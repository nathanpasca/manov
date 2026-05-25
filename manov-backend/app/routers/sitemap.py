from datetime import datetime

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.config import settings
from app.database import get_session
from app.models import Novel

router = APIRouter()


@router.get("/sitemap.xml")
async def get_sitemap(session: AsyncSession = Depends(get_session)):
    # Ambil semua novel (hanya butuh slug dan updated_at)
    result = await session.execute(select(Novel).order_by(Novel.updatedAt.desc()))
    novels = result.scalars().all()

    # Base URL website dari environment variable
    base_url = settings.FRONTEND_URL

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
        <loc>{base_url}{page["path"]}</loc>
        <lastmod>{today}</lastmod>
        <changefreq>{page["changefreq"]}</changefreq>
        <priority>{page["priority"]}</priority>
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

    xml_content += "</urlset>"

    return Response(content=xml_content, media_type="application/xml")
