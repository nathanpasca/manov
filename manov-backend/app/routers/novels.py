from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Header, HTTPException
from jose import jwt

from app.database import db
from app.schemas import ChapterContent, Genre, NovelDetail, NovelList
from app.utils.security import ALGORITHM, SECRET_KEY

router = APIRouter()


# Helper untuk cek user opsional
async def get_optional_user(authorization: str | None = Header(None)):
    if not authorization:
        return None
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        if not user_id:
            return None

        # Verify user exists in DB to avoid ForeignKeyViolationError
        user = await db.user.find_unique(where={"id": int(user_id)})

        return user.id if user else None
    except Exception:
        return None


@router.get("/genres", response_model=list[Genre])
async def get_all_genres():
    return await db.genre.find_many(order={"name": "asc"})


@router.get("/novels", response_model=list[NovelList])
async def get_all_novels(skip: int = 0, limit: int = 20):
    # Ambil semua novel dengan pagination
    novels = await db.novel.find_many(
        skip=skip,
        take=limit,
        order={"updatedAt": "desc"},
        include={
            "genres": True,
            "chapters": True,
        },
    )

    # Manually map to schema to include chapterCount
    results = []
    for n in novels:
        n_dict = n.dict()
        n_dict["chapterCount"] = len(n.chapters) if n.chapters else 0
        results.append(n_dict)

    return results


@router.get("/novels/count")
async def get_novels_count():
    count = await db.novel.count()
    return {"count": count}


@router.get("/novels/{slug}", response_model=NovelDetail)
async def get_novel_detail(slug: str):
    # Kita include publishedAt di sini
    novel = await db.novel.find_unique(
        where={"slug": slug},
        include={
            "genres": True,
            "chapters": {
                "orderBy": {"chapterNum": "asc"},
                "include": {"translations": {"where": {"language": "EN"}}},
            },
        },
    )

    if not novel:
        raise HTTPException(status_code=404, detail="Novel not found")

    return novel


@router.get("/novels/{slug}/chapters/{chapter_num}", response_model=ChapterContent)
async def get_chapter_content(
    slug: str,
    chapter_num: int,
    user_id: int | None = Depends(get_optional_user),  # Inject optional user
):
    # 1. Cari Novel & Chapter
    novel = await db.novel.find_unique(where={"slug": slug})
    if not novel:
        raise HTTPException(status_code=404, detail="Novel not found")

    translation = await db.chaptertranslation.find_first(
        where={
            "chapter": {"novelId": novel.id, "chapterNum": chapter_num},
            "language": "EN",
        }
    )
    if not translation:
        raise HTTPException(status_code=404, detail="Chapter not found")

    # 2. Cek Lock (Logic Gembok Kemarin)
    if translation.publishedAt and translation.publishedAt > datetime.now(UTC):
        raise HTTPException(status_code=403, detail="Chapter locked")

    # 3. --- LOGIC HISTORY BARU ---
    if user_id:
        # Upsert: Update kalau ada, Create kalau belum ada
        await db.history.upsert(
            where={"userId_novelId": {"userId": user_id, "novelId": novel.id}},
            data={
                "create": {
                    "userId": user_id,
                    "novelId": novel.id,
                    "chapterNum": chapter_num,
                },
                "update": {
                    "chapterNum": chapter_num  # Update ke chapter terbaru ini
                },
            },
        )

    # 4. Cek Next & Prev Chapter
    # Kita cari chapter lain di novel yang sama
    # Next: Chapter dengan nomor > current, ambil yang terkecil (asc)
    next_chapter = await db.chapter.find_first(
        where={"novelId": novel.id, "chapterNum": {"gt": chapter_num}},
        order={"chapterNum": "asc"},
    )

    # Prev: Chapter dengan nomor < current, ambil yang terbesar (desc)
    prev_chapter = await db.chapter.find_first(
        where={"novelId": novel.id, "chapterNum": {"lt": chapter_num}},
        order={"chapterNum": "desc"},
    )

    return {
        "id": translation.id,
        "chapterId": translation.chapterId,  # Return ID Chapter
        "chapterNum": chapter_num,
        "title": translation.title,
        "content": translation.content,
        "language": translation.language,
        "nextChapterNum": next_chapter.chapterNum if next_chapter else None,
        "prevChapterNum": prev_chapter.chapterNum if prev_chapter else None,
        "novelTitle": novel.title,  # Added for SEO
    }
