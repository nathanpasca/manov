"""SQLModel database models migrated from Prisma schema."""

from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Column, Text, UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    pass


def utc_now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


# ---------------------------------------------------------------------------
# Link table for Novel <-> Genre many-to-many
# ---------------------------------------------------------------------------
class NovelGenreLink(SQLModel, table=True):
    """Association table linking novels and genres."""

    novel_id: int = Field(foreign_key="novel.id", ondelete="CASCADE", primary_key=True)
    genre_id: int = Field(foreign_key="genre.id", ondelete="CASCADE", primary_key=True)


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
    viewCount: int = Field(default=0)

    createdAt: datetime = Field(default_factory=utc_now)
    updatedAt: datetime = Field(
        default_factory=utc_now,
        sa_column_kwargs={"onupdate": utc_now},
    )

    # Relations
    chapters: list["Chapter"] = Relationship(back_populates="novel")
    libraries: list["Library"] = Relationship(back_populates="novel")
    histories: list["History"] = Relationship(back_populates="novel")
    genres: list["Genre"] = Relationship(
        back_populates="novels", link_model=NovelGenreLink
    )
    ratings: list["Rating"] = Relationship(back_populates="novel")
    comments: list["Comment"] = Relationship(back_populates="novel")
    reviews: list["Review"] = Relationship(back_populates="novel")
    notifications: list["Notification"] = Relationship(back_populates="novel")


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
    novelId: int = Field(foreign_key="novel.id", ondelete="CASCADE", index=True)
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
    notifications: list["Notification"] = Relationship(back_populates="chapter")


# ---------------------------------------------------------------------------
# ChapterTranslation
# ---------------------------------------------------------------------------
class ChapterTranslation(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("chapterId", "language"),)

    id: int | None = Field(default=None, primary_key=True)
    chapterId: int = Field(foreign_key="chapter.id", ondelete="CASCADE", index=True)
    language: str

    title: str
    content: str = Field(sa_column=Column(Text))

    publishedAt: datetime | None = None
    price: int = Field(default=0)

    createdAt: datetime = Field(default_factory=utc_now)
    updatedAt: datetime = Field(
        default_factory=utc_now,
        sa_column_kwargs={"onupdate": utc_now},
    )

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

    resetTokenHash: str | None = Field(default=None, index=True)
    resetTokenExpires: datetime | None = Field(default=None)

    createdAt: datetime = Field(default_factory=utc_now)

    # Relations
    library: list["Library"] = Relationship(back_populates="user")
    history: list["History"] = Relationship(back_populates="user")
    unlocked: list["UnlockedChapter"] = Relationship(back_populates="user")
    ratings: list["Rating"] = Relationship(back_populates="user")
    comments: list["Comment"] = Relationship(back_populates="user")
    reviews: list["Review"] = Relationship(back_populates="user")
    notifications: list["Notification"] = Relationship(back_populates="user")
    apiKeys: list["ApiKey"] = Relationship(back_populates="user")
    auditLogs: list["AdminAuditLog"] = Relationship(back_populates="user")


# ---------------------------------------------------------------------------
# Library
# ---------------------------------------------------------------------------
class Library(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("userId", "novelId"),)

    id: int | None = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="user.id", ondelete="CASCADE", index=True)
    novelId: int = Field(foreign_key="novel.id", ondelete="CASCADE", index=True)
    createdAt: datetime = Field(default_factory=utc_now)

    user: User | None = Relationship(back_populates="library")
    novel: Novel | None = Relationship(back_populates="libraries")


# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------
class History(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("userId", "novelId"),)

    id: int | None = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="user.id", ondelete="CASCADE", index=True)
    novelId: int = Field(foreign_key="novel.id", ondelete="CASCADE", index=True)
    chapterNum: int
    scrollPosition: float | None = Field(default=None)
    progressPercent: int = Field(default=0)
    lastReadBlockIndex: int | None = Field(default=None)
    blockOffsetPercent: int = Field(default=0)
    updatedAt: datetime = Field(default_factory=utc_now)

    user: User | None = Relationship(back_populates="history")
    novel: Novel | None = Relationship(back_populates="histories")


# ---------------------------------------------------------------------------
# ApiKey
# ---------------------------------------------------------------------------
class ApiKey(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="user.id", ondelete="CASCADE", index=True)
    name: str
    keyHash: str = Field(index=True)
    keyPrefix: str
    role: str = Field(default="ADMIN")
    isActive: bool = Field(default=True)
    lastUsedAt: datetime | None = None
    createdAt: datetime = Field(default_factory=utc_now)

    user: User | None = Relationship(back_populates="apiKeys")


# ---------------------------------------------------------------------------
# AdminAuditLog
# ---------------------------------------------------------------------------
class AdminAuditLog(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="user.id", ondelete="CASCADE", index=True)
    action: str
    entityType: str
    entityId: int
    payloadSnapshot: str | None = Field(default=None, sa_column=Column(Text))
    ipAddress: str | None = None
    createdAt: datetime = Field(default_factory=utc_now)

    user: User | None = Relationship(back_populates="auditLogs")


# ---------------------------------------------------------------------------
# UnlockedChapter
# ---------------------------------------------------------------------------
class UnlockedChapter(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("userId", "translationId"),)

    id: int | None = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="user.id", ondelete="CASCADE", index=True)
    translationId: int = Field(
        foreign_key="chaptertranslation.id", ondelete="CASCADE", index=True
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
# DEPRECATED: The quick-rating-without-review feature is no longer supported.
# New ratings should be created as Reviews (score + content). This table is
# retained for backward compatibility so existing Rating rows continue to
# contribute to aggregate stats, but no new rows should be created via the API.
# ---------------------------------------------------------------------------
class Rating(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("userId", "novelId"),)

    id: int | None = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="user.id", ondelete="CASCADE", index=True)
    novelId: int = Field(foreign_key="novel.id", ondelete="CASCADE", index=True)
    score: int
    createdAt: datetime = Field(default_factory=utc_now)

    user: User | None = Relationship(back_populates="ratings")
    novel: Novel | None = Relationship(back_populates="ratings")


# ---------------------------------------------------------------------------
# Review
# ---------------------------------------------------------------------------
class Review(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("userId", "novelId"),)

    id: int | None = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="user.id", ondelete="CASCADE", index=True)
    novelId: int = Field(foreign_key="novel.id", ondelete="CASCADE", index=True)
    score: int
    content: str = Field(sa_column=Column(Text))
    createdAt: datetime = Field(default_factory=utc_now)
    updatedAt: datetime = Field(
        default_factory=utc_now,
        sa_column_kwargs={"onupdate": utc_now},
    )

    user: User | None = Relationship(back_populates="reviews")
    novel: Novel | None = Relationship(back_populates="reviews")


# ---------------------------------------------------------------------------
# Comment
# ---------------------------------------------------------------------------
class Comment(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="user.id", ondelete="CASCADE", index=True)
    content: str = Field(sa_column=Column(Text))
    createdAt: datetime = Field(default_factory=utc_now)

    novelId: int | None = Field(
        default=None, foreign_key="novel.id", ondelete="CASCADE", index=True
    )
    chapterId: int | None = Field(
        default=None, foreign_key="chapter.id", ondelete="CASCADE", index=True
    )
    parentId: int | None = Field(
        default=None, foreign_key="comment.id", ondelete="CASCADE", index=True
    )
    depth: int = Field(default=0)

    user: User | None = Relationship(back_populates="comments")
    novel: Novel | None = Relationship(back_populates="comments")
    chapter: Chapter | None = Relationship(back_populates="comments")


# ---------------------------------------------------------------------------
# Notification
# ---------------------------------------------------------------------------
class Notification(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="user.id", ondelete="CASCADE", index=True)
    type: str
    message: str
    novelId: int | None = Field(
        default=None, foreign_key="novel.id", ondelete="CASCADE", index=True
    )
    chapterId: int | None = Field(
        default=None, foreign_key="chapter.id", ondelete="CASCADE", index=True
    )
    isRead: bool = Field(default=False)
    createdAt: datetime = Field(default_factory=utc_now)

    user: User | None = Relationship(back_populates="notifications")
    novel: Novel | None = Relationship(back_populates="notifications")
    chapter: Chapter | None = Relationship(back_populates="notifications")
