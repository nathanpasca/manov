from datetime import datetime

import nh3
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.crud import (
    create_comment,
    delete_comment,
    get_chapter_comments,
    get_comment_by_id,
    get_novel_comments,
    get_novel_rating_stats,
    upsert_rating,
)
from app.database import get_session
from app.middleware.rate_limit import limiter
from app.models import Comment, Novel
from app.utils.deps import get_current_user

router = APIRouter()


# --- SCHEMAS ---
class RatingRequest(BaseModel):
    score: int  # 1-5


class CommentRequest(BaseModel):
    content: str = Field(..., max_length=5000)


class CommentResponse(BaseModel):
    id: int
    userId: int
    username: str
    content: str
    createdAt: datetime


# --- RATINGS ---


@router.post("/novels/{id}/rate")
@limiter.limit("10/minute")
async def rate_novel(
    request: Request,
    id: int,
    req: RatingRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not 1 <= req.score <= 5:
        raise HTTPException(status_code=400, detail="Score must be between 1 and 5")

    # 1. Upsert Rating
    await upsert_rating(session, user["id"], id, req.score)

    # 2. Recalculate Average using SQL aggregates
    average, count = await get_novel_rating_stats(session, id)

    # 3. Update Novel Stats
    novel = await session.get(Novel, id)
    if novel:
        novel.averageRating = average
        novel.ratingCount = count
        await session.commit()

    return {"message": "Rating submitted", "average": average, "count": count}


# --- COMMENTS (NOVEL) ---


@router.get("/novels/{id}/comments", response_model=list[CommentResponse])
async def get_novel_comments_endpoint(
    id: int, skip: int = 0, limit: int = 10, session: AsyncSession = Depends(get_session)
):
    comments = await get_novel_comments(session, id, skip=skip, limit=limit)

    return [
        {
            "id": c.id,
            "userId": c.userId,
            "username": c.user.username,
            "content": c.content,
            "createdAt": c.createdAt,
        }
        for c in comments
    ]


@router.post("/novels/{id}/comments")
@limiter.limit("10/minute")
async def post_novel_comment(
    request: Request,
    id: int,
    req: CommentRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    clean_content = nh3.clean(req.content)
    comment = Comment(userId=user["id"], novelId=id, content=clean_content)
    await create_comment(session, comment)
    # Eager load user for response
    result = await session.execute(
        select(Comment).where(Comment.id == comment.id).options(selectinload(Comment.user))
    )
    comment = result.scalar_one()

    return {
        "id": comment.id,
        "userId": comment.userId,
        "username": comment.user.username,
        "content": comment.content,
        "createdAt": comment.createdAt,
    }


# --- COMMENTS (CHAPTER) ---


@router.get("/chapters/{id}/comments", response_model=list[CommentResponse])
async def get_chapter_comments_endpoint(
    id: int, skip: int = 0, limit: int = 10, session: AsyncSession = Depends(get_session)
):
    comments = await get_chapter_comments(session, id, skip=skip, limit=limit)

    return [
        {
            "id": c.id,
            "userId": c.userId,
            "username": c.user.username,
            "content": c.content,
            "createdAt": c.createdAt,
        }
        for c in comments
    ]


@router.post("/chapters/{id}/comments")
@limiter.limit("10/minute")
async def post_chapter_comment(
    request: Request,
    id: int,
    req: CommentRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    clean_content = nh3.clean(req.content)
    comment = Comment(userId=user["id"], chapterId=id, content=clean_content)
    await create_comment(session, comment)
    # Eager load user for response
    result = await session.execute(
        select(Comment).where(Comment.id == comment.id).options(selectinload(Comment.user))
    )
    comment = result.scalar_one()

    return {
        "id": comment.id,
        "userId": comment.userId,
        "username": comment.user.username,
        "content": comment.content,
        "createdAt": comment.createdAt,
    }


# --- DELETE COMMENT ---


@router.delete("/comments/{id}")
async def delete_comment_endpoint(
    id: int, user: dict = Depends(get_current_user), session: AsyncSession = Depends(get_session)
):
    # 1. Cari Comment
    comment = await get_comment_by_id(session, id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # 2. Cek Owner (Hanya pemilik yang bisa hapus)
    if comment.userId != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    # 3. Hapus
    await delete_comment(session, id)

    return {"message": "Comment deleted"}
