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
            
            return {
                "title": novel_title,
                "original_title": novel_title # Temporary same
            }
        except Exception as e:
            print(f"❌ Error getting metadata: {e}")
            return None
        finally:
            browser.close()

async def main():
    # 1. Extract Metadata
    print("🚀 Starting Batch Processor...")
    # Wrap sync call in thread
    metadata = await asyncio.to_thread(extract_novel_metadata, START_URL)
    
    if not metadata:
        print("❌ Failed to extract metadata. Exiting.")
        return

    novel_title = metadata['title']
    novel_slug = slugify(novel_title)
    
    print(f"📚 Target Novel: {novel_title}")
    print(f"🔗 Slug: {novel_slug}")

    # 2. Init Database & Translator
    db = Prisma()
    await db.connect()
    
    translator = LLMTranslator()
    
    # 3. Ensure Novel Entry Exists
    novel = await db.novel.find_unique(where={'slug': novel_slug})
    
    if not novel:
        print(f"🆕 Creating new novel entry for '{novel_title}'...")
        novel = await db.novel.create(data={
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
    crawler = NovelCrawler()
    # Note: start_crawling is synchronous and handles the loop internally
    # WRAP IN THREAD to avoid Playwright Async Loop Error
    await asyncio.to_thread(crawler.start_crawling, START_URL, max_chapters=100)

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
        existing_chapter = await db.chapter.find_unique(
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
        translated_title = await translator.translate(raw_title)
        translated_content = await translator.translate(raw_content)

        # Save to DB
        print("   💾 Saving to Postgres...")
        new_chapter = await db.chapter.create(data={
            'novelId': novel.id,
            'chapterNum': chapter_num,
            'rawTitle': raw_title,
            'rawContent': raw_content,
            'sourceUrl': source_url
        })

        await db.chaptertranslation.create(data={
            'chapterId': new_chapter.id,
            'language': 'EN',
            'title': translated_title,
            'content': translated_content,
            # No publishedAt to keep it draft? Or set it.
            # 'publishedAt': datetime.now() 
        })
        
        print(f"✅ Chapter {chapter_num} Done!")

    await db.disconnect()
    print("\n🎉 Batch Processing Complete!")

if __name__ == "__main__":
    asyncio.run(main())