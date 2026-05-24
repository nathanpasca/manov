"""Shared slug generation utility."""

import re
import time

from app.database import db


async def generate_slug(title: str) -> str:
    """Generate a URL-safe slug from a title."""
    slug = re.sub(r"[^\w\s-]", "", title.lower())
    slug = re.sub(r"[\s_-]+", "-", slug).strip("-")

    # Ensure uniqueness
    existing = await db.novel.find_unique(where={"slug": slug})
    if existing:
        slug = f"{slug}-{int(time.time())}"

    return slug
