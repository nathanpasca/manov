from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.crud import create_chapter, create_novel, delete_chapter, delete_novel
from app.database import get_session
from app.middleware.rate_limit import limiter
from app.models import Chapter, ChapterTranslation, Genre, Novel, utc_now
from app.services.processor import NovelProcessorService
from app.utils.audit import log_admin_action
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


class AgentChapterInput(BaseModel):
    chapterNum: int
    title: str = Field(..., max_length=500)
    content: str = Field(..., max_length=500000)
    language: str = Field(default="EN", max_length=10)
    publishedAt: datetime | None = None


class CreateNovelWithChaptersRequest(BaseModel):
    title: str = Field(..., max_length=255)
    originalTitle: str = Field(..., max_length=255)
    author: str = Field(..., max_length=255)
    coverUrl: str = Field(..., max_length=500)
    synopsis: str = Field(..., max_length=10000)
    status: str = Field(..., max_length=50)
    genreNames: list[str] = []
    chapters: list[AgentChapterInput] = []


class BulkAddChaptersRequest(BaseModel):
    chapters: list[AgentChapterInput]


class UpdateChapterContentRequest(BaseModel):
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
    result = await session.execute(
        select(Novel).where(Novel.id == id).options(selectinload(Novel.genres))
    )
    novel = result.scalar_one_or_none()
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


@router.post(
    "/novels/with-chapters",
    summary="Create a novel and optionally its first chapters in a single call.",
)
async def create_novel_with_chapters(
    req: CreateNovelWithChaptersRequest,
    user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
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

    if req.genreNames:
        genres = await session.scalars(
            select(Genre).where(Genre.name.in_(req.genreNames))
        )
        novel.genres.extend(genres)

    session.add(novel)
    await session.flush()  # assign novel.id

    translation_ids = []
    for ch in req.chapters:
        chapter = Chapter(
            novelId=novel.id,
            chapterNum=ch.chapterNum,
            rawTitle=ch.title,
            rawContent=ch.content,
        )
        session.add(chapter)
        await session.flush()

        translation = ChapterTranslation(
            chapterId=chapter.id,
            language=ch.language,
            title=ch.title,
            content=ch.content,
            publishedAt=ch.publishedAt or utc_now(),
        )
        session.add(translation)
        await session.flush()
        translation_ids.append(translation.id)

    await session.commit()
    await session.refresh(novel)

    await log_admin_action(
        session,
        user_id=user["id"],
        action="CREATE_NOVEL_WITH_CHAPTERS",
        entity_type="novel",
        entity_id=novel.id,
        payload={"title": req.title, "chaptersCreated": len(req.chapters)},
    )

    return {
        "novelId": novel.id,
        "slug": novel.slug,
        "chaptersCreated": len(req.chapters),
        "translationIds": translation_ids,
    }


@router.post(
    "/novels/{novel_id}/chapters/bulk",
    summary="Add multiple chapters to an existing novel.",
)
async def bulk_add_chapters(
    novel_id: int,
    req: BulkAddChaptersRequest,
    user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    novel = await session.get(Novel, novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="Novel not found")

    translation_ids = []
    for ch in req.chapters:
        existing = await session.scalar(
            select(Chapter).where(
                Chapter.novelId == novel_id, Chapter.chapterNum == ch.chapterNum
            )
        )
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"Chapter {ch.chapterNum} already exists. Use PUT /admin/chapters/{existing.id}/content to update.",
            )

        chapter = Chapter(
            novelId=novel_id,
            chapterNum=ch.chapterNum,
            rawTitle=ch.title,
            rawContent=ch.content,
        )
        session.add(chapter)
        await session.flush()

        translation = ChapterTranslation(
            chapterId=chapter.id,
            language=ch.language,
            title=ch.title,
            content=ch.content,
            publishedAt=ch.publishedAt or utc_now(),
        )
        session.add(translation)
        await session.flush()
        translation_ids.append(translation.id)

    await session.commit()

    await log_admin_action(
        session,
        user_id=user["id"],
        action="BULK_ADD_CHAPTERS",
        entity_type="novel",
        entity_id=novel_id,
        payload={"chaptersAdded": len(req.chapters)},
    )

    return {
        "novelId": novel_id,
        "chaptersAdded": len(req.chapters),
        "translationIds": translation_ids,
    }


@router.put(
    "/chapters/{translation_id}/content",
    summary="Update the title and content of a chapter translation.",
)
async def update_chapter_translation_content(
    translation_id: int,
    req: UpdateChapterContentRequest,
    user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    translation = await session.get(ChapterTranslation, translation_id)
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")

    translation.title = req.title
    translation.content = req.content
    await session.commit()
    await session.refresh(translation)

    await log_admin_action(
        session,
        user_id=user["id"],
        action="UPDATE_CHAPTER_CONTENT",
        entity_type="translation",
        entity_id=translation_id,
        payload={"title": req.title},
    )

    return {"message": "Chapter updated", "translationId": translation_id}
