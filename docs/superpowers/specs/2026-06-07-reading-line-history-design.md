# Reading Line History — Design Spec

## Goal
Allow logged-in users to resume reading a chapter from the exact line / block they left off, instead of only remembering the chapter number. The design must survive font-size and line-spacing changes in the reader settings.

## Decision: Approach B — Block Index + Intra-Block Offset

We store:
- `lastReadBlockIndex` — the index of the parsed content block the user is currently reading.
- `blockOffsetPercent` — 0–100, how far down that block the viewport is.

This is robust across rendering changes because we resolve position through content structure, not pixels.

## Backend

### Schema changes

Update the `History` model to add two columns:

```python
lastReadBlockIndex: int | None = Field(default=None)
blockOffsetPercent: int = Field(default=0)
```

### API changes

1. **Extend `ProgressUpdateRequest`**
   ```python
   class ProgressUpdateRequest(BaseModel):
       novelId: int
       chapterNum: int
       lastReadBlockIndex: int | None = None
       blockOffsetPercent: int = 0
       scrollPosition: float | None = None
       progressPercent: int = 0
   ```

2. **New endpoint** — `GET /user/history/{novelId}`
   - Returns the single `History` row for the authenticated user and novel.
   - Response shape includes `chapterNum`, `lastReadBlockIndex`, `blockOffsetPercent`, `progressPercent`.
   - Returns 404 if no history exists (reader starts at top as usual).

3. **Update `POST /user/history/progress`**
   - Persist `lastReadBlockIndex` and `blockOffsetPercent` on create/update.

4. **Alembic migration**
   - Add nullable `last_read_block_index` and `block_offset_percent` columns to `history` table.

## Frontend

### Reader.tsx

1. **Collect block refs**
   - Render each parsed block with a ref callback that stores the DOM element in an array.

2. **Compute current reading position**
   - On scroll (debounced), determine the block whose top is at or just above the viewport top.
   - Compute `blockOffsetPercent = clamp(0, 100, (viewportTop - blockTop) / blockHeight * 100)`.

3. **Save position**
   - Include `lastReadBlockIndex` and `blockOffsetPercent` in the existing `api.updateProgress` call.

4. **Restore position on mount**
   - After hydration, call `api.getHistoryForNovel(novelId)`.
   - If `chapterNum` matches the current chapter and `lastReadBlockIndex` is not null:
     - Find the block element at that index.
     - Scroll so the saved offset is just below the navbar (roughly `blockTop + blockHeight * offset / 100 - navbarHeight`).
     - Clamp out-of-range indices and offsets.
     - If the block is not yet measured, retry once after a short delay.

### Novel detail page

No changes. The existing "Continue Reading" button behavior remains — it links to the last-read chapter number.

## Edge Cases

| Scenario | Handling |
|---|---|
| Content changed, saved block index >= block count | Clamp to the last block, offset 0. |
| Block exists but height is 0 or unmeasured | Retry once after a requestAnimationFrame. |
| No history for this novel | Start at top of chapter. |
| History exists for a different chapter | Start at top of current chapter (do not auto-scroll cross-chapter). |
| User rapidly changes settings | Next scroll save will overwrite with correct block/offset. |

## Out of Scope

- Cross-device pixel-perfect sync (block index is sufficient).
- Visual "you are here" indicator in the reader UI (can be added later).
- Changing the novel detail page CTA text beyond the existing "Continue Reading" behavior.

## Files to Modify

- `manov-backend/app/models.py`
- `manov-backend/app/routers/user.py`
- `manov-backend/app/schemas.py` (if ProgressUpdateRequest is shared here)
- `manov-backend/app/crud.py` (if helper needed for single history lookup)
- `manov-backend/alembic/versions/...` (new migration)
- `manov-frontend-astro/src/lib/api.ts`
- `manov-frontend-astro/src/components/islands/Reader.tsx`
