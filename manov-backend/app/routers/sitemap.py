from datetime import datetime

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.config import settings
from app.database import get_session
from app.models import Novel

router = APIRouter()


@router.get("/sitemap.xml")
async def get_sitemap(session: AsyncSession = Depends(get_session)):
    # Ambil semua novel dengan chapters eagerly loaded
    result = await session.execute(
        select(Novel)
        .options(selectinload(Novel.chapters))
        .order_by(Novel.updatedAt.desc())
    )
    novels = result.scalars().all()

    # Base URL website dari environment variable
    base_url = settings.FRONTEND_URL

    # Header XML
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'

    # Current date for static pages
    today = datetime.now().strftime("%Y-%m-%d")

    # 1. Static Pages
    static_pages = [
        {"path": "/", "priority": "1.0", "changefreq": "daily"},
        {"path": "/about", "priority": "0.6", "changefreq": "monthly"},
        {"path": "/login", "priority": "0.3", "changefreq": "monthly"},
        {"path": "/register", "priority": "0.3", "changefreq": "monthly"},
        {"path": "/library", "priority": "0.5", "changefreq": "weekly"},
    ]

    for page in static_pages:
        xml_content += f"""    <url>
        <loc>{base_url}{page["path"]}</loc>
        <lastmod>{today}</lastmod>
        <changefreq>{page["changefreq"]}</changefreq>
        <priority>{page["priority"]}</priority>
    </url>
"""

    # 2. Dynamic Pages (Novels + Chapters)
    total_chapter_urls = 0
    for novel in novels:
        last_mod = novel.updatedAt.strftime("%Y-%m-%d") if novel.updatedAt else today

        # Novel detail page
        xml_content += f"""    <url>
        <loc>{base_url}/novel/{novel.slug}</loc>
        <lastmod>{last_mod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
"""
        # Add cover image annotation if available
        if novel.coverUrl:
            cover_image = (
                novel.coverUrl
                if novel.coverUrl.startswith("http")
                else f"{base_url}{novel.coverUrl}"
            )
            xml_content += f"""        <image:image>
            <image:loc>{cover_image}</image:loc>
            <image:title>{novel.title}</image:title>
            <image:caption>{novel.title} cover</image:caption>
        </image:image>
"""
        xml_content += "    </url>\n"

        # Chapter pages (limit to prevent massive sitemap)
        MAX_CHAPTERS_PER_NOVEL = 500
        sorted_chapters = sorted(novel.chapters, key=lambda c: c.chapterNum)
        for chapter in sorted_chapters[:MAX_CHAPTERS_PER_NOVEL]:
            total_chapter_urls += 1
            xml_content += f"""    <url>
        <loc>{base_url}/novel/{novel.slug}/read/{chapter.chapterNum}</loc>
        <lastmod>{last_mod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
    </url>
"""

    xml_content += "</urlset>"

    # Add total count as XML comment for debugging
    total_urls = len(static_pages) + len(novels) + total_chapter_urls
    xml_content = xml_content.replace(
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<?xml version="1.0" encoding="UTF-8"?>\n<!-- Total URLs: {total_urls} (static: {len(static_pages)}, novels: {len(novels)}, chapters: {total_chapter_urls}) -->'
    )

    return Response(content=xml_content, media_type="application/xml")
