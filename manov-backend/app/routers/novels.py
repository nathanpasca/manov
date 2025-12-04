from fastapi import APIRouter, HTTPException, Header, Depends
from prisma import Prisma
from typing import List, Optional 
from app.schemas import NovelList, NovelDetail, ChapterContent, Genre
from datetime import datetime, timezone

from app.utils.security import SECRET_KEY, ALGORITHM
from jose import jwt

router = APIRouter()
db = Prisma()


# Helper untuk cek user opsional
async def get_optional_user(authorization: Optional[str] = Header(None)):
    if not authorization: return None
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        if not user_id: return None
        
        # Verify user exists in DB to avoid ForeignKeyViolationError
        if not db.is_connected(): await db.connect()
        user = await db.user.find_unique(where={'id': int(user_id)})
        
        return user.id if user else None
    except:
        return None

@router.get("/genres", response_model=List[Genre])
async def get_all_genres():
    if not db.is_connected():
        await db.connect()
    return await db.genre.find_many(order={'name': 'asc'})

@router.get("/novels", response_model=List[NovelList])
async def get_all_novels(skip: int = 0, limit: int = 20):
    # Ambil semua novel dengan pagination
    if not db.is_connected():
        await db.connect()
        
    novels = await db.novel.find_many(
        skip=skip,
        take=limit,
        order={'updatedAt': 'desc'},
        include={
            'genres': True,
            'genres': True,
            'chapters': True 
        }
    )
    
    # Manually map to schema to include chapterCount
    results = []
    for n in novels:
        n_dict = n.dict()
        n_dict['chapterCount'] = len(n.chapters) if n.chapters else 0
        results.append(n_dict)
        
    return results

@router.get("/novels/{slug}", response_model=NovelDetail)
async def get_novel_detail(slug: str):
    if not db.is_connected():
        await db.connect()

    # Kita include publishedAt di sini
    novel = await db.novel.find_unique(
        where={'slug': slug},
        include={
            'genres': True,
            'chapters': {
                'orderBy': {'chapterNum': 'asc'},
                'include': {
                    'translations': {
                        'where': {'language': 'EN'}
                    }
                }
            }
        }
    )
    
    if not novel:
        raise HTTPException(status_code=404, detail="Novel not found")
        
    return novel

@router.get("/novels/{slug}/chapters/{chapter_num}", response_model=ChapterContent)
async def get_chapter_content(
    slug: str, 
    chapter_num: int, 
    user_id: Optional[int] = Depends(get_optional_user) # Inject optional user
):
    if not db.is_connected(): await db.connect()

    # 1. Cari Novel & Chapter
    novel = await db.novel.find_unique(where={'slug': slug})
    if not novel: raise HTTPException(status_code=404, detail="Novel not found")

    translation = await db.chaptertranslation.find_first(
        where={
            'chapter': {'novelId': novel.id, 'chapterNum': chapter_num},
            'language': 'EN'
        }
    )
    if not translation: raise HTTPException(status_code=404, detail="Chapter not found")

    # 2. Cek Lock (Logic Gembok Kemarin)
    if translation.publishedAt and translation.publishedAt > datetime.now(timezone.utc):
        raise HTTPException(status_code=403, detail="Chapter locked")

    # 3. --- LOGIC HISTORY BARU ---
    if user_id:
        # Upsert: Update kalau ada, Create kalau belum ada
        await db.history.upsert(
            where={
                'userId_novelId': {'userId': user_id, 'novelId': novel.id}
            },
            data={
                'create': {
                    'userId': user_id,
                    'novelId': novel.id,
                    'chapterNum': chapter_num
                },
                'update': {
                    'chapterNum': chapter_num # Update ke chapter terbaru ini
                }
            }
        )

    # 4. Cek Next & Prev Chapter
    # Kita cari chapter lain di novel yang sama
    # Next: Chapter dengan nomor > current, ambil yang terkecil (asc)
    next_chapter = await db.chapter.find_first(
        where={
            'novelId': novel.id,
            'chapterNum': {'gt': chapter_num}
        },
        order={'chapterNum': 'asc'}
    )
    
    # Prev: Chapter dengan nomor < current, ambil yang terbesar (desc)
    prev_chapter = await db.chapter.find_first(
        where={
            'novelId': novel.id,
            'chapterNum': {'lt': chapter_num}
        },
        order={'chapterNum': 'desc'}
    )

    return {
        "id": translation.id,
        "chapterId": translation.chapterId, # Return ID Chapter
        "chapterNum": chapter_num,
        "title": translation.title,
        "content": translation.content,
        "language": translation.language,
        "nextChapterNum": next_chapter.chapterNum if next_chapter else None,
        "prevChapterNum": prev_chapter.chapterNum if prev_chapter else None,
        "novelTitle": novel.title # Added for SEO
    }