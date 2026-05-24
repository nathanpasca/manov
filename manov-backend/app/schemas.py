from datetime import datetime

from pydantic import BaseModel


class ChapterTranslationSimple(BaseModel):
    title: str
    language: str
    publishedAt: datetime | None = None


class ChapterItem(BaseModel):
    id: int
    chapterNum: int
    translations: list[ChapterTranslationSimple]


class Genre(BaseModel):
    id: int
    name: str


class GenreCreate(BaseModel):
    name: str


class NovelList(BaseModel):
    id: int
    title: str
    slug: str
    coverUrl: str | None = None
    status: str
    author: str | None = None
    genres: list[Genre] = []
    chapterCount: int = 0
    synopsis: str | None = None
    averageRating: float = 0.0
    ratingCount: int = 0


class ChapterContent(BaseModel):
    id: int
    chapterId: int  # ID dari tabel Chapter (untuk comments)
    chapterNum: int
    title: str
    content: str
    language: str
    nextChapterNum: int | None = None
    prevChapterNum: int | None = None
    novelTitle: str | None = None


class NovelDetail(NovelList):
    originalTitle: str
    synopsis: str | None = None
    updatedAt: datetime | None = None
    # Di detail novel, kita tampilkan list nomor chapter saja
    chapters: list[ChapterItem]
