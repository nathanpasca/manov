from fastapi import APIRouter, BackgroundTasks, Depends, Request
from pydantic import BaseModel, Field

from app.database import db
from app.middleware.rate_limit import limiter
from app.services.processor import NovelProcessorService
from app.utils.deps import get_current_admin
from app.utils.slug import generate_slug

router = APIRouter(dependencies=[Depends(get_current_admin)])
processor = NovelProcessorService()


# --- SCHEMA REQUEST ---
class ScrapeRequest(BaseModel):
    slug: str
    url: str | None = None  # Boleh kosong kalau mau Resume
    title: str | None = None  # Boleh kosong kalau novel sudah ada


class UpdateNovelRequest(BaseModel):
    title: str = Field(..., max_length=255)
    originalTitle: str = Field(..., max_length=255)
    slug: str = Field(..., max_length=255)
    author: str = Field(..., max_length=255)
    coverUrl: str = Field(..., max_length=500)
    synopsis: str = Field(..., max_length=10000)
    status: str = Field(..., max_length=50)
    genres: list[int] = []


class UpdateChapterRequest(BaseModel):
    title: str = Field(..., max_length=500)
    content: str = Field(..., max_length=500000)


class CreateNovelRequest(BaseModel):
    title: str = Field(..., max_length=255)
    originalTitle: str = Field(..., max_length=255)
    author: str = Field(..., max_length=255)
    coverUrl: str = Field(..., max_length=500)
    synopsis: str = Field(..., max_length=10000)
    status: str = Field(..., max_length=50)
    genres: list[int] = []


class CreateChapterRequest(BaseModel):
    chapterNum: int
    title: str = Field(..., max_length=500)
    content: str = Field(..., max_length=500000)


# --- ENDPOINTS ---


@router.post("/novels")
async def create_novel(req: CreateNovelRequest):
    slug = await generate_slug(req.title)

    novel = await db.novel.create(
        data={
            "slug": slug,
            "title": req.title,
            "originalTitle": req.originalTitle,
            "author": req.author,
            "coverUrl": req.coverUrl,
            "synopsis": req.synopsis,
            "status": req.status,
            "genres": {"connect": [{"id": gid} for gid in req.genres]},
        }
    )
    return novel


@router.post("/novels/{id}/chapters")
async def create_chapter(id: int, req: CreateChapterRequest):
    # Create Chapter
    chapter = await db.chapter.create(
        data={
            "novelId": id,
            "chapterNum": req.chapterNum,
            "rawTitle": req.title,
            "rawContent": req.content,  # Storing in rawContent too for consistency
            "translations": {
                "create": {
                    "language": "EN",
                    "title": req.title,
                    "content": req.content,
                }
            },
        }
    )
    return chapter


@router.delete("/chapters/{id}")
async def delete_chapter(id: int):
    """Delete a chapter and its translations (cascaded at DB level)."""
    await db.chapter.delete(where={"id": id})
    return {"message": "Chapter deleted"}


@router.post("/scrape")
@limiter.limit("3/minute")
async def trigger_scrape(request: Request, req: ScrapeRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(
        processor.process_novel,  # Panggil fungsi yang baru diupdate
        req.slug,
        req.url,
        req.title,
    )

    mode = "RESUME" if not req.url else "START NEW"
    return {
        "status": "success",
        "message": f"Scraping '{req.slug}' ({mode}) started in background.",
    }


@router.put("/novels/{id}")
async def update_novel_metadata(id: int, req: UpdateNovelRequest):
    """Edit Judul, Cover, Sinopsis, Author"""
    updated = await db.novel.update(
        where={"id": id},
        data={
            "title": req.title,
            "originalTitle": req.originalTitle,
            "slug": req.slug,
            "author": req.author,
            "coverUrl": req.coverUrl,
            "synopsis": req.synopsis,
            "status": req.status,
            "genres": {"set": [{"id": gid} for gid in req.genres]},
        },
    )
    return updated


@router.put("/chapters/{translation_id}")
async def update_chapter_content(translation_id: int, req: UpdateChapterRequest):
    """Edit Isi Terjemahan (Manual Fix)"""
    updated = await db.chaptertranslation.update(
        where={"id": translation_id},
        data={"title": req.title, "content": req.content},
    )
    return updated


@router.delete("/novels/{id}")
async def delete_novel(id: int):
    """Delete a novel and ALL related data (cascaded at DB level)."""
    await db.novel.delete(where={"id": id})
    return {"message": "Novel deleted successfully"}
