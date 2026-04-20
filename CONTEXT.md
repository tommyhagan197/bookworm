# BookWorm — Session Context

> Paste this file at the start of every new Claude session.  
> Then paste any specific source files you're about to touch.  
> Keep this updated after every meaningful change.

**Last updated:** April 2026  
**Current state:** React + Vite, deployed via GitHub → Cloudflare Pages

---

## What BookWorm Is

A social reading platform for iPhone and web. Premium EPUB reading surface. Four pillars:

1. **Shelf** — personal reading space, books from Library + uploaded EPUBs
2. **Library** — Free Classics (Gutenberg), For You (future), Marketplace (future)
3. **Community** — trending books, book clubs, friends (partially built)
4. **Profile** — settings: theme, font size

**One-liner:** "The reading app that makes free books feel like expensive ones."

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Plain CSS with CSS variables (no Tailwind, no CSS-in-JS) |
| EPUB parsing | JSZip 3.10.1 via npm |
| On-device storage | IndexedDB — DB name: `bookworm`, stores: `books`, `pages`, `settings` |
| Hosting | Cloudflare Pages — auto-deploy from GitHub `main` branch |
| EPUB proxy | Cloudflare Worker at `bookworm-proxy.tommyhagan197.workers.dev` |
| Source control | GitHub — repo: `tommyhagan197/bookworm` |
| Deploy URL | `bookworm-dpq.pages.dev` |

**Tommy does not code. Claude writes all code. Tommy runs terminal commands and tests on iPhone.**  
**File path on Tommy's Mac:** `/Users/tommyhagan/bookworm/src/` (no `197` in path)  
**Always use `python3 - << 'EOF'` for multiline file writes — shell heredoc corrupts files.**

---

## File Structure

```
/Users/tommyhagan/bookworm/
├── src/
│   ├── App.jsx              — 5-tab shell, nav routing
│   ├── App.css              — global CSS variables, nav styles, shared view styles
│   ├── db/
│   │   └── idb.js           — shared IndexedDB helpers (openDB, dbGet, dbPut, dbGetAll, getSetting, setSetting, getAllBooks, findBookByGutenbergId)
│   ├── reader/
│   │   └── epubProcessor.js — full EPUB extraction + pagination + IndexedDB write
│   └── views/
│       ├── BrowseView.jsx   — Free Classics: Gutendex API, search, download via proxy
│       ├── ShelfView.jsx    — grid of downloaded books from IndexedDB
│       ├── DiscoverView.jsx — For You placeholder (genre pills)
│       ├── CommunityView.jsx — Trending (Gutendex) + Book Clubs toggle
│       └── ProfileView.jsx  — Settings: theme (Sepia/Light/Dark) + font size (S/M/L/XL)
├── package.json             — includes jszip dependency
└── CONTEXT.md               — this file
```

---

## CSS Variables (source of truth — never hardcode colors)

```css
--bg:           #f5f0e8        /* Sepia paper */
--surface:      #ede8df        /* Cards, nav */
--accent:       #8b6f47        /* Walnut brown — brand primary */
--accent-dark:  #6b5234        /* Leather — hover/active states */
--text:         #2c2417        /* Espresso ink */
--text-muted:   #9c8b78        /* Faded ink */
--nav-h:        72px
--safe-bottom:  env(safe-area-inset-bottom, 0px)
--reader-font-size: 17px       /* Controlled by ProfileView settings */
```

Dark mode overrides applied dynamically by `ProfileView.jsx` via `document.documentElement.style.setProperty()`.

---

## Brand Colors (from brand guide)

| Name | Hex | Use |
|---|---|---|
| Cream (Paper) | #F5F0E8 | App background |
| Bone (Surface) | #EDE8DF | Cards, nav |
| Parchment | #E4DFD5 | Surface 2 |
| Faded Ink | #7A6E5E | Muted text |
| Espresso | #2C2416 | Primary text |
| Walnut | #6B5344 | Brand color |
| Leather | #704214 | Brand deep |
| Gilded | #D4A574 | Secondary |
| Ember | #E07C3A | Accent / CTA |
| Kindling | #C0602A | Accent deep |

**Ember (#E07C3A) is the CTA/action color. Walnut (#6B5344) is the brand identity color.**  
The current `--accent` in the app uses `#8b6f47` (between Walnut and Gilded) — acceptable but could be tightened to `#6B5344` for brand fidelity.

---

## The Protected Reader Core

These behaviors must never regress. Test against *David and Goliath* and *The Time Keeper* after any reader-touching change.

### EPUB Processor (`src/reader/epubProcessor.js`)

**Four-layer front matter detection** (all four run before accepting a chapter):
1. `isFrontMatterByOpfType(item)` — checks `properties` attribute on OPF manifest item for cover/title-page/copyright-page/etc.
2. `isFrontMatterByFilename(filename, idx, total)` — filename pattern match on first 20% of spine (max 8 items)
3. `isFrontMatterByBodyType(doc)` — checks `epub:type` or `data-type` on the `<body>` element
4. `isFrontMatterByContent(text)` — detects 2+ copyright/legal boilerplate signals in first 1200 chars

**TreeWalker extractor:**
- Walks DOM using `NodeFilter.SHOW_ELEMENT`
- Accepts only `h1–h6` (isHeading: true) and `p` (isHeading: false)
- Filters TOC noise: paragraphs whose only child is an `<a>` and text matches are skipped
- Returns `{ html, isHeading, text }` objects

**Paginator:**
- Target: `WORDS_PER_PAGE = Math.round(window.innerHeight / 22 * 12)` — screen-height relative
- Breaks on word count, never mid-paragraph
- Returns array of pages, each page is array of `{ html, isHeading }`

**IndexedDB write:**
- Book record: `{ id, title, author, totalPages, progress, currentPage, addedAt, gutenbergId? }`
- Pages written in single transaction: key = `bookId:pageIndex`, value = `{ key, content: [{ html, isHeading }] }`
- Book ID format: `book_${Date.now()}_${random5chars}`

---

## Proxy — CRITICAL

**URL:** `https://bookworm-proxy.tommyhagan197.workers.dev`

**Format:** Path-based, NOT query string.
```
// CORRECT:
const proxyUrl = `${PROXY_BASE}/${encodeURIComponent(epubUrl)}`;

// WRONG (old format — do not use):
const proxyUrl = `${PROXY_BASE}/?url=${encodeURIComponent(epubUrl)}`;
```

The Worker decodes the path, fetches the Gutenberg URL, follows redirects, sets `Access-Control-Allow-Origin: *`. Only `gutenberg.org` URLs are allowed through (allow-list enforced in Worker).

Gutendex (`https://gutendex.com/books`) has CORS — fetch it **directly**, no proxy needed.

---

## Gutenberg / Library

**Gutendex API:** `https://gutendex.com/books`
- Popular: `?ids=1342,84,11,1661,2701,98,345,174,76,5200` (curated — re-sort client-side to match order)
- Search: `?search=QUERY&languages=en`
- Response: `{ results: [{ id, title, authors: [{name}], formats: {"application/epub+zip": url} }] }`

**EPUB URL:** `book.formats["application/epub+zip"]` — this URL redirects, the Worker follows it.

**Duplicate detection:** `findBookByGutenbergId(id)` in `idb.js` — scans `books` store for matching `gutenbergId` field.

**Popular IDs (ordered by intent):**
```
1342  Pride and Prejudice — Austen
84    Frankenstein — Shelley
11    Alice's Adventures in Wonderland — Carroll
1661  Sherlock Holmes — Doyle
2701  Moby Dick — Melville
98    A Tale of Two Cities — Dickens
345   Dracula — Stoker
174   The Picture of Dorian Gray — Wilde
76    Adventures of Huckleberry Finn — Twain
5200  Metamorphosis — Kafka
```

---

## Nav — 5 Tabs

```
Shelf · Library · [Discover — elevated center button] · Community · Profile
```

- Center Discover button: 56px circle, `margin-top: -28px` to lift above nav bar, amber/Ember background
- Tab state managed in `App.jsx` via `useState("library")` — Library is default tab
- Fixed to bottom, `max-width: 430px`, respects `safe-area-inset-bottom`

---

## Settings (ProfileView)

Themes applied by setting CSS variables on `document.documentElement`:
```
sepia: --bg #f5f0e8 / --surface #ede8df / --text #2c2417
light: --bg #ffffff  / --surface #f5f5f5 / --text #1a1a1a
dark:  --bg #1a1714  / --surface #252220 / --text #e8e0d0
```

Font sizes: small=15px, medium=17px, large=19px, xlarge=21px → set `--reader-font-size`

Both persisted to IndexedDB `settings` store via `setSetting(key, value)` and loaded on mount.

---

## What's Next (Roadmap)

| Priority | Task |
|---|---|
| 1 | Wire reader into React — open a book from Shelf and read it (the reader UI doesn't exist in React yet) |
| 2 | Shelf → tapping a book should open the reader overlay |
| 3 | Upload EPUB from device (file picker → epubProcessor → Shelf) |
| 4 | Supabase auth — Sign in with Apple (required for App Store) |
| 5 | Library For You — genre onboarding, personalized picks |
| 6 | Marketplace — indie author listings, Stripe Connect |
| 7 | Capacitor iOS wrap — `npx cap sync ios` → Xcode → TestFlight |

**The reader UI (the actual reading experience) has not been ported to React yet.** The EPUB processor writes to IndexedDB correctly, but there's no React component that renders pages and handles swipe navigation. This is the most critical next build.

---

## How to Start a New Session

1. Paste this `CONTEXT.md` into the chat
2. Paste the specific files you're about to touch (e.g. `cat src/views/BrowseView.jsx`)
3. State what you want to build
4. Update this file and commit it when the session ends

```bash
# Quick way to get file contents to paste:
cat /Users/tommyhagan/bookworm/src/reader/epubProcessor.js | pbcopy
# Then Cmd+V into Claude
```

---

## Session Notes (April 20 2026)
- Accent color changed to Ember #E07C3A, accent-dark to Kindling #C0602A, --brand #6B5344 added
- PWA manifest added, app icon is orange B on SVG, theme-color updated to #E07C3A
- DiscoverView fully rebuilt: Tinder swipe deck, 10 hardcoded short stories, tap to flip, swipe to add/skip, genre filter pills, SVG action buttons (no emojis)
- Seen state persisted to IndexedDB under discover_seen key — deck survives tab switches
- Swipe right saves book record to IndexedDB books store — appears on Shelf immediately
- All emojis replaced with SVG icons throughout

## Known Issues / Watch Out For

- **Reader not ported yet** — biggest gap. Books download correctly but can't be opened and read inside the React app.
- **ShelfView `onOpenBook` prop** — wired in App.jsx but does nothing until the reader component exists.
- **Theme on app load** — ProfileView loads theme from IndexedDB on mount, but there's a brief flash of default sepia before it applies. Low priority for now.
- **Community clubs are mocked** — the 3 book clubs in CommunityView are hardcoded placeholder data. Real clubs require Supabase.
- **DiscoverView is a placeholder** — genre pills don't do anything yet. For You requires backend.
