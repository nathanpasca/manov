from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ChapterTranslationSimple(BaseModel):
    title: str
    language: str
    publishedAt: Optional[datetime] = None

class ChapterItem(BaseModel):
    id: int
    chapterNum: int
    translations: List[ChapterTranslationSimple]

class Genre(BaseModel):
    id: int
    name: str

class GenreCreate(BaseModel):
    name: str

class NovelList(BaseModel):
    id: int
    title: str
    slug: str
    coverUrl: Optional[str] = None
    status: str
    author: Optional[str] = None
    genres: List[Genre] = []
    chapterCount: int = 0
    synopsis: Optional[str] = None
    averageRating: float = 0.0
    ratingCount: int = 0

class ChapterContent(BaseModel):
    id: int
    chapterId: int # ID dari tabel Chapter (untuk comments)
    chapterNum: int
    title: str
    content: str
    language: str
    nextChapterNum: Optional[int] = None
    prevChapterNum: Optional[int] = None
    novelTitle: Optional[str] = None

class NovelDetail(NovelList):
    originalTitle: str
    synopsis: Optional[str] = None
    updatedAt: Optional[datetime] = None
    # Di detail novel, kita tampilkan list nomor chapter saja
    chapters: List[ChapterItem]