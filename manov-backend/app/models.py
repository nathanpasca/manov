"""SQLModel database models migrated from Prisma schema."""

from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Column, Text, UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    pass


def utc_now() -> datetime:
    return datetime.now(UTC)


# ---------------------------------------------------------------------------
# Link table for Novel <-> Genre many-to-many
# ---------------------------------------------------------------------------
class NovelGenreLink(SQLModel, table=True):
    """Association table linking novels and genres."""

    novel_id: int = Field(foreign_key="novel.id", primary_key=True)
    genre_id: int = Field(foreign_key="genre.id", primary_key=True)


# ---------------------------------------------------------------------------
# Novel
# ---------------------------------------------------------------------------
class Novel(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    slug: str = Field(unique=True, index=True)

    title: str
    originalTitle: str
    romajiTitle: str | None = None
    author: str | None = None
    coverUrl: str | None = None
    synopsis: str | None = None

    status: str = Field(default="ONGOING")

    averageRating: float = Field(default=0.0)
    ratingCount: int = Field(default=0)

    createdAt: datetime = Field(default_factory=utc_now)
    updatedAt: datetime = Field(default_factory=utc_now)

    # Relations
    chapters: list["Chapter"] = Relationship(back_populates="novel")
    libraries: list["Library"] = Relationship(back_populates="novel")
    histories: list["History"] = Relationship(back_populates="novel")
    genres: list["Genre"] = Relationship(
        back_populates="novels", link_model=NovelGenreLink
    )
    ratings: list["Rating"] = Relationship(back_populates="novel")
    comments: list["Comment"] = Relationship(back_populates="novel")


# ---------------------------------------------------------------------------
# Genre
# ---------------------------------------------------------------------------
class Genre(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)

    novels: list[Novel] = Relationship(
        back_populates="genres", link_model=NovelGenreLink
    )


# ---------------------------------------------------------------------------
# Chapter
# ---------------------------------------------------------------------------
class Chapter(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("novelId", "chapterNum"),)

    id: int | None = Field(default=None, primary_key=True)
    novelId: int = Field(foreign_key="novel.id", ondelete="CASCADE")
    chapterNum: int

    rawTitle: str | None = None
    rawContent: str = Field(sa_column=Column(Text))
    sourceUrl: str | None = None

    # Relations
    novel: Novel | None = Relationship(back_populates="chapters")
    translations: list["ChapterTranslation"] = Relationship(
        back_populates="chapter"
    )
    comments: list["Comment"] = Relationship(back_populates="chapter")


# ---------------------------------------------------------------------------
# ChapterTranslation
# ---------------------------------------------------------------------------
class ChapterTranslation(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("chapterId", "language"),)

    id: int | None = Field(default=None, primary_key=True)
    chapterId: int = Field(foreign_key="chapter.id", ondelete="CASCADE")
    language: str

    title: str
    content: str = Field(sa_column=Column(Text))

    publishedAt: datetime | None = None
    price: int = Field(default=0)

    createdAt: datetime = Field(default_factory=utc_now)
    updatedAt: datetime = Field(default_factory=utc_now)

    # Relations
    chapter: Chapter | None = Relationship(back_populates="translations")
    unlockedBy: list["UnlockedChapter"] = Relationship(
        back_populates="translation"
    )


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    username: str
    password: str

    role: str = Field(default="USER")
    coins: int = Field(default=0)

    createdAt: datetime = Field(default_factory=utc_now)

    # Relations
    library: list["Library"] = Relationship(back_populates="user")
    history: list["History"] = Relationship(back_populates="user")
    unlocked: list["UnlockedChapter"] = Relationship(back_populates="user")
    ratings: list["Rating"] = Relationship(back_populates="user")
    comments: list["Comment"] = Relationship(back_populates="user")


# ---------------------------------------------------------------------------
# Library
# ---------------------------------------------------------------------------
class Library(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("userId", "novelId"),)

    id: int | None = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="user.id", ondelete="CASCADE")
    novelId: int = Field(foreign_key="novel.id", ondelete="CASCADE")
    createdAt: datetime = Field(default_factory=utc_now)

    user: User | None = Relationship(back_populates="library")
    novel: Novel | None = Relationship(back_populates="libraries")


# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------
class History(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("userId", "novelId"),)

    id: int | None = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="user.id", ondelete="CASCADE")
    novelId: int = Field(foreign_key="novel.id", ondelete="CASCADE")
    chapterNum: int
    updatedAt: datetime = Field(default_factory=utc_now)

    user: User | None = Relationship(back_populates="history")
    novel: Novel | None = Relationship(back_populates="histories")


# ---------------------------------------------------------------------------
# UnlockedChapter
# ---------------------------------------------------------------------------
class UnlockedChapter(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("userId", "translationId"),)

    id: int | None = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="user.id", ondelete="CASCADE")
    translationId: int = Field(
        foreign_key="chaptertranslation.id", ondelete="CASCADE"
    )
    cost: int
    unlockedAt: datetime = Field(default_factory=utc_now)

    user: User | None = Relationship(back_populates="unlocked")
    translation: ChapterTranslation | None = Relationship(
        back_populates="unlockedBy"
    )


# ---------------------------------------------------------------------------
# Rating
# ---------------------------------------------------------------------------
class Rating(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("userId", "novelId"),)

    id: int | None = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="user.id", ondelete="CASCADE")
    novelId: int = Field(foreign_key="novel.id", ondelete="CASCADE")
    score: int
    createdAt: datetime = Field(default_factory=utc_now)

    user: User | None = Relationship(back_populates="ratings")
    novel: Novel | None = Relationship(back_populates="ratings")


# ---------------------------------------------------------------------------
# Comment
# ---------------------------------------------------------------------------
class Comment(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="user.id", ondelete="CASCADE")
    content: str = Field(sa_column=Column(Text))
    createdAt: datetime = Field(default_factory=utc_now)

    novelId: int | None = Field(
        default=None, foreign_key="novel.id", ondelete="CASCADE"
    )
    chapterId: int | None = Field(
        default=None, foreign_key="chapter.id", ondelete="CASCADE"
    )

    user: User | None = Relationship(back_populates="comments")
    novel: Novel | None = Relationship(back_populates="comments")
    chapter: Chapter | None = Relationship(back_populates="comments")
