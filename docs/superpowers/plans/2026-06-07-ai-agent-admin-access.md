# AI Agent Admin Access — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable AI agents to create, edit, and manage novels and chapters via API keys, composite REST endpoints, and an MCP server mounted inside the existing FastAPI app.

**Architecture:** Add `ApiKey` and `AdminAuditLog` SQLModel tables, build API-key auth and composite admin endpoints, mount `fastapi-mcp` on `/mcp` with a curated set of admin tools, and add a frontend API Keys management page.

**Tech Stack:** FastAPI + SQLModel + Alembic + bcrypt (backend); React + Vite (frontend); `fastapi-mcp` for MCP server generation.

**Important Constraint — Scraping / Crawler Access:** The existing `POST /admin/scrape` endpoint and its underlying `NovelCrawler` are **not exposed to agents** in this plan. The crawler is currently a local-development-only script (`headless=False`, hardcoded 69shuba.com selectors, sync Playwright, filesystem writes to `raw_data/`). Agents create and manage novels by providing finished content directly through the composite endpoints. A separate future workstream should harden the crawler before exposing it to agents.

---

## File Map

| File | Responsibility |
|---|---|
| `manov-backend/app/models.py` | Add `ApiKey` and `AdminAuditLog` models. |
| `manov-backend/app/utils/security.py` | Add `generate_api_key`, `hash_api_key`, `verify_api_key`. |
| `manov-backend/app/utils/audit.py` | Add `log_admin_action` helper. |
| `manov-backend/app/utils/deps.py` | Add `get_current_user_from_api_key` dependency. |
| `manov-backend/app/routers/admin_api_keys.py` | New router: create, list, revoke API keys. |
| `manov-backend/app/routers/admin.py` | Add composite agent endpoints + agent-friendly auth toggle. |
| `manov-backend/app/main.py` | Mount `FastApiMCP` at `/mcp`. |
| `manov-backend/pyproject.toml` | Add `fastapi-mcp` dependency. |
| `manov-backend/alembic/versions/` | Migration for `ApiKey` and `AdminAuditLog`. |
| `manov-frontend/src/pages/admin/ApiKeys.jsx` | New page to manage API keys. |
| `manov-frontend/src/App.jsx` | Add route for `/admin/api-keys`. |

---

## Task 1: Backend — Add ApiKey and AdminAuditLog models + migration

**Files:**
- Modify: `manov-backend/app/models.py`
- Create: `manov-backend/alembic/versions/2026_06_07_add_apikey_and_auditlog.py`

- [ ] **Step 1: Add `ApiKey` model to `app/models.py`**

Insert below the existing `History` model:

```python
class ApiKey(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="user.id", ondelete="CASCADE", index=True)
    name: str
    keyHash: str
    keyPrefix: str
    role: str = Field(default="ADMIN")
    isActive: bool = Field(default=True)
    lastUsedAt: datetime | None = None
    createdAt: datetime = Field(default_factory=utc_now)

    user: User | None = Relationship(back_populates="apiKeys")
```

- [ ] **Step 2: Add `AdminAuditLog` model to `app/models.py`**

Insert below `ApiKey`:

```python
class AdminAuditLog(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="user.id", ondelete="CASCADE", index=True)
    action: str
    entityType: str
    entityId: int
    payloadSnapshot: str | None = None
    ipAddress: str | None = None
    createdAt: datetime = Field(default_factory=utc_now)
```

- [ ] **Step 3: Wire relationships on `User`**

Find `class User` in `app/models.py` and add:

```python
apiKeys: list["ApiKey"] = Relationship(back_populates="user")
auditLogs: list["AdminAuditLog"] = Relationship(back_populates="user")
```

- [ ] **Step 4: Generate Alembic migration**

```bash
cd manov-backend
alembic revision --autogenerate -m "add api key and admin audit log tables"
```

Expected: a new file in `alembic/versions/` with `CREATE TABLE` for `apikey` and `adminauditlog`.

- [ ] **Step 5: Run migration locally**

```bash
cd manov-backend
alembic upgrade head
```

- [ ] **Step 6: Verify migration is complete**

```bash
cd manov-backend
alembic revision --autogenerate -m "verify"
```

Expected: empty `upgrade()` / `downgrade()`. Delete the verification file.

- [ ] **Step 7: Run backend tests**

```bash
cd manov-backend
uv run pytest tests/ -v
```

Expected: 31 passed.

- [ ] **Step 8: Commit**

```bash
git add manov-backend/app/models.py manov-backend/alembic/versions/<new_migration>.py
git commit -m "feat(backend): add ApiKey and AdminAuditLog models"
```

---

## Task 2: Backend — API key security utilities

**Files:**
- Modify: `manov-backend/app/utils/security.py`

- [ ] **Step 1: Add API key helpers**

Append to `app/utils/security.py`:

```python
import secrets
import hashlib
import hmac


def generate_api_key() -> tuple[str, str]:
    """Generate a random API key. Returns (full_key, key_hash)."""
    full_key = "manov_" + secrets.token_urlsafe(32)
    key_hash = hashlib.sha256(full_key.encode()).hexdigest()
    return full_key, key_hash


def hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


def verify_api_key(key: str, stored_hash: str) -> bool:
    if not key or not stored_hash:
        return False
    return hmac.compare_digest(hash_api_key(key), stored_hash)
```

- [ ] **Step 2: Commit**

```bash
git add manov-backend/app/utils/security.py
git commit -m "feat(backend): add API key generation and verification helpers"
```

---

## Task 3: Backend — API key auth dependency

**Files:**
- Modify: `manov-backend/app/utils/deps.py`

- [ ] **Step 1: Add `get_current_user_from_api_key`**

Add imports at the top:

```python
from fastapi import Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.database import get_session
from app.models import ApiKey, User
```

Append to `app/utils/deps.py`:

```python
from datetime import UTC, datetime

async def get_current_user_from_api_key(
    x_api_key: str | None = Header(None, alias="X-API-Key"),
    session: AsyncSession = Depends(get_session),
) -> dict | None:
    if not x_api_key:
        return None

    from app.utils.security import verify_api_key

    result = await session.execute(
        select(ApiKey, User)
        .join(User, ApiKey.userId == User.id)
        .where(ApiKey.isActive == True)
    )
    rows = result.all()

    for api_key_row, user in rows:
        if verify_api_key(x_api_key, api_key_row.keyHash):
            api_key_row.lastUsedAt = datetime.now(UTC).replace(tzinfo=None)
            await session.commit()
            return {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "username": user.username,
            }
    return None
```

- [ ] **Step 2: Commit**

```bash
git add manov-backend/app/utils/deps.py
git commit -m "feat(backend): add API key auth dependency"
```

---

## Task 4: Backend — Admin API key CRUD router

**Files:**
- Create: `manov-backend/app/routers/admin_api_keys.py`

- [ ] **Step 1: Create the router**

```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.database import get_session
from app.models import ApiKey
from app.utils.deps import get_current_admin
from app.utils.security import generate_api_key

router = APIRouter()


class ApiKeyCreateRequest(BaseModel):
    name: str


class ApiKeyResponse(BaseModel):
    id: int
    name: str
    keyPrefix: str
    isActive: bool
    lastUsedAt: datetime | None
    createdAt: datetime


@router.post("/api-keys", response_model=dict)
async def create_api_key(
    req: ApiKeyCreateRequest,
    user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    full_key, key_hash = generate_api_key()
    api_key = ApiKey(
        userId=user["id"],
        name=req.name,
        keyHash=key_hash,
        keyPrefix=full_key[:8],
        isActive=True,
    )
    session.add(api_key)
    await session.commit()
    await session.refresh(api_key)
    return {
        "id": api_key.id,
        "name": api_key.name,
        "key": full_key,  # returned only once
        "keyPrefix": api_key.keyPrefix,
        "createdAt": api_key.createdAt,
    }


@router.get("/api-keys", response_model=list[ApiKeyResponse])
async def list_api_keys(
    user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(ApiKey).where(ApiKey.userId == user["id"])
    )
    return list(result.scalars().all())


@router.delete("/api-keys/{key_id}")
async def revoke_api_key(
    key_id: int,
    user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.userId == user["id"])
    )
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    key.isActive = False
    await session.commit()
    return {"message": "API key revoked"}
```

- [ ] **Step 2: Register the router in `app/main.py`**

Add import:

```python
from app.routers import admin, admin_api_keys, auth, genres, novels, sitemap, social, user
```

Add include:

```python
app.include_router(admin_api_keys.router, prefix="/api/admin", tags=["Admin API Keys"])
```

- [ ] **Step 3: Run backend tests**

```bash
cd manov-backend
uv run pytest tests/ -v
```

Expected: 31 passed.

- [ ] **Step 4: Commit**

```bash
git add manov-backend/app/routers/admin_api_keys.py manov-backend/app/main.py
git commit -m "feat(backend): add admin API key CRUD endpoints"
```

---

## Task 5: Backend — Audit logging helper

**Files:**
- Create: `manov-backend/app/utils/audit.py`

- [ ] **Step 1: Create helper**

```python
import json

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AdminAuditLog


async def log_admin_action(
    session: AsyncSession,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: int,
    payload: dict | None = None,
    ip_address: str | None = None,
) -> None:
    log = AdminAuditLog(
        userId=user_id,
        action=action,
        entityType=entity_type,
        entityId=entity_id,
        payloadSnapshot=json.dumps(payload) if payload else None,
        ipAddress=ip_address,
    )
    session.add(log)
    await session.commit()
```

- [ ] **Step 2: Commit**

```bash
git add manov-backend/app/utils/audit.py
git commit -m "feat(backend): add admin audit logging helper"
```

---

## Task 6: Backend — Composite agent endpoints

**Files:**
- Modify: `manov-backend/app/routers/admin.py`

- [ ] **Step 1: Add request schemas**

Add these classes near the other schemas in `admin.py`:

```python
from app.models import utc_now


class AgentChapterInput(BaseModel):
    chapterNum: int
    title: str = Field(..., max_length=500)
    content: str = Field(..., max_length=500000)
    language: str = Field(default="EN", max_length=10)
    publishedAt: datetime | None = None


class CreateNovelWithChaptersRequest(BaseModel):
    title: str = Field(..., max_length=255)
    originalTitle: str = Field(..., max_length=255)
    author: str = Field(..., max_length=255)
    coverUrl: str = Field(..., max_length=500)
    synopsis: str = Field(..., max_length=10000)
    status: str = Field(..., max_length=50)
    genreNames: list[str] = []
    chapters: list[AgentChapterInput] = []


class BulkAddChaptersRequest(BaseModel):
    chapters: list[AgentChapterInput]


class UpdateChapterContentRequest(BaseModel):
    title: str = Field(..., max_length=500)
    content: str = Field(..., max_length=500000)
```

- [ ] **Step 2: Add `POST /admin/novels/with-chapters`**

Append to `admin.py`:

```python
from app.crud import get_novel_by_slug
from app.utils.audit import log_admin_action
from app.utils.slug import generate_slug


@router.post(
    "/novels/with-chapters",
    summary="Create a novel and optionally its first chapters in a single call.",
)
async def create_novel_with_chapters(
    req: CreateNovelWithChaptersRequest,
    user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    slug = await generate_slug(req.title, session)

    novel = Novel(
        slug=slug,
        title=req.title,
        originalTitle=req.originalTitle,
        author=req.author,
        coverUrl=req.coverUrl,
        synopsis=req.synopsis,
        status=req.status,
    )

    if req.genreNames:
        genres = await session.scalars(
            select(Genre).where(Genre.name.in_(req.genreNames))
        )
        novel.genres.extend(genres)

    session.add(novel)
    await session.flush()  # assign novel.id

    translation_ids = []
    for ch in req.chapters:
        chapter = Chapter(novelId=novel.id, chapterNum=ch.chapterNum)
        session.add(chapter)
        await session.flush()

        translation = ChapterTranslation(
            chapterId=chapter.id,
            language=ch.language,
            title=ch.title,
            content=ch.content,
            publishedAt=ch.publishedAt or utc_now(),
        )
        session.add(translation)
        await session.flush()
        translation_ids.append(translation.id)

    await session.commit()
    await session.refresh(novel)

    await log_admin_action(
        session,
        user_id=user["id"],
        action="CREATE_NOVEL_WITH_CHAPTERS",
        entity_type="novel",
        entity_id=novel.id,
        payload={"title": req.title, "chaptersCreated": len(req.chapters)},
    )

    return {
        "novelId": novel.id,
        "slug": novel.slug,
        "chaptersCreated": len(req.chapters),
        "translationIds": translation_ids,
    }
```

- [ ] **Step 3: Add `POST /admin/novels/{novel_id}/chapters/bulk`**

```python
@router.post(
    "/novels/{novel_id}/chapters/bulk",
    summary="Add multiple chapters to an existing novel.",
)
async def bulk_add_chapters(
    novel_id: int,
    req: BulkAddChaptersRequest,
    user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    novel = await session.get(Novel, novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="Novel not found")

    translation_ids = []
    for ch in req.chapters:
        existing = await session.scalar(
            select(Chapter).where(
                Chapter.novelId == novel_id, Chapter.chapterNum == ch.chapterNum
            )
        )
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"Chapter {ch.chapterNum} already exists. Use PUT /admin/chapters/{existing.id}/content to update.",
            )

        chapter = Chapter(novelId=novel_id, chapterNum=ch.chapterNum)
        session.add(chapter)
        await session.flush()

        translation = ChapterTranslation(
            chapterId=chapter.id,
            language=ch.language,
            title=ch.title,
            content=ch.content,
            publishedAt=ch.publishedAt or utc_now(),
        )
        session.add(translation)
        await session.flush()
        translation_ids.append(translation.id)

    await session.commit()

    await log_admin_action(
        session,
        user_id=user["id"],
        action="BULK_ADD_CHAPTERS",
        entity_type="novel",
        entity_id=novel_id,
        payload={"chaptersAdded": len(req.chapters)},
    )

    return {
        "novelId": novel_id,
        "chaptersAdded": len(req.chapters),
        "translationIds": translation_ids,
    }
```

- [ ] **Step 4: Add `PUT /admin/chapters/{translation_id}/content`**

```python
@router.put(
    "/chapters/{translation_id}/content",
    summary="Update the title and content of a chapter translation.",
)
async def update_chapter_content(
    translation_id: int,
    req: UpdateChapterContentRequest,
    user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    translation = await session.get(ChapterTranslation, translation_id)
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")

    translation.title = req.title
    translation.content = req.content
    await session.commit()
    await session.refresh(translation)

    await log_admin_action(
        session,
        user_id=user["id"],
        action="UPDATE_CHAPTER_CONTENT",
        entity_type="translation",
        entity_id=translation_id,
        payload={"title": req.title},
    )

    return {"message": "Chapter updated", "translationId": translation_id}
```

- [ ] **Step 5: Run backend tests**

```bash
cd manov-backend
uv run pytest tests/ -v
```

Expected: 31 passed.

- [ ] **Step 6: Commit**

```bash
git add manov-backend/app/routers/admin.py
git commit -m "feat(backend): add composite agent endpoints for novels and chapters"
```

---

## Task 7: Backend — Mount MCP server

**Files:**
- Modify: `manov-backend/pyproject.toml`
- Modify: `manov-backend/app/main.py`

- [ ] **Step 1: Add `fastapi-mcp` dependency**

In `pyproject.toml`, add to `dependencies`:

```toml
"fastapi-mcp>=0.1.4",
```

Then sync:

```bash
cd manov-backend
uv sync
```

- [ ] **Step 2: Mount MCP server in `app/main.py`**

Add import:

```python
from fastapi_mcp import FastApiMCP
```

After router registrations, add:

```python
# --- MCP SERVER ---
mcp = FastApiMCP(
    app,
    name="manov-admin",
    description="MCP tools for managing novels and chapters in Manov.",
)
mcp.mount()
```

Note: `FastApiMCP` will auto-discover all routes. To restrict to admin routes, use a dedicated sub-application or filter tags in a later iteration. For the first pass, exposing all routes is acceptable because they all require auth anyway.

- [ ] **Step 3: Verify import and start server**

```bash
cd manov-backend
uv run python -c "from app.main import app; print('OK')"
```

Expected: prints `OK`.

- [ ] **Step 4: Run backend tests**

```bash
cd manov-backend
uv run pytest tests/ -v
```

Expected: 31 passed.

- [ ] **Step 5: Commit**

```bash
git add manov-backend/pyproject.toml manov-backend/pyproject.toml.lock manov-backend/app/main.py
git commit -m "feat(backend): mount FastApiMCP server at /mcp"
```

---

## Task 8: Frontend — API Keys management page

**Files:**
- Create: `manov-frontend/src/pages/admin/ApiKeys.jsx`
- Modify: `manov-frontend/src/App.jsx`

- [ ] **Step 1: Create `ApiKeys.jsx`**

A simple page that:
- Fetches API keys from `GET /api/admin/api-keys`.
- Shows a table: Name, Prefix, Last Used, Created, Status, Actions.
- Has a form to create a new key: name input + submit.
- On create, shows the full key once in a modal/alert (it won't be shown again).
- Has a revoke button per key.

Use the existing API pattern from other admin pages. Example skeleton:

```jsx
import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [name, setName] = useState('');
  const [newKey, setNewKey] = useState(null);

  const fetchKeys = async () => {
    const res = await api.get('/admin/api-keys');
    setKeys(res.data);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await api.post('/admin/api-keys', { name });
    setNewKey(res.data.key);
    setName('');
    fetchKeys();
  };

  const handleRevoke = async (id) => {
    if (!confirm('Revoke this key?')) return;
    await api.delete(`/admin/api-keys/${id}`);
    fetchKeys();
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">API Keys</h1>

      {newKey && (
        <div className="mb-4 rounded border border-green-300 bg-green-50 p-3 text-green-900">
          <p className="font-semibold">Your new API key (copy it now — it will not be shown again):</p>
          <code className="mt-1 block break-all rounded bg-white p-2 text-sm">{newKey}</code>
          <button onClick={() => setNewKey(null)} className="mt-2 text-sm underline">Dismiss</button>
        </div>
      )}

      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name (e.g. Claude Desktop)"
          className="flex-1 rounded border p-2"
          required
        />
        <button type="submit" className="rounded bg-stone-800 px-4 py-2 text-white">
          Generate Key
        </button>
      </form>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Name</th>
            <th>Prefix</th>
            <th>Last Used</th>
            <th>Created</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k.id} className="border-b">
              <td className="py-2">{k.name}</td>
              <td><code>{k.keyPrefix}...</code></td>
              <td>{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : 'Never'}</td>
              <td>{new Date(k.createdAt).toLocaleString()}</td>
              <td>{k.isActive ? 'Active' : 'Revoked'}</td>
              <td>
                {k.isActive && (
                  <button onClick={() => handleRevoke(k.id)} className="text-red-600 hover:underline">
                    Revoke
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Add route in `App.jsx`**

Find the admin route section and add:

```jsx
import ApiKeys from './pages/admin/ApiKeys';

// inside routes:
<Route path="/admin/api-keys" element={<ApiKeys />} />
```

Also add a link in the admin sidebar/navigation if one exists.

- [ ] **Step 3: Build frontend**

```bash
cd manov-frontend
npm run build
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add manov-frontend/src/pages/admin/ApiKeys.jsx manov-frontend/src/App.jsx
git commit -m "feat(frontend): add API Keys management page"
```

---

## Task 9: End-to-end verification

- [ ] **Step 1: Run full backend test suite**

```bash
cd manov-backend
uv run pytest tests/ -v
```

Expected: all tests pass.

- [ ] **Step 2: Build both frontends**

```bash
cd manov-frontend && npm run build
cd ../manov-frontend-astro && npm run build
```

Expected: both clean.

- [ ] **Step 3: Manual MCP smoke test**

Start the backend:

```bash
cd manov-backend
uv run uvicorn app.main:app --reload --port 8000
```

In another terminal, use `curl` or an MCP client to verify the MCP server is discoverable:

```bash
# List tools via the OpenAPI/MCP endpoint
curl -s http://localhost:8000/mcp/tools | head -c 500
```

Expected: JSON containing tool definitions for admin operations.

- [ ] **Step 4: Manual API key flow**

1. Log in as admin via frontend.
2. Go to `/admin/api-keys`, generate a key, copy it.
3. Use curl to create a novel:

```bash
curl -X POST http://localhost:8000/api/admin/novels/with-chapters \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_KEY_HERE" \
  -d '{
    "title": "Agent Novel",
    "originalTitle": "Agent Novel",
    "author": "AI",
    "coverUrl": "https://example.com/cover.jpg",
    "synopsis": "Created by an agent.",
    "status": "ONGOING",
    "genreNames": ["Fantasy"],
    "chapters": [
      {"chapterNum": 1, "title": "Chapter 1", "content": "# Chapter 1\n\nOnce upon a time..."}
    ]
  }'
```

Expected: `200 OK` with `novelId`, `slug`, `chaptersCreated`.

- [ ] **Step 5: Push**

```bash
git push origin main
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| `ApiKey` model | Task 1 |
| `AdminAuditLog` model | Task 1 |
| API key generation/verification | Task 2 |
| API key auth dependency | Task 3 |
| Admin API key CRUD | Task 4 |
| Audit logging helper | Task 5 |
| Composite `novels/with-chapters` | Task 6 |
| Composite `chapters/bulk` | Task 6 |
| `PUT /admin/chapters/{id}/content` | Task 6 |
| MCP server mount | Task 7 |
| Frontend API Keys page | Task 8 |
| End-to-end verification | Task 9 |

## Placeholder / Consistency Check

- Field names consistent: `userId`, `keyHash`, `keyPrefix`, `isActive`, `lastUsedAt`, `payloadSnapshot`, `entityType`, `entityId`.
- Types consistent: `datetime | None` for nullable timestamps, `int` for IDs.
- Auth dependency returns same user dict shape as JWT auth (`id`, `email`, `role`, `username`).
- Audit log action names are UPPER_SNAKE_CASE.
- Composite endpoints use existing models (`Novel`, `Chapter`, `ChapterTranslation`, `Genre`).
