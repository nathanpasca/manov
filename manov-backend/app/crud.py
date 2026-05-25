"""Reusable async CRUD operations."""

from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.models import (
    Chapter,
    ChapterTranslation,
    Comment,
    Genre,
    History,
    Library,
    Novel,
    Rating,
    User,
)


# ---------------------------------------------------------------------------
# Novel
# ---------------------------------------------------------------------------
async def get_novel_by_slug(session: AsyncSession, slug: str) -> Novel | None:
    return await session.scalar(select(Novel).where(Novel.slug == slug))


async def get_novel_by_id(session: AsyncSession, novel_id: int) -> Novel | None:
    return await session.get(Novel, novel_id)


async def get_novels(
    session: AsyncSession, skip: int = 0, limit: int = 20
) -> list[tuple[Novel, int]]:
    chapter_count_subq = (
        select(func.count(Chapter.id))
        .where(Chapter.novelId == Novel.id)
        .correlate(Novel)
        .scalar_subquery()
    )
    result = await session.execute(
        select(Novel, chapter_count_subq.label("chapter_count"))
        .options(selectinload(Novel.genres))
        .order_by(Novel.updatedAt.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.all())


async def count_novels(session: AsyncSession) -> int:
    count = await session.scalar(select(func.count()).select_from(Novel))
    return count or 0


async def create_novel(session: AsyncSession, novel: Novel) -> Novel:
    session.add(novel)
    await session.commit()
    await session.refresh(novel)
    return novel


async def update_novel(session: AsyncSession, novel: Novel) -> Novel:
    session.add(novel)
    await session.commit()
    await session.refresh(novel)
    return novel


async def delete_novel(session: AsyncSession, novel_id: int) -> None:
    novel = await session.get(Novel, novel_id)
    if novel:
        await session.delete(novel)
        await session.commit()


# ---------------------------------------------------------------------------
# Chapter
# ---------------------------------------------------------------------------
async def get_chapter_by_id(session: AsyncSession, chapter_id: int) -> Chapter | None:
    return await session.get(Chapter, chapter_id)


async def get_chapter_by_novel_and_num(
    session: AsyncSession, novel_id: int, chapter_num: int
) -> Chapter | None:
    return await session.scalar(
        select(Chapter).where(
            Chapter.novelId == novel_id, Chapter.chapterNum == chapter_num
        )
    )


async def get_first_chapter(
    session: AsyncSession, novel_id: int, direction: str = "asc"
) -> Chapter | None:
    order = Chapter.chapterNum.asc() if direction == "asc" else Chapter.chapterNum.desc()
    return await session.scalar(
        select(Chapter).where(Chapter.novelId == novel_id).order_by(order).limit(1)
    )


async def get_next_chapter(
    session: AsyncSession, novel_id: int, current_num: int
) -> Chapter | None:
    return await session.scalar(
        select(Chapter)
        .where(Chapter.novelId == novel_id, Chapter.chapterNum > current_num)
        .order_by(Chapter.chapterNum.asc())
        .limit(1)
    )


async def get_prev_chapter(
    session: AsyncSession, novel_id: int, current_num: int
) -> Chapter | None:
    return await session.scalar(
        select(Chapter)
        .where(Chapter.novelId == novel_id, Chapter.chapterNum < current_num)
        .order_by(Chapter.chapterNum.desc())
        .limit(1)
    )


async def create_chapter(session: AsyncSession, chapter: Chapter) -> Chapter:
    session.add(chapter)
    await session.commit()
    await session.refresh(chapter)
    return chapter


async def update_chapter(session: AsyncSession, chapter: Chapter) -> Chapter:
    session.add(chapter)
    await session.commit()
    await session.refresh(chapter)
    return chapter


async def delete_chapter(session: AsyncSession, chapter_id: int) -> None:
    chapter = await session.get(Chapter, chapter_id)
    if chapter:
        await session.delete(chapter)
        await session.commit()


# ---------------------------------------------------------------------------
# ChapterTranslation
# ---------------------------------------------------------------------------
async def get_translation_by_id(
    session: AsyncSession, translation_id: int
) -> ChapterTranslation | None:
    return await session.get(ChapterTranslation, translation_id)


async def get_translation_by_chapter_and_language(
    session: AsyncSession, chapter_id: int, language: str
) -> ChapterTranslation | None:
    return await session.scalar(
        select(ChapterTranslation).where(
            ChapterTranslation.chapterId == chapter_id,
            ChapterTranslation.language == language,
        )
    )


async def create_translation(
    session: AsyncSession, translation: ChapterTranslation
) -> ChapterTranslation:
    session.add(translation)
    await session.commit()
    await session.refresh(translation)
    return translation


async def update_translation(
    session: AsyncSession, translation: ChapterTranslation
) -> ChapterTranslation:
    session.add(translation)
    await session.commit()
    await session.refresh(translation)
    return translation


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
async def get_user_by_id(session: AsyncSession, user_id: int) -> User | None:
    return await session.get(User, user_id)


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    return await session.scalar(select(User).where(User.email == email))


async def create_user(session: AsyncSession, user: User) -> User:
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Genre
# ---------------------------------------------------------------------------
async def get_genres(session: AsyncSession) -> list[Genre]:
    result = await session.execute(select(Genre).order_by(Genre.name.asc()))
    return list(result.scalars().all())


async def get_genre_by_id(session: AsyncSession, genre_id: int) -> Genre | None:
    return await session.get(Genre, genre_id)


async def create_genre(session: AsyncSession, genre: Genre) -> Genre:
    session.add(genre)
    await session.commit()
    await session.refresh(genre)
    return genre


async def delete_genre(session: AsyncSession, genre_id: int) -> None:
    genre = await session.get(Genre, genre_id)
    if genre:
        await session.delete(genre)
        await session.commit()


# ---------------------------------------------------------------------------
# Library
# ---------------------------------------------------------------------------
async def get_library_entry(
    session: AsyncSession, user_id: int, novel_id: int
) -> Library | None:
    return await session.scalar(
        select(Library).where(
            Library.userId == user_id, Library.novelId == novel_id
        )
    )


async def get_user_library(session: AsyncSession, user_id: int) -> list[tuple[Library, int]]:
    chapter_count_subq = (
        select(func.count(Chapter.id))
        .where(Chapter.novelId == Novel.id)
        .correlate(Novel)
        .scalar_subquery()
    )
    result = await session.execute(
        select(Library, chapter_count_subq.label("chapter_count"))
        .where(Library.userId == user_id)
        .options(selectinload(Library.novel).selectinload(Novel.genres))
        .order_by(Library.createdAt.desc())
    )
    return list(result.all())


async def add_to_library(
    session: AsyncSession, user_id: int, novel_id: int
) -> Library:
    entry = Library(userId=user_id, novelId=novel_id)
    session.add(entry)
    await session.commit()
    await session.refresh(entry)
    return entry


async def remove_from_library(
    session: AsyncSession, user_id: int, novel_id: int
) -> None:
    entry = await get_library_entry(session, user_id, novel_id)
    if entry:
        await session.delete(entry)
        await session.commit()


# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------
async def get_history_entry(
    session: AsyncSession, user_id: int, novel_id: int
) -> History | None:
    return await session.scalar(
        select(History).where(
            History.userId == user_id, History.novelId == novel_id
        )
    )


async def upsert_history(
    session: AsyncSession, user_id: int, novel_id: int, chapter_num: int
) -> History:
    entry = await get_history_entry(session, user_id, novel_id)
    if entry:
        entry.chapterNum = chapter_num
    else:
        entry = History(userId=user_id, novelId=novel_id, chapterNum=chapter_num)
        session.add(entry)
    await session.commit()
    await session.refresh(entry)
    return entry


async def get_user_histories(session: AsyncSession, user_id: int) -> list[History]:
    result = await session.execute(
        select(History)
        .where(History.userId == user_id)
        .options(selectinload(History.novel))
        .order_by(History.updatedAt.desc())
        .limit(5)
    )
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# Rating
# ---------------------------------------------------------------------------
async def get_rating(
    session: AsyncSession, user_id: int, novel_id: int
) -> Rating | None:
    return await session.scalar(
        select(Rating).where(
            Rating.userId == user_id, Rating.novelId == novel_id
        )
    )


async def upsert_rating(
    session: AsyncSession, user_id: int, novel_id: int, score: int
) -> Rating:
    rating = await get_rating(session, user_id, novel_id)
    if rating:
        rating.score = score
    else:
        rating = Rating(userId=user_id, novelId=novel_id, score=score)
        session.add(rating)
    await session.commit()
    await session.refresh(rating)
    return rating


async def get_novel_rating_stats(session: AsyncSession, novel_id: int) -> tuple[float, int]:
    result = await session.execute(
        select(func.avg(Rating.score), func.count(Rating.id))
        .where(Rating.novelId == novel_id)
    )
    avg, count = result.one()
    return (float(avg) if avg is not None else 0.0, int(count) if count is not None else 0)


# ---------------------------------------------------------------------------
# Comment
# ---------------------------------------------------------------------------
async def get_comment_by_id(session: AsyncSession, comment_id: int) -> Comment | None:
    return await session.get(Comment, comment_id)


async def get_novel_comments(
    session: AsyncSession, novel_id: int, skip: int = 0, limit: int = 10
) -> list[Comment]:
    result = await session.execute(
        select(Comment)
        .where(Comment.novelId == novel_id)
        .options(selectinload(Comment.user))
        .order_by(Comment.createdAt.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_chapter_comments(
    session: AsyncSession, chapter_id: int, skip: int = 0, limit: int = 10
) -> list[Comment]:
    result = await session.execute(
        select(Comment)
        .where(Comment.chapterId == chapter_id)
        .options(selectinload(Comment.user))
        .order_by(Comment.createdAt.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def create_comment(session: AsyncSession, comment: Comment) -> Comment:
    session.add(comment)
    await session.commit()
    await session.refresh(comment)
    return comment


async def delete_comment(session: AsyncSession, comment_id: int) -> None:
    comment = await session.get(Comment, comment_id)
    if comment:
        await session.delete(comment)
        await session.commit()
