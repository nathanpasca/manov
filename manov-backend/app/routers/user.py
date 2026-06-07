from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import (
    add_to_library,
    get_library_entry,
    get_rating,
    get_review_by_user_and_novel,
    get_unread_notification_count,
    get_user_histories,
    get_user_library,
    get_user_notifications,
    mark_all_notifications_read,
    mark_notification_read,
    remove_from_library,
)
from app.database import get_session
from app.schemas import NovelHistory, NovelList
from app.utils.deps import get_current_user

router = APIRouter()


class ProgressUpdateRequest(BaseModel):
    novelId: int
    chapterNum: int
    scrollPosition: float | None = None
    progressPercent: int = 0
    lastReadBlockIndex: int | None = None
    blockOffsetPercent: int = 0


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

    # Cek Rating User (prefer Review score since it is the more considered opinion,
    # fallback to quick Rating if no review exists)
    review = await get_review_by_user_and_novel(session, user["id"], novel_id)
    if review:
        user_rating = review.score
    else:
        rating = await get_rating(session, user["id"], novel_id)
        user_rating = rating.score if rating else 0

    return {
        "isBookmarked": bool(exists),
        "userRating": user_rating,
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
            "progressPercent": h.progressPercent,
        }
        result.append(NovelHistory.model_validate(novel_data))

    return result


# --- UPDATE READING PROGRESS ---
@router.post("/history/progress")
async def update_progress(
    req: ProgressUpdateRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    from app.crud import get_history_entry, upsert_history

    entry = await get_history_entry(session, user["id"], req.novelId)
    if entry:
        entry.chapterNum = req.chapterNum
        entry.scrollPosition = req.scrollPosition
        entry.progressPercent = req.progressPercent
        entry.lastReadBlockIndex = req.lastReadBlockIndex
        entry.blockOffsetPercent = req.blockOffsetPercent
        await session.commit()
        await session.refresh(entry)
        return {"message": "Progress updated"}

    # Create new history entry
    await upsert_history(session, user["id"], req.novelId, req.chapterNum)
    # Re-fetch to update progress fields
    entry = await get_history_entry(session, user["id"], req.novelId)
    if entry:
        entry.scrollPosition = req.scrollPosition
        entry.progressPercent = req.progressPercent
        entry.lastReadBlockIndex = req.lastReadBlockIndex
        entry.blockOffsetPercent = req.blockOffsetPercent
        await session.commit()

    return {"message": "Progress saved"}


@router.get("/history/{novel_id}")
async def get_history_for_novel(
    novel_id: int,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    from app.crud import get_history_entry

    entry = await get_history_entry(session, user["id"], novel_id)
    if not entry:
        raise HTTPException(status_code=404, detail="History not found")
    return {
        "novelId": entry.novelId,
        "chapterNum": entry.chapterNum,
        "lastReadBlockIndex": entry.lastReadBlockIndex,
        "blockOffsetPercent": entry.blockOffsetPercent,
        "scrollPosition": entry.scrollPosition,
        "progressPercent": entry.progressPercent,
        "updatedAt": entry.updatedAt,
    }


# --- NOTIFICATIONS ---
@router.get("/notifications")
async def get_notifications(
    skip: int = 0,
    limit: int = 20,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    notifications = await get_user_notifications(session, user["id"], skip=skip, limit=limit)
    return [
        {
            "id": n.id,
            "type": n.type,
            "message": n.message,
            "novelId": n.novelId,
            "chapterId": n.chapterId,
            "isRead": n.isRead,
            "createdAt": n.createdAt,
        }
        for n in notifications
    ]


@router.get("/notifications/unread-count")
async def get_unread_count(
    user: dict = Depends(get_current_user), session: AsyncSession = Depends(get_session)
):
    count = await get_unread_notification_count(session, user["id"])
    return {"count": count}


@router.post("/notifications/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: int,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    notification = await mark_notification_read(session, notification_id, user["id"])
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Marked as read"}


@router.post("/notifications/read-all")
async def mark_all_as_read(
    user: dict = Depends(get_current_user), session: AsyncSession = Depends(get_session)
):
    await mark_all_notifications_read(session, user["id"])
    return {"message": "All notifications marked as read"}
