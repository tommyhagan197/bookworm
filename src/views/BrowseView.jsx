import { useState, useEffect, useRef, useCallback } from "react";
import { processEpubBuffer } from "../reader/epubProcessor";
import { findBookByGutenbergId } from "../db/idb";

const PROXY_BASE = "https://bookworm-proxy.tommyhagan197.workers.dev";
const GUTENDEX_BASE = "https://gutendex.com/books";

const POPULAR_IDS = [1342, 84, 11, 1661, 2701, 98, 345, 174, 76, 5200];

const COVER_COLORS = [
  "#6B5234","#4A6741","#2D5A7B","#7B4A6B","#6B6234","#3D6B6B","#7B5A3D","#4A4A7B"
];

function coverColor(id) {
  return COVER_COLORS[Math.abs(id) % COVER_COLORS.length];
}

export default function BrowseView({ onOpenBook }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [downloading, setDownloading] = useState({}); // bookId -> true
  const [inLibrary, setInLibrary] = useState({}); // gutenbergId -> bookId
  const searchTimer = useRef(null);
  const abortRef = useRef(null);

  // Load popular on mount
  useEffect(() => {
    fetchPopular();
  }, []);

  async function fetchPopular() {
    setLoading(true);
    setError(null);
    try {
      const ids = POPULAR_IDS.join(",");
      const res = await fetch(`${GUTENDEX_BASE}?ids=${ids}`);
      if (!res.ok) throw new Error("Gutendex returned " + res.status);
      const data = await res.json();
      // Re-sort to match POPULAR_IDS order
      const map = {};
      data.results.forEach(b => { map[b.id] = b; });
      const sorted = POPULAR_IDS.map(id => map[id]).filter(Boolean);
      setBooks(sorted);
      checkLibraryStatus(sorted.map(b => b.id));
    } catch (e) {
      setError("Couldn't load books. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function checkLibraryStatus(ids) {
    const status = {};
    for (const id of ids) {
      const book = await findBookByGutenbergId(id);
      if (book) status[id] = book.id;
    }
    setInLibrary(status);
  }

  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2) { fetchPopular(); return; }
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${GUTENDEX_BASE}?search=${encodeURIComponent(q)}&languages=en`, { signal: controller.signal });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setBooks(data.results.slice(0, 20));
      checkLibraryStatus(data.results.slice(0, 20).map(b => b.id));
    } catch (e) {
      if (e.name !== "AbortError") setError("Search failed. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  function onSearchChange(e) {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(q), 400);
  }

  function clearSearch() {
    setQuery("");
    fetchPopular();
  }

  async function download(book) {
    const gutId = book.id;
    if (inLibrary[gutId]) {
      onOpenBook && onOpenBook(inLibrary[gutId]);
      return;
    }

    // Find best EPUB URL
    const formats = book.formats || {};
    const epubUrl = formats["application/epub+zip"] || Object.entries(formats).find(([k]) => k.includes("epub"))?.[1];
    if (!epubUrl) { alert("No EPUB available for this book."); return; }

    setDownloading(d => ({ ...d, [gutId]: true }));

    try {
      const proxyUrl = `${PROXY_BASE}/${encodeURIComponent(epubUrl)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Proxy returned " + res.status);
      const buffer = await res.arrayBuffer();
      if (!buffer || buffer.byteLength < 1000) throw new Error("Empty EPUB");

      const author = book.authors?.[0]?.name || "Unknown";
      const record = await processEpubBuffer(buffer, book.title + ".epub", {
        gutenbergId: gutId,
        metaTitle: book.title,
        metaAuthor: author
      });

      setInLibrary(s => ({ ...s, [gutId]: record.id }));
    } catch (e) {
      console.error("[Browse] download failed:", e);
      alert("Download failed. Try again.");
    } finally {
      setDownloading(d => { const n = { ...d }; delete n[gutId]; return n; });
    }
  }

  return (
    <div className="view-container">
      <h1 className="view-header">Free Classics</h1>
      <p className="view-subhead">70,000+ public domain books</p>

      {/* Search */}
      <div className="browse-search-wrap">
        <svg className="browse-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          className="browse-search"
          type="text"
          placeholder="Search by title or author…"
          value={query}
          onChange={onSearchChange}
        />
        {query && (
          <button className="browse-search-clear" onClick={clearSearch}>✕</button>
        )}
      </div>

      {loading && (
        <div className="browse-loading">
          <div className="browse-spinner-ring"/>
          <p>Loading books…</p>
        </div>
      )}

      {error && !loading && (
        <div className="empty-state">
          <p>{error}</p>
          <button className="browse-retry" onClick={() => query ? doSearch(query) : fetchPopular()}>Try again</button>
        </div>
      )}

      {!loading && !error && (
        <div className="browse-grid">
          {books.map(book => {
            const gutId = book.id;
            const already = inLibrary[gutId];
            const isDownloading = downloading[gutId];
            const author = book.authors?.[0]?.name || "Unknown";
            const bgColor = coverColor(gutId);

            return (
              <div key={gutId} className="browse-card">
                <div className="browse-cover" style={{ background: bgColor }}>
                  <span className="browse-cover-title">{book.title}</span>
                  <span className="browse-cover-author">{author}</span>
                </div>
                <div className="browse-card-body">
                  <div className="browse-card-title">{book.title}</div>
                  <div className="browse-card-author">{author}</div>
                  <button
                    className={"browse-btn" + (already ? " in-library" : "") + (isDownloading ? " loading" : "")}
                    disabled={isDownloading}
                    onClick={() => download(book)}
                  >
                    {isDownloading ? (
                      <svg className="btn-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                    ) : already ? "✓ Read now" : "+ Add to Shelf"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .browse-search-wrap {
          position: relative;
          margin-bottom: 20px;
        }
        .browse-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: var(--text-muted);
          pointer-events: none;
        }
        .browse-search {
          width: 100%;
          padding: 10px 36px 10px 36px;
          background: var(--surface);
          border: 1px solid rgba(139,111,71,0.2);
          border-radius: 10px;
          font-size: 15px;
          color: var(--text);
          outline: none;
          -webkit-appearance: none;
        }
        .browse-search:focus { border-color: var(--accent); }
        .browse-search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 13px;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
        }
        .browse-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px 0;
          gap: 12px;
          color: var(--text-muted);
          font-size: 14px;
        }
        .browse-spinner-ring {
          width: 28px;
          height: 28px;
          border: 2.5px solid rgba(139,111,71,0.2);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .browse-retry {
          margin-top: 8px;
          padding: 8px 20px;
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
        }
        .browse-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .browse-card {
          display: flex;
          gap: 14px;
          background: var(--surface);
          border-radius: 12px;
          padding: 12px;
          border: 1px solid rgba(139,111,71,0.1);
          align-items: flex-start;
        }
        .browse-cover {
          width: 64px;
          flex-shrink: 0;
          aspect-ratio: 2/3;
          border-radius: 5px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6px 4px;
          box-shadow: 2px 3px 8px rgba(0,0,0,0.2);
          gap: 4px;
        }
        .browse-cover-title {
          font-family: Georgia, serif;
          font-size: 8px;
          color: rgba(255,255,255,0.95);
          text-align: center;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .browse-cover-author {
          font-size: 7px;
          color: rgba(255,255,255,0.65);
          text-align: center;
        }
        .browse-card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }
        .browse-card-title {
          font-family: Georgia, serif;
          font-size: 15px;
          color: var(--text);
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .browse-card-author {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .browse-btn {
          align-self: flex-start;
          padding: 6px 14px;
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 100px;
          justify-content: center;
          -webkit-tap-highlight-color: transparent;
          transition: opacity 0.15s;
        }
        .browse-btn.in-library {
          background: rgba(224,124,58,0.12);
          color: var(--accent);
          border: 1px solid rgba(224,124,58,0.3);
        }
        .browse-btn.loading { opacity: 0.7; cursor: default; }
        .btn-spinner {
          width: 14px;
          height: 14px;
          animation: spin 0.7s linear infinite;
        }
      `}</style>
    </div>
  );
}
