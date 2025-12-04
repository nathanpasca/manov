from fastapi import APIRouter, Response
from prisma import Prisma

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

    # Base URL website (sesuaikan dengan domain production nanti)
    base_url = "https://manov.vercel.app"

    # Header XML
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    # 1. Static Pages (Home)
    xml_content += f"""
    <url>
        <loc>{base_url}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    """

    # 2. Dynamic Pages (Novels)
    for novel in novels:
        last_mod = novel.updatedAt.strftime("%Y-%m-%d") if novel.updatedAt else "2024-01-01"
        xml_content += f"""
    <url>
        <loc>{base_url}/novel/{novel.slug}</loc>
        <lastmod>{last_mod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    """

    xml_content += '</urlset>'

    return Response(content=xml_content, media_type="application/xml")
