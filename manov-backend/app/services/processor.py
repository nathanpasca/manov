# app/services/processor.py
import json
import os
from datetime import UTC, datetime

from fastapi.concurrency import run_in_threadpool
from sqlmodel import select

from app.database import AsyncSessionLocal
from app.models import Chapter, ChapterTranslation, Novel
from app.services.scraper_crawler import NovelCrawler
from app.services.translator import LLMTranslator


class NovelProcessorService:
    def __init__(self):
        self.translator = LLMTranslator()
        self.crawler = NovelCrawler()
        self.raw_dir = "raw_data"

    async def process_novel(self, slug: str, input_url: str = None, title_override: str = None):
        """
        Logic pintar:
        - Jika input_url ADA -> Pakai itu (Mode Manual/Start Awal).
        - Jika input_url KOSONG -> Cari last chapter di DB -> Resume dari situ.
        """
        async with AsyncSessionLocal() as session:
            try:
                target_url = input_url
                novel = await session.scalar(select(Novel).where(Novel.slug == slug))

                # --- LOGIC AUTO-RESUME ---
                if not target_url:
                    if not novel:
                        print(
                            "❌ Error: Novel belum ada, harus input URL awal untuk scraping pertama kali."
                        )
                        return

                    # Cari chapter terakhir
                    last_chapter = await session.scalar(
                        select(Chapter)
                        .where(Chapter.novelId == novel.id)
                        .order_by(Chapter.chapterNum.desc())
                        .limit(1)
                    )

                    if last_chapter and last_chapter.sourceUrl:
                        print(
                            f"🔄 Auto-Resume dari Chapter {last_chapter.chapterNum}: {last_chapter.sourceUrl}"
                        )
                        target_url = last_chapter.sourceUrl
                    else:
                        print("❌ Error: Tidak ada history chapter untuk di-resume.")
                        return

                start_num_hint = 1
                if novel:
                    last_ch = await session.scalar(
                        select(Chapter)
                        .where(Chapter.novelId == novel.id)
                        .order_by(Chapter.chapterNum.desc())
                        .limit(1)
                    )
                    if last_ch:
                        start_num_hint = last_ch.chapterNum

                print(f"🕷️  Crawler Start: {target_url} (Hint: {start_num_hint})")

                # 2. BUNGKUS DENGAN THREADPOOL (Solusi Error Playwright Sync)
                await run_in_threadpool(
                    self.crawler.start_crawling,
                    target_url,
                    5,  # max_chapters
                    start_num_hint,  # start_counter
                )
                # --- PROCESS DATA (Simpan ke DB) ---
                # Create Novel jika belum ada
                if not novel and title_override:
                    novel = Novel(
                        title=title_override,
                        slug=slug,
                        originalTitle="Unknown",
                        status="ONGOING",
                    )
                    session.add(novel)
                    await session.commit()
                    await session.refresh(novel)

                # Loop JSON files
                files = sorted(os.listdir(self.raw_dir))
                for filename in files:
                    if not filename.endswith(".json"):
                        continue

                    # Parse Chapter Num
                    try:
                        chapter_num = int(filename.split("_")[1].split(".")[0])
                    except Exception:
                        continue

                    # Load JSON
                    filepath = os.path.join(self.raw_dir, filename)
                    with open(filepath, encoding="utf-8") as f:
                        data = json.load(f)

                    # Cek DB (Skip jika sudah ada)
                    existing = await session.scalar(
                        select(Chapter).where(
                            Chapter.novelId == novel.id,
                            Chapter.chapterNum == chapter_num,
                        )
                    )

                    if existing:
                        # UPDATE URL JIKA KOSONG (Self-healing)
                        if not existing.sourceUrl and "source_url" in data:
                            existing.sourceUrl = data.get("source_url")
                            await session.commit()
                        print(f"⏭️  Skip Ch {chapter_num} (Sudah ada).")
                        continue

                    # --- PROSES DATA BARU ---
                    print(f"✨ Processing New Chapter {chapter_num}...")

                    # Translate
                    tl_content = await self.translator.translate(data["content"])
                    tl_title = await self.translator.translate(data["title"])

                    # Save Raw Chapter
                    new_ch = Chapter(
                        novelId=novel.id,
                        chapterNum=chapter_num,
                        rawTitle=data["title"],
                        rawContent=data["content"],
                        sourceUrl=data.get("source_url"),
                    )
                    session.add(new_ch)
                    await session.commit()
                    await session.refresh(new_ch)

                    # Save Translation
                    translation = ChapterTranslation(
                        chapterId=new_ch.id,
                        language="EN",
                        title=tl_title,
                        content=tl_content,
                        publishedAt=datetime.now(UTC),
                    )
                    session.add(translation)
                    await session.commit()
                    await session.refresh(translation)
                    print(f"   ✅ Saved Ch {chapter_num}.")

                    # Create notifications for users who have this novel in library
                    await self._notify_users_of_new_chapter(
                        session, novel.id, novel.title, chapter_num, new_ch.id
                    )

            except Exception as e:
                print(f"❌ Error Processor: {e}")

    async def _notify_users_of_new_chapter(
        self, session, novel_id: int, novel_title: str, chapter_num: int, chapter_id: int
    ):
        """Create notifications for all users who have this novel in their library."""
        from app.models import Library, Notification

        try:
            # Get all users who have this novel in library
            result = await session.execute(
                select(Library.userId).where(Library.novelId == novel_id)
            )
            user_ids = [row[0] for row in result.all()]

            if not user_ids:
                return

            # Batch create notifications
            for user_id in user_ids:
                notification = Notification(
                    userId=user_id,
                    type="NEW_CHAPTER",
                    message=f"{novel_title} — Chapter {chapter_num} is now available!",
                    novelId=novel_id,
                    chapterId=chapter_id,
                )
                session.add(notification)

            await session.commit()
            print(f"   📬 Notifications sent to {len(user_ids)} users.")
        except Exception as e:
            print(f"   ⚠️ Notification error: {e}")
            await session.rollback()
