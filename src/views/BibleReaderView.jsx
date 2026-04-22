import { useState, useEffect, useRef, useCallback } from 'react';

const HIGHLIGHT_COLORS = [
  { id: 'yellow', value: 'rgba(251,191,36,0.32)' },
  { id: 'green',  value: 'rgba(134,188,118,0.32)' },
  { id: 'blue',   value: 'rgba(96,165,250,0.32)' },
  { id: 'pink',   value: 'rgba(251,113,133,0.32)' },
];

export default function BibleReaderView({ book, chapterIndex, allBooks, onClose, onNavigate }) {
  const [chapter, setChapter] = useState(chapterIndex);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [showVerseMenu, setShowVerseMenu] = useState(false);
  const [highlights, setHighlights] = useState({});
  const [copied, setCopied] = useState(false);
  const [swipeDir, setSwipeDir] = useState(null); // 'left' | 'right' | null
  const scrollRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const verses = book.chapters[chapter] || [];
  const chapterNum = chapter + 1;
  const totalChapters = book.chapters.length;
  const bookIdx = allBooks?.findIndex(b => b.id === book.id) ?? -1;

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bw-bible-highlights');
      if (stored) setHighlights(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    setChapter(chapterIndex);
    scrollRef.current?.scrollTo(0, 0);
  }, [chapterIndex]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [chapter]);

  const saveHighlights = useCallback((next) => {
    setHighlights(next);
    try { localStorage.setItem('bw-bible-highlights', JSON.stringify(next)); } catch {}
  }, []);

  const hlKey = (v) => `${book.id}:${chapter}:${v}`;

  const goNext = useCallback(() => {
    setSelectedVerse(null); setShowVerseMenu(false);
    if (chapter < totalChapters - 1) {
      setChapter(c => c + 1);
    } else if (onNavigate && bookIdx < allBooks.length - 1) {
      onNavigate({ book: allBooks[bookIdx + 1], chapterIndex: 0, allBooks });
    }
  }, [chapter, totalChapters, bookIdx, allBooks, onNavigate]);

  const goPrev = useCallback(() => {
    setSelectedVerse(null); setShowVerseMenu(false);
    if (chapter > 0) {
      setChapter(c => c - 1);
    } else if (onNavigate && bookIdx > 0) {
      const prev = allBooks[bookIdx - 1];
      onNavigate({ book: prev, chapterIndex: prev.chapters.length - 1, allBooks });
    }
  }, [chapter, bookIdx, allBooks, onNavigate]);

  // Swipe gesture handling
  const onTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    // Only count as horizontal swipe if dx > 60 and mostly horizontal
    if (Math.abs(dx) > 60 && Math.abs(dx) > dy * 1.5) {
      if (dx < 0) { setSwipeDir('left'); setTimeout(() => setSwipeDir(null), 300); goNext(); }
      else        { setSwipeDir('right'); setTimeout(() => setSwipeDir(null), 300); goPrev(); }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [goNext, goPrev]);

  const handleVersePress = useCallback((i) => {
    if (selectedVerse === i) { setSelectedVerse(null); setShowVerseMenu(false); }
    else { setSelectedVerse(i); setShowVerseMenu(true); }
  }, [selectedVerse]);

  const handleHighlight = useCallback((color) => {
    if (selectedVerse === null) return;
    const key = hlKey(selectedVerse);
    const next = { ...highlights };
    if (highlights[key] === color) delete next[key]; else next[key] = color;
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
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else navigator.clipboard?.writeText(text).catch(() => {});
    setShowVerseMenu(false); setSelectedVerse(null);
  }, [selectedVerse, verses, book, chapterNum]);

  const dismissMenu = useCallback(() => {
    if (showVerseMenu) { setSelectedVerse(null); setShowVerseMenu(false); }
  }, [showVerseMenu]);

  const canGoPrev = chapter > 0 || bookIdx > 0;
  const canGoNext = chapter < totalChapters - 1 || (bookIdx >= 0 && bookIdx < allBooks.length - 1);

  return (
    <div style={rootStyle} onClick={dismissMenu}>

      {/* Top bar */}
      <div style={topbarStyle}>
        <button style={closeStyle} onClick={onClose}
          onTouchEnd={(e) => { e.stopPropagation(); onClose(); }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={locationStyle}>
          <span style={{ fontFamily:"'Lora', Georgia, serif", fontSize:15, color:'var(--text)', fontWeight:600 }}>{book.name}</span>
          <span style={{ fontSize:12, color:'var(--text-muted)', fontFamily:"'DM Sans', sans-serif", marginTop:1 }}>Chapter {chapterNum} of {totalChapters}</span>
        </div>
        <div style={{ width:44 }}/>
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        style={scrollStyle}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Chapter heading */}
        <div style={headingStyle}>
          <div style={chapterNumStyle}>{chapterNum}</div>
          <div style={bookNameStyle}>{book.name}</div>
        </div>

        {/* Verses — flowing paragraph style */}
        <div style={versesStyle} onClick={(e) => e.stopPropagation()}>
          {verses.map((text, i) => {
            const key = hlKey(i);
            const hlColor = highlights[key];
            const isSelected = selectedVerse === i;
            return (
              <span
                key={i}
                onClick={(e) => { e.stopPropagation(); handleVersePress(i); }}
                style={{
                  ...verseStyle,
                  background: isSelected ? 'rgba(224,124,58,0.18)' : hlColor || 'transparent',
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <sup style={verseNumStyle}>{i + 1}</sup>
                {text}{' '}
              </span>
            );
          })}
        </div>

        {/* Bottom chapter navigation */}
        <div style={bottomNavStyle}>
          <button
            style={{ ...navBtnStyle, opacity: canGoPrev ? 1 : 0.3 }}
            disabled={!canGoPrev}
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {chapter > 0 ? `Chapter ${chapter}` : 'Prev book'}
          </button>
          <span style={{ fontSize:13, color:'var(--text-muted)', fontFamily:"'DM Sans', sans-serif" }}>
            {chapterNum} / {totalChapters}
          </span>
          <button
            style={{ ...navBtnStyle, flexDirection:'row-reverse', opacity: canGoNext ? 1 : 0.3 }}
            disabled={!canGoNext}
            onClick={(e) => { e.stopPropagation(); goNext(); }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {chapter < totalChapters - 1 ? `Chapter ${chapter + 2}` : 'Next book'}
          </button>
        </div>

        <div style={{ height: 60 }}/>
      </div>

      {/* Verse action menu */}
      {showVerseMenu && selectedVerse !== null && (
        <div style={verseMenuStyle} onClick={(e) => e.stopPropagation()}>
          <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:"'DM Sans', sans-serif", marginBottom:10, fontWeight:600 }}>
            {book.name} {chapterNum}:{selectedVerse + 1}
          </div>
          {/* Highlight colors */}
          <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center' }}>
            {HIGHLIGHT_COLORS.map(({ id, value }) => (
              <button key={id} onClick={() => handleHighlight(value)} style={{
                width:28, height:28, borderRadius:'50%', border:'none', cursor:'pointer',
                background: value,
                boxShadow: highlights[hlKey(selectedVerse)] === value ? '0 0 0 2px var(--accent)' : '0 0 0 1px rgba(139,111,71,0.2)',
              }}/>
            ))}
            {highlights[hlKey(selectedVerse)] && (
              <button onClick={() => handleHighlight(highlights[hlKey(selectedVerse)])} style={{
                width:28, height:28, borderRadius:'50%', border:'1px solid rgba(139,111,71,0.2)',
                background:'var(--surface)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2l8 8M10 2L2 10" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
          {/* Actions */}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleCopy} style={actionBtnStyle}>
              {copied
                ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5 6-6" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4" y="4" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 10V3a1 1 0 011-1h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
              }
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={handleShare} style={actionBtnStyle}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M10 1l3 3-3 3M13 4H5a3 3 0 000 6h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Share
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const rootStyle = {
  position:'fixed', inset:0, background:'var(--bg)', zIndex:300,
  display:'flex', flexDirection:'column', overflow:'hidden',
};

const topbarStyle = {
  display:'flex', alignItems:'center', justifyContent:'space-between',
  padding:'56px 16px 12px',
  borderBottom:'1px solid rgba(139,111,71,0.12)',
  flexShrink:0,
};

const closeStyle = {
  width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center',
  background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer',
  WebkitTapHighlightColor:'transparent',
};

const locationStyle = {
  display:'flex', flexDirection:'column', alignItems:'center',
};

const scrollStyle = {
  flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch',
  padding:'0 22px',
};

const headingStyle = {
  paddingTop:36, paddingBottom:24, textAlign:'center',
  borderBottom:'1px solid rgba(139,111,71,0.15)',
  marginBottom:28,
};

const chapterNumStyle = {
  fontFamily:"'Lora', Georgia, serif",
  fontSize:56, fontWeight:700,
  color:'var(--text)', lineHeight:1,
  marginBottom:6,
};

const bookNameStyle = {
  fontFamily:"'DM Sans', sans-serif",
  fontSize:13, letterSpacing:'0.1em', textTransform:'uppercase',
  color:'var(--text-muted)',
};

const versesStyle = {
  fontSize:19,
  lineHeight:1.85,
  fontFamily:"'Lora', Georgia, serif",
  color:'var(--text)',
  letterSpacing:'0.01em',
};

const verseStyle = {
  display:'inline',
};

const verseNumStyle = {
  fontSize:10,
  fontFamily:"'DM Sans', sans-serif",
  color:'var(--accent)',
  fontWeight:700,
  verticalAlign:'super',
  marginRight:2,
  letterSpacing:'0.02em',
};

const bottomNavStyle = {
  display:'flex', alignItems:'center', justifyContent:'space-between',
  paddingTop:40, paddingBottom:16,
  borderTop:'1px solid rgba(139,111,71,0.12)',
  marginTop:32,
};

const navBtnStyle = {
  display:'flex', alignItems:'center', gap:6,
  background:'none', border:'none', cursor:'pointer',
  color:'var(--accent)', fontSize:13,
  fontFamily:"'DM Sans', sans-serif", fontWeight:500,
  WebkitTapHighlightColor:'transparent', padding:'8px 0',
};

const verseMenuStyle = {
  position:'absolute', bottom:0, left:0, right:0,
  background:'var(--surface)',
  borderTop:'1px solid rgba(139,111,71,0.15)',
  borderRadius:'16px 16px 0 0',
  padding:'16px 20px 40px',
  zIndex:400,
};

const actionBtnStyle = {
  display:'flex', alignItems:'center', gap:6,
  padding:'8px 16px', borderRadius:8,
  background:'var(--bg)', border:'1px solid rgba(139,111,71,0.2)',
  color:'var(--text)', fontSize:13,
  fontFamily:"'DM Sans', sans-serif", cursor:'pointer',
};