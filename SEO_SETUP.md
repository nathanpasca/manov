# SEO & Google Search Console Setup Guide

This guide documents all SEO improvements made to **Manov** and provides step-by-step instructions for completing the Google Search Console (GSC) and Google Analytics 4 (GA4) setup.

---

## Changes Made

### 1. `index.html` — Enhanced Fallback Meta Tags
- Added default **Open Graph** tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`, `og:locale`, `og:image:width`, `og:image:height`)
- Added default **Twitter Card** tags (`twitter:card`, `twitter:site`, `twitter:title`, `twitter:description`, `twitter:image`)
- Added `referrer` policy meta tag (`strict-origin-when-cross-origin`)
- Added `keywords` meta tag for better discoverability
- Added `author` meta tag
- Added `robots` meta tag
- Added canonical link fallback
- Added **GSC verification meta tag** placeholder
- Added **GA4 tracking script** placeholder
- Updated `<title>` to be more descriptive: *"Manov — Read Translated Web Novels"*

### 2. `site.webmanifest` — PWA Manifest
- Filled `name`: *"Manov - Read Translated Web Novels"*
- Filled `short_name`: *"Manov"*
- Added `description`, `start_url`, `scope`, `orientation`, `lang`

### 3. `src/components/SEO.jsx` — Dynamic Meta Tag Component
- **Fixed `og:image`**: Now always generates an **absolute URL** (critical for social crawlers)
- **Fixed `og:url` and `canonical`**: Now always absolute URLs
- Added `twitter:site` handle (`@manovnovels`)
- Added `og:locale` (`en_US`)
- Added `og:image:width` and `og:image:height` (1200×630)
- Added `book:author` and `book:tag` OG tags for `type="book"`
- Added `article:published_time` and `article:modified_time` support
- Added `noindex` prop support (used on `/library` page)

### 4. `src/pages/NovelDetail.jsx` — Rich Book Schema
- Updated SEO component call to pass `author`, `tags`, `publishedAt`, and `modifiedAt`
- Already had `Book` schema + `BreadcrumbList` JSON-LD ← no changes needed

### 5. `src/pages/Reader.jsx` — Chapter-Level SEO
- Improved SEO title and description
- Added **Article schema** JSON-LD for each chapter page
- Added **BreadcrumbList** schema for chapter pages
- Uses cover image for `og:image`

### 6. `src/pages/About.jsx` ← Added SEO component
### 7. `src/pages/Library.jsx` ← Added SEO component with `noindex` (private page)

### 8. `public/robots.txt` — Crawler Instructions
- `Disallow` added for: `/admin/`, `/library/`, `/login`, `/register`, `/forgot-password`, `/reset-password`
- Sitemap URL preserved

### 9. `manov-backend/app/routers/sitemap.py` — Dynamic Sitemap
- Added eager loading of `chapters` via `selectinload(Novel.chapters)`
- Added **chapter URLs** to sitemap (limited to 500 per novel)
- Added **image sitemap annotations** (`<image:image>`) for novel cover images
- Added `/about` page
- Added XML comment with total URL count for debugging

### 10. `public/google-site-verification.html` — Verification File Placeholder
- Created as an alternative verification method reference

---

## Known Limitation: SPA Social Sharing

**Manov is a Client-Side Rendered (CSR) React SPA.**

Social media crawlers (Facebook, Twitter/X, LinkedIn, WhatsApp, Telegram, Discord) **do NOT execute JavaScript** or execute it very poorly. This means:

- Dynamic `og:title`, `og:description`, and `og:image` injected by `react-helmet-async` will **NOT be seen** by these crawlers
- When sharing a link like `https://manov.pascarz.site/novel/some-novel`, the preview will show the **fallback tags from `index.html`** instead of the novel-specific data

### Solutions (choose one)

| Solution | Effort | Impact |
|----------|--------|--------|
| **Prerendering** (e.g., `vite-plugin-prerender-static`) | Medium | Good for static routes |
| **SSR with Vite** (e.g., Vike) | High | Best for dynamic OG tags |
| **Cloudflare Workers / Edge SSR** | High | Best performance + SEO |
| **Service-side rendering of OG tags** (FastAPI serves meta tags) | High | Most robust |

For now, the fallback `index.html` tags provide a decent default. If you want perfect social previews for every novel, consider implementing **prerendering** or migrating key pages to SSR.

---

## Google Search Console Setup (Step-by-Step)

### Step 1: Choose Property Type

Go to [https://search.google.com/search-console](https://search.google.com/search-console)

- **Recommended**: Choose **Domain** property (covers all subdomains, HTTP/HTTPS)
- Alternative: Choose **URL prefix** property (e.g., `https://manov.pascarz.site/`)

### Step 2: Verify Ownership

#### Option A: DNS TXT Record (Recommended for Domain Property)
1. Copy the `google-site-verification=...` TXT record from GSC
2. Go to your DNS provider (Cloudflare, Namecheap, GoDaddy, etc.)
3. Add a new **TXT record**:
   - **Name/Host**: `@` (or leave blank for root)
   - **Value**: Paste the GSC verification string
   - **TTL**: Auto
4. Return to GSC ← click **Verify**
5. Wait up to 24–48 hours for DNS propagation

#### Option B: HTML Meta Tag (Easiest for URL Prefix)
1. In GSC, copy the meta tag: `<meta name="google-site-verification" content="YOUR_CODE" />`
2. Open `manov-frontend/index.html`
3. Replace `GSC_VERIFICATION_CODE_PLACEHOLDER` with your actual code:
   ```html
   <meta name="google-site-verification" content="YOUR_ACTUAL_CODE_HERE" />
   ```
4. Rebuild and redeploy
5. Click **Verify** in GSC

#### Option C: HTML File Upload
1. In GSC, download the `.html` verification file
2. Replace `public/google-site-verification.html` with the downloaded file
3. Ensure it is served at the root: `https://manov.pascarz.site/google-site-verification.html`
4. Click **Verify** in GSC

### Step 3: Submit Sitemap

1. In GSC sidebar, go to **Sitemaps**
2. Enter: `sitemap.xml`
3. Click **Submit**
4. Wait for GSC to process (usually within a few hours)

### Step 4: Request Indexing for Key Pages

1. Use the **URL Inspection** tool in GSC
2. Enter URLs like:
   - `https://manov.pascarz.site/`
   - `https://manov.pascarz.site/about`
   - `https://manov.pascarz.site/novel/{popular-novel-slug}`
3. Click **Request Indexing** for each

### Step 5: Link to GA4 (Optional but Recommended)

1. In GSC, go to **Settings** ← **Associations** ← **Google Analytics property**
2. Link to your GA4 property for unified reporting

---

## Google Analytics 4 Setup

### Step 1: Create GA4 Property
1. Go to [https://analytics.google.com](https://analytics.google.com)
2. Create a new property for "Manov"
3. Set data stream: **Web** ← URL: `https://manov.pascarz.site`
4. Copy the **Measurement ID** (looks like `G-XXXXXXXXXX`)

### Step 2: Add Measurement ID to Site

Open `manov-frontend/index.html` and replace both instances of `GA_MEASUREMENT_ID_PLACEHOLDER`:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Step 3: Redeploy

Rebuild and redeploy the frontend.

---

## Validation Checklist

After deployment, verify each item:

- [ ] `https://manov.pascarz.site/robots.txt` → returns valid robots.txt
- [ ] `https://manov.pascarz.site/sitemap.xml` → returns XML with novel + chapter URLs
- [ ] `https://manov.pascarz.site/site.webmanifest` → returns JSON with filled name fields
- [ ] `curl -s https://manov.pascarz.site | grep "og:title"` → returns fallback OG tags
- [ ] Facebook Sharing Debugger: [https://developers.facebook.com/tools/debug/](https://developers.facebook.com/tools/debug/)
- [ ] Twitter Card Validator: [https://cards-dev.twitter.com/validator](https://cards-dev.twitter.com/validator)
- [ ] GSC → Sitemaps → Status shows "Success"
- [ ] GSC → Coverage → shows indexed pages

---

## Next SEO Improvements to Consider

1. **Prerendering / SSR**: Implement `vite-plugin-ssr` or Cloudflare Workers for real dynamic OG tags
2. **Core Web Vitals**: Monitor INP, LCP, CLS in GSC ← optimize images to WebP
3. **Hreflang**: Add if you support multiple languages
4. **Breadcrumb navigation UI**: Add visible breadcrumbs matching the JSON-LD schema
5. **Internal linking**: Add "Related Novels" section on NovelDetail for better crawlability
6. **Image optimization**: Serve WebP covers with responsive `srcset`
7. **Canonical pagination**: If search results are paginated, add `rel="next"` / `rel="prev"`

---

*Sources used for research:*
- [Google Search Console Guide 2026 — Semrush](https://www.semrush.com/blog/google-search-console/)
- [SEO for React Applications 2026 — LinkGraph](https://www.linkgraph.com/blog/seo-for-react-applications/)
- [Open Graph React SEO Guide — ccbd.dev](https://ccbd.dev/blog/open-graph-react-seo-fix-social-previews-and-add-og-meta-tags-2026-guide)
- [Prerendering for SEO 2026 — copebusiness.com](https://www.copebusiness.com/technical-seo/prerendering-for-seo/)
