from fastapi import APIRouter, Depends, HTTPException
from prisma import Prisma
from typing import List
from app.utils.deps import get_current_user
from app.schemas import NovelList # Kita reuse schema yang sudah ada

router = APIRouter()
db = Prisma()

# --- GET LIBRARY ---
@router.get("/library", response_model=List[NovelList])
async def get_user_library(user: dict = Depends(get_current_user)):
    if not db.is_connected(): await db.connect()
    
    # Ambil data Library, include data Novel beserta Genres & Chapters
    items = await db.library.find_many(
        where={'userId': user['id']},
        include={
            'novel': {
                'include': {
                    'genres': True,
                    'chapters': True
                }
            }
        },
        order={'createdAt': 'desc'}
    )
    
    # Flatten structure & Manual Map for chapterCount
    results = []
    for item in items:
        n_dict = item.novel.dict()
        n_dict['chapterCount'] = len(item.novel.chapters) if item.novel.chapters else 0
        results.append(n_dict)

    return results

# --- ADD TO LIBRARY ---
@router.post("/library/{novel_id}")
async def add_to_library(novel_id: int, user: dict = Depends(get_current_user)):
    if not db.is_connected(): await db.connect()
    
    # Cek apakah sudah ada
    exists = await db.library.find_unique(
        where={
            'userId_novelId': {
                'userId': user['id'], 
                'novelId': novel_id
            }
        }
    )
    
    if exists:
        return {"message": "Already in library"}
        
    await db.library.create(data={
        'userId': user['id'],
        'novelId': novel_id
    })
    
    return {"message": "Added to library"}

# --- REMOVE FROM LIBRARY ---
@router.delete("/library/{novel_id}")
async def remove_from_library(novel_id: int, user: dict = Depends(get_current_user)):
    if not db.is_connected(): await db.connect()
    
    await db.library.delete_many(
        where={
            'userId': user['id'],
            'novelId': novel_id
        }
    )
    
    return {"message": "Removed from library"}

# --- CHECK STATUS (Is Bookmarked?) ---
@router.get("/library/check/{novel_id}")
async def check_library_status(novel_id: int, user: dict = Depends(get_current_user)):
    if not db.is_connected(): await db.connect()
    
    exists = await db.library.find_unique(
        where={
            'userId_novelId': {
                'userId': user['id'], 
                'novelId': novel_id
            }
        }
    )

    # Cek Rating User
    rating = await db.rating.find_unique(
        where={
            'userId_novelId': {
                'userId': user['id'],
                'novelId': novel_id
            }
        }
    )

    return {
        "isBookmarked": bool(exists),
        "userRating": rating.score if rating else 0
    }


# --- GET HISTORY ---
@router.get("/history")
async def get_user_history(user: dict = Depends(get_current_user)):
    if not db.is_connected(): await db.connect()
    
    # Ambil 5 riwayat bacaan terakhir
    histories = await db.history.find_many(
        where={'userId': user['id']},
        include={'novel': True},
        order={'updatedAt': 'desc'},
        take=5
    )
    
    # Kita perlu format khusus agar Frontend tahu chapter terakhirnya berapa
    result = []
    for h in histories:
        novel_data = h.novel.dict()
        novel_data['lastReadChapter'] = h.chapterNum # Inject info tambahan
        result.append(novel_data)
        
    return result