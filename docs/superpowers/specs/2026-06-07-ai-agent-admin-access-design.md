# AI Agent Admin Access — Design Spec

## Goal
Enable AI agents (Claude Code, Cursor, Kimi, custom agents) to create, edit, and manage novels and chapters on behalf of admin users without using the browser UI. The interface should be discoverable, typed, and agent-native.

## Research Summary

From the web search:

- **MCP (Model Context Protocol)** is becoming the de facto standard for AI tool integration. Anthropic, OpenAI, Google, Microsoft, and Amazon have all adopted it. It is described as "USB-C for AI" — a universal interface between agents and capabilities.
- **FastAPI-MCP** (`fastapi-mcp` by tadata-org, 122+ stars) can auto-expose FastAPI endpoints as MCP tools with zero or minimal configuration. It mounts an MCP server at a subpath (e.g., `/mcp`) and uses existing FastAPI `Depends()` for auth.
- **FastMCP** is the standard Python framework for building MCP servers from scratch using decorators like `@mcp.tool`.
- MCP servers expose **Tools** (actions), **Resources** (read-only data), and **Prompts** (templated interactions). Agents discover tools at runtime via JSON-RPC 2.0.
- A 2026 arXiv paper noted that ~88.6% of MCP servers are backed by existing REST services, and maintaining dual HTTP + MCP definitions is a common burden. FastAPI-MCP solves this by auto-generating MCP tools from FastAPI routes.

## Decision: Hybrid Approach — MCP + Composite Admin API

We will:

1. **Add API-key auth** for programmatic/agent access (long-lived, scoped to admin users).
2. **Add composite agent-friendly endpoints** for common multi-step workflows (create novel + chapters in one call).
3. **Mount an MCP server** via `fastapi-mcp` so agents can discover and invoke admin operations as native tools.
4. **Keep the existing REST admin API** untouched for the human dashboard.

This gives agents three ways in, ordered by convenience:
- **MCP tools** (best for Claude/Cursor/Kimi with native MCP support)
- **Composite REST endpoints** (best for scripts and simpler agents)
- **Existing granular REST endpoints** (fallback for custom integrations)

## Architecture

```
┌─────────────────┐      ┌─────────────────────────────┐      ┌──────────────┐
│   AI Agent      │──────│  MCP over HTTP/SSE (/mcp)   │──────│  FastAPI app │
│  (Claude/etc)   │      │  Tools: create_novel,       │      │  Admin API   │
└─────────────────┘      │  add_chapter, edit_chapter  │      │  Composite   │
                         └─────────────────────────────┘      │  API keys    │
                                                                └──────────────┘
```

The MCP server is mounted inside the existing FastAPI app. It reuses the same SQLModel session, the same CRUD helpers, and the same API-key auth dependency.

## Backend Changes

### 1. API Key Authentication

New model:

```python
class ApiKey(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="user.id", ondelete="CASCADE", index=True)
    name: str
    keyHash: str            # bcrypt hash of the key
    keyPrefix: str          # first 8 chars for display
    role: str = "ADMIN"     # optional scope
    isActive: bool = True
    lastUsedAt: datetime | None = None
    createdAt: datetime = Field(default_factory=utc_now)
```

New endpoints (admin only):

```http
POST   /admin/api-keys           # generate a new key (returns plain key once)
GET    /admin/api-keys           # list keys
DELETE /admin/api-keys/{id}      # revoke
```

New auth dependency:

```python
async def get_current_user_from_api_key(
    api_key: str = Header(..., alias="X-API-Key"),
    session: AsyncSession = Depends(get_session),
) -> dict:
    ...
```

The dependency looks up the key hash, verifies it with bcrypt, updates `lastUsedAt`, and returns the user dict (same shape as JWT auth).

### 2. Composite Agent Endpoints

These endpoints accept larger, structured payloads so agents can perform common workflows in one call.

#### `POST /admin/novels/with-chapters`

Creates a novel and optionally its chapters + translations in one transaction.

Request:

```json
{
  "title": "My Novel",
  "originalTitle": "...",
  "author": "Author Name",
  "synopsis": "...",
  "status": "ONGOING",
  "genreNames": ["Fantasy", "Action"],
  "coverUrl": "https://...",
  "chapters": [
    {
      "chapterNum": 1,
      "title": "Chapter 1",
      "content": "# Chapter 1\n\nIt was a dark...",
      "language": "EN",
      "publishedAt": "2026-06-07T12:00:00Z"
    }
  ]
}
```

Response:

```json
{
  "novelId": 42,
  "slug": "my-novel",
  "chaptersCreated": 1,
  "translationIds": [101]
}
```

#### `POST /admin/novels/{novel_id}/chapters/bulk`

Adds multiple chapters to an existing novel.

Request:

```json
{
  "chapters": [
    { "chapterNum": 2, "title": "...", "content": "...", "language": "EN" }
  ]
}
```

#### `PUT /admin/chapters/{translation_id}/content`

Simple content update for agents.

Request:

```json
{
  "title": "New Title",
  "content": "New markdown content"
}
```

### 3. MCP Server Mount

Add to `app/main.py`:

```python
from fastapi_mcp import FastApiMCP

mcp = FastApiMCP(app, name="manov-admin")
mcp.mount()
```

This auto-exposes all FastAPI endpoints as MCP tools. To avoid leaking public endpoints that agents do not need, we will configure `FastApiMCP` with an include list or router filter:

```python
mcp = FastApiMCP(
    app,
    name="manov-admin",
    include_operations=[
        "create_novel",
        "create_novel_with_chapters",
        "bulk_add_chapters",
        "update_chapter_content",
        "delete_novel",
        "delete_chapter",
        "list_genres",
    ],
)
```

Alternatively, create a dedicated `agent_router` and pass only that router to `FastApiMCP`.

Each operation will include:
- A clear docstring/summary (becomes the tool description for the LLM).
- Pydantic schemas (becomes the tool input schema).

### 4. Security & Audit

- All agent endpoints require the `X-API-Key` header.
- API keys are scoped to users with `role="ADMIN"` only.
- Every agent-mutating operation logs an audit row:

```python
class AdminAuditLog(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="user.id", ondelete="CASCADE")
    action: str           # CREATE_NOVEL, ADD_CHAPTER, EDIT_CHAPTER, etc.
    entityType: str       # novel, chapter, translation
    entityId: int
    payloadSnapshot: str | None = None   # JSON blob
    ipAddress: str | None = None
    createdAt: datetime = Field(default_factory=utc_now)
```

Audit logging is handled in a dependency wrapper or middleware, not duplicated in every route.

## Frontend Changes

Minimal. The human admin dashboard only needs:

1. A new "API Keys" page under `/admin/api-keys` where admin users can:
   - Generate a key (one-time reveal).
   - View key name, prefix, last used, created.
   - Revoke keys.

No changes to novel/chapter admin forms are required.

## Agent UX Considerations

### Tool descriptions
Each MCP tool gets a description derived from the FastAPI route summary. We will write explicit summaries:

```python
@router.post(
    "/admin/novels/with-chapters",
    summary="Create a new novel and optionally its first chapters in one call.",
)
```

### Error messages
Agent-facing errors should be structured and include actionable guidance:

```json
{
  "error": "CHAPTER_NUMBER_CONFLICT",
  "message": "Chapter number 3 already exists for this novel.",
  "suggestion": "Use PUT /admin/chapters/{translation_id}/content to update existing chapter content."
}
```

### Idempotency
Bulk endpoints accept an optional `idempotencyKey` header. If provided, the server stores the key for 24 hours and returns the previous response on duplicate requests.

## Out of Scope

- Natural-language agent that parses free-text commands (we expose tools; the host agent does the NL reasoning).
- Real-time collaboration / locking.
- Non-admin agent access (this spec is admin-only).
- MCP prompts and resources (Phase 2; we start with tools only).

## Files to Create / Modify

| File | Change |
|---|---|
| `manov-backend/app/models.py` | Add `ApiKey` and `AdminAuditLog` models. |
| `manov-backend/app/routers/admin.py` | Add composite endpoints; add API-key auth dependency where needed. |
| `manov-backend/app/routers/admin_api_keys.py` | New router for API key CRUD. |
| `manov-backend/app/utils/security.py` | Add `verify_api_key`, `hash_api_key`. |
| `manov-backend/app/utils/audit.py` | New audit logging helper. |
| `manov-backend/app/main.py` | Mount `FastApiMCP`. |
| `manov-backend/pyproject.toml` | Add `fastapi-mcp` dependency. |
| `manov-backend/alembic/versions/` | New migration for `ApiKey` and `AdminAuditLog`. |
| `manov-frontend/src/pages/admin/ApiKeys.tsx` | New page (optional for Phase 1). |

## Implementation Phases

### Phase 1 — API keys + composite endpoints (1 day)
- Add `ApiKey` model and migration.
- Build API key generation/verification.
- Add `POST /admin/novels/with-chapters`.
- Add `POST /admin/novels/{id}/chapters/bulk`.
- Add `PUT /admin/chapters/{translation_id}/content`.
- Tests + build verification.

### Phase 2 — MCP mount (1 day)
- Add `fastapi-mcp` dependency.
- Mount MCP server on `/mcp`.
- Filter to include only agent-relevant operations.
- Write clear summaries on all included routes.
- Test with a simple MCP client (Claude Desktop or `mcp-cli`).

### Phase 3 — Audit + frontend key management (1 day)
- Add `AdminAuditLog` model and migration.
- Log all agent mutations.
- Build frontend API Keys page.

## Verification

- Backend tests pass.
- `GET /mcp/tools` (or MCP `tools/list`) returns the expected tool schemas.
- A test MCP client can call `create_novel_with_chapters` and verify the DB state.
- API keys reject non-admin users.
- Revoked keys return 401.

## Open Questions

1. Do we want to expose MCP via SSE or HTTP? (Recommendation: HTTP for simpler deployment; SSE is a one-line config change later.)
2. Should agent-created novels bypass the normal scrape/translate pipeline? (Recommendation: yes, agents provide finished translations directly.)
3. Should we rate-limit agent endpoints separately? (Recommendation: yes, per API key, via a simple middleware in Phase 2.)
