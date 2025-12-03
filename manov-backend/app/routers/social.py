from fastapi import APIRouter, Depends, HTTPException
from prisma import Prisma
from typing import List, Optional
from pydantic import BaseModel
from app.utils.deps import get_current_user
from datetime import datetime

router = APIRouter()
db = Prisma()

# --- SCHEMAS ---
class RatingRequest(BaseModel):
    score: int # 1-5

class CommentRequest(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: int
    userId: int
    username: str
    content: str
    createdAt: datetime

# --- RATINGS ---

@router.post("/novels/{id}/rate")
async def rate_novel(id: int, req: RatingRequest, user: dict = Depends(get_current_user)):
    if not 1 <= req.score <= 5:
        raise HTTPException(status_code=400, detail="Score must be between 1 and 5")

    if not db.is_connected(): await db.connect()

    # 1. Upsert Rating
    # Prisma upsert butuh unique constraint
    await db.rating.upsert(
        where={
            'userId_novelId': {
                'userId': user['id'],
                'novelId': id
            }
        },
        data={
            'create': {
                'userId': user['id'],
                'novelId': id,
                'score': req.score
            },
            'update': {
                'score': req.score
            }
        }
    )

    # 2. Recalculate Average (Async/Background idealnya, tapi simple dulu)
    ratings = await db.rating.find_many(where={'novelId': id})
    total_score = sum([r.score for r in ratings])
    count = len(ratings)
    average = total_score / count if count > 0 else 0

    # 3. Update Novel Stats
    await db.novel.update(
        where={'id': id},
        data={
            'averageRating': average,
            'ratingCount': count
        }
    )

    return {"message": "Rating submitted", "average": average, "count": count}


# --- COMMENTS (NOVEL) ---

@router.get("/novels/{id}/comments", response_model=List[CommentResponse])
async def get_novel_comments(id: int, skip: int = 0, limit: int = 10):
    if not db.is_connected(): await db.connect()

    comments = await db.comment.find_many(
        where={'novelId': id},
        skip=skip,
        take=limit,
        order={'createdAt': 'desc'},
        include={'user': True}
    )

    return [
        {
            "id": c.id,
            "userId": c.userId,
            "username": c.user.username,
            "content": c.content,
            "createdAt": c.createdAt
        }
        for c in comments
    ]

@router.post("/novels/{id}/comments")
async def post_novel_comment(id: int, req: CommentRequest, user: dict = Depends(get_current_user)):
    if not db.is_connected(): await db.connect()

    comment = await db.comment.create(
        data={
            'userId': user['id'],
            'novelId': id,
            'content': req.content
        },
        include={'user': True}
    )

    return {
        "id": comment.id,
        "userId": comment.userId,
        "username": comment.user.username,
        "content": comment.content,
        "createdAt": comment.createdAt
    }


# --- COMMENTS (CHAPTER) ---

@router.get("/chapters/{id}/comments", response_model=List[CommentResponse])
async def get_chapter_comments(id: int, skip: int = 0, limit: int = 10):
    if not db.is_connected(): await db.connect()

    comments = await db.comment.find_many(
        where={'chapterId': id},
        skip=skip,
        take=limit,
        order={'createdAt': 'desc'},
        include={'user': True}
    )

    return [
        {
            "id": c.id,
            "userId": c.userId,
            "username": c.user.username,
            "content": c.content,
            "createdAt": c.createdAt
        }
        for c in comments
    ]

@router.post("/chapters/{id}/comments")
async def post_chapter_comment(id: int, req: CommentRequest, user: dict = Depends(get_current_user)):
    if not db.is_connected(): await db.connect()

    comment = await db.comment.create(
        data={
            'userId': user['id'],
            'chapterId': id,
            'content': req.content
        },
        include={'user': True}
    )

    return {
        "id": comment.id,
        "userId": comment.userId,
        "username": comment.user.username,
        "content": comment.content,
        "createdAt": comment.createdAt
    }

# --- DELETE COMMENT ---

@router.delete("/comments/{id}")
async def delete_comment(id: int, user: dict = Depends(get_current_user)):
    if not db.is_connected(): await db.connect()

    # 1. Cari Comment
    comment = await db.comment.find_unique(where={'id': id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # 2. Cek Owner (Hanya pemilik yang bisa hapus)
    # TODO: Admin juga harusnya bisa hapus
    if comment.userId != user['id']:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    # 3. Hapus
    await db.comment.delete(where={'id': id})

    return {"message": "Comment deleted"}
