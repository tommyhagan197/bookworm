import { useState, useEffect, useRef, useCallback } from "react";
import { openDB } from "../db/idb";

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

export default function ReaderView({ bookId, onClose }) {
  const [book, setBook] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [slots, setSlots] = useState([[], [], []]);
  const [hudVisible, setHudVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const hudTimer = useRef(null);
  const bookRef = useRef(null);
  const currentPageRef = useRef(0);

  useEffect(() => {
    if (!bookId) return;
    setLoading(true);
    getBook(bookId).then(async b => {
      if (!b) return;
      setBook(b);
      bookRef.current = b;
      const startPage = b.currentPage || 0;
      setCurrentPage(startPage);
      currentPageRef.current = startPage;
      const [prev, cur, next] = await Promise.all([
        startPage > 0 ? getPage(bookId, startPage - 1) : Promise.resolve([]),
        getPage(bookId, startPage),
        startPage < b.totalPages - 1 ? getPage(bookId, startPage + 1) : Promise.resolve([]),
      ]);
      setSlots([prev, cur, next]);
      setLoading(false);
    });
  }, [bookId]);

  const goToPage = useCallback(async (newPage) => {
    const b = bookRef.current;
    if (!b) return;
    if (newPage < 0 || newPage >= b.totalPages) return;
    const [prev, cur, next] = await Promise.all([
      newPage > 0 ? getPage(bookId, newPage - 1) : Promise.resolve([]),
      getPage(bookId, newPage),
      newPage < b.totalPages - 1 ? getPage(bookId, newPage + 1) : Promise.resolve([]),
    ]);
    setSlots([prev, cur, next]);
    setCurrentPage(newPage);
    currentPageRef.current = newPage;
    saveProgress(bookId, newPage, b.totalPages);
  }, [bookId]);

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;

    // Small movement = tap
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      toggleHud();
      return;
    }

    // Horizontal swipe dominant
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 35) {
      if (dx < 0) goToPage(currentPageRef.current + 1);
      else goToPage(currentPageRef.current - 1);
    }
  }

  function toggleHud() {
    setHudVisible(v => {
      clearTimeout(hudTimer.current);
      if (!v) {
        hudTimer.current = setTimeout(() => setHudVisible(false), 3500);
      }
      return !v;
    });
  }

  function renderPage(pageContent) {
    if (!pageContent || pageContent.length === 0) return null;
    return pageContent.map((para, i) =>
      para.isHeading
        ? <h2 key={i} className="reader-heading" dangerouslySetInnerHTML={{ __html: para.html }} />
        : <p key={i} className="reader-para" dangerouslySetInnerHTML={{ __html: para.html }} />
    );
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
        <style>{readerCSS}</style>
      </div>
    );
  }

  return (
    <div
      className="reader-overlay"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Always-visible close button — never hidden by HUD logic */}
      <button
        className={"reader-close-persistent" + (hudVisible ? " hud-open" : "")}
        onClick={onClose}
        aria-label="Close reader"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>

      {/* HUD top — title only, close button is separate */}
      <div className={"reader-hud-top" + (hudVisible ? " visible" : "")}>
        <div className="reader-hud-title">{book?.title}</div>
      </div>

      {/* Page content */}
      <div className="reader-page">
        <div className="reader-content">
          {renderPage(slots[1])}
        </div>
      </div>

      {/* HUD bottom — progress */}
      <div className={"reader-hud-bottom" + (hudVisible ? " visible" : "")}>
        <span className="reader-progress-text">{progress}%</span>
        <div className="reader-progress-track">
          <div className="reader-progress-fill" style={{ width: progress + "%" }} />
        </div>
        <span className="reader-page-text">{currentPage + 1} / {book?.totalPages}</span>
      </div>

      <style>{readerCSS}</style>
    </div>
  );
}

const readerCSS = `
  .reader-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: var(--bg, #f5f0e8);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
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
    animation: rspin 0.7s linear infinite;
  }
  @keyframes rspin { to { transform: rotate(360deg); } }

  /* Persistent close — always tappable */
  .reader-close-persistent {
    position: fixed;
    top: calc(env(safe-area-inset-top, 0px) + 12px);
    left: 12px;
    z-index: 20;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(245,240,232,0.85);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    color: var(--text, #2c2417);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    -webkit-tap-highlight-color: transparent;
    transition: opacity 0.2s ease;
    box-shadow: 0 1px 6px rgba(0,0,0,0.12);
  }
  .reader-close-persistent svg { width: 20px; height: 20px; }
  .reader-close-persistent.hud-open { opacity: 0; pointer-events: none; }

  /* HUD top */
  .reader-hud-top {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding-top: env(safe-area-inset-top, 0px);
    height: calc(env(safe-area-inset-top, 0px) + 56px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 12px;
    padding-left: 60px;
    padding-right: 16px;
    background: linear-gradient(to bottom, var(--bg, #f5f0e8) 50%, transparent);
    z-index: 10;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }
  .reader-hud-top.visible { opacity: 1; }

  .reader-hud-title {
    font-family: Georgia, serif;
    font-size: 14px;
    color: var(--text-muted, #9c8b78);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* HUD bottom */
  .reader-hud-bottom {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 20px calc(env(safe-area-inset-bottom, 0px) + 16px);
    display: flex;
    align-items: center;
    gap: 10px;
    background: linear-gradient(to top, var(--bg, #f5f0e8) 50%, transparent);
    z-index: 10;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }
  .reader-hud-bottom.visible { opacity: 1; }

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

  /* Page */
  .reader-page {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .reader-content {
    flex: 1;
    padding: 80px 28px 80px;
    overflow: hidden;
  }
  .reader-heading {
    font-family: Georgia, serif;
    font-size: 1.1em;
    font-weight: normal;
    color: var(--text, #2c2417);
    margin: 0 0 1.2em;
    line-height: 1.4;
    text-align: center;
  }
  .reader-para {
    font-family: Georgia, serif;
    font-size: var(--reader-font-size, 17px);
    line-height: 1.8;
    color: var(--text, #2c2417);
    margin: 0 0 0.9em;
    text-align: justify;
    hyphens: auto;
    -webkit-hyphens: auto;
  }
  .reader-para:last-child { margin-bottom: 0; }
`;
