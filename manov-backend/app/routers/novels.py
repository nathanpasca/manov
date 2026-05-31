from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.crud import (
    get_next_chapter,
    get_novel_by_slug,
    get_novels,
    get_prev_chapter,
    get_translation_by_chapter_and_language,
    search_novels,
    upsert_history,
)
from app.database import get_session
from app.models import Chapter, Novel
from app.schemas import ChapterContent, Genre, NovelDetail, NovelList
from app.utils.deps import get_current_user_optional

router = APIRouter()


async def get_optional_user(
    user: dict | None = Depends(get_current_user_optional),
) -> int | None:
    """Return user id if authenticated, else None."""
    return user["id"] if user else None


@router.get("/genres", response_model=list[Genre])
async def get_all_genres(session: AsyncSession = Depends(get_session)):
    from app.crud import get_genres

    return await get_genres(session)


@router.get("/novels", response_model=list[NovelList])
async def get_all_novels(
    q: str | None = None,
    skip: int = 0,
    limit: int = 20,
    sort_by: str = "updatedAt",
    sort_order: str = "desc",
    status: str | None = None,
    genre_id: int | None = None,
    session: AsyncSession = Depends(get_session),
):
    # --- Search mode ---
    if q and len(q.strip()) >= 2:
        novels = await search_novels(session, query=q.strip(), skip=skip, limit=limit)
    else:
        novels = await get_novels(
            session,
            skip=skip,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
            status=status,
            genre_id=genre_id,
        )

    # Map to schema (get_novels now returns tuples of (Novel, chapter_count))
    results = []
    for novel, chapter_count in novels:
        n_dict = {
            "id": novel.id,
            "title": novel.title,
            "slug": novel.slug,
            "coverUrl": novel.coverUrl,
            "status": novel.status,
            "author": novel.author,
            "genres": [Genre(id=g.id, name=g.name) for g in novel.genres],
            "chapterCount": chapter_count or 0,
            "synopsis": novel.synopsis,
            "averageRating": novel.averageRating,
            "ratingCount": novel.ratingCount,
        }
        results.append(NovelList.model_validate(n_dict))

    return results


@router.get("/novels/count")
async def get_novels_count(session: AsyncSession = Depends(get_session)):
    from app.crud import count_novels

    count = await count_novels(session)
    return {"count": count}


@router.get("/novels/trending", response_model=list[NovelList])
async def get_trending_novels(
    limit: int = 10, session: AsyncSession = Depends(get_session)
):
    """Return top novels by view count."""
    from app.crud import get_trending_novels

    novels = await get_trending_novels(session, limit=limit)
    results = []
    for novel, chapter_count in novels:
        n_dict = {
            "id": novel.id,
            "title": novel.title,
            "slug": novel.slug,
            "coverUrl": novel.coverUrl,
            "status": novel.status,
            "author": novel.author,
            "genres": [Genre(id=g.id, name=g.name) for g in novel.genres],
            "chapterCount": chapter_count or 0,
            "synopsis": novel.synopsis,
            "averageRating": novel.averageRating,
            "ratingCount": novel.ratingCount,
        }
        results.append(NovelList.model_validate(n_dict))
    return results


@router.post("/novels/{slug}/track-view")
async def track_novel_view(
    slug: str, session: AsyncSession = Depends(get_session)
):
    """Increment view count for a novel."""
    from app.crud import get_novel_by_slug, increment_view_count

    novel = await get_novel_by_slug(session, slug)
    if not novel:
        raise HTTPException(status_code=404, detail="Novel not found")

    await increment_view_count(session, novel.id)
    return {"message": "View tracked"}


@router.get("/novels/{slug}", response_model=NovelDetail)
async def get_novel_detail(slug: str, session: AsyncSession = Depends(get_session)):
    # Kita include publishedAt di sini
    result = await session.execute(
        select(Novel)
        .where(Novel.slug == slug)
        .options(
            selectinload(Novel.genres),
            selectinload(Novel.chapters).selectinload(Chapter.translations),
        )
    )
    novel = result.scalar_one_or_none()

    if not novel:
        raise HTTPException(status_code=404, detail="Novel not found")

    # Filter translations to EN only for each chapter
    for ch in novel.chapters:
        ch.translations = [t for t in ch.translations if t.language == "EN"]

    return novel


@router.get("/novels/{slug}/chapters/{chapter_num}", response_model=ChapterContent)
async def get_chapter_content(
    slug: str,
    chapter_num: int,
    user_id: int | None = Depends(get_optional_user),
    session: AsyncSession = Depends(get_session),
):
    # 1. Cari Novel & Chapter
    novel = await get_novel_by_slug(session, slug)
    if not novel:
        raise HTTPException(status_code=404, detail="Novel not found")

    chapter = await session.scalar(
        select(Chapter).where(
            Chapter.novelId == novel.id, Chapter.chapterNum == chapter_num
        )
    )
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    translation = await get_translation_by_chapter_and_language(
        session, chapter.id, "EN"
    )
    if not translation:
        raise HTTPException(status_code=404, detail="Chapter not found")

    # 2. Cek Lock (Logic Gembok Kemarin)
    if translation.publishedAt and translation.publishedAt > datetime.now(UTC):
        raise HTTPException(status_code=403, detail="Chapter locked")

    # 3. --- LOGIC HISTORY BARU ---
    if user_id:
        await upsert_history(session, user_id, novel.id, chapter_num)

    # 4. Cek Next & Prev Chapter
    next_chapter = await get_next_chapter(session, novel.id, chapter_num)
    prev_chapter = await get_prev_chapter(session, novel.id, chapter_num)

    return ChapterContent.model_validate({
        "id": translation.id,
        "chapterId": translation.chapterId,
        "chapterNum": chapter_num,
        "title": translation.title,
        "content": translation.content,
        "language": translation.language,
        "nextChapterNum": next_chapter.chapterNum if next_chapter else None,
        "prevChapterNum": prev_chapter.chapterNum if prev_chapter else None,
        "novelTitle": novel.title,
    })
