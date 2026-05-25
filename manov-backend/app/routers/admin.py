from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.crud import create_chapter, create_novel, delete_chapter, delete_novel
from app.database import get_session
from app.middleware.rate_limit import limiter
from app.models import Chapter, ChapterTranslation, Genre, Novel
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
async def create_new_novel(req: CreateNovelRequest, session: AsyncSession = Depends(get_session)):
    slug = await generate_slug(req.title, session)

    novel = Novel(
        slug=slug,
        title=req.title,
        originalTitle=req.originalTitle,
        author=req.author,
        coverUrl=req.coverUrl,
        synopsis=req.synopsis,
        status=req.status,
    )

    if req.genres:
        genres = await session.scalars(select(Genre).where(Genre.id.in_(req.genres)))
        novel.genres.extend(genres)

    await create_novel(session, novel)
    return novel


@router.post("/novels/{id}/chapters")
async def create_new_chapter(
    id: int, req: CreateChapterRequest, session: AsyncSession = Depends(get_session)
):
    chapter = Chapter(
        novelId=id,
        chapterNum=req.chapterNum,
        rawTitle=req.title,
        rawContent=req.content,
    )

    translation = ChapterTranslation(
        language="EN",
        title=req.title,
        content=req.content,
    )
    chapter.translations.append(translation)

    await create_chapter(session, chapter)
    return chapter


@router.delete("/chapters/{id}")
async def delete_existing_chapter(id: int, session: AsyncSession = Depends(get_session)):
    """Delete a chapter and its translations (cascaded at DB level)."""
    await delete_chapter(session, id)
    return {"message": "Chapter deleted"}


@router.post("/scrape")
@limiter.limit("3/minute")
async def trigger_scrape(
    request: Request,
    req: ScrapeRequest,
    background_tasks: BackgroundTasks,
):
    background_tasks.add_task(
        processor.process_novel,
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
async def update_novel_metadata(
    id: int, req: UpdateNovelRequest, session: AsyncSession = Depends(get_session)
):
    """Edit Judul, Cover, Sinopsis, Author"""
    novel = await session.get(Novel, id)
    if not novel:
        raise HTTPException(status_code=404, detail="Novel not found")

    novel.title = req.title
    novel.originalTitle = req.originalTitle
    novel.slug = req.slug
    novel.author = req.author
    novel.coverUrl = req.coverUrl
    novel.synopsis = req.synopsis
    novel.status = req.status

    # Update genres
    novel.genres.clear()
    if req.genres:
        genres = await session.scalars(select(Genre).where(Genre.id.in_(req.genres)))
        novel.genres.extend(genres)

    await session.commit()
    await session.refresh(novel)
    return novel


@router.put("/chapters/{translation_id}")
async def update_chapter_content(
    translation_id: int, req: UpdateChapterRequest, session: AsyncSession = Depends(get_session)
):
    """Edit Isi Terjemahan (Manual Fix)"""
    translation = await session.get(ChapterTranslation, translation_id)
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")

    translation.title = req.title
    translation.content = req.content

    await session.commit()
    await session.refresh(translation)
    return translation


@router.delete("/novels/{id}")
async def delete_existing_novel(id: int, session: AsyncSession = Depends(get_session)):
    """Delete a novel and ALL related data (cascaded at DB level)."""
    await delete_novel(session, id)
    return {"message": "Novel deleted successfully"}
