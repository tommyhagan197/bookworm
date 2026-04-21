import { useState, useEffect, useRef, useCallback } from 'react';

export default function BibleReaderView({ book, chapterIndex, allBooks, onClose, onNavigate }) {
  const [chapter, setChapter] = useState(chapterIndex);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [highlights, setHighlights] = useState({});
  const [showVerseMenu, setShowVerseMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef(null);

  const verses = book.chapters[chapter] || [];
  const chapterNum = chapter + 1;
  const totalChapters = book.chapters.length;

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bw-bible-highlights');
      if (stored) setHighlights(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => { setChapter(chapterIndex); }, [chapterIndex]);

  const saveHighlights = useCallback((next) => {
    setHighlights(next);
    try { localStorage.setItem('bw-bible-highlights', JSON.stringify(next)); } catch {}
  }, []);

  const highlightKey = (v) => `${book.id}:${chapter}:${v}`;

  const handleVersePress = useCallback((verseIdx) => {
    if (selectedVerse === verseIdx) { setSelectedVerse(null); setShowVerseMenu(false); }
    else { setSelectedVerse(verseIdx); setShowVerseMenu(true); }
  }, [selectedVerse]);

  const handleHighlight = useCallback((color) => {
    if (selectedVerse === null) return;
    const key = highlightKey(selectedVerse);
    const next = { ...highlights };
    if (highlights[key] === color) { delete next[key]; } else { next[key] = color; }
    saveHighlights(next);
    setShowVerseMenu(false); setSelectedVerse(null);
  }, [selectedVerse, highlights, saveHighlights]);

  const handleCopy = useCallback(() => {
    if (selectedVerse === null) return;
    const text = `"${verses[selectedVerse]}" — ${book.name} ${chapterNum}:${selectedVerse + 1} (KJV)`;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => { setCopied(false); setShowVerseMenu(false); setSelectedVerse(null); }, 1200);
  }, [selectedVerse, verses, book, chapterNum]);

  const handleShare = useCallback(() => {
    if (selectedVerse === null) return;
    const text = `"${verses[selectedVerse]}" — ${book.name} ${chapterNum}:${selectedVerse + 1} (KJV)`;
    if (navigator.share) { navigator.share({ text }).catch(() => {}); }
    else { navigator.clipboard?.writeText(text).catch(() => {}); }
    setShowVerseMenu(false); setSelectedVerse(null);
  }, [selectedVerse, verses, book, chapterNum]);

  const goNext = useCallback(() => {
    setSelectedVerse(null); setShowVerseMenu(false);
    if (chapter < totalChapters - 1) { setChapter(c => c + 1); containerRef.current?.scrollTo(0, 0); }
    else if (onNavigate) {
      const bookIdx = allBooks.findIndex(b => b.id === book.id);
      if (bookIdx < allBooks.length - 1) onNavigate({ book: allBooks[bookIdx + 1], chapterIndex: 0, allBooks });
    }
  }, [chapter, totalChapters, allBooks, book, onNavigate]);

  const goPrev = useCallback(() => {
    setSelectedVerse(null); setShowVerseMenu(false);
    if (chapter > 0) { setChapter(c => c - 1); containerRef.current?.scrollTo(0, 0); }
    else if (onNavigate) {
      const bookIdx = allBooks.findIndex(b => b.id === book.id);
      if (bookIdx > 0) { const prev = allBooks[bookIdx - 1]; onNavigate({ book: prev, chapterIndex: prev.chapters.length - 1, allBooks }); }
    }
  }, [chapter, allBooks, book, onNavigate]);

  const HIGHLIGHT_COLORS = [
    { id: 'yellow', value: 'rgba(251,191,36,0.35)' },
    { id: 'green', value: 'rgba(134,188,118,0.35)' },
    { id: 'blue', value: 'rgba(96,165,250,0.35)' },
    { id: 'pink', value: 'rgba(251,113,133,0.35)' },
  ];

  return (
    <div className="bible-reader-root" onClick={showVerseMenu ? () => { setSelectedVerse(null); setShowVerseMenu(false); } : undefined}>
      <div className="bible-reader-topbar">
        <button className="bible-reader-close" onClick={onClose} onTouchEnd={(e) => { e.stopPropagation(); onClose(); }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="bible-reader-location">
          <span className="bible-reader-book-name">{book.name}</span>
          <span className="bible-reader-chapter-label">Chapter {chapterNum}</span>
        </div>
        <div style={{width:44}}/>
      </div>

      <div className="bible-reader-scroll" ref={containerRef}>
        <div className="bible-reader-chapter-heading">
          <div className="bible-reader-chapter-number">{chapterNum}</div>
          <div className="bible-reader-book-label">{book.name}</div>
        </div>

        <div className="bible-reader-verses">
          {verses.map((text, i) => {
            const key = highlightKey(i);
            const hlColor = highlights[key];
            const isSelected = selectedVerse === i;
            return (
              <span key={i} className={"bible-verse" + (isSelected ? ' selected' : '')}
                style={hlColor ? { background: hlColor } : undefined}
                onClick={(e) => { e.stopPropagation(); handleVersePress(i); }}>
                <sup className="bible-verse-num">{i + 1}</sup>{text}{' '}
              </span>
            );
          })}
        </div>

        <div className="bible-reader-chapter-nav">
          <button className="bible-chapter-nav-btn" onClick={goPrev}
            disabled={chapter === 0 && allBooks?.findIndex(b => b.id === book.id) === 0}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {chapter > 0 ? `Chapter ${chapter}` : 'Previous book'}
          </button>
          <div className="bible-chapter-nav-label">{chapter + 1} / {totalChapters}</div>
          <button className="bible-chapter-nav-btn next" onClick={goNext}
            disabled={chapter === totalChapters - 1 && allBooks?.findIndex(b => b.id === book.id) === allBooks.length - 1}>
            {chapter < totalChapters - 1 ? `Chapter ${chapter + 2}` : 'Next book'}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>

      {showVerseMenu && selectedVerse !== null && (
        <div className="bible-verse-menu" onClick={e => e.stopPropagation()}>
          <div className="bible-verse-menu-ref">{book.name} {chapterNum}:{selectedVerse + 1}</div>
          <div className="bible-verse-menu-highlights">
            {HIGHLIGHT_COLORS.map(({ id, value }) => (
              <button key={id} className="bible-hl-dot"
                style={{ background: value, border: highlights[highlightKey(selectedVerse)] === value ? '2px solid var(--ink,#3a2e1e)' : '2px solid transparent' }}
                onClick={() => handleHighlight(value)} />
            ))}
            {highlights[highlightKey(selectedVerse)] && (
              <button className="bible-hl-clear" onClick={() => handleHighlight(highlights[highlightKey(selectedVerse)])}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            )}
          </div>
          <div className="bible-verse-menu-actions">
            <button className="bible-verse-action-btn" onClick={handleCopy}>
              {copied ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M3 11V3a1 1 0 011-1h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button className="bible-verse-action-btn" onClick={handleShare}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11 1l4 4-4 4M15 5H6a4 4 0 000 8h1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Share
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
