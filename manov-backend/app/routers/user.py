from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import (
    add_to_library,
    get_library_entry,
    get_rating,
    get_user_histories,
    get_user_library,
    remove_from_library,
)
from app.database import get_session
from app.schemas import NovelHistory, NovelList
from app.utils.deps import get_current_user

router = APIRouter()


# --- GET LIBRARY ---
@router.get("/library", response_model=list[NovelList])
async def get_user_library_endpoint(user: dict = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    # Ambil data Library, include data Novel beserta Genres
    items = await get_user_library(session, user["id"])

    # Flatten structure & map to schema
    results = []
    for item, chapter_count in items:
        n = item.novel
        n_dict = {
            "id": n.id,
            "title": n.title,
            "slug": n.slug,
            "coverUrl": n.coverUrl,
            "status": n.status,
            "author": n.author,
            "genres": [{"id": g.id, "name": g.name} for g in n.genres],
            "chapterCount": chapter_count or 0,
            "synopsis": n.synopsis,
            "averageRating": n.averageRating,
            "ratingCount": n.ratingCount,
        }
        results.append(NovelList.model_validate(n_dict))

    return results


# --- ADD TO LIBRARY ---
@router.post("/library/{novel_id}")
async def add_to_library_endpoint(
    novel_id: int, user: dict = Depends(get_current_user), session: AsyncSession = Depends(get_session)
):
    # Cek apakah sudah ada
    exists = await get_library_entry(session, user["id"], novel_id)

    if exists:
        return {"message": "Already in library"}

    await add_to_library(session, user["id"], novel_id)

    return {"message": "Added to library"}


# --- REMOVE FROM LIBRARY ---
@router.delete("/library/{novel_id}")
async def remove_from_library_endpoint(
    novel_id: int, user: dict = Depends(get_current_user), session: AsyncSession = Depends(get_session)
):
    await remove_from_library(session, user["id"], novel_id)

    return {"message": "Removed from library"}


# --- CHECK STATUS (Is Bookmarked?) ---
@router.get("/library/check/{novel_id}")
async def check_library_status(
    novel_id: int, user: dict = Depends(get_current_user), session: AsyncSession = Depends(get_session)
):
    exists = await get_library_entry(session, user["id"], novel_id)

    # Cek Rating User
    rating = await get_rating(session, user["id"], novel_id)

    return {
        "isBookmarked": bool(exists),
        "userRating": rating.score if rating else 0,
    }


# --- GET HISTORY ---
@router.get("/history")
async def get_user_history_endpoint(user: dict = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    # Ambil 5 riwayat bacaan terakhir
    histories = await get_user_histories(session, user["id"])

    # Kita perlu format khusus agar Frontend tahu chapter terakhirnya berapa
    result = []
    for h in histories:
        novel_data = {
            "id": h.novel.id,
            "title": h.novel.title,
            "slug": h.novel.slug,
            "coverUrl": h.novel.coverUrl,
            "status": h.novel.status,
            "author": h.novel.author,
            "genres": [],
            "chapterCount": 0,
            "synopsis": h.novel.synopsis,
            "averageRating": h.novel.averageRating,
            "ratingCount": h.novel.ratingCount,
            "originalTitle": h.novel.originalTitle,
            "updatedAt": h.novel.updatedAt,
            "chapters": [],
            "lastReadChapter": h.chapterNum,
        }
        result.append(NovelHistory.model_validate(novel_data))

    return result
