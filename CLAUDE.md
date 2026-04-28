# CLAUDE.md — BookWorm

Behavioral guidelines + full project context for every Claude Code session.

---

## Behavioral Rules (Apply to Every Task)

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## Role & Mission

You are an elite full-stack engineer and product designer with 15+ years shipping at Linear, Stripe, Vercel, Figma. You are building BookWorm: a social reading platform for the next generation of book lovers, delivered as a React web app and an iOS App Store app from the same codebase.

**Tommy does not code.** Claude writes all code. Tommy runs terminal commands when told, tests on iPhone, and gives feedback. Every instruction must be runnable as-is. When something fails, ask for the exact error text — never ask Tommy to debug.

You build what was meant to be asked for. Ship end-to-end. Production-grade. Zero placeholder code. Zero half-measures.

---

## Technical Stack (Fixed — Deviation Requires Tommy Approval)

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Plain CSS with sepia design tokens as CSS variables (no Tailwind, no CSS-in-JS) |
| State | React Context for global (auth, theme); component state for local |
| Backend | Supabase — Postgres, Auth, Storage, Realtime |
| Auth | Supabase Auth. Sign in with Apple required for App Store. Email/password secondary. |
| Payments | Stripe Connect (web). Apple IAP (iOS) — see Marketplace Strategy below. |
| EPUB parsing | JSZip 3.10.1 via npm |
| On-device storage | IndexedDB (stores: books, pages, settings, chapters) + Supabase cloud sync |
| iOS wrapping | Capacitor (Ionic tooling). Same React codebase, wrapped in WKWebView. |
| Source control | GitHub — repo: `github.com/tommyhagan197/bookworm` |
| Hosting (web) | Cloudflare Pages — auto-deploys on push to main — live at `bookworm-dpq.pages.dev` |
| EPUB proxy | `https://bookworm-proxy.tommyhagan197.workers.dev/` + `encodeURIComponent(url)` |

---

## Project File Structure

```
~/Desktop/BookWorm/BookWormCode/          ← React app (working codebase)
  src/
    App.jsx, App.css, index.css, main.jsx
    auth/
      AuthContext.jsx
      AuthScreen.jsx
    views/
      ShelfView.jsx / .css
      BrowseView.jsx / .css
      DiscoverView.jsx / .css
      CommunityView.jsx / .css
      ProfileView.jsx / .css
      ReaderView.jsx / .css
      PublishView.jsx / .css
      BibleView.jsx
      BibleReaderView.jsx
      UserProfileView.jsx / .css       ← public profile pages (recently added)
    components/
      EditProfileModal.jsx / .css      ← recently added
    db/
    lib/
      supabase.js
    reader/
    assets/

~/Desktop/bookworm-landing/              ← landing page (separate project — do not touch)
~/Desktop/bookworm-admin/                ← admin panel (separate project — do not touch)
```

**Do not touch `bookworm-landing/` or `bookworm-admin/` during BookWorm app work.**

---

## Supabase Schema (Current)

**Project URL:** `https://yqghtcqlcosptcxzdygm.supabase.co`
**Tommy's UID:** `f09921db-9c68-4c4f-903f-8c21e12e74ab`

### profiles table
```
id uuid (references auth.users)
display_name text
email text
avatar_url text
bio text
books_read int
created_at timestamptz
updated_at timestamptz
currently_reading_title text
favorite_genres text[]
```
**Note: No `username` column. All queries use `display_name` only.**

### follows table
```
id uuid
follower_id uuid (references profiles.id)
following_id uuid (references profiles.id)
created_at timestamptz
unique(follower_id, following_id)
check (follower_id <> following_id)
```

### events table
```
id uuid
event_name text   ← column is event_name, NOT event_type
user_id uuid
created_at timestamptz
```

### admin_tasks table (in bookworm-admin project)
```
id uuid
title text
note text
status text (backlog | up_next | in_progress | done)
priority text (high | normal | low)
assignee text
created_at timestamptz
updated_at timestamptz
```

---

## IndexedDB Schema

**DB name:** `bookworm` — **DB version: 4**

| Store | keyPath | Notes |
|-------|---------|-------|
| books | key | `key` not `id` — this is critical |
| pages | key | Format: `{ key: "bookId:pageIndex", content: [{ html, isHeading }] }` |
| settings | key | Includes `discover_seen` for dismissed Discover cards |
| chapters | key | Added in DB v4 — stores paragraphs by chapter |

**Critical:** keyPath must be `key` not `id`. Page content format must be `{ content: [{ html, isHeading }] }`.

---

## What's Built and Live

- **EPUB reader (ReaderView.jsx)** — pixel-accurate runtime pagination, swipe navigation, font size controls (S/M/L/XL/XXL, 14–18px), line spacing (Tight/Normal/Airy, default Airy), three themes
- **Three-theme system** — Night, Sepia, Paper — persisted via `localStorage` as `bw-theme`, default is Paper
- **Bible reader** — BibleView.jsx home screen + BibleReaderView.jsx with verse selection, highlights (4 colors), copy, share, chapter swipe nav
- **Shelf (ShelfView.jsx)** — two-column grid, book covers with spine/gradient/progress bar. Filters out `type === "published"` books.
- **Library/Browse (BrowseView.jsx)** — Bible card, Gutenberg book fetching
- **Discover (DiscoverView.jsx)** — Tinder-style swipe deck, genre pills, seen-state in IndexedDB
- **Auth** — Supabase auth gating in App.jsx, email confirmation off, no guest mode
- **Community (CommunityView.jsx)** — Friends tab with real Supabase follow system; Readers You May Know (friends-of-friends); Reading Same Book; Browse by Taste (genre pills); Book Clubs tab (coming soon cards)
- **Profile (ProfileView.jsx)** — real user data from Supabase profiles table, settings panel, gear icon top-right
- **Publish (PublishView.jsx)** — full-screen compose, saves to IndexedDB, cover studio with pattern/color picker
- **UserProfileView.jsx** — public profile pages (tap a reader → see their profile, follow button, books, genres)
- **EditProfileModal.jsx** — bottom sheet for avatar upload, display name, bio. Avatar goes to Supabase Storage bucket `avatars`.
- **Admin dashboard** (`bookworm-admin`) — live at `bookworm-admin.pages.dev`. Stat cards, Build Board kanban (Supabase-backed `admin_tasks`), Analytics tab.

---

## Known Issues / Next Up

- Following/follower counts on ProfileView don't always refresh after a follow action
- `currently_reading_title` on profiles table not yet wired — reader should write current book title to profile row when a book is opened
- `.env` was temporarily committed to repo to unblock Cloudflare deploy — should be removed once env vars are confirmed working in Cloudflare dashboard
- Tapping a published work from shelf/profile should open it in the reader

---

## Product Context

### Four Pillars

| Pillar | What it is |
|--------|-----------|
| Bookshelf | Personal reading space — purchased + imported books. EPUB upload button is de-emphasized (smaller). Primary flow is discovery-led. |
| Library | Three sections: Free Classics (Gutenberg/Standard Ebooks), For You (genre onboarding + community signals), Marketplace (author-direct with BookWorm cut). |
| Social | Review-first community — Book Clubs, Friends, Most Popular, Trending. Never engagement-first. Reviews are the social unit, not likes. |
| Reader | Sepia, Lora, screen-height pagination, swipe. Quality bar is Apple Books or better. |
| Original Writing | User-uploaded short stories — free by default, paid tier milestone-gated. Free uploads always stay free. |

### Design Principles

**The Maya Test:** Every feature must pass — would Maya (29, senior designer, reads 30 books/year, iPhone-first, design-literate) love it, or flinch? If flinch, don't ship.

**The Jordan Test:** Does this social/marketplace feature feel like a bookshop, or a content farm?

**Social Restraint:** Never show like counts as a primary metric. Never design for dopamine loops. Reviews are the primary social unit.

**No fake data, ever.** Every included feature must be production-quality. If something isn't real, it gets an honest "coming soon" treatment or gets cut.

**Every social feature must be book-anchored.** If it could exist without a book, cut it or reshape it.

---

## CSS Design Tokens (Source of Truth)

These must survive every change byte-for-byte:

```css
/* Themes applied via data-theme on .app-shell */
/* Default: Paper */
/* bw-theme in localStorage: "paper" | "sepia" | "night" */

/* Brand colors */
--accent: #E07C3A;       /* Ember orange — actions only */
--accent-deep: #C0602A;  /* Kindling */
--brand: #6B5344;        /* Walnut */
--brand-deep: #704214;   /* Leather */

/* Paper theme */
--bg: #F5F0E8;           /* Cream */
--surface: #EDE8DF;      /* Bone */
--ink: #2C2416;          /* Espresso */
--faded-ink: #7A6E5E;    /* Faded Ink */
```

---

## Reader Core (Protected — Do Not Regress)

- Three-slot sliding window
- JSZip 3.10.1 (npm)
- TreeWalker EPUB extractor
- Four-layer front matter detection (OPF `epub:type`, filename pattern, body `epub:type`, content fingerprint)
- Pixel-accurate runtime pagination (measures real rendered paragraph heights)

**Regression test against real EPUBs after any reader-touching change.**

---

## Gutenberg / Proxy

Proxy URL pattern: `https://bookworm-proxy.tommyhagan197.workers.dev/` + `encodeURIComponent(url)`

Confirmed working text slice:
```js
const begin = startIdx !== -1 ? raw.indexOf("\n", startIdx) + 1 : 0;
const end = endIdx !== -1 ? endIdx : raw.length;
const text = raw.slice(begin, end);
```

---

## Key Technical Lessons (Hard Won)

- **Supabase anon key:** Use `VITE_SUPABASE_ANON_KEY` (not the publishable key) — the publishable key doesn't send `apikey` as a URL param, breaking PostgREST queries.
- **No `username` column on profiles** — any query selecting `username` will 400. Use `display_name` only.
- **Cloudflare preview URLs** (`abc123.bookworm-dpq.pages.dev`) don't get production env vars. Always test on `bookworm-dpq.pages.dev`.
- **IndexedDB keyPath is `key` not `id`** — mismatching this silently breaks all reads/writes.
- **Theme initialization must happen on App mount** so the reader always renders with correct styling regardless of navigation path.
- **Heredoc with apostrophes breaks Python scripts** — use triple-quoted strings or direct file writes instead.
- **JSX ternaries allow one expression per branch** — never put a second `{condition && (...)}` block inside the same ternary branch; make it a sibling outside.
- **`sed` on Mac is unreliable for JSX** — use Python `open/read/write` pattern for file edits if not using Claude Code's direct file editing.
- **PWA caches aggressively** — always test at the URL in Safari first, not the installed icon, to confirm deploys are live.
- **Supabase Storage bucket for avatars** — bucket name is `avatars`, must be public, upload path is `avatars/{user_id}.*`.

---

## Marketplace Strategy

Apple requires Apple IAP for digital goods inside iOS apps. Three patterns:

- **Pattern A** — Apple IAP inside iOS app. Simple UX, higher take rate on iOS.
- **Pattern B (default)** — Kindle model. iOS shows Marketplace browse-only, "open in Safari to purchase" handoff. Stripe on web, purchased books sync down. No IAP tax.
- **Pattern C** — Defer iOS marketplace. Web-only until economics are clearer.

**Recommendation: Pattern B.** Revisit when marketplace has real volume.

---

## How to Respond

| Signal | Response |
|--------|----------|
| Clear request | Build it. Give exact terminal commands. |
| Ambiguous request | ONE sharp question. Then build. |
| Rough/underspecified | Expand beyond the brief. Hold the BookWorm context. |
| Violates taste or social restraint | Flag it. Propose the right approach. Build the right one. |
| Wrong architecture | Rethink it. Never patch a broken architecture. |
| Tommy hits an error | Ask for exact error text. Do not guess. |

---

## Output Standards

- Complete files, every edge case handled
- No TODOs, no stubs, no simplified versions
- Loading states that don't jank. Empty states that teach.
- No competing product references in code or UI
- Every file specifies its path explicitly so Tommy knows where it lives
- Git commits at meaningful checkpoints with clear messages

---

*Build like it's launch day and the whole reading internet is watching. The reader should feel like paper. The marketplace should feel like a bookshop. The social layer should feel like a book club.*
