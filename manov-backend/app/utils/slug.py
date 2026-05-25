"""Shared slug generation utility."""

import re
import time

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models import Novel


async def generate_slug(title: str, session: AsyncSession) -> str:
    """Generate a URL-safe slug from a title."""
    slug = re.sub(r"[^\w\s-]", "", title.lower())
    slug = re.sub(r"[\s_-]+", "-", slug).strip("-")

    # Ensure uniqueness
    existing = await session.scalar(select(Novel).where(Novel.slug == slug))
    if existing:
        slug = f"{slug}-{int(time.time())}"

    return slug
