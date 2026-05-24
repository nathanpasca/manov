from fastapi import APIRouter, Depends, HTTPException

from app.database import db
from app.schemas import Genre, GenreCreate
from app.utils.deps import get_current_admin

router = APIRouter()


@router.get("/genres", response_model=list[Genre])
async def get_genres():
    return await db.genre.find_many(order={"name": "asc"})


@router.post("/admin/genres", response_model=Genre)
async def create_genre(genre: GenreCreate, admin=Depends(get_current_admin)):
    try:
        return await db.genre.create(data={"name": genre.name})
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Genre already exists or error creating") from exc


@router.delete("/admin/genres/{id}")
async def delete_genre(id: int, admin=Depends(get_current_admin)):
    try:
        await db.genre.delete(where={"id": id})
        return {"message": "Genre deleted"}
    except Exception as exc:
        raise HTTPException(status_code=404, detail="Genre not found") from exc
