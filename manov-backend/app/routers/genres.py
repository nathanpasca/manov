from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import create_genre, delete_genre, get_genres
from app.database import get_session
from app.models import Genre
from app.schemas import Genre as GenreSchema
from app.schemas import GenreCreate
from app.utils.deps import get_current_admin

router = APIRouter()


@router.get("/genres", response_model=list[GenreSchema])
async def get_all_genres(session: AsyncSession = Depends(get_session)):
    return await get_genres(session)


@router.post("/admin/genres", response_model=GenreSchema)
async def create_new_genre(
    genre: GenreCreate, admin=Depends(get_current_admin), session: AsyncSession = Depends(get_session)
):
    try:
        db_genre = Genre(name=genre.name)
        return await create_genre(session, db_genre)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Genre already exists or error creating") from exc


@router.delete("/admin/genres/{id}")
async def delete_existing_genre(
    id: int, admin=Depends(get_current_admin), session: AsyncSession = Depends(get_session)
):
    try:
        await delete_genre(session, id)
        return {"message": "Genre deleted"}
    except Exception as exc:
        raise HTTPException(status_code=404, detail="Genre not found") from exc
