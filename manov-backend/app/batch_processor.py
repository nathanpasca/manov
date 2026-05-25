import asyncio
import json
import os

from sqlmodel import select

from app.database import AsyncSessionLocal, engine
from app.models import Chapter, ChapterTranslation, Novel
from app.services.scraper_crawler import NovelCrawler
from app.services.translator import LLMTranslator
from app.utils.slug import generate_slug

# --- KONFIGURASI ---
START_URL = "https://www.69shuba.com/txt/89349/40066143"  # Supply link chapter 1 disni
RAW_DATA_FOLDER = "raw_data"


def extract_novel_metadata(url: str):
    """
    Extract novel title from the first chapter URL using a headless browser.
    """
    from playwright.sync_api import sync_playwright

    print(f"🔍 Analyzing metadata from: {url}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        try:
            page.goto(url, timeout=60000)

            # Cloudflare Wait
            try:
                page.wait_for_selector(".txtnav", state="visible", timeout=10000)
            except Exception:
                print("⚠️  Cloudflare detected. Waiting...")
                page.wait_for_selector(".txtnav", state="visible", timeout=60000)

            page_title = page.title()  # Format: "Chapter - Novel - Site"
            print(f"   📄 Page Title: {page_title}")

            novel_title = "Unknown Novel"
            if "-" in page_title:
                parts = page_title.split("-")
                if len(parts) >= 2:
                    candidate = parts[0].strip()
                    # If part 0 is chapter (has digits), take part 1
                    if any(char.isdigit() for char in candidate):
                        novel_title = parts[1].strip()
                    else:
                        novel_title = candidate
            else:
                novel_title = page_title

            # Cleanup
            novel_title = novel_title.replace("69书吧", "").strip()

            # Extract Chapter Number from Title if possible
            import re

            chapter_num = 1
            match = re.search(r"第(\d+)章", page_title)
            if match:
                chapter_num = int(match.group(1))

            return {
                "title": novel_title,
                "original_title": novel_title,
                "chapter_num": chapter_num,
            }
        except Exception as e:
            print(f"❌ Error getting metadata: {e}")
            return None
        finally:
            browser.close()


# Helper Retry
async def retry_async_op(func, *args, retries=3, delay=2, **kwargs):
    for i in range(retries):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            print(f"   ⚠️ Error (Attempt {i + 1}/{retries}): {e}")
            if i == retries - 1:
                raise
            await asyncio.sleep(delay)


async def main():
    async with AsyncSessionLocal() as session:
        # 1. Extract Metadata
        print("🚀 Starting Batch Processor...")
        metadata = await asyncio.to_thread(extract_novel_metadata, START_URL)

        if not metadata:
            print("❌ Failed to extract metadata. Exiting.")
            return

        novel_title = metadata["title"]
        novel_slug = await generate_slug(novel_title, session)

        print(f"📚 Target Novel: {novel_title}")
        print(f"🔗 Slug: {novel_slug}")

        # 2. Init Database & Translator
        translator = LLMTranslator()

        # 3. Ensure Novel Entry Exists
        novel = await retry_async_op(
            session.scalar, select(Novel).where(Novel.slug == novel_slug)
        )

        # Fallback: Try matching by Original Title
        if not novel:
            print(f"⚠️ Slug mismatch. Trying to find by Original Title: {metadata['original_title']}...")
            novel = await retry_async_op(
                session.scalar,
                select(Novel).where(Novel.originalTitle == metadata["original_title"]),
            )

        if not novel:
            print(f"🆕 Creating new novel entry for '{novel_title}'...")
            novel = Novel(
                title=novel_title,
                slug=novel_slug,
                originalTitle=metadata["original_title"],
                author="Unknown",
                status="ONGOING",
            )
            session.add(novel)
            await session.commit()
            await session.refresh(novel)
        else:
            print(f"✅ Found existing novel: {novel.title} (ID: {novel.id})")

        # 3.5 Setup Novel Data Folder
        novel_data_folder = os.path.join(RAW_DATA_FOLDER, novel.slug)
        if not os.path.exists(novel_data_folder):
            os.makedirs(novel_data_folder)
        print(f"wb 📂 Data Folder: {novel_data_folder}")

        # 4. Start Crawling (Sync Blocking)
        print("\n🕷️  Starting Crawler (This might take a while)...")

        # Check for last chapter in DB or Local Files to resume
        crawler_start_url = START_URL
        start_chapter_num = metadata.get("chapter_num", 1)

        # A. Check Database
        last_db_chapter = await retry_async_op(
            session.scalar,
            select(Chapter)
            .where(Chapter.novelId == novel.id)
            .order_by(Chapter.chapterNum.desc())
            .limit(1),
        )

        # B. Check Local Files
        last_local_chapter_num = 0
        last_local_url = None

        if os.path.exists(novel_data_folder):
            files = sorted([f for f in os.listdir(novel_data_folder) if f.endswith(".json")])
            if files:
                for f in reversed(files):
                    try:
                        num = int(f.split("_")[1].split(".")[0])
                        if num > last_local_chapter_num:
                            last_local_chapter_num = num
                            with open(os.path.join(novel_data_folder, f), encoding="utf-8") as jf:
                                d = json.load(jf)
                                if "source_url" in d:
                                    last_local_url = d["source_url"]
                                    break
                    except Exception:
                        pass

        print(
            f"📊 State Check: DB Last={last_db_chapter.chapterNum if last_db_chapter else 'None'} | Local Last={last_local_chapter_num}"
        )

        # Decision Logic: Use the furthest point
        resume_candidate_url = None
        resume_candidate_num = 0

        if last_db_chapter and last_db_chapter.chapterNum >= last_local_chapter_num:
            resume_candidate_num = last_db_chapter.chapterNum
            resume_candidate_url = last_db_chapter.sourceUrl
            print("👉 Resuming from DATABASE record.")
        elif last_local_chapter_num > 0 and last_local_url:
            resume_candidate_num = last_local_chapter_num
            resume_candidate_url = last_local_url
            print("👉 Resuming from LOCAL FILES (cached).")

        if resume_candidate_url:
            print(f"🔄 Auto-Resuming Crawler from Chapter {resume_candidate_num}...")
            print(f"   URL: {resume_candidate_url}")
            crawler_start_url = resume_candidate_url

            print("   🕵️  Verifying real chapter number from URL...")
            resume_metadata = await asyncio.to_thread(extract_novel_metadata, crawler_start_url)
            if resume_metadata and "chapter_num" in resume_metadata:
                real_num = resume_metadata["chapter_num"]
                print(f"   ✅ Real Chapter Number on Page: {real_num}")
                start_chapter_num = real_num
            else:
                print("   ⚠️ Could not verify real number, falling back to candidate logic.")
                start_chapter_num = resume_candidate_num

        crawler = NovelCrawler(output_dir=novel_data_folder)
        await asyncio.to_thread(
            crawler.start_crawling,
            crawler_start_url,
            max_chapters=1,
            start_counter=start_chapter_num,
        )

        # 5. Process & Translate (Async Loop)
        print("\n📝 Processing & Translating Chapters...")
        files = sorted(os.listdir(novel_data_folder))

        for filename in files:
            if not filename.endswith(".json"):
                continue

            filepath = os.path.join(novel_data_folder, filename)

            try:
                chapter_num = int(filename.split("_")[1].split(".")[0])
            except Exception:
                continue

            existing_chapter = await retry_async_op(
                session.scalar,
                select(Chapter).where(
                    Chapter.novelId == novel.id,
                    Chapter.chapterNum == chapter_num,
                ),
            )

            if existing_chapter:
                print(f"⏭️  Chapter {chapter_num} exist. Skipping.")
                continue

            print(f"🔨 Processing Chapter {chapter_num}...")

            with open(filepath, encoding="utf-8") as f:
                data = json.load(f)

            raw_content = data["content"]
            raw_title = data["title"]
            source_url = data.get("source_url")

            print("   🤖 Translating Title & Content...")
            translated_title = await retry_async_op(translator.translate, raw_title)
            translated_content = await retry_async_op(translator.translate, raw_content)

            print("   💾 Saving to Postgres...")

            try:
                new_chapter = Chapter(
                    novelId=novel.id,
                    chapterNum=chapter_num,
                    rawTitle=raw_title,
                    rawContent=raw_content,
                    sourceUrl=source_url,
                )
                session.add(new_chapter)
                await session.commit()
                await session.refresh(new_chapter)

                translation = ChapterTranslation(
                    chapterId=new_chapter.id,
                    language="EN",
                    title=translated_title,
                    content=translated_content,
                )
                session.add(translation)
                await session.commit()
            except Exception as e:
                print(f"   ❌ FAILED to save Chapter {chapter_num}: {e}")
                continue

            print(f"✅ Chapter {chapter_num} Done!")

    await engine.dispose()
    print("\n🎉 Batch Processing Complete!")


if __name__ == "__main__":
    asyncio.run(main())
