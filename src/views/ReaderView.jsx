// src/views/ReaderView.jsx
// Pixel-accurate paginator: measures real rendered paragraph heights,
// fills pages to exactly fit the screen. Swipe = page turn. Tap = HUD.

import { useState, useEffect, useRef, useCallback } from "react";
import { openDB, dbGet, dbPut } from "../db/idb";

// ── DB helpers ────────────────────────────────────────────────────────────────

async function getBook(bookId) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction("books", "readonly").objectStore("books").get(bookId);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function getChapter(bookId, chapterIdx) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction("chapters", "readonly").objectStore("chapters").get(`${bookId}:${chapterIdx}`);
    req.onsuccess = () => res(req.result?.paras || null);
    req.onerror = () => rej(req.error);
  });
}

// Legacy support: books imported before schema v2
async function getLegacyPage(bookId, pageIndex) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction("pages", "readonly").objectStore("pages").get(`${bookId}:${pageIndex}`);
    req.onsuccess = () => res(req.result?.content || []);
    req.onerror = () => rej(req.error);
  });
}

async function saveProgress(bookId, globalPage, totalPages, chapter, pageInChapter) {
  const db = await openDB();
  const tx = db.transaction("books", "readwrite");
  const store = tx.objectStore("books");
  const req = store.get(bookId);
  req.onsuccess = () => {
    const book = req.result;
    if (book) {
      book.currentPage = globalPage;
      book.currentChapter = chapter;
      book.pageInChapter = pageInChapter;
      book.totalPages = totalPages;
      book.progress = totalPages > 1 ? globalPage / (totalPages - 1) : 1;
      store.put(book);
    }
  };
}

// ── Pixel-accurate paginator ──────────────────────────────────────────────────
// Renders each paragraph into a hidden div with the exact reader CSS,
// measures real pixel height, greedily fills pages.

function paginateParas(paras, availableHeight, fontSize, lineHeight, paraGap, paddingH) {
  if (!paras || paras.length === 0) return [];

  // Create hidden measurement container
  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed;
    top: -9999px;
    left: 0;
    width: calc(100vw - ${paddingH * 2}px);
    font-family: 'Lora', Georgia, serif;
    font-size: ${fontSize}px;
    line-height: ${lineHeight};
    visibility: hidden;
    pointer-events: none;
    box-sizing: border-box;
  `;
  document.body.appendChild(container);

  const pages = [];
  let currentPage = [];
  let currentHeight = 0;

  for (const para of paras) {
    const el = document.createElement(para.isHeading ? "h2" : "p");
    el.innerHTML = para.html;
    el.style.cssText = para.isHeading
      ? `margin: 0 0 ${paraGap * 0.6}px; font-size: ${fontSize * 1.1}px; font-weight: normal; text-align: center; line-height: 1.4;`
      : `margin: 0 0 ${paraGap}px; text-align: justify; hyphens: auto; -webkit-hyphens: auto;`;
    container.appendChild(el);
    const h = el.getBoundingClientRect().height + paraGap;
    container.removeChild(el);

    if (currentHeight + h > availableHeight && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [];
      currentHeight = 0;
    }
    currentPage.push(para);
    currentHeight += h;
  }
  if (currentPage.length > 0) pages.push(currentPage);

  document.body.removeChild(container);
  return pages;
}

// ── Main component ────────────────────────────────────────────────────────────

const FONT_SIZES = [14, 16, 18, 20, 22];
const LINE_HEIGHTS = [1.6, 1.75, 1.9];
const PADDING_H = 28;
const PADDING_V = 80; // top + bottom HUD space

export default function ReaderView({ bookId, onClose }) {
  const [book, setBook] = useState(null);
  const [pages, setPages] = useState([]); // all pages for current chapter
  const [pageIndex, setPageIndex] = useState(0); // within current chapter
  const [chapterIndex, setChapterIndex] = useState(0);
  const [globalPage, setGlobalPage] = useState(0);
  const [totalGlobalPages, setTotalGlobalPages] = useState(1);
  const [hudVisible, setHudVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [repaginating, setRepaginating] = useState(false);
  const [fontSizeIdx, setFontSizeIdx] = useState(2); // default 19px
  const [lineHeightIdx, setLineHeightIdx] = useState(1); // default 1.75
  const [showSettings, setShowSettings] = useState(false);
  const [isLegacy, setIsLegacy] = useState(false);

  // Legacy mode state
  const [legacyPage, setLegacyPage] = useState(0);
  const [legacySlots, setLegacySlots] = useState([[], [], []]);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const hudTimer = useRef(null);
  const bookRef = useRef(null);
  const chapterCacheRef = useRef({}); // { chapterIdx: pages[] }
  const globalPageOffsets = useRef([]); // [startGlobalPage per chapter]

  const fontSize = FONT_SIZES[fontSizeIdx];
  const lineHeight = LINE_HEIGHTS[lineHeightIdx];
  const availableHeight = window.innerHeight - PADDING_V * 2 - 40;

  // ── Load book ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!bookId) return;
    setLoading(true);
    getBook(bookId).then(async b => {
      if (!b) return;
      bookRef.current = b;
      setBook(b);

      // Legacy book (pre-chapter schema)
      if (!b.schemaVersion || b.schemaVersion < 2) {
        setIsLegacy(true);
        const startPage = b.currentPage || 0;
        setLegacyPage(startPage);
        const [prev, cur, next] = await Promise.all([
          startPage > 0 ? getLegacyPage(bookId, startPage - 1) : Promise.resolve([]),
          getLegacyPage(bookId, startPage),
          startPage < b.totalPages - 1 ? getLegacyPage(bookId, startPage + 1) : Promise.resolve([]),
        ]);
        setLegacySlots([prev, cur, next]);
        setLoading(false);
        return;
      }

      // New schema
      const startChapter = b.currentChapter || 0;
      const startPageInChapter = b.pageInChapter || 0;
      setChapterIndex(startChapter);
      await loadChapter(b, startChapter, startPageInChapter);
      setLoading(false);
    });
  }, [bookId]);

  // ── Load + paginate a chapter ──────────────────────────────────────────────

  const loadChapter = useCallback(async (b, chapIdx, startPage = 0) => {
    const bk = b || bookRef.current;
    if (!bk) return;

    // Cache hit
    if (chapterCacheRef.current[chapIdx]) {
      const cached = chapterCacheRef.current[chapIdx];
      setPages(cached);
      setPageIndex(Math.min(startPage, cached.length - 1));
      return;
    }

    setRepaginating(true);
    const paras = await getChapter(bookId, chapIdx);
    if (!paras) { setRepaginating(false); return; }

    const paginated = paginateParas(paras, availableHeight, fontSize, lineHeight, fontSize * 0.9, PADDING_H);
    chapterCacheRef.current[chapIdx] = paginated;
    setPages(paginated);
    setPageIndex(Math.min(startPage, paginated.length - 1));
    setRepaginating(false);
  }, [bookId, availableHeight, fontSize, lineHeight]);

  // ── Re-paginate when font size changes ────────────────────────────────────

  useEffect(() => {
    if (isLegacy || loading || !bookRef.current) return;
    chapterCacheRef.current = {}; // bust cache
    loadChapter(bookRef.current, chapterIndex, 0);
  }, [fontSizeIdx, lineHeightIdx]);

  // ── Navigation ─────────────────────────────────────────────────────────────

  const goNextPage = useCallback(async () => {
    const b = bookRef.current;
    if (!b) return;

    if (pageIndex < pages.length - 1) {
      const next = pageIndex + 1;
      setPageIndex(next);
      setGlobalPage(g => g + 1);
      saveProgress(bookId, globalPage + 1, totalGlobalPages, chapterIndex, next);
    } else if (chapterIndex < b.totalChapters - 1) {
      // Next chapter
      const nextChap = chapterIndex + 1;
      setChapterIndex(nextChap);
      await loadChapter(b, nextChap, 0);
      setPageIndex(0);
      setGlobalPage(g => g + 1);
    }
  }, [pageIndex, pages, chapterIndex, globalPage, totalGlobalPages, bookId, loadChapter]);

  const goPrevPage = useCallback(async () => {
    const b = bookRef.current;
    if (!b) return;

    if (pageIndex > 0) {
      const prev = pageIndex - 1;
      setPageIndex(prev);
      setGlobalPage(g => Math.max(0, g - 1));
      saveProgress(bookId, Math.max(0, globalPage - 1), totalGlobalPages, chapterIndex, prev);
    } else if (chapterIndex > 0) {
      // Previous chapter — go to its last page
      const prevChap = chapterIndex - 1;
      setChapterIndex(prevChap);
      const b2 = bookRef.current;
      let cached = chapterCacheRef.current[prevChap];
      if (!cached) {
        const paras = await getChapter(bookId, prevChap);
        cached = paginateParas(paras, availableHeight, fontSize, lineHeight, fontSize * 0.9, PADDING_H);
        chapterCacheRef.current[prevChap] = cached;
      }
      setPages(cached);
      const lastPage = cached.length - 1;
      setPageIndex(lastPage);
      setGlobalPage(g => Math.max(0, g - 1));
    }
  }, [pageIndex, pages, chapterIndex, globalPage, totalGlobalPages, bookId, availableHeight, fontSize, lineHeight]);

  // ── Legacy navigation ──────────────────────────────────────────────────────

  const legacyGoTo = useCallback(async (newPage) => {
    const b = bookRef.current;
    if (!b || newPage < 0 || newPage >= b.totalPages) return;
    const [prev, cur, next] = await Promise.all([
      newPage > 0 ? getLegacyPage(bookId, newPage - 1) : Promise.resolve([]),
      getLegacyPage(bookId, newPage),
      newPage < b.totalPages - 1 ? getLegacyPage(bookId, newPage + 1) : Promise.resolve([]),
    ]);
    setLegacySlots([prev, cur, next]);
    setLegacyPage(newPage);
    saveProgress(bookId, newPage, b.totalPages, 0, newPage);
  }, [bookId]);

  // ── Touch handling ─────────────────────────────────────────────────────────

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;

    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      toggleHud();
      return;
    }

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 35) {
      if (showSettings) { setShowSettings(false); return; }
      if (dx < 0) isLegacy ? legacyGoTo(legacyPage + 1) : goNextPage();
      else isLegacy ? legacyGoTo(legacyPage - 1) : goPrevPage();
    }
  }

  function toggleHud() {
    if (showSettings) { setShowSettings(false); setHudVisible(false); return; }
    setHudVisible(v => {
      clearTimeout(hudTimer.current);
      if (!v) hudTimer.current = setTimeout(() => setHudVisible(false), 4000);
      return !v;
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  function renderParas(content) {
    if (!content || content.length === 0) return null;
    return content.map((para, i) =>
      para.isHeading
        ? <h2 key={i} className="rdr-heading" dangerouslySetInnerHTML={{ __html: para.html }} />
        : <p key={i} className="rdr-para" dangerouslySetInnerHTML={{ __html: para.html }} />
    );
  }

  const currentContent = isLegacy ? legacySlots[1] : (pages[pageIndex] || []);
  const currentPageNum = isLegacy ? legacyPage : globalPage;
  const totalPageNum = isLegacy ? (bookRef.current?.totalPages || 1) : totalGlobalPages;
  const progress = totalPageNum > 1 ? Math.round((currentPageNum / (totalPageNum - 1)) * 100) : 100;

  if (loading) {
    return (
      <div className="rdr-overlay">
        <div className="rdr-loading">
          <div className="rdr-spinner"/>
          <p>Opening book…</p>
        </div>
        <style>{css(fontSize, lineHeight)}</style>
      </div>
    );
  }

  return (
    <div className="rdr-overlay" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* Close button */}
      <button
        className={"rdr-close" + (hudVisible ? " hud-open" : "")}
        onTouchEnd={e => { e.stopPropagation(); onClose(); }}
        onClick={onClose}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>

      {/* HUD top */}
      <div className={"rdr-hud-top" + (hudVisible ? " visible" : "")}>
        <div className="rdr-title">{book?.title}</div>
      </div>

      {/* Page content */}
      <div className="rdr-page">
        {repaginating ? (
          <div className="rdr-repaginating">
            <div className="rdr-spinner"/>
          </div>
        ) : (
          <div className="rdr-content">
            {renderParas(currentContent)}
          </div>
        )}
      </div>

      {/* HUD bottom */}
      <div className={"rdr-hud-bottom" + (hudVisible ? " visible" : "")}>
        <div className="rdr-hud-row">
          <span className="rdr-prog-text">{progress}%</span>
          <div className="rdr-prog-track">
            <div className="rdr-prog-fill" style={{ width: progress + "%" }}/>
          </div>
          <span className="rdr-page-count">{currentPageNum + 1} / {totalPageNum}</span>
          <button className="rdr-settings-btn" onClick={e => { e.stopPropagation(); setShowSettings(s => !s); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </button>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="rdr-settings-panel" onClick={e => e.stopPropagation()}>
            <div className="rdr-settings-row">
              <span className="rdr-settings-label">Text size</span>
              <div className="rdr-btn-group">
                {FONT_SIZES.map((sz, i) => (
                  <button key={i} className={"rdr-sz-btn" + (fontSizeIdx === i ? " active" : "")}
                    onClick={() => setFontSizeIdx(i)}>
                    {["S","M","L","XL","XXL"][i]}
                  </button>
                ))}
              </div>
            </div>
            <div className="rdr-settings-row">
              <span className="rdr-settings-label">Spacing</span>
              <div className="rdr-btn-group">
                {LINE_HEIGHTS.map((lh, i) => (
                  <button key={i} className={"rdr-sz-btn" + (lineHeightIdx === i ? " active" : "")}
                    onClick={() => setLineHeightIdx(i)}>
                    {["Tight","Normal","Airy"][i]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{css(fontSize, lineHeight)}</style>
    </div>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────────

function css(fontSize, lineHeight) {
  return `
    .rdr-overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: var(--bg, #f5f0e8);
      display: flex; flex-direction: column; overflow: hidden;
      touch-action: none; user-select: none; -webkit-user-select: none;
    }
    .rdr-loading, .rdr-repaginating {
      flex: 1; display: flex; align-items: center; justify-content: center;
      flex-direction: column; gap: 16px;
      color: var(--text-muted, #9c8b78); font-size: 15px;
    }
    .rdr-spinner {
      width: 28px; height: 28px;
      border: 2.5px solid rgba(139,111,71,0.2);
      border-top-color: var(--accent, #8b6f47);
      border-radius: 50%;
      animation: rspin 0.7s linear infinite;
    }
    @keyframes rspin { to { transform: rotate(360deg); } }

    .rdr-close {
      position: fixed;
      top: calc(env(safe-area-inset-top, 0px) + 12px);
      left: 12px; z-index: 20;
      width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(245,240,232,0.9);
      border: none; border-radius: 50%; cursor: pointer;
      color: var(--text, #2c2417);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      -webkit-tap-highlight-color: transparent;
      transition: opacity 0.2s;
      box-shadow: 0 1px 6px rgba(0,0,0,0.12);
    }
    .rdr-close svg { width: 20px; height: 20px; }
    .rdr-close.hud-open { opacity: 0; pointer-events: none; }

    .rdr-hud-top {
      position: fixed; top: 0; left: 0; right: 0;
      padding-top: env(safe-area-inset-top, 0px);
      height: calc(env(safe-area-inset-top, 0px) + 56px);
      display: flex; align-items: flex-end; justify-content: center;
      padding-bottom: 12px; padding-left: 60px; padding-right: 16px;
      background: linear-gradient(to bottom, var(--bg, #f5f0e8) 60%, transparent);
      z-index: 10; opacity: 0; pointer-events: none; transition: opacity 0.2s;
    }
    .rdr-hud-top.visible { opacity: 1; }
    .rdr-title {
      font-family: Georgia, serif; font-size: 13px;
      color: var(--text-muted, #9c8b78);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    .rdr-hud-bottom {
      position: fixed; bottom: 0; left: 0; right: 0;
      padding: 12px 16px calc(env(safe-area-inset-bottom, 0px) + 16px);
      background: linear-gradient(to top, var(--bg, #f5f0e8) 60%, transparent);
      z-index: 10; opacity: 0; pointer-events: none; transition: opacity 0.2s;
    }
    .rdr-hud-bottom.visible { opacity: 1; pointer-events: auto; }

    .rdr-hud-row {
      display: flex; align-items: center; gap: 10px;
    }
    .rdr-prog-text, .rdr-page-count {
      font-size: 12px; color: var(--text-muted, #9c8b78); min-width: 32px;
      font-family: 'DM Sans', sans-serif;
    }
    .rdr-page-count { text-align: right; min-width: 48px; }
    .rdr-prog-track {
      flex: 1; height: 2px; background: rgba(139,111,71,0.2);
      border-radius: 2px; overflow: hidden;
    }
    .rdr-prog-fill {
      height: 100%; background: var(--accent, #8b6f47);
      border-radius: 2px; transition: width 0.3s;
    }
    .rdr-settings-btn {
      background: none; border: none; cursor: pointer;
      color: var(--text-muted, #9c8b78); padding: 4px;
      -webkit-tap-highlight-color: transparent;
    }
    .rdr-settings-btn svg { width: 18px; height: 18px; display: block; }

    .rdr-settings-panel {
      margin-top: 14px;
      padding: 14px 16px;
      background: var(--surface, #ede8df);
      border-radius: 12px;
      border: 1px solid rgba(139,111,71,0.12);
    }
    .rdr-settings-row {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 10px;
    }
    .rdr-settings-row:last-child { margin-bottom: 0; }
    .rdr-settings-label {
      font-size: 13px; color: var(--text-muted, #9c8b78);
      font-family: 'DM Sans', sans-serif;
    }
    .rdr-btn-group { display: flex; gap: 6px; }
    .rdr-sz-btn {
      padding: 5px 10px; border-radius: 6px;
      border: 1px solid rgba(139,111,71,0.2);
      background: transparent;
      color: var(--text-muted, #9c8b78);
      font-size: 12px; font-family: 'DM Sans', sans-serif;
      cursor: pointer; transition: all 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .rdr-sz-btn.active {
      background: var(--accent, #8b6f47);
      border-color: var(--accent, #8b6f47);
      color: #fff;
    }

    .rdr-page {
      flex: 1; overflow: hidden;
      display: flex; flex-direction: column;
    }
    .rdr-content {
      flex: 1;
      padding: ${PADDING_V}px ${PADDING_H}px;
      overflow: hidden;
    }
    .rdr-heading {
      font-family: 'Lora', Georgia, serif;
      font-size: ${fontSize * 1.1}px;
      font-weight: normal;
      color: var(--text, #2c2417);
      margin: 0 0 ${fontSize * 0.6}px;
      line-height: 1.4;
      text-align: center;
    }
    .rdr-para {
      font-family: 'Lora', Georgia, serif;
      font-size: ${fontSize}px;
      line-height: ${lineHeight};
      color: var(--text, #2c2417);
      margin: 0 0 ${fontSize * 0.9}px;
      text-align: justify;
      hyphens: auto;
      -webkit-hyphens: auto;
    }
    .rdr-para:last-child { margin-bottom: 0; }
  `;
}

