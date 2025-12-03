from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import time

class NovelScraper:
    def __init__(self):
        pass

    def scrape_69shuba(self, url: str) -> dict:
        print(f"🎭 Playwright (GUI Mode) Scraping: {url}...")
        
        try:
            with sync_playwright() as p:
                # 1. HEADLESS = FALSE (Browser akan MUNCUL di layar)
                # Ini membuat bot jauh lebih sulit dideteksi
                browser = p.chromium.launch(
                    headless=False, 
                    args=["--disable-blink-features=AutomationControlled"] # Trik menyembunyikan identitas bot
                )
                
                context = browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    viewport={'width': 1280, 'height': 800}
                )
                
                page = context.new_page()
                
                print("🚀 Membuka Website...")
                page.goto(url, timeout=90000)
                
                # 2. LOGIKA HUMAN-IN-THE-LOOP
                # Kita cek apakah konten langsung muncul atau tertahan Cloudflare
                try:
                    print("⏳ Menunggu konten novel muncul...")
                    page.wait_for_selector('.txtnav', state='visible', timeout=10000)
                    print("✅ Konten terdeteksi otomatis!")
                except Exception:
                    # Jika timeout (berarti kena Cloudflare atau Captcha)
                    print("\n" + "!"*50)
                    print("⚠️  TERTAHAN CLOUDFLARE / CAPTCHA!")
                    print("👉 Silakan cek jendela Chrome yang terbuka.")
                    print("👉 KLIK MANUAL kotak 'Verify you are human' atau selesaikan puzzle.")
                    print("👉 Tunggu sampai teks novel bahasa China muncul di layar.")
                    print("!"*50 + "\n")
                    
                    # Script akan berhenti di sini menunggu kamu tekan Enter di terminal
                    input("⌨️  JIKA TEKS NOVEL SUDAH MUNCUL DI BROWSER, TEKAN [ENTER] DI SINI UNTUK LANJUT...")
                
                # 3. Ambil HTML setelah kamu pastikan aman
                html_content = page.content()
                browser.close() # Tutup browser setelah selesai

                # 4. Parsing (Logic sama seperti sebelumnya)
                soup = BeautifulSoup(html_content, 'html.parser')
                container = soup.select_one('.txtnav')
                
                if not container:
                    print("❌ Masih gagal mengambil konten. Pastikan halaman sudah terbuka penuh sebelum tekan Enter.")
                    return None

                # Cleaning
                junk_selectors = [
                    '.txtinfo', '#txtright', '.contentadv', 
                    '.bottom-ad', '.bottom-ad2', '.page1', 
                    'script', 'style', 'h1', '.mybox h3', '.tools'
                ]
                
                for selector in junk_selectors:
                    for tag in container.select(selector):
                        tag.decompose()

                raw_text = container.get_text(separator='\n')
                lines = raw_text.split('\n')
                clean_lines = []
                
                for line in lines:
                    line = line.strip()
                    if not line: continue
                    if "loadAdv" in line: continue
                    if "69书吧" in line: continue
                    if "(本章完)" in line: break
                    
                    clean_lines.append(line)

                content_cleaned = "\n\n".join(clean_lines)
                
                # Ambil Judul (Fallback logic lebih kuat)
                title = "Unknown"
                if soup.title:
                    title = soup.title.string.split('-')[0].strip()

                return {
                    "title": title,
                    "content": content_cleaned
                }

        except Exception as e:
            print(f"❌ Error System: {e}")
            return None

if __name__ == "__main__":
    scraper = NovelScraper()
    url = "https://www.69shuba.com/txt/83350/39231623"
    result = scraper.scrape_69shuba(url)
    
    if result:
        print(f"\n✅ BERHASIL: {result['title']}")
        print(f"Panjang Konten: {len(result['content'])} karakter")
        print("-" * 30)
        print(result['content'][:500])
    else:
        print("❌ Gagal.")