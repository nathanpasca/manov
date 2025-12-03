# app/services/processor.py
import os
import json
import asyncio
from datetime import datetime, timezone
from prisma import Prisma
from app.services.translator import LLMTranslator
from app.services.scraper_crawler import NovelCrawler # Pastikan import ini benar
from fastapi.concurrency import run_in_threadpool
import re


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
        db = Prisma()
        await db.connect()
        
        try:
            target_url = input_url
            novel = await db.novel.find_unique(where={'slug': slug})

            # --- LOGIC AUTO-RESUME ---
            if not target_url:
                if not novel:
                    print("❌ Error: Novel belum ada, harus input URL awal untuk scraping pertama kali.")
                    return
                
                # Cari chapter terakhir
                last_chapter = await db.chapter.find_first(
                    where={'novelId': novel.id},
                    order={'chapterNum': 'desc'}
                )
                
                if last_chapter and last_chapter.sourceUrl:
                    print(f"🔄 Auto-Resume dari Chapter {last_chapter.chapterNum}: {last_chapter.sourceUrl}")
                    target_url = last_chapter.sourceUrl
                else:
                    print("❌ Error: Tidak ada history chapter untuk di-resume.")
                    return
            
            start_num_hint = 1
            if novel:
                last_ch = await db.chapter.find_first(
                    where={'novelId': novel.id},
                    order={'chapterNum': 'desc'}
                )
                if last_ch:
                    start_num_hint = last_ch.chapterNum

            print(f"🕷️  Crawler Start: {target_url} (Hint: {start_num_hint})")
            
            # 2. BUNGKUS DENGAN THREADPOOL (Solusi Error Playwright Sync)
            await run_in_threadpool(
                self.crawler.start_crawling, # Fungsi yang mau dijalankan
                target_url,                  # Argumen 1
                5,                           # Argumen 2 (max_chapters)
                start_num_hint               # Argumen 3 (start_counter)
            )
            # --- PROCESS DATA (Simpan ke DB) ---
            # Create Novel jika belum ada
            if not novel and title_override:
                 novel = await db.novel.create(data={
                    'title': title_override,
                    'slug': slug,
                    'originalTitle': "Unknown",
                    'status': 'ONGOING'
                })

            # Loop JSON files
            files = sorted(os.listdir(self.raw_dir))
            for filename in files:
                if not filename.endswith(".json"): continue
                
                # Parse Chapter Num
                try:
                    chapter_num = int(filename.split('_')[1].split('.')[0])
                except: continue

                # Load JSON
                filepath = os.path.join(self.raw_dir, filename)
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                # Cek DB (Skip jika sudah ada)
                existing = await db.chapter.find_unique(
                    where={'novelId_chapterNum': {'novelId': novel.id, 'chapterNum': chapter_num}}
                )
                
                if existing:
                    # UPDATE URL JIKA KOSONG (Self-healing)
                    # Biar data lama punya sourceUrl juga
                    if not existing.sourceUrl and 'source_url' in data:
                        await db.chapter.update(
                            where={'id': existing.id},
                            data={'sourceUrl': data.get('source_url')}
                        )
                    print(f"⏭️  Skip Ch {chapter_num} (Sudah ada).")
                    continue

                # --- PROSES DATA BARU ---
                print(f"✨ Processing New Chapter {chapter_num}...")
                
                # Translate
                tl_content = await self.translator.translate(data['content'])
                tl_title = await self.translator.translate(data['title'])
                
                # Save Raw Chapter (PENTING: Simpan sourceUrl dari JSON crawler)
                new_ch = await db.chapter.create(data={
                    'novelId': novel.id,
                    'chapterNum': chapter_num,
                    'rawTitle': data['title'],
                    'rawContent': data['content'],
                    'sourceUrl': data.get('source_url') # <--- SIMPAN URL DISINI
                })

                # Save Translation
                await db.chaptertranslation.create(data={
                    'chapterId': new_ch.id,
                    'language': 'EN',
                    'title': tl_title,
                    'content': tl_content,
                    'publishedAt': datetime.now(timezone.utc)
                })
                print(f"   ✅ Saved Ch {chapter_num}.")

        except Exception as e:
            print(f"❌ Error Processor: {e}")
        finally:
            if db.is_connected(): await db.disconnect()