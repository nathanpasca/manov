from fastapi import APIRouter, HTTPException, Depends
from prisma import Prisma
from typing import List
from app.schemas import Genre, GenreCreate
from app.utils.deps import get_current_admin

router = APIRouter()
db = Prisma()

@router.get("/genres", response_model=List[Genre])
async def get_genres():
    if not db.is_connected(): await db.connect()
    return await db.genre.find_many(order={'name': 'asc'})

@router.post("/admin/genres", response_model=Genre)
async def create_genre(genre: GenreCreate, admin=Depends(get_current_admin)):
    if not db.is_connected(): await db.connect()
    try:
        return await db.genre.create(data={'name': genre.name})
    except Exception as e:
        raise HTTPException(status_code=400, detail="Genre already exists or error creating")

@router.delete("/admin/genres/{id}")
async def delete_genre(id: int, admin=Depends(get_current_admin)):
    if not db.is_connected(): await db.connect()
    try:
        await db.genre.delete(where={'id': id})
        return {"message": "Genre deleted"}
    except Exception:
        raise HTTPException(status_code=404, detail="Genre not found")
