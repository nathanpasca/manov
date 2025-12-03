import asyncio
import json
import os
from prisma import Prisma
from services.translator import LLMTranslator

# --- KONFIGURASI ---
NOVEL_SLUG = "yidu-lvshe" # Ganti slug novel sesuai keinginanmu
NOVEL_TITLE = "异度旅社 (Yidu Hotel)" # Judul Novel
RAW_DATA_FOLDER = "raw_data"

async def main():
    # 1. Init Database & Translator
    db = Prisma()
    await db.connect()
    
    translator = LLMTranslator()
    
    print("🔌 Terhubung ke Database...")

    # 2. Pastikan Novel Entry Ada
    # Kita cari dulu novelnya by slug
    novel = await db.novel.find_unique(where={'slug': NOVEL_SLUG})
    
    if not novel:
        print(f"🆕 Novel '{NOVEL_TITLE}' belum ada. Membuat entry baru...")
        novel = await db.novel.create(data={
            'title': NOVEL_TITLE,
            'slug': NOVEL_SLUG,
            'originalTitle': "异度旅社",
            'author': "Yuan Tong", # Bisa diambil dari JSON sebenernya
            'status': 'ONGOING'
        })
    
    print(f"📚 Target Novel: {novel.title} (ID: {novel.id})")

    # 3. Baca File JSON
    files = sorted(os.listdir(RAW_DATA_FOLDER)) # Urutkan biar chapter 1, 2, 3...
    
    for filename in files:
        if not filename.endswith(".json"): continue
        
        filepath = os.path.join(RAW_DATA_FOLDER, filename)
        
        # Extract nomor chapter dari nama file (chapter_0001.json -> 1)
        try:
            chapter_num = int(filename.split('_')[1].split('.')[0])
        except:
            print(f"⚠️ Skip file aneh: {filename}")
            continue

        # Cek apakah chapter ini sudah ada di DB?
        existing_chapter = await db.chapter.find_unique(
            where={
                'novelId_chapterNum': {
                    'novelId': novel.id,
                    'chapterNum': chapter_num
                }
            }
        )

        if existing_chapter:
            print(f"⏭️  Chapter {chapter_num} sudah ada di DB. Skip.")
            continue

        print(f"\n🔨 Processing Chapter {chapter_num} from {filename}...")
        
        # Load Raw Data
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        raw_content = data['content']
        raw_title = data['title']

        # --- STEP TRANSLATE ---
        print(f"   🤖 Translating ({len(raw_content)} chars)...")
        translated_content = translator.translate(raw_content)
        
        # Translate Judul (Simple request)
        translated_title = translator.translate(raw_title)

        # --- STEP SAVE TO DB ---
        print("   💾 Saving to Postgres...")
        
        # 1. Simpan Chapter Induk (Raw)
        new_chapter = await db.chapter.create(data={
            'novelId': novel.id,
            'chapterNum': chapter_num,
            'rawTitle': raw_title,
            'rawContent': raw_content
        })

        # 2. Simpan Translation (ID)
        await db.chaptertranslation.create(data={
            'chapterId': new_chapter.id,
            'language': 'EN',
            'title': translated_title,
            'content': translated_content,
            # Scheduling: Default publish NOW (bisa diubah logikanya nanti)
            # 'publishedAt': datetime.now() 
        })

        print(f"✅ Chapter {chapter_num} Selesai!")

    await db.disconnect()
    print("\n🎉 Semua proses selesai!")

if __name__ == "__main__":
    asyncio.run(main())