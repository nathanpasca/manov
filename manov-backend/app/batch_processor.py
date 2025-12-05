import asyncio
import json
import os
import re
from prisma import Prisma
from playwright.sync_api import sync_playwright
from app.services.translator import LLMTranslator
from app.services.scraper_crawler import NovelCrawler

# --- KONFIGURASI ---
START_URL = "https://www.69shuba.com/txt/89876/40393077" # Supply link chapter 1 disni
RAW_DATA_FOLDER = "raw_data"

def slugify(text: str) -> str:
    """Simple slugify implementation."""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text.strip('-')

def extract_novel_metadata(url: str):
    """
    Extract novel title from the first chapter URL using a headless browser.
    """
    print(f"🔍 Analyzing metadata from: {url}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        try:
            page.goto(url, timeout=60000)
            
            # Cloudflare Wait
            try:
                page.wait_for_selector('.txtnav', state='visible', timeout=10000)
            except:
                print("⚠️  Cloudflare detected. Waiting...")
                page.wait_for_selector('.txtnav', state='visible', timeout=60000)
                
            page_title = page.title() # Format: "Chapter - Novel - Site"
            print(f"   📄 Page Title: {page_title}")
            
            novel_title = "Unknown Novel"
            if "-" in page_title:
                parts = page_title.split('-')
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
            # Format: "冬日重现-第1章 异常死亡-69书吧"
            chapter_num = 1
            match = re.search(r'第(\d+)章', page_title)
            if match:
                chapter_num = int(match.group(1))
            
            return {
                "title": novel_title,
                "original_title": novel_title,
                "chapter_num": chapter_num
            }
        except Exception as e:
            print(f"❌ Error getting metadata: {e}")
            return None
        finally:
            browser.close()

# Helper Retry
async def retry_async_op(func, retries=3, delay=2, *args, **kwargs):
    for i in range(retries):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            print(f"   ⚠️ Error (Attempt {i+1}/{retries}): {e}")
            if i == retries - 1:
                raise
            await asyncio.sleep(delay)

async def main():
    # 1. Extract Metadata
    print("🚀 Starting Batch Processor...")
    # Wrap sync call in thread
    # NOTE: START_URL might be a specific chapter, but for initial metadata it's fine
    metadata = await asyncio.to_thread(extract_novel_metadata, START_URL)
    
    if not metadata:
        print("❌ Failed to extract metadata. Exiting.")
        return

    novel_title = metadata['title']
    novel_slug = slugify(novel_title)
    
    print(f"📚 Target Novel: {novel_title}")
    print(f"🔗 Slug: {novel_slug}")

    # 2. Init Database & Translator
    # Increase timeout to handle slow remote connection
    db = Prisma(http={'timeout': 60.0}) 
    await db.connect()
    
    translator = LLMTranslator()
    
    # 3. Ensure Novel Entry Exists
    novel = await retry_async_op(db.novel.find_unique, where={'slug': novel_slug})
    
    # Fallback: Try matching by Original Title (in case user renamed slug/title in DB)
    if not novel:
        print(f"⚠️ Slug mismatch. Trying to find by Original Title: {metadata['original_title']}...")
        novel = await retry_async_op(db.novel.find_first, where={'originalTitle': metadata['original_title']})

    if not novel:
        print(f"🆕 Creating new novel entry for '{novel_title}'...")
        novel = await retry_async_op(db.novel.create, data={
            'title': novel_title,
            'slug': novel_slug,
            'originalTitle': metadata['original_title'],
            'author': "Unknown", 
            'status': 'ONGOING'
        })
    else:
        print(f"✅ Found existing novel: {novel.title} (ID: {novel.id})")

    # 4. Start Crawling (Sync Blocking)
    print("\n🕷️  Starting Crawler (This might take a while)...")
    
    # Check for last chapter in DB or Local Files to resume
    crawler_start_url = START_URL
    start_chapter_num = metadata.get('chapter_num', 1)

    # A. Check Database
    last_db_chapter = await retry_async_op(
        db.chapter.find_first, 
        where={'novelId': novel.id}, 
        order={'chapterNum': 'desc'}
    )
    
    # B. Check Local Files
    last_local_chapter_num = 0
    last_local_url = None
    
    if os.path.exists(RAW_DATA_FOLDER):
        files = sorted([f for f in os.listdir(RAW_DATA_FOLDER) if f.endswith(".json")])
        if files:
            # Check the last few files to find the highest number
            for f in reversed(files):
                 try:
                    # Format: chapter_0001.json
                    num = int(f.split('_')[1].split('.')[0])
                    if num > last_local_chapter_num:
                        last_local_chapter_num = num
                        # Read URL from file
                        with open(os.path.join(RAW_DATA_FOLDER, f), 'r', encoding='utf-8') as jf:
                            d = json.load(jf)
                            if 'source_url' in d:
                                last_local_url = d['source_url']
                                break # Found the max file with URL
                 except: pass

    print(f"📊 State Check: DB Last={last_db_chapter.chapterNum if last_db_chapter else 'None'} | Local Last={last_local_chapter_num}")

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
        
        # INTELLIGENT SYNC:
        print("   🕵️  Verifying real chapter number from URL...")
        resume_metadata = await asyncio.to_thread(extract_novel_metadata, crawler_start_url)
        if resume_metadata and 'chapter_num' in resume_metadata:
            real_num = resume_metadata['chapter_num']
            print(f"   ✅ Real Chapter Number on Page: {real_num}")
            start_chapter_num = real_num
        else:
            print("   ⚠️ Could not verify real number, falling back to candidate logic.")
            start_chapter_num = resume_candidate_num
    
    crawler = NovelCrawler()
    # Note: start_crawling is synchronous and handles the loop internally
    # WRAP IN THREAD to avoid Playwright Async Loop Error
    await asyncio.to_thread(crawler.start_crawling, crawler_start_url, max_chapters=50, start_counter=start_chapter_num)

    # 5. Process & Translate (Async Loop)
    print("\n📝 Processing & Translating Chapters...")
    files = sorted(os.listdir(RAW_DATA_FOLDER))
    
    for filename in files:
        if not filename.endswith(".json"): continue
        
        filepath = os.path.join(RAW_DATA_FOLDER, filename)
        
        # Extract chapter number
        try:
            # Format: chapter_0001.json
            chapter_num = int(filename.split('_')[1].split('.')[0])
        except:
            continue

        # Check existing in DB
        existing_chapter = await retry_async_op(
            db.chapter.find_unique,
            where={
                'novelId_chapterNum': {
                    'novelId': novel.id,
                    'chapterNum': chapter_num
                }
            }
        )

        if existing_chapter:
            print(f"⏭️  Chapter {chapter_num} exist. Skipping.")
            continue

        print(f"🔨 Processing Chapter {chapter_num}...")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        raw_content = data['content']
        raw_title = data['title']
        source_url = data.get('source_url')

        # Translate
        print(f"   🤖 Translating Title & Content...")
        translated_title = await retry_async_op(translator.translate, raw_title)
        translated_content = await retry_async_op(translator.translate, raw_content)

        # Save to DB
        print("   💾 Saving to Postgres...")
        
        # Retry logic for creating chapter
        try:
             new_chapter = await retry_async_op(db.chapter.create, data={
                'novelId': novel.id,
                'chapterNum': chapter_num,
                'rawTitle': raw_title,
                'rawContent': raw_content,
                'sourceUrl': source_url
            })
    
             await retry_async_op(db.chaptertranslation.create, data={
                'chapterId': new_chapter.id,
                'language': 'EN',
                'title': translated_title,
                'content': translated_content,
                # No publishedAt to keep it draft? Or set it.
                # 'publishedAt': datetime.now() 
            })
        except Exception as e:
            print(f"   ❌ FAILED to save Chapter {chapter_num}: {e}")
            continue

        print(f"✅ Chapter {chapter_num} Done!")
        


    await db.disconnect()
    print("\n🎉 Batch Processing Complete!")

if __name__ == "__main__":
    asyncio.run(main())