# Reading Line History — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Save and restore the user's exact reading position within a chapter using a parsed block index and intra-block offset percentage, so readers resume where they left off even after changing font size or line spacing.

**Architecture:** Extend the existing `History` table with `lastReadBlockIndex` and `blockOffsetPercent`, expose a new `GET /user/history/{novelId}` endpoint, and enhance the Astro `Reader` island to compute the current block from the viewport, send it to the backend, and scroll back to it on chapter load.

**Tech Stack:** FastAPI + SQLModel + Alembic (backend); Astro + React + TypeScript + Tailwind (frontend).

---

## File Map

| File | Responsibility |
|---|---|
| `manov-backend/app/models.py` | Add `lastReadBlockIndex` and `blockOffsetPercent` to `History` model. |
| `manov-backend/app/routers/user.py` | Extend `ProgressUpdateRequest`, update `POST /user/history/progress`, add `GET /user/history/{novelId}`. |
| `manov-backend/app/crud.py` | Add `get_history_entry_by_novel` helper (if not already present). |
| `manov-backend/alembic/versions/` | New migration adding the two columns. |
| `manov-frontend-astro/src/lib/api.ts` | Add `getHistoryForNovel(novelId)` and update `updateProgress` payload type. |
| `manov-frontend-astro/src/components/islands/Reader.tsx` | Collect block refs, compute block index + offset, save on scroll/mount, restore on mount. |

---

## Task 1: Backend — Extend History model and create migration

**Files:**
- Modify: `manov-backend/app/models.py:175-188`
- Create: `manov-backend/alembic/versions/2026_06_07_add_reading_line_columns_to_history.py`

- [ ] **Step 1: Add columns to `History` model**

Add two fields inside `class History`:

```python
lastReadBlockIndex: int | None = Field(default=None)
blockOffsetPercent: int = Field(default=0)
```

Resulting model:

```python
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
```

- [ ] **Step 2: Generate Alembic migration**

Run:

```bash
cd manov-backend
alembic revision --autogenerate -m "add reading line columns to history"
```

Expected: a new file appears in `alembic/versions/` with `op.add_column` for `last_read_block_index` and `block_offset_percent`.

- [ ] **Step 3: Review and run migration**

Run:

```bash
cd manov-backend
alembic upgrade head
```

Expected: `INFO  [alembic.runtime.migration] Context impl PostgresqlImpl. ... Running upgrade ... -> <new>, add reading line columns to history`

- [ ] **Step 4: Verify migration is empty on second run**

Run:

```bash
alembic revision --autogenerate -m "verify"
```

Expected: creates a file with empty `upgrade()` / `downgrade()` functions. Delete that verification file after confirming.

- [ ] **Step 5: Commit**

```bash
git add manov-backend/app/models.py manov-backend/alembic/versions/<new_migration>.py
git commit -m "feat(backend): add lastReadBlockIndex and blockOffsetPercent to History"
```

---

## Task 2: Backend — Update progress endpoint and add history fetch

**Files:**
- Modify: `manov-backend/app/routers/user.py:25-167`

- [ ] **Step 1: Extend `ProgressUpdateRequest`**

Change:

```python
class ProgressUpdateRequest(BaseModel):
    novelId: int
    chapterNum: int
    scrollPosition: float | None = None
    progressPercent: int = 0
```

To:

```python
class ProgressUpdateRequest(BaseModel):
    novelId: int
    chapterNum: int
    lastReadBlockIndex: int | None = None
    blockOffsetPercent: int = 0
    scrollPosition: float | None = None
    progressPercent: int = 0
```

- [ ] **Step 2: Update `POST /user/history/progress` to persist new fields**

Inside `update_progress`, update both the "entry exists" and "create new entry" branches so the new fields are saved:

```python
if entry:
    entry.chapterNum = req.chapterNum
    entry.scrollPosition = req.scrollPosition
    entry.progressPercent = req.progressPercent
    entry.lastReadBlockIndex = req.lastReadBlockIndex
    entry.blockOffsetPercent = req.blockOffsetPercent
    await session.commit()
    await session.refresh(entry)
    return {"message": "Progress updated"}

# Create new history entry
await upsert_history(session, user["id"], req.novelId, req.chapterNum)
entry = await get_history_entry(session, user["id"], req.novelId)
if entry:
    entry.scrollPosition = req.scrollPosition
    entry.progressPercent = req.progressPercent
    entry.lastReadBlockIndex = req.lastReadBlockIndex
    entry.blockOffsetPercent = req.blockOffsetPercent
    await session.commit()

return {"message": "Progress saved"}
```

- [ ] **Step 3: Add `GET /user/history/{novelId}` endpoint**

Append below `update_progress`:

```python
@router.get("/history/{novel_id}")
async def get_history_for_novel(
    novel_id: int,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    from app.crud import get_history_entry

    entry = await get_history_entry(session, user["id"], novel_id)
    if not entry:
        raise HTTPException(status_code=404, detail="History not found")
    return {
        "novelId": entry.novelId,
        "chapterNum": entry.chapterNum,
        "lastReadBlockIndex": entry.lastReadBlockIndex,
        "blockOffsetPercent": entry.blockOffsetPercent,
        "scrollPosition": entry.scrollPosition,
        "progressPercent": entry.progressPercent,
        "updatedAt": entry.updatedAt,
    }
```

- [ ] **Step 4: Run backend tests**

```bash
cd manov-backend
uv run pytest tests/ -v
```

Expected: all existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add manov-backend/app/routers/user.py
git commit -m "feat(backend): persist reading line fields and add GET /user/history/{novel_id}"
```

---

## Task 3: Frontend — Add API client methods

**Files:**
- Modify: `manov-frontend-astro/src/lib/api.ts:68-75`

- [ ] **Step 1: Update `updateProgress` payload shape and add `getHistoryForNovel`**

Change the existing `updateProgress` call to include the new fields:

```typescript
updateProgress: (data: {
  novelId: string;
  chapterNum: number;
  lastReadBlockIndex?: number | null;
  blockOffsetPercent?: number;
  scrollPosition: number;
  progressPercent: number;
}) => apiClient.post('/user/history/progress', data).then((r) => r.data),
```

Add below it:

```typescript
getHistoryForNovel: (novelId: string) =>
  apiClient.get(`/user/history/${novelId}`).then((r) => r.data),
```

- [ ] **Step 2: Commit**

```bash
git add manov-frontend-astro/src/lib/api.ts
git commit -m "feat(astro/api): add reading line fields and getHistoryForNovel client"
```

---

## Task 4: Frontend — Track and restore reading position in Reader

**Files:**
- Modify: `manov-frontend-astro/src/components/islands/Reader.tsx`

- [ ] **Step 1: Add block refs array**

Near the top of the component, add:

```typescript
const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
```

- [ ] **Step 2: Add helper to compute current block and offset**

Inside `Reader`, add:

```typescript
const getCurrentReadingPosition = useCallback(() => {
  if (blockRefs.current.length === 0) return null;
  const viewportTop = window.scrollY + 80; // small buffer below navbar

  for (let i = 0; i < blockRefs.current.length; i++) {
    const el = blockRefs.current[i];
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    const blockTop = rect.top + window.scrollY;
    const blockHeight = rect.height;
    if (blockHeight <= 0) continue;

    if (blockTop <= viewportTop && blockTop + blockHeight > viewportTop) {
      const offset = Math.min(
        100,
        Math.max(0, Math.round(((viewportTop - blockTop) / blockHeight) * 100))
      );
      return { blockIndex: i, blockOffsetPercent: offset };
    }
  }
  return null;
}, []);
```

- [ ] **Step 3: Update scroll progress save to include block data**

Find the scroll handler `useEffect` (around line 126). Replace the inner `api.updateProgress` call so it sends block data:

```typescript
const readingPos = getCurrentReadingPosition();
api
  .updateProgress({
    novelId,
    chapterNum,
    lastReadBlockIndex: readingPos?.blockIndex ?? null,
    blockOffsetPercent: readingPos?.blockOffsetPercent ?? 0,
    scrollPosition: window.scrollY,
    progressPercent: progress,
  })
  .catch(() => {});
```

- [ ] **Step 4: Update mount progress save to include block data**

Find the mount `useEffect` that calls `updateProgress`. Update it to:

```typescript
useEffect(() => {
  if (novelId) {
    const readingPos = getCurrentReadingPosition();
    api
      .updateProgress({
        novelId,
        chapterNum,
        lastReadBlockIndex: readingPos?.blockIndex ?? null,
        blockOffsetPercent: readingPos?.blockOffsetPercent ?? 0,
        scrollPosition: window.scrollY,
        progressPercent: 0,
      })
      .catch(() => {});
  }
}, [novelId, chapterNum, getCurrentReadingPosition]);
```

- [ ] **Step 5: Add restore-on-mount effect**

Add a new `useEffect` that runs once on mount to restore scroll position:

```typescript
useEffect(() => {
  if (!novelId) return;

  let cancelled = false;

  api
    .getHistoryForNovel(novelId)
    .then((history: any) => {
      if (cancelled) return;
      if (!history || history.chapterNum !== chapterNum) return;
      if (history.lastReadBlockIndex == null) return;

      const tryRestore = () => {
        const blockCount = blockRefs.current.length;
        if (blockCount === 0) return;
        const blockIndex = Math.min(
          blockCount - 1,
          Math.max(0, history.lastReadBlockIndex)
        );
        const el = blockRefs.current[blockIndex];
        if (!el) {
          // Content may not be measured yet; retry once
          requestAnimationFrame(tryRestore);
          return;
        }
        const rect = el.getBoundingClientRect();
        const blockHeight = rect.height;
        if (blockHeight <= 0) return;

        const offset = Math.min(100, Math.max(0, history.blockOffsetPercent));
        const offsetPx = (offset / 100) * blockHeight;
        const targetY =
          el.offsetTop + offsetPx - 80; // 80 = approximate navbar height
        window.scrollTo({ top: Math.max(0, targetY), behavior: 'auto' });
      };

      // Give React a tick to render/measure
      requestAnimationFrame(tryRestore);
    })
    .catch(() => {});

  return () => {
    cancelled = true;
  };
}, [novelId, chapterNum]);
```

- [ ] **Step 6: Wire refs into the rendered blocks**

Find the block render loop inside `parsedBlocks.map((block, index) => (`. Attach a ref callback to the outer `<div key={block.id} className="mb-6">`:

```tsx
<div
  key={block.id}
  ref={(el) => {
    blockRefs.current[index] = el;
  }}
  className="mb-6"
>
```

- [ ] **Step 7: Build and lint the Astro frontend**

```bash
cd manov-frontend-astro
npm run build
```

Expected: build completes with no TypeScript or runtime errors.

- [ ] **Step 8: Commit**

```bash
git add manov-frontend-astro/src/components/islands/Reader.tsx
git commit -m "feat(astro/reader): track and restore reading line via block index + offset"
```

---

## Task 5: End-to-end verification

- [ ] **Step 1: Run backend test suite**

```bash
cd manov-backend
uv run pytest tests/ -v
```

Expected: all tests pass.

- [ ] **Step 2: Build Astro frontend**

```bash
cd manov-frontend-astro
npm run build
```

Expected: clean build.

- [ ] **Step 3: Manual test checklist**

1. Log in, open a novel, click Read Now.
2. Scroll halfway through chapter 1.
3. Navigate away (e.g., back to novel detail).
4. Click Continue Reading.
5. Expected: reader opens chapter 1 and scrolls to approximately where you left off.
6. Change font size in reader settings.
7. Navigate away and return.
8. Expected: still resumes near the same text, not the old pixel position.

- [ ] **Step 4: Push**

```bash
git push origin main
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| Add `lastReadBlockIndex` to `History` | Task 1 |
| Add `blockOffsetPercent` to `History` | Task 1 |
| Alembic migration | Task 1 |
| Extend `ProgressUpdateRequest` | Task 2 |
| Update `POST /user/history/progress` | Task 2 |
| New `GET /user/history/{novelId}` | Task 2 |
| Frontend API client updates | Task 3 |
| Reader computes block + offset on scroll | Task 4 |
| Reader saves block data on mount | Task 4 |
| Reader restores scroll from saved block data | Task 4 |
| No novel detail page changes | (no tasks touch it) |

## Placeholder / Consistency Check

- No TBDs or TODOs in this plan.
- Field names are consistent: `lastReadBlockIndex`, `blockOffsetPercent` in DB, API, and frontend.
- `getHistoryForNovel` uses the same URL pattern as the new backend endpoint.
- Block refs are keyed by `index` from `parsedBlocks.map((block, index) => ...)`.
