import { useState, useEffect, useRef, useCallback } from "react";
import { openDB } from "../db/idb";

const DB_NAME = "bookworm";

async function getBook(bookId) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction("books", "readonly").objectStore("books").get(bookId);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function getPage(bookId, pageIndex) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction("pages", "readonly").objectStore("pages").get(`${bookId}:${pageIndex}`);
    req.onsuccess = () => res(req.result?.content || []);
    req.onerror = () => rej(req.error);
  });
}

async function saveProgress(bookId, currentPage, totalPages) {
  const db = await openDB();
  const tx = db.transaction("books", "readwrite");
  const store = tx.objectStore("books");
  const req = store.get(bookId);
  req.onsuccess = () => {
    const book = req.result;
    if (book) {
      book.currentPage = currentPage;
      book.progress = totalPages > 1 ? currentPage / (totalPages - 1) : 1;
      store.put(book);
    }
  };
}

// Three-slot sliding window: prev, current, next
const SLOT_PREV = 0;
const SLOT_CUR  = 1;
const SLOT_NEXT = 2;

export default function ReaderView({ bookId, onClose }) {
  const [book, setBook] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [slots, setSlots] = useState([[], [], []]); // [prev, cur, next]
  const [hudVisible, setHudVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // Touch/swipe state
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const swiping = useRef(false);
  const hudTimer = useRef(null);

  // Load book metadata + initial pages
  useEffect(() => {
    if (!bookId) return;
    setLoading(true);
    getBook(bookId).then(async b => {
      if (!b) return;
      setBook(b);
      const startPage = b.currentPage || 0;
      setCurrentPage(startPage);
      const [prev, cur, next] = await Promise.all([
        startPage > 0 ? getPage(bookId, startPage - 1) : Promise.resolve([]),
        getPage(bookId, startPage),
        startPage < b.totalPages - 1 ? getPage(bookId, startPage + 1) : Promise.resolve([]),
      ]);
      setSlots([prev, cur, next]);
      setLoading(false);
    });
  }, [bookId]);

  // Fill slots when page changes
  const goToPage = useCallback(async (newPage) => {
    if (!book) return;
    if (newPage < 0 || newPage >= book.totalPages) return;
    const [prev, cur, next] = await Promise.all([
      newPage > 0 ? getPage(bookId, newPage - 1) : Promise.resolve([]),
      getPage(bookId, newPage),
      newPage < book.totalPages - 1 ? getPage(bookId, newPage + 1) : Promise.resolve([]),
    ]);
    setSlots([prev, cur, next]);
    setCurrentPage(newPage);
    saveProgress(bookId, newPage, book.totalPages);
  }, [book, bookId]);

  function nextPage() { goToPage(currentPage + 1); }
  function prevPage() { goToPage(currentPage - 1); }

  // Touch handlers
  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swiping.current = false;
  }

  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      // Tap — toggle HUD
      toggleHud();
      return;
    }
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) nextPage();
      else prevPage();
    }
    touchStartX.current = null;
  }

  function toggleHud() {
    setHudVisible(v => {
      if (!v) {
        clearTimeout(hudTimer.current);
        hudTimer.current = setTimeout(() => setHudVisible(false), 3000);
      }
      return !v;
    });
  }

  function renderPage(pageContent) {
    if (!pageContent || pageContent.length === 0) return null;
    return pageContent.map((para, i) => {
      if (para.isHeading) {
        return <h2 key={i} className="reader-heading" dangerouslySetInnerHTML={{ __html: para.html }} />;
      }
      return <p key={i} className="reader-para" dangerouslySetInnerHTML={{ __html: para.html }} />;
    });
  }

  const progress = book && book.totalPages > 1
    ? Math.round((currentPage / (book.totalPages - 1)) * 100)
    : 100;

  if (loading) {
    return (
      <div className="reader-overlay">
        <div className="reader-loading">
          <div className="reader-spinner" />
          <p>Opening book…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="reader-overlay"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* HUD — top */}
      <div className={"reader-hud-top" + (hudVisible ? " visible" : "")}>
        <button className="reader-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div className="reader-hud-title">{book?.title}</div>
        <div style={{ width: 40 }} />
      </div>

      {/* Page content */}
      <div className="reader-page">
        <div className="reader-content">
          {renderPage(slots[SLOT_CUR])}
        </div>
      </div>

      {/* HUD — bottom */}
      <div className={"reader-hud-bottom" + (hudVisible ? " visible" : "")}>
        <span className="reader-progress-text">{progress}%</span>
        <div className="reader-progress-track">
          <div className="reader-progress-fill" style={{ width: progress + "%" }} />
        </div>
        <span className="reader-page-text">{currentPage + 1} / {book?.totalPages}</span>
      </div>

      <style>{`
        .reader-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: var(--bg, #f5f0e8);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          touch-action: pan-y;
        }
        .reader-loading {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: var(--text-muted, #9c8b78);
          font-size: 15px;
        }
        .reader-spinner {
          width: 28px;
          height: 28px;
          border: 2.5px solid rgba(139,111,71,0.2);
          border-top-color: var(--accent, #8b6f47);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* HUD */
        .reader-hud-top {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          padding: env(safe-area-inset-top, 0) 16px 0;
          display: flex;
          align-items: flex-end;
          padding-bottom: 12px;
          background: linear-gradient(to bottom, var(--bg, #f5f0e8) 60%, transparent);
          z-index: 10;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }
        .reader-hud-top.visible {
          opacity: 1;
          pointer-events: all;
        }
        .reader-hud-bottom {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 12px 20px calc(env(safe-area-inset-bottom, 0px) + 12px);
          display: flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(to top, var(--bg, #f5f0e8) 60%, transparent);
          z-index: 10;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }
        .reader-hud-bottom.visible {
          opacity: 1;
          pointer-events: all;
        }
        .reader-close {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text, #2c2417);
          flex-shrink: 0;
          -webkit-tap-highlight-color: transparent;
        }
        .reader-close svg { width: 22px; height: 22px; }
        .reader-hud-title {
          flex: 1;
          text-align: center;
          font-family: Georgia, serif;
          font-size: 14px;
          color: var(--text-muted, #9c8b78);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .reader-progress-text {
          font-size: 12px;
          color: var(--text-muted, #9c8b78);
          min-width: 32px;
        }
        .reader-progress-track {
          flex: 1;
          height: 2px;
          background: rgba(139,111,71,0.2);
          border-radius: 2px;
          overflow: hidden;
        }
        .reader-progress-fill {
          height: 100%;
          background: var(--accent, #8b6f47);
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        .reader-page-text {
          font-size: 12px;
          color: var(--text-muted, #9c8b78);
          min-width: 48px;
          text-align: right;
        }

        /* Page content */
        .reader-page {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .reader-content {
          flex: 1;
          padding: 72px 28px 80px;
          overflow: hidden;
        }
        .reader-heading {
          font-family: Georgia, serif;
          font-size: 1.15em;
          font-weight: normal;
          color: var(--text, #2c2417);
          margin: 0 0 1em;
          line-height: 1.4;
          text-align: center;
        }
        .reader-para {
          font-family: Georgia, serif;
          font-size: var(--reader-font-size, 17px);
          line-height: 1.75;
          color: var(--text, #2c2417);
          margin: 0 0 0.9em;
          text-align: justify;
          hyphens: auto;
          -webkit-hyphens: auto;
        }
        .reader-para:last-child { margin-bottom: 0; }
      `}</style>
    </div>
  );
}
