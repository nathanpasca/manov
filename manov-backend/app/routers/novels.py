from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Header, HTTPException
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.crud import (
    get_next_chapter,
    get_novel_by_slug,
    get_novels,
    get_prev_chapter,
    get_translation_by_chapter_and_language,
    upsert_history,
)
from app.database import get_session
from app.models import Chapter, Novel, User
from app.schemas import ChapterContent, Genre, NovelDetail, NovelList
from app.utils.security import ALGORITHM, SECRET_KEY

router = APIRouter()


# Helper untuk cek user opsional
async def get_optional_user(
    authorization: str | None = Header(None),
    session: AsyncSession = Depends(get_session),
):
    if not authorization:
        return None
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        if not user_id:
            return None

        # Verify user exists in DB to avoid ForeignKeyViolationError
        user = await session.get(User, int(user_id))

        return user.id if user else None
    except Exception:
        return None


@router.get("/genres", response_model=list[Genre])
async def get_all_genres(session: AsyncSession = Depends(get_session)):
    from app.crud import get_genres

    return await get_genres(session)


@router.get("/novels", response_model=list[NovelList])
async def get_all_novels(
    skip: int = 0, limit: int = 20, session: AsyncSession = Depends(get_session)
):
    # Ambil semua novel dengan pagination
    novels = await get_novels(session, skip=skip, limit=limit)

    # Manually map to schema to include chapterCount
    results = []
    for n in novels:
        n_dict = {
            "id": n.id,
            "title": n.title,
            "slug": n.slug,
            "coverUrl": n.coverUrl,
            "status": n.status,
            "author": n.author,
            "genres": [Genre(id=g.id, name=g.name) for g in n.genres],
            "chapterCount": len(n.chapters) if n.chapters else 0,
            "synopsis": n.synopsis,
            "averageRating": n.averageRating,
            "ratingCount": n.ratingCount,
        }
        results.append(n_dict)

    return results


@router.get("/novels/count")
async def get_novels_count(session: AsyncSession = Depends(get_session)):
    from app.crud import count_novels

    count = await count_novels(session)
    return {"count": count}


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

    return {
        "id": translation.id,
        "chapterId": translation.chapterId,
        "chapterNum": chapter_num,
        "title": translation.title,
        "content": translation.content,
        "language": translation.language,
        "nextChapterNum": next_chapter.chapterNum if next_chapter else None,
        "prevChapterNum": prev_chapter.chapterNum if prev_chapter else None,
        "novelTitle": novel.title,
    }
