from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from pydantic import BaseModel
from prisma import Prisma
from app.services.processor import NovelProcessorService
from typing import Optional, List
from app.utils.deps import get_current_admin

router = APIRouter(dependencies=[Depends(get_current_admin)])
db = Prisma()
processor = NovelProcessorService()

# --- SCHEMA REQUEST ---
class ScrapeRequest(BaseModel):
    slug: str
    url: Optional[str] = None   # Boleh kosong kalau mau Resume
    title: Optional[str] = None # Boleh kosong kalau novel sudah ada

class UpdateNovelRequest(BaseModel):
    title: str
    originalTitle: str
    author: str
    coverUrl: str
    synopsis: str
    status: str
    genres: List[int] = []

class UpdateChapterRequest(BaseModel):
    title: str
    content: str

class CreateNovelRequest(BaseModel):
    title: str
    originalTitle: str
    author: str
    coverUrl: str
    synopsis: str
    status: str
    genres: List[int] = []

class CreateChapterRequest(BaseModel):
    chapterNum: int
    title: str
    content: str

# --- ENDPOINTS ---

import re
import time

# ...

@router.post("/novels")
async def create_novel(req: CreateNovelRequest):
    if not db.is_connected(): await db.connect()
    
    # Simple slug generation
    slug = re.sub(r'[^a-z0-9]+', '-', req.title.lower()).strip('-')
    
    # Ensure unique slug
    existing = await db.novel.find_unique(where={'slug': slug})
    if existing:
        slug = f"{slug}-{int(time.time())}" # Fallback if duplicate

    novel = await db.novel.create(
        data={
            'slug': slug,
            'title': req.title,
            'originalTitle': req.originalTitle,
            'author': req.author,
            'coverUrl': req.coverUrl,
            'synopsis': req.synopsis,
            'status': req.status,
            'genres': {
                'connect': [{'id': gid} for gid in req.genres]
            }
        }
    )
    return novel

@router.post("/novels/{id}/chapters")
async def create_chapter(id: int, req: CreateChapterRequest):
    if not db.is_connected(): await db.connect()
    
    # Create Chapter
    chapter = await db.chapter.create(
        data={
            'novelId': id,
            'chapterNum': req.chapterNum,
            'rawTitle': req.title,
            'rawContent': req.content, # Storing in rawContent too for consistency
            'translations': {
                'create': {
                    'language': 'EN',
                    'title': req.title,
                    'content': req.content
                }
            }
        }
    )
    return chapter

@router.delete("/chapters/{id}")
async def delete_chapter(id: int):
    """Delete a chapter and its translations"""
    if not db.is_connected(): await db.connect()
    
    # Delete translations first (if not cascading, but Prisma handles cascade usually if configured, 
    # but here we might need to be explicit or rely on DB)
    # Actually, let's delete the Chapter, which should cascade if schema is set, 
    # but our schema didn't explicitly say onDelete: Cascade. 
    # Let's delete translations then chapter to be safe.
    
    await db.chaptertranslation.delete_many(where={'chapterId': id})
    await db.chapter.delete(where={'id': id})
    
    return {"message": "Chapter deleted"}

@router.post("/scrape")
async def trigger_scrape(req: ScrapeRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(
        processor.process_novel, # Panggil fungsi yang baru diupdate
        req.slug, req.url, req.title
    )
    
    mode = "RESUME" if not req.url else "START NEW"
    return {"status": "success", "message": f"Scraping '{req.slug}' ({mode}) started in background."}

@router.put("/novels/{id}")
async def update_novel_metadata(id: int, req: UpdateNovelRequest):
    """Edit Judul, Cover, Sinopsis, Author"""
    if not db.is_connected(): await db.connect()
    
    updated = await db.novel.update(
        where={'id': id},
        data={
            'title': req.title,
            'originalTitle': req.originalTitle,
            'author': req.author,
            'coverUrl': req.coverUrl,
            'synopsis': req.synopsis,
            'status': req.status,
            'genres': {
                'set': [{'id': gid} for gid in req.genres]
            }
        }
    )
    return updated

@router.put("/chapters/{translation_id}")
async def update_chapter_content(translation_id: int, req: UpdateChapterRequest):
    """Edit Isi Terjemahan (Manual Fix)"""
    if not db.is_connected(): await db.connect()

    updated = await db.chaptertranslation.update(
        where={'id': translation_id},
        data={
            'title': req.title,
            'content': req.content
        }
    )
    return updated

@router.delete("/novels/{id}")
async def delete_novel(id: int):
    """Delete a novel and ALL related data (Cascade Manual)"""
    if not db.is_connected(): await db.connect()

    # 1. Delete Social & User Data linked to Novel
    await db.rating.delete_many(where={'novelId': id})
    await db.comment.delete_many(where={'novelId': id})
    await db.library.delete_many(where={'novelId': id})
    await db.history.delete_many(where={'novelId': id})

    # 2. Handle Chapters
    chapters = await db.chapter.find_many(where={'novelId': id}, include={'translations': True})
    for chapter in chapters:
        # Delete Chapter Comments
        await db.comment.delete_many(where={'chapterId': chapter.id})
        
        # Delete UnlockedChapter (via translations)
        for trans in chapter.translations:
             await db.unlockedchapter.delete_many(where={'translationId': trans.id})
        
        # Delete Translations
        await db.chaptertranslation.delete_many(where={'chapterId': chapter.id})

    # 3. Delete Chapters
    await db.chapter.delete_many(where={'novelId': id})

    # 4. Delete Novel
    await db.novel.delete(where={'id': id})

    return {"message": "Novel deleted successfully"}