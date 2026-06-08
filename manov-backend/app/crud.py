"""Reusable async CRUD operations."""

from sqlalchemy import func, or_
from sqlalchemy import update as sa_update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import delete, select

from app.models import (
    Chapter,
    ChapterTranslation,
    Comment,
    Genre,
    History,
    Library,
    Notification,
    Novel,
    NovelGenreLink,
    Rating,
    Review,
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
    session: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    sort_by: str = "updatedAt",
    sort_order: str = "desc",
    status: str = "",
    genre_id: int = 0,
) -> list[tuple[Novel, int]]:
    chapter_count_subq = (
        select(func.count(Chapter.id))
        .where(Chapter.novelId == Novel.id)
        .correlate(Novel)
        .scalar_subquery()
    )

    query = (
        select(Novel, chapter_count_subq.label("chapter_count"))
        .options(selectinload(Novel.genres))
    )

    # --- Filters ---
    if status:
        query = query.where(Novel.status == status)

    if genre_id:
        query = query.where(
            Novel.id.in_(
                select(NovelGenreLink.novel_id).where(
                    NovelGenreLink.genre_id == genre_id
                )
            )
        )

    # --- Sorting ---
    sort_column = getattr(Novel, sort_by, Novel.updatedAt)
    if sort_order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    query = query.offset(skip).limit(limit)
    result = await session.execute(query)
    return list(result.all())


async def search_novels(
    session: AsyncSession, query: str, skip: int = 0, limit: int = 20
) -> list[tuple[Novel, int]]:
    chapter_count_subq = (
        select(func.count(Chapter.id))
        .where(Chapter.novelId == Novel.id)
        .correlate(Novel)
        .scalar_subquery()
    )

    search_pattern = f"%{query}%"
    result = await session.execute(
        select(Novel, chapter_count_subq.label("chapter_count"))
        .options(selectinload(Novel.genres))
        .where(
            or_(
                Novel.title.ilike(search_pattern),
                Novel.author.ilike(search_pattern),
                Novel.synopsis.ilike(search_pattern),
            )
        )
        .order_by(Novel.updatedAt.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.all())


async def count_search_results(session: AsyncSession, query: str) -> int:
    search_pattern = f"%{query}%"
    count = await session.scalar(
        select(func.count(Novel.id)).where(
            or_(
                Novel.title.ilike(search_pattern),
                Novel.author.ilike(search_pattern),
                Novel.synopsis.ilike(search_pattern),
            )
        )
    )
    return count or 0


async def count_novels(session: AsyncSession) -> int:
    count = await session.scalar(select(func.count()).select_from(Novel))
    return count or 0


async def increment_view_count(session: AsyncSession, novel_id: int) -> None:
    novel = await session.get(Novel, novel_id)
    if novel:
        novel.viewCount += 1
        await session.commit()


async def get_trending_novels(
    session: AsyncSession, limit: int = 10
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
        .order_by(Novel.viewCount.desc())
        .limit(limit)
    )
    return list(result.all())


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
    # Use direct DELETE so the DB handles cascading via ON DELETE CASCADE
    # without loading every related row into Python memory.
    # Explicitly delete link rows first for DBs without FK cascade on the link table.
    await session.execute(delete(NovelGenreLink).where(NovelGenreLink.novel_id == novel_id))
    await session.execute(delete(Novel).where(Novel.id == novel_id))
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
    await session.execute(delete(Chapter).where(Chapter.id == chapter_id))
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
    await session.execute(delete(NovelGenreLink).where(NovelGenreLink.genre_id == genre_id))
    await session.execute(delete(Genre).where(Genre.id == genre_id))
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
# DEPRECATED: The quick-rating-without-review feature is no longer supported.
# These helpers are retained only for backward compatibility (e.g. reading
# existing Rating rows when computing aggregate stats or showing a user's
# historical rating). New ratings must be created as Reviews via the review
# endpoints, and the POST /novels/{id}/rate endpoint now returns 400.
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
    """DEPRECATED: Only kept for potential internal/backfill use. Do not expose to users."""
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
    """DEPRECATED: Use get_novel_combined_rating_stats for unified stats."""
    result = await session.execute(
        select(func.avg(Rating.score), func.count(Rating.id))
        .where(Rating.novelId == novel_id)
    )
    avg, count = result.one()
    return (float(avg) if avg is not None else 0.0, int(count) if count is not None else 0)


async def get_novel_combined_rating_stats(
    session: AsyncSession, novel_id: int
) -> tuple[float, int]:
    """Return combined average/count from both Rating and Review tables.

    If a user has both a Rating and a Review for the same novel, the Review
    score takes precedence (it is the more considered opinion). Each user
    is counted only once.

    NOTE: The Rating table is deprecated. New ratings must be created as
    Reviews. Rating rows are still included here for backward compatibility
    until existing data is migrated or removed.
    """
    rating_rows = await session.execute(
        select(Rating.userId, Rating.score).where(Rating.novelId == novel_id)
    )
    review_rows = await session.execute(
        select(Review.userId, Review.score).where(Review.novelId == novel_id)
    )

    scores_by_user: dict[int, int] = {}
    for user_id, score in rating_rows.all():
        scores_by_user[user_id] = score
    for user_id, score in review_rows.all():
        scores_by_user[user_id] = score  # Review overrides quick rating

    scores = list(scores_by_user.values())
    if not scores:
        return (0.0, 0)
    return (sum(scores) / len(scores), len(scores))


# ---------------------------------------------------------------------------
# Comment
# ---------------------------------------------------------------------------
async def get_comment_by_id(session: AsyncSession, comment_id: int) -> Comment | None:
    return await session.get(Comment, comment_id)


async def get_comment_replies(
    session: AsyncSession, parent_id: int
) -> list[Comment]:
    """Get direct replies to a comment."""
    result = await session.execute(
        select(Comment)
        .where(Comment.parentId == parent_id)
        .options(selectinload(Comment.user))
        .order_by(Comment.createdAt.asc())
    )
    return list(result.scalars().all())


async def get_novel_comments(
    session: AsyncSession, novel_id: int, skip: int = 0, limit: int = 10
) -> list[Comment]:
    # Fetch top-level comments first, then their replies in a flat structure
    # Frontend will reconstruct the tree using parentId
    result = await session.execute(
        select(Comment)
        .where(Comment.novelId == novel_id)
        .options(selectinload(Comment.user))
        .order_by(Comment.createdAt.desc())
        .offset(skip)
        .limit(limit)
    )
    top_level = list(result.scalars().all())

    # Also fetch all replies for these top-level comments
    top_ids = [c.id for c in top_level]
    if top_ids:
        replies_result = await session.execute(
            select(Comment)
            .where(Comment.parentId.in_(top_ids))
            .options(selectinload(Comment.user))
            .order_by(Comment.createdAt.asc())
        )
        return top_level + list(replies_result.scalars().all())
    return top_level


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
    top_level = list(result.scalars().all())

    top_ids = [c.id for c in top_level]
    if top_ids:
        replies_result = await session.execute(
            select(Comment)
            .where(Comment.parentId.in_(top_ids))
            .options(selectinload(Comment.user))
            .order_by(Comment.createdAt.asc())
        )
        return top_level + list(replies_result.scalars().all())
    return top_level


async def create_comment(session: AsyncSession, comment: Comment) -> Comment:
    # Calculate depth from parent
    if comment.parentId:
        parent = await get_comment_by_id(session, comment.parentId)
        if parent:
            comment.depth = min(parent.depth + 1, 5)  # Max depth 5
    session.add(comment)
    await session.commit()
    await session.refresh(comment)
    return comment


async def delete_comment(session: AsyncSession, comment_id: int) -> None:
    comment = await session.get(Comment, comment_id)
    if comment:
        await session.delete(comment)
        await session.commit()


# ---------------------------------------------------------------------------
# Review
# ---------------------------------------------------------------------------
async def get_review_by_id(session: AsyncSession, review_id: int) -> Review | None:
    return await session.get(Review, review_id)


async def get_review_by_user_and_novel(
    session: AsyncSession, user_id: int, novel_id: int
) -> Review | None:
    return await session.scalar(
        select(Review).where(
            Review.userId == user_id, Review.novelId == novel_id
        )
    )


async def get_reviews_by_novel(
    session: AsyncSession, novel_id: int, skip: int = 0, limit: int = 10
) -> list[tuple[Review, str]]:
    result = await session.execute(
        select(Review, User.username)
        .join(User, Review.userId == User.id)
        .where(Review.novelId == novel_id)
        .order_by(Review.createdAt.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.all())


async def create_review(session: AsyncSession, review: Review) -> Review:
    session.add(review)
    await session.commit()
    await session.refresh(review)
    return review


async def update_review(
    session: AsyncSession, review: Review, score: int, content: str
) -> Review:
    review.score = score
    review.content = content
    await session.commit()
    await session.refresh(review)
    return review


async def delete_review(session: AsyncSession, review_id: int) -> None:
    review = await session.get(Review, review_id)
    if review:
        await session.delete(review)
        await session.commit()


async def get_novel_review_stats(session: AsyncSession, novel_id: int) -> tuple[float, int]:
    result = await session.execute(
        select(func.avg(Review.score), func.count(Review.id))
        .where(Review.novelId == novel_id)
    )
    avg, count = result.one()
    return (float(avg) if avg is not None else 0.0, int(count) if count is not None else 0)


# ---------------------------------------------------------------------------
# Notification
# ---------------------------------------------------------------------------
async def create_notification(session: AsyncSession, notification: Notification) -> Notification:
    session.add(notification)
    await session.commit()
    await session.refresh(notification)
    return notification


async def get_user_notifications(
    session: AsyncSession, user_id: int, skip: int = 0, limit: int = 20
) -> list[Notification]:
    result = await session.execute(
        select(Notification)
        .where(Notification.userId == user_id)
        .order_by(Notification.createdAt.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_unread_notification_count(session: AsyncSession, user_id: int) -> int:
    count = await session.scalar(
        select(func.count(Notification.id))
        .where(Notification.userId == user_id, Notification.isRead == False)  # noqa: E712
    )
    return count or 0


async def mark_notification_read(
    session: AsyncSession, notification_id: int, user_id: int
) -> Notification | None:
    notification = await session.scalar(
        select(Notification).where(
            Notification.id == notification_id, Notification.userId == user_id
        )
    )
    if notification:
        notification.isRead = True
        await session.commit()
        await session.refresh(notification)
    return notification


async def mark_all_notifications_read(session: AsyncSession, user_id: int) -> None:
    await session.execute(
        sa_update(Notification)
        .where(Notification.userId == user_id, Notification.isRead == False)  # noqa: E712
        .values(isRead=True)
    )
    await session.commit()
