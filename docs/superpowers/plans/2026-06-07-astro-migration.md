# Manov Astro Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the entire `manov-frontend/` (React + Vite) to a new `manov-frontend-astro/` folder using Astro hybrid SSR/SSG + React islands, preserving exact UI/UX.

**Architecture:** Astro handles routing, layouts, SEO `<head>`, and server-side data fetching. React islands (`client:load` / `client:idle` / `client:only="react"`) handle interactivity. Tailwind v4 CSS-first theming preserved. Auth stays localStorage JWT with no backend changes.

**Tech Stack:** Astro 5, React 19, TypeScript, Tailwind CSS v4, Axios, Framer Motion, react-hot-toast, lucide-react, date-fns, react-markdown

---

## File Structure

```
manov-frontend-astro/
├── public/                          # Copied from manov-frontend/public/
├── src/
│   ├── layouts/
│   │   └── Layout.astro             # Root layout: fonts, FOUC prevention, Navbar, Footer, GlobalUI island
│   ├── pages/
│   │   ├── index.astro              # Home — SSR
│   │   ├── about.astro              # About — SSG
│   │   ├── login.astro              # Login — SSG shell + AuthForms island
│   │   ├── register.astro           # Register — SSG shell + AuthForms island
│   │   ├── forgot-password.astro    # Forgot Password — SSG shell + AuthForms island
│   │   ├── reset-password.astro     # Reset Password — SSG shell + AuthForms island
│   │   ├── library.astro            # Library — SSR shell + Library island
│   │   ├── novel/
│   │   │   ├── [slug].astro         # Novel Detail — SSR shell + islands
│   │   │   └── [slug]/
│   │   │       └── read/
│   │   │           └── [chapterNum].astro  # Reader — SSR shell + Reader island
│   │   └── admin/
│   │       ├── index.astro          # Admin Dashboard — SSG shell + AdminDashboard island
│   │       ├── genres.astro         # Manage Genres — SSG shell + AdminGenreManager island
│   │       ├── add-novel.astro      # Add Novel — SSG shell + AdminNovelForm island
│   │       ├── add-chapter/
│   │       │   └── [slug].astro     # Add Chapter — SSG shell + AdminChapterForm island
│   │       ├── edit-novel/
│   │       │   └── [slug].astro     # Edit Novel — SSG shell + AdminNovelForm island
│   │       └── edit/
│   │           └── [slug]/
│   │               └── [chapterNum].astro  # Edit Chapter — SSG shell + AdminChapterForm island
│   ├── components/
│   │   ├── astro/
│   │   │   ├── SEO.astro
│   │   │   ├── Navbar.astro
│   │   │   ├── Footer.astro
│   │   │   ├── HeroSection.astro
│   │   │   ├── NovelCard.astro
│   │   │   ├── ChapterList.astro
│   │   │   └── SkeletonCard.astro
│   │   └── islands/
│   │       ├── GlobalUI.tsx         # Toaster + notification polling setup
│   │       ├── NavbarAuth.tsx
│   │       ├── DarkModeToggle.tsx
│   │       ├── SearchBar.tsx
│   │       ├── NotificationBell.tsx
│   │       ├── Reader.tsx
│   │       ├── CommentSection.tsx
│   │       ├── ReviewSection.tsx
│   │       ├── StarRating.tsx
│   │       ├── AuthForms.tsx
│   │       ├── LibraryIsland.tsx
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminGenreManager.tsx
│   │       ├── AdminNovelForm.tsx
│   │       └── AdminChapterForm.tsx
│   ├── lib/
│   │   ├── api.ts                   # Axios instance (Node + browser)
│   │   ├── auth.ts                  # Token helpers + useAuth hook
│   │   ├── types.ts                 # Shared TypeScript interfaces
│   │   └── smartParser.ts           # Chapter text parser
│   └── styles/
│       └── global.css               # Tailwind v4 CSS-first config
├── astro.config.mjs
├── tsconfig.json
├── package.json
└── .env.example
```

---

## Universal Porting Rules (apply to all React islands)

1. **Remove React Router:**
   - `import { Link } from 'react-router-dom'` → use `<a href="...">`
   - `import { useNavigate } from 'react-router-dom'` → use `window.location.href = ...`
   - `import { useParams } from 'react-router-dom'` → receive params as props from Astro page
   - `import { useLocation } from 'react-router-dom'` → use `window.location`
   - `import { useSearchParams } from 'react-router-dom'` → use `new URLSearchParams(window.location.search)`

2. **Auth:**
   - `import { useAuth } from '../context/AuthContext'` → use `import { useAuth } from '../../lib/auth'`
   - The new `useAuth` hook reads `localStorage` and listens to `auth-change` events

3. **Environment variables:**
   - `import.meta.env.VITE_API_URL` → `import.meta.env.PUBLIC_API_URL`
   - `import.meta.env.VITE_FRONTEND_URL` → `import.meta.env.PUBLIC_FRONTEND_URL`

4. **SEO:**
   - Remove `SEO` and `Helmet` imports from React islands
   - Astro pages handle all `<head>` content via `SEO.astro`

5. **Toast:**
   - Keep `react-hot-toast` imports and `toast()` calls in islands
   - Add `<Toaster />` to `GlobalUI.tsx` island only
   - `react-hot-toast` global store works across island roots

---

## Tasks

### Phase 1: Scaffold & Config

- [ ] **Task 1.1:** Create `manov-frontend-astro/package.json` with all dependencies (astro, @astrojs/react, @astrojs/node, react, react-dom, typescript, tailwindcss, axios, framer-motion, react-hot-toast, lucide-react, date-fns, react-markdown, clsx)
- [ ] **Task 1.2:** Create `manov-frontend-astro/astro.config.mjs` with `output: 'hybrid'`, React integration, Node adapter
- [ ] **Task 1.3:** Create `manov-frontend-astro/tsconfig.json` with strict TypeScript + React JSX
- [ ] **Task 1.4:** Create `manov-frontend-astro/.env.example` with `PUBLIC_API_URL` and `PUBLIC_FRONTEND_URL`
- [ ] **Task 1.5:** Copy `manov-frontend/public/` assets to `manov-frontend-astro/public/`
- [ ] **Task 1.6:** Create `manov-frontend-astro/src/styles/global.css` — port Tailwind v4 CSS-first config from `manov-frontend/src/index.css`
- [ ] **Task 1.7:** Run `npm install` in `manov-frontend-astro/`

### Phase 2: Shared Infrastructure

- [ ] **Task 2.1:** Create `src/lib/types.ts` — define shared interfaces (Novel, Chapter, User, Genre, Review, Comment, Notification, etc.)
- [ ] **Task 2.2:** Create `src/lib/api.ts` — Axios instance with browser auth interceptor. Export service methods matching existing backend contract.
- [ ] **Task 2.3:** Create `src/lib/auth.ts` — `getToken`, `getUser`, `setAuth`, `clearAuth` helpers + `useAuth()` React hook using localStorage + `auth-change` events
- [ ] **Task 2.4:** Create `src/layouts/Layout.astro` — root HTML shell, Google Fonts, FOUC prevention inline script, Navbar + Footer + GlobalUI island slots
- [ ] **Task 2.5:** Create `src/components/astro/SEO.astro` — props: title, description, ogImage, canonical, jsonLd. Renders all meta tags + JSON-LD scripts

### Phase 3: Astro UI Components (zero JS)

- [ ] **Task 3.1:** Create `src/components/astro/Navbar.astro` — static nav links, slots for `NavbarAuth` island and `DarkModeToggle` island. Hides on reader pages.
- [ ] **Task 3.2:** Create `src/components/astro/Footer.astro` — simple static footer
- [ ] **Task 3.3:** Create `src/components/astro/NovelCard.astro` — port from `manov-frontend/src/components/NovelCard.jsx`. Replace `Link` with `<a>`.
- [ ] **Task 3.4:** Create `src/components/astro/HeroSection.astro` — port from `manov-frontend/src/components/HeroSection.jsx`. Replace `useNavigate` with `<a href>`. Use CSS animations instead of framer-motion.
- [ ] **Task 3.5:** Create `src/components/astro/SkeletonCard.astro` — port from `manov-frontend/src/components/SkeletonCard.jsx`
- [ ] **Task 3.6:** Create `src/components/astro/ChapterList.astro` — static chapter grid. Receives `chapters`, `slug` props. No framer-motion.

### Phase 4: React Islands — Core UI

- [ ] **Task 4.1:** Create `src/components/islands/GlobalUI.tsx` (`client:load`) — renders `<Toaster />` from react-hot-toast. This is the single toast container for the whole app.
- [ ] **Task 4.2:** Create `src/components/islands/NavbarAuth.tsx` (`client:load`) — port auth-dependent navbar section from `Navbar.jsx`. Uses `useAuth()` hook. Shows avatar/login/admin links.
- [ ] **Task 4.3:** Create `src/components/islands/DarkModeToggle.tsx` (`client:load`) — toggle button. Reads/writes `localStorage.theme`, toggles `document.documentElement.classList`.
- [ ] **Task 4.4:** Create `src/components/islands/SearchBar.tsx` (`client:idle`) — port from `manov-frontend/src/components/SearchBar.jsx`. No router changes needed (just callbacks).
- [ ] **Task 4.5:** Create `src/components/islands/StarRating.tsx` (`client:idle`) — port from `manov-frontend/src/components/StarRating.jsx`
- [ ] **Task 4.6:** Create `src/components/islands/NotificationBell.tsx` (`client:load`) — port from `manov-frontend/src/components/NotificationBell.jsx`. Replace `useNavigate` with `window.location.href`. Replace `useAuth` with local hook.

### Phase 5: Static Pages

- [ ] **Task 5.1:** Create `src/pages/about.astro` — SSG. Port content from `manov-frontend/src/pages/About.jsx`. Use CSS animations instead of framer-motion `motion.div`.
- [ ] **Task 5.2:** Create `src/pages/login.astro` — SSG shell with `AuthForms` island (`client:idle`).
- [ ] **Task 5.3:** Create `src/pages/register.astro` — SSG shell with `AuthForms` island.
- [ ] **Task 5.4:** Create `src/pages/forgot-password.astro` — SSG shell with `AuthForms` island.
- [ ] **Task 5.5:** Create `src/pages/reset-password.astro` — SSG shell with `AuthForms` island.
- [ ] **Task 5.6:** Create `src/components/islands/AuthForms.tsx` — handles all 4 auth forms (login, register, forgot, reset). Uses query param or prop to determine mode. Port logic from existing auth pages.

### Phase 6: Home Page (SSR)

- [ ] **Task 6.1:** Create `src/pages/index.astro` — SSR (`export const prerender = false`).
  - Frontmatter: fetch trending novels + genres + latest novels via `api.ts`
  - Render `SEO.astro` with WebSite + ItemList JSON-LD
  - Render `HeroSection`, `SearchBar` island, trending section, latest novels grid (`NovelCard`), "Load More" button
  - "Continue Reading" section: render conditionally via `NavbarAuth` or client-side script
- [ ] **Task 6.2:** Add "Load More" pagination logic to Home page (can be inline script or small island)

### Phase 7: Novel Detail Page (SSR)

- [ ] **Task 7.1:** Create `src/pages/novel/[slug].astro` — SSR (`export const prerender = false`).
  - Frontmatter: fetch novel data by slug. Track view (fire-and-forget). Return 404 if not found.
  - Render `SEO.astro` with Book + BreadcrumbList JSON-LD
  - Render hero section (static Astro with CSS animations), synopsis (with `react-markdown` island or Astro-native markdown rendering), chapter list
  - Include `ReviewSection` island (`client:idle`) and `CommentSection` island (`client:idle`)
- [ ] **Task 7.2:** Create novel detail interactive wrapper island if needed (bookmark, rating, share buttons). These can be small inline islands within the Astro page.

### Phase 8: Reader Page

- [ ] **Task 8.1:** Create `src/pages/novel/[slug]/read/[chapterNum].astro` — SSR shell.
  - Frontmatter: fetch chapter + novel data
  - Render `SEO.astro` with Article + BreadcrumbList JSON-LD
  - Pass `slug`, `chapterNum`, `chapterData`, `novelChapters` as props to `Reader` island
- [ ] **Task 8.2:** Create `src/components/islands/Reader.tsx` (`client:only="react"`) — port from `manov-frontend/src/pages/Reader.jsx`.
  - Receive `slug`, `chapterNum`, `initialChapter`, `novelChapters` as props
  - Keep all reader settings, progress tracking, keyboard nav, TOC, settings panel
  - Replace `useParams` with props, `useNavigate` with `window.location.href`
  - Keep `smartParser` utility import
  - Include `CommentSection` island for chapter comments

### Phase 9: Social Features

- [ ] **Task 9.1:** Create `src/components/islands/CommentSection.tsx` (`client:idle`) — port from `manov-frontend/src/components/CommentSection.jsx`. Replace `useAuth` with local hook.
- [ ] **Task 9.2:** Create `src/components/islands/ReviewSection.tsx` (`client:idle`) — port from `manov-frontend/src/components/ReviewSection.jsx`. Replace `useAuth` with local hook.

### Phase 10: Library Page

- [ ] **Task 10.1:** Create `src/pages/library.astro` — SSR shell.
  - Render `SEO.astro` with `noindex`
  - Include `LibraryIsland` (`client:idle`) for auth-gated content
- [ ] **Task 10.2:** Create `src/components/islands/LibraryIsland.tsx` — port from `manov-frontend/src/pages/Library.jsx`. Uses `useAuth()`. Shows login prompt or library grid.

### Phase 11: Admin Suite

- [ ] **Task 11.1:** Create `src/components/islands/AdminDashboard.tsx` (`client:only="react"`) — port from `manov-frontend/src/pages/admin/Dashboard.jsx`. Replace `useNavigate`.
- [ ] **Task 11.2:** Create `src/components/islands/AdminGenreManager.tsx` (`client:only="react"`) — port from `manov-frontend/src/pages/admin/ManageGenres.jsx`.
- [ ] **Task 11.3:** Create `src/components/islands/AdminNovelForm.tsx` (`client:only="react"`) — port from `manov-frontend/src/pages/admin/AddNovel.jsx` AND `EditNovelMetadata.jsx`. Accept `mode: 'create' | 'edit'` and `initialData` props.
- [ ] **Task 11.4:** Create `src/components/islands/AdminChapterForm.tsx` (`client:only="react"`) — port from `manov-frontend/src/pages/admin/AddChapter.jsx` AND `EditChapter.jsx`. Accept `mode: 'create' | 'edit'` and `initialData` props.
- [ ] **Task 11.5:** Create all admin Astro pages (`admin/index.astro`, `admin/genres.astro`, `admin/add-novel.astro`, `admin/add-chapter/[slug].astro`, `admin/edit-novel/[slug].astro`, `admin/edit/[slug]/[chapterNum].astro`) — SSG shells that pass params as props to the appropriate admin islands.

### Phase 12: Polish & Verification

- [ ] **Task 12.1:** Create `src/pages/404.astro` — port from `manov-frontend/src/pages/NotFound.jsx`
- [ ] **Task 12.2:** Port `smartParser.js` to `src/lib/smartParser.ts`
- [ ] **Task 12.3:** Add admin route protection — check `user.role === 'ADMIN'` client-side in admin islands, redirect to `/` if not admin
- [ ] **Task 12.4:** Verify all `window`/`document` accesses are inside islands (not Astro components)
- [ ] **Task 12.5:** Run `astro check` — fix any TypeScript errors
- [ ] **Task 12.6:** Run `astro build` — fix any build errors
- [ ] **Task 12.7:** Verify all routes render correctly. Check SEO meta tags on key pages.
