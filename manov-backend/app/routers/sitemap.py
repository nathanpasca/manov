import os
from fastapi import APIRouter, Response
from prisma import Prisma
from datetime import datetime

router = APIRouter()
db = Prisma()

@router.get("/sitemap.xml")
async def get_sitemap():
    if not db.is_connected():
        await db.connect()

    # Ambil semua novel (hanya butuh slug dan updated_at)
    novels = await db.novel.find_many(
        order={'updatedAt': 'desc'}
    )

    # Base URL website dari environment variable
    base_url = os.getenv("FRONTEND_URL", "https://manov.nathanpasca.com")

    # Header XML
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    # Current date for static pages
    today = datetime.now().strftime("%Y-%m-%d")

    # 1. Static Pages
    static_pages = [
        {"path": "/", "priority": "1.0", "changefreq": "daily"},
        {"path": "/login", "priority": "0.5", "changefreq": "monthly"},
        {"path": "/register", "priority": "0.5", "changefreq": "monthly"},
        {"path": "/library", "priority": "0.6", "changefreq": "weekly"},
    ]

    for page in static_pages:
        xml_content += f"""    <url>
        <loc>{base_url}{page['path']}</loc>
        <lastmod>{today}</lastmod>
        <changefreq>{page['changefreq']}</changefreq>
        <priority>{page['priority']}</priority>
    </url>
"""

    # 2. Dynamic Pages (Novels)
    for novel in novels:
        last_mod = novel.updatedAt.strftime("%Y-%m-%d") if novel.updatedAt else today
        xml_content += f"""    <url>
        <loc>{base_url}/novel/{novel.slug}</loc>
        <lastmod>{last_mod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
"""

    xml_content += '</urlset>'

    return Response(content=xml_content, media_type="application/xml")
