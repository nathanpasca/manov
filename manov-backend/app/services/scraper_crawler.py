from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import time
import json
import os
import random
import re
class NovelCrawler:
    def __init__(self):
        # Buat folder untuk menyimpan hasil
        self.output_dir = "raw_data"
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)

    def extract_chapter_number(self, title: str, fallback_num: int) -> int:
        """
        Mencoba mengambil angka dari judul Mandarin (misal: "第123章").
        Jika gagal, pakai fallback hitungan manual.
        """
        # Cari pola angka Arab di antara karakter Mandarin (第 ... 章)
        # Contoh: 第5章 -> match angka 5
        match = re.search(r'第(\d+)章', title)
        if match:
            return int(match.group(1))
        
        # Coba cari angka saja di awal string (misal: "123 Judul")
        match_simple = re.search(r'^(\d+)\s', title)
        if match_simple:
            return int(match_simple.group(1))
            
        return fallback_num

    def start_crawling(self, start_url: str, max_chapters=10, start_counter=1):
        """
        start_counter: Angka awal hitungan jika Regex gagal detect nomor.
        """
        print(f"🕷️  Mulai Crawler dari: {start_url}")
        
        current_url = start_url
        # Counter ini hanya untuk backup jika judulnya aneh
        sequential_counter = start_counter 

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False, args=["--disable-blink-features=AutomationControlled"])
            context = browser.new_context(viewport={'width': 1280, 'height': 800})
            page = context.new_page()

            while current_url:
                # Limit safety (hanya kalau max_chapters > 0)
                # Logika limit agak tricky saat resume, jadi kita pakai loop count sederhana
                # Tapi untuk sekarang biarkan manual stop atau limit sederhana
                
                print(f"\n📖 Visiting URL: {current_url}")
                
                # 1. Scrape Single Page
                data, next_url = self.scrape_single_page(page, current_url)
                
                if not data:
                    print("❌ Gagal scrape halaman ini. Berhenti.")
                    break

                # 2. INTELLIGENT NUMBERING
                # Ekstrak nomor dari judul asli (misal: "第5章")
                real_chapter_num = self.extract_chapter_number(data['title'], sequential_counter)
                
                # Update counter manual agar sinkron
                sequential_counter = real_chapter_num + 1

                print(f"   📍 Detected Chapter: {real_chapter_num} (Title: {data['title']})")

                # 3. Save to File
                # Nama file menggunakan nomor ASLI dari judul
                filename = f"{self.output_dir}/chapter_{real_chapter_num:04d}.json"
                
                # Inject detected number ke dalam data JSON juga biar processor gampang
                data['chapter_num'] = real_chapter_num 
                
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=4)
                
                print(f"   ✅ Tersimpan: {filename}")

                # 4. Limit Check (Optional, hitung berapa file yg sudah didownload sesi ini)
                if max_chapters > 0:
                    max_chapters -= 1
                    if max_chapters == 0:
                        print("🛑 Batas limit download tercapai.")
                        break

                # 5. Pindah Halaman
                if next_url:
                    current_url = next_url
                    
                    sleep_time = random.uniform(2, 4)
                    print(f"   💤 Sleep {sleep_time:.1f}s...")
                    time.sleep(sleep_time)
                else:
                    print("🏁 Tamat / Tidak ada link Next.")
                    break
            
            browser.close()

    def scrape_single_page(self, page, url):
        try:
            page.goto(url, timeout=60000)
            
            # Handling Cloudflare Manual (Hanya di awal biasanya)
            try:
                page.wait_for_selector('.txtnav', state='visible', timeout=10000)
            except:
                print("⚠️  Terhalang Cloudflare/Loading. Silakan verify manual di browser...")
                try:
                    page.wait_for_selector('.txtnav', state='visible', timeout=60000) # Tunggu 1 menit max
                except:
                    return None, None

            html_content = page.content()
            soup = BeautifulSoup(html_content, 'html.parser')
            container = soup.select_one('.txtnav')

            # --- CLEANING ---
            junk_selectors = ['.txtinfo', '#txtright', '.contentadv', '.bottom-ad', '.bottom-ad2', '.page1', 'script', 'style', 'h1']
            for s in junk_selectors:
                for tag in container.select(s):
                    tag.decompose()

            # Ambil Text
            raw_text = container.get_text(separator='\n')
            lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
            
            # Filter baris sampah
            clean_lines = []
            for line in lines:
                if "loadAdv" in line or "69书吧" in line or "(本章完)" in line: continue
                clean_lines.append(line)
            
            content = "\n\n".join(clean_lines)
            
            # Ambil Judul
            title = soup.title.string.split('-')[0].strip() if soup.title else "Unknown"

            # --- CARI NEXT URL ---
            # Cari tombol dengan teks "下一章" (Next Chapter)
            # Struktur: <div class="page1"> ... <a href="...">下一章</a> ... </div>
            next_url = None
            page1_div = soup.select_one('.page1')
            if page1_div:
                links = page1_div.find_all('a')
                for link in links:
                    if "下一章" in link.get_text():
                        href = link.get('href')
                        if href:
                            # 69shuba kadang kasih link relatif (/txt/...) atau absolute
                            if href.startswith('http'):
                                next_url = href
                            else:
                                next_url = f"https://www.69shuba.com{href}"
                        break

            return {
                "source_url": url,
                "title": title,
                "content": content
            }, next_url

        except Exception as e:
            print(f"Error scraping page: {e}")
            return None, None
