from datetime import datetime

import nh3
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.crud import (
    create_comment,
    create_review,
    delete_comment,
    delete_review,
    get_chapter_comments,
    get_comment_by_id,
    get_novel_combined_rating_stats,
    get_novel_comments,
    get_review_by_id,
    get_review_by_user_and_novel,
    get_reviews_by_novel,
    update_review,
    upsert_rating,
)
from app.database import get_session
from app.middleware.rate_limit import limiter
from app.models import Comment, Novel, Review
from app.utils.deps import get_current_user

router = APIRouter()


# --- SCHEMAS ---
class RatingRequest(BaseModel):
    score: int  # 1-5


class CommentRequest(BaseModel):
    content: str = Field(..., max_length=5000)
    parentId: int | None = None


class CommentResponse(BaseModel):
    id: int
    userId: int
    username: str
    content: str
    createdAt: datetime
    parentId: int | None = None
    depth: int = 0


class ReviewRequest(BaseModel):
    score: int = Field(..., ge=1, le=5)
    content: str = Field(..., max_length=5000)


class ReviewResponse(BaseModel):
    id: int
    userId: int
    username: str
    score: int
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

    # 2. Recalculate Average from both Rating and Review tables
    average, count = await get_novel_combined_rating_stats(session, id)

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
            "parentId": c.parentId,
            "depth": c.depth,
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
    comment = Comment(
        userId=user["id"], novelId=id, content=clean_content, parentId=req.parentId
    )
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
        "parentId": comment.parentId,
        "depth": comment.depth,
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
            "parentId": c.parentId,
            "depth": c.depth,
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
    comment = Comment(
        userId=user["id"], chapterId=id, content=clean_content, parentId=req.parentId
    )
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
        "parentId": comment.parentId,
        "depth": comment.depth,
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


# --- REVIEWS ---


@router.get("/novels/{id}/reviews", response_model=list[ReviewResponse])
async def get_novel_reviews(
    id: int, skip: int = 0, limit: int = 10, session: AsyncSession = Depends(get_session)
):
    reviews = await get_reviews_by_novel(session, id, skip=skip, limit=limit)
    return [
        {
            "id": review.id,
            "userId": review.userId,
            "username": username,
            "score": review.score,
            "content": review.content,
            "createdAt": review.createdAt,
        }
        for review, username in reviews
    ]


@router.post("/novels/{id}/reviews")
@limiter.limit("5/minute")
async def post_novel_review(
    request: Request,
    id: int,
    req: ReviewRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # Upsert: if user already reviewed this novel, update it
    existing = await get_review_by_user_and_novel(session, user["id"], id)
    if existing:
        await update_review(session, existing, req.score, nh3.clean(req.content))
        review = existing
    else:
        review = Review(
            userId=user["id"],
            novelId=id,
            score=req.score,
            content=nh3.clean(req.content),
        )
        await create_review(session, review)

    # Update novel combined rating stats (includes both quick ratings and reviews)
    avg, count = await get_novel_combined_rating_stats(session, id)
    novel = await session.get(Novel, id)
    if novel:
        novel.averageRating = avg
        novel.ratingCount = count
        await session.commit()

    return {
        "message": "Review submitted",
        "id": review.id,
        "score": review.score,
        "content": review.content,
        "average": avg,
        "count": count,
    }


@router.put("/reviews/{id}")
async def update_review_endpoint(
    id: int,
    req: ReviewRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    review = await get_review_by_id(session, id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.userId != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this review")

    await update_review(session, review, req.score, nh3.clean(req.content))

    # Update novel combined rating stats
    avg, count = await get_novel_combined_rating_stats(session, review.novelId)
    novel = await session.get(Novel, review.novelId)
    if novel:
        novel.averageRating = avg
        novel.ratingCount = count
        await session.commit()

    return {"message": "Review updated", "id": review.id}


@router.delete("/reviews/{id}")
async def delete_review_endpoint(
    id: int, user: dict = Depends(get_current_user), session: AsyncSession = Depends(get_session)
):
    review = await get_review_by_id(session, id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.userId != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")

    novel_id = review.novelId
    await delete_review(session, id)

    # Update novel combined rating stats
    avg, count = await get_novel_combined_rating_stats(session, novel_id)
    novel = await session.get(Novel, novel_id)
    if novel:
        novel.averageRating = avg
        novel.ratingCount = count
        await session.commit()

    return {"message": "Review deleted"}
