# Manov Frontend Astro Migration — Design Spec

**Date:** 2026-06-07
**Scope:** Migrate the entire `manov-frontend/` (React + Vite) to a new `manov-frontend-astro/` folder using Astro with hybrid SSR/SSG and React islands.
**Motivation:** SEO, performance, reduced loading times, better user experience.

---

## 1. Goals

- **SEO-first architecture:** Public pages render fully-formed HTML on the server for crawlers.
- **Performance:** Ship minimal JavaScript to the browser. Only interactive regions hydrate as React islands.
- **Preserve UX:** Reader, comments, reviews, admin CRUD, and auth behavior remain identical to the current app.
- **Zero backend changes:** The FastAPI backend contract stays the same. Auth continues using localStorage JWT.
- **TypeScript:** The new frontend uses TypeScript throughout.

---

## 2. Architecture

**Pattern:** Astro Hybrid Output (`output: 'hybrid'`) + React Islands.

- **Astro** handles routing, layouts, SEO `<head>`, and server-side data fetching for public pages.
- **React islands** (`client:load`, `client:idle`, `client:only="react"`) handle highly interactive UI.
- **Tailwind CSS v4** (CSS-first configuration) preserves the existing warm ink & paper design system.

---

## 3. Project Structure

```
manov-frontend-astro/
├── public/                       # Static assets (favicons, OG image, manifest, robots.txt)
├── src/
│   ├── layouts/
│   │   └── Layout.astro          # Root layout: <html>, fonts, FOUC prevention, navbar/footer slots
│   ├── pages/                    # File-based routing (replaces React Router)
│   │   ├── index.astro           # Home — SSR
│   │   ├── about.astro           # About — SSG
│   │   ├── login.astro           # Login — SSG
│   │   ├── register.astro        # Register — SSG
│   │   ├── forgot-password.astro # Forgot Password — SSG
│   │   ├── reset-password.astro  # Reset Password — SSG
│   │   ├── library.astro         # Library — SSR shell + React island
│   │   ├── novel/
│   │   │   ├── [slug].astro              # Novel Detail — SSR
│   │   │   └── [slug]/
│   │   │       └── read/
│   │   │           └── [chapterNum].astro # Reader — SSR shell + React island
│   │   └── admin/
│   │       ├── index.astro               # Admin Dashboard — SSG shell + island
│   │       ├── genres.astro              # Manage Genres — SSG shell + island
│   │       ├── add-novel.astro           # Add Novel — SSG shell + island
│   │       ├── add-chapter/
│   │       │   └── [slug].astro          # Add Chapter — SSG shell + island
│   │       ├── edit-novel/
│   │       │   └── [slug].astro          # Edit Novel — SSG shell + island
│   │       └── edit/
│   │           └── [slug]/
│   │               └── [chapterNum].astro # Edit Chapter — SSG shell + island
│   ├── components/
│   │   ├── astro/                # Pure Astro components (zero JS shipped)
│   │   │   ├── SEO.astro
│   │   │   ├── Navbar.astro
│   │   │   ├── Footer.astro
│   │   │   ├── HeroSection.astro
│   │   │   ├── NovelCard.astro
│   │   │   ├── ChapterList.astro
│   │   │   └── SkeletonCard.astro
│   │   └── islands/              # React islands (interactive)
│   │       ├── NavbarAuth.tsx    # Auth-dependent navbar section
│   │       ├── SearchBar.tsx
│   │       ├── NotificationBell.tsx
│   │       ├── DarkModeToggle.tsx
│   │       ├── Reader.tsx
│   │       ├── CommentSection.tsx
│   │       ├── ReviewSection.tsx
│   │       ├── AuthForms.tsx     # Login, Register, Forgot, Reset forms
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminNovelForm.tsx
│   │       ├── AdminChapterForm.tsx
│   │       ├── AdminGenreManager.tsx
│   │       └── StarRating.tsx
│   ├── lib/
│   │   ├── api.ts                # Axios instance (Node + browser compatible)
│   │   ├── auth.ts               # Token helpers (localStorage read/write)
│   │   └── types.ts              # Shared TypeScript interfaces
│   └── styles/
│       └── global.css            # Tailwind v4 CSS-first config + custom utilities
├── astro.config.mjs
├── tsconfig.json
├── package.json
└── .env.example
```

---

## 4. Routing & Rendering Strategy

| Route | File | Mode | Reason |
|---|---|---|---|
| `/` | `index.astro` | **SSR** (`prerender = false`) | Trending/latest novels change frequently |
| `/about` | `about.astro` | **SSG** | Static content |
| `/login` | `login.astro` | **SSG** | Static form |
| `/register` | `register.astro` | **SSG** | Static form |
| `/forgot-password` | `forgot-password.astro` | **SSG** | Static form |
| `/reset-password` | `reset-password.astro` | **SSG** | Static form |
| `/library` | `library.astro` | **SSR shell + island** | Needs auth; island fetches library client-side |
| `/novel/[slug]` | `[slug].astro` | **SSR** | Dynamic novel data, many slugs, frequently updated |
| `/novel/[slug]/read/[chapterNum]` | `[chapterNum].astro` | **SSR shell + island** | Chapter text SSR'd; progress tracking is client-side |
| `/admin` | `admin/index.astro` | **SSG shell + island** | Internal tool; island handles all CRUD |
| `/admin/genres` | `admin/genres.astro` | **SSG shell + island** | Internal tool |
| `/admin/add-novel` | `admin/add-novel.astro` | **SSG shell + island** | Internal tool |
| `/admin/add-chapter/[slug]` | `admin/add-chapter/[slug].astro` | **SSG shell + island** | Internal tool |
| `/admin/edit-novel/[slug]` | `admin/edit-novel/[slug].astro` | **SSG shell + island** | Internal tool |
| `/admin/edit/[slug]/[chapterNum]` | `admin/edit/[slug]/[chapterNum].astro` | **SSG shell + island** | Internal tool |

---

## 5. Component Architecture

### Astro Components (`.astro`)
Used for pure markup with no client-side interactivity. Astro ships **zero JavaScript** for these.

- `Layout.astro` — Root HTML shell, font links, FOUC prevention script
- `SEO.astro` — `<title>`, `<meta>`, Open Graph, Twitter cards, canonical, JSON-LD
- `Navbar.astro` — Static nav links + slots for `client:load` auth island
- `Footer.astro` — Static footer
- `HeroSection.astro` — Featured novel banner
- `NovelCard.astro` — Cover card with gradient overlay
- `ChapterList.astro` — Grid of chapter links
- `SkeletonCard.astro` — Loading placeholder

### React Islands (`client:*`)
Used where interactivity, state, or DOM events are required.

| Island | Directive | Notes |
|---|---|---|
| `NavbarAuth.tsx` | `client:load` | Reads localStorage token immediately to show avatar or login button |
| `DarkModeToggle.tsx` | `client:load` | Must be available immediately for user toggle |
| `NotificationBell.tsx` | `client:load` | Polls every 60s; needs auth state early |
| `SearchBar.tsx` | `client:idle` | Interactive filters; not critical for first paint |
| `StarRating.tsx` | `client:idle` | Interactive or read-only rating |
| `CommentSection.tsx` | `client:idle` | Nested comments, CRUD, replies |
| `ReviewSection.tsx` | `client:idle` | Reviews with create/edit/delete |
| `AuthForms.tsx` | `client:idle` | Form validation + API submission |
| `Reader.tsx` | `client:only="react"` | Heavy local state: font size, theme, progress, keyboard nav, TOC |
| `AdminDashboard.tsx` | `client:only="react"` | Complex tables, modals, pagination |
| `AdminNovelForm.tsx` | `client:only="react"` | Multi-field forms with live preview |
| `AdminChapterForm.tsx` | `client:only="react"` | Rich text / translation editing |
| `AdminGenreManager.tsx` | `client:only="react"` | Drag/drop or inline CRUD |

---

## 6. Data Flow

### Server-Side (Astro Pages)
Astro pages fetch data in frontmatter using the shared API client:

```astro
---
// src/pages/novel/[slug].astro
import { api } from '../../lib/api';
const { slug } = Astro.params;
if (!slug) return Astro.redirect('/404');
const novel = await api.getNovel(slug);
if (!novel) return Astro.redirect('/404');
---
<Layout>
  <SEO title={novel.title} description={novel.synopsis} jsonLd={buildBookJsonLd(novel)} />
  <HeroSection novel={novel} />
  <ChapterList chapters={novel.chapters} />
  <ReviewSection client:idle novelId={novel.id} initialReviews={novel.reviews} />
  <CommentSection client:idle novelId={novel.id} />
</Layout>
```

### Client-Side (React Islands)
Islands use the **same API client** but attach the Bearer token from `localStorage`:

```ts
// src/lib/api.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.PUBLIC_API_URL,
});

// Browser-only interceptor
if (typeof window !== 'undefined') {
  apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}

export const api = {
  getNovel: (slug: string) => apiClient.get(`/novels/${slug}`).then(r => r.data),
  // ... other methods
};
```

### Error Handling
- **Server fetch failures:** Astro returns 404 or 500 pages directly.
- **Client fetch failures:** Islands use the existing toast + redirect pattern (401 → logout + redirect to `/login`).

---

## 7. Auth Strategy

**Constraint:** No backend changes. The FastAPI auth contract (JWT in `Authorization: Bearer` header) stays the same.

**Approach:**
1. **Token storage:** Continue storing JWT in `localStorage` (key: `token`).
2. **Auth context:** A lightweight React Context inside islands (not global) that reads `localStorage` on mount.
3. **SSR pages:** Public pages (Home, Novel Detail, About) do not need auth and SSR perfectly without it.
4. **Auth-gated pages:** Library and Admin render an Astro shell, then the React island checks for the token client-side. If missing, the island redirects to `/login`.
5. **Navbar:** `Navbar.astro` renders static links. A `NavbarAuth.tsx` island (`client:load`) slots in the avatar/login button.

**Trade-off:** Library/Admin pages show a brief "checking auth" state inside the island. This is acceptable because the current React app already shows a loading spinner during auth initialization.

---

## 8. SEO Strategy

`react-helmet-async` is removed entirely. Astro controls `<head>` natively.

### `SEO.astro` Component

```astro
---
interface Props {
  title: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
  jsonLd?: Record<string, any>;
}
const { title, description, ogImage, canonical, jsonLd } = Astro.props;
const siteName = 'Manov';
---
<title>{title} | {siteName}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical || Astro.url.href} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={ogImage || '/og-image.png'} />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
{jsonLd && (
  <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
)}
```

### JSON-LD Schemas
- **Home:** `WebSite` + `ItemList` (trending novels)
- **Novel Detail:** `Book` schema
- **Reader:** `Article` schema (chapter)
- **All pages:** `BreadcrumbList`

---

## 9. Styles & Theming

### Tailwind v4 (CSS-First)
```css
/* src/styles/global.css */
@import 'tailwindcss';

@theme {
  --font-serif: 'Merriweather', serif;
  --font-sans: 'Inter', sans-serif;
  --color-ink: #1c1917;
  --color-paper: #faf8f5;
  --color-accent: #b45309;
  --color-accent-light: #d97706;
}

@custom-variant dark (&:where(.dark, .dark *));

body {
  @apply bg-paper text-ink transition-colors;
}

.dark body {
  @apply bg-ink text-paper;
}
```

### Dark Mode (FOUC Prevention)
An inline script in `Layout.astro` `<head>` runs before render:
```html
<script is:inline>
  (function() {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') document.documentElement.classList.add('dark');
  })();
</script>
```

The toggle button is a React island that updates `localStorage` and `document.documentElement.classList`.

---

## 10. Build & Deployment

### `astro.config.mjs`
```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';

export default defineConfig({
  output: 'hybrid',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  vite: {
    plugins: [], // Tailwind v4 is handled via CSS import, no Vite plugin needed
  },
});
```

**Adapter note:** `@astrojs/node` (standalone mode) is chosen for Docker/containerized deployments. If deploying to Vercel/Netlify later, swap to `@astrojs/vercel` or `@astrojs/netlify`.

### Environment Variables
- `PUBLIC_API_URL` — Backend API base URL (exposed to browser)
- `PUBLIC_FRONTEND_URL` — Canonical frontend URL (for SEO canonical tags)

---

## 11. Migration Phases

The implementation will proceed in the following order:

1. **Scaffold & Config** — Initialize Astro project, install React/Tailwind integrations, set up TS config, port global styles.
2. **Shared Infrastructure** — Build `Layout.astro`, `SEO.astro`, API client (`lib/api.ts`), types (`lib/types.ts`), and auth helpers.
3. **Static Pages** — Migrate About, Login, Register, Forgot/Reset Password (SSG pages with minimal islands).
4. **Core Public Pages** — Migrate Home (SSR) and Novel Detail (SSR). These are the highest SEO impact.
5. **Reader** — Build Astro shell + `Reader.tsx` island with full feature parity (progress, themes, keyboard nav).
6. **Social Features** — CommentSection and ReviewSection islands inside Novel Detail.
7. **Library** — Library page shell + client-side island.
8. **Admin Suite** — All admin pages as Astro shells + React islands (Dashboard, Genres, Add/Edit Novel, Add/Edit Chapter).
9. **Polish** — 404 page, error boundaries, loading states, PWA manifest verification, final SEO audit.
10. **Verification** — Build succeeds, all routes render, no console errors, Lighthouse audit.

---

## 12. Key Decisions & Trade-offs

| Decision | Rationale |
|---|---|
| **Hybrid output (not full SSR)** | About and auth forms are truly static; SSR'ing them wastes compute. Hybrid lets us pick per-page. |
| **React islands for admin** | Admin is internal with no SEO value, but keeping it in the same codebase avoids maintaining two frontends. |
| **localStorage auth (no cookies)** | Avoids backend changes. The brief auth-loading flash on Library/Admin is acceptable. |
| **Axios over fetch** | Existing backend contract is built around axios patterns. Consistent API client in Node + browser. |
| **Tailwind v4 CSS-first** | Matches current frontend config exactly. No `tailwind.config.js` needed. |
| **No Zustand/Redux added** | Current app uses React Context. Migration preserves existing state patterns to limit scope creep. |
