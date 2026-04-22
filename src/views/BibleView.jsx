import { useState, useEffect, useCallback } from 'react';

const VOTD_POOL = [
  { ref: 'John 3:16', book: 'John', chapter: 3, verse: 16 },
  { ref: 'Psalm 23:1', book: 'Psalms', chapter: 23, verse: 1 },
  { ref: 'Philippians 4:13', book: 'Philippians', chapter: 4, verse: 13 },
  { ref: 'Romans 8:28', book: 'Romans', chapter: 8, verse: 28 },
  { ref: 'Jeremiah 29:11', book: 'Jeremiah', chapter: 29, verse: 11 },
  { ref: 'Proverbs 3:5', book: 'Proverbs', chapter: 3, verse: 5 },
  { ref: 'Isaiah 40:31', book: 'Isaiah', chapter: 40, verse: 31 },
  { ref: 'Matthew 6:33', book: 'Matthew', chapter: 6, verse: 33 },
  { ref: 'Psalm 46:10', book: 'Psalms', chapter: 46, verse: 10 },
  { ref: 'Romans 12:2', book: 'Romans', chapter: 12, verse: 2 },
  { ref: '2 Timothy 1:7', book: '2 Timothy', chapter: 1, verse: 7 },
  { ref: 'Ephesians 2:8', book: 'Ephesians', chapter: 2, verse: 8 },
  { ref: 'Psalm 27:1', book: 'Psalms', chapter: 27, verse: 1 },
  { ref: 'Matthew 28:19', book: 'Matthew', chapter: 28, verse: 19 },
  { ref: 'Hebrews 11:1', book: 'Hebrews', chapter: 11, verse: 1 },
];

const getDayVOTD = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const day = Math.floor((now - start) / 86400000);
  return VOTD_POOL[day % VOTD_POOL.length];
};

const POPULAR_BOOKS = [
  { name: 'Psalms',    desc: 'Songs & prayers' },
  { name: 'John',      desc: 'The Gospel of John' },
  { name: 'Proverbs',  desc: 'Wisdom literature' },
  { name: 'Romans',    desc: "Paul's letter to Rome" },
  { name: 'Genesis',   desc: 'In the beginning' },
  { name: 'Matthew',   desc: 'The Gospel of Matthew' },
];

export default function BibleView({ onOpenChapter }) {
  const [bibleData, setBibleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('home');
  const [selectedBook, setSelectedBook] = useState(null);
  const [testament, setTestament] = useState('OT');
  const [votdText, setVotdText] = useState('');
  const votd = getDayVOTD();

  useEffect(() => {
    fetch('/bible-kjv.json')
      .then(r => { if (!r.ok) throw new Error('not found'); return r.json(); })
      .then(data => {
        setBibleData(data);
        const book = data.books.find(b => b.name === votd.book);
        if (book) {
          const text = book.chapters[votd.chapter - 1]?.[votd.verse - 1];
          if (text) setVotdText(text);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleBookSelect = useCallback((book) => {
    setSelectedBook(book);
    setView('chapters');
  }, []);

  const handleChapterSelect = useCallback((chapterIndex) => {
    if (!selectedBook || !onOpenChapter) return;
    onOpenChapter({ book: selectedBook, chapterIndex, allBooks: bibleData.books });
  }, [selectedBook, bibleData, onOpenChapter]);

  const openVotdChapter = useCallback(() => {
    if (!bibleData) return;
    const book = bibleData.books.find(b => b.name === votd.book);
    if (book) onOpenChapter({ book, chapterIndex: votd.chapter - 1, allBooks: bibleData.books });
  }, [bibleData, votd, onOpenChapter]);

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 0', gap:16 }}>
      <div style={{ width:28, height:28, border:'2.5px solid rgba(139,111,71,0.2)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
      <p style={{ color:'var(--text-muted)', fontSize:14, fontFamily:"'DM Sans', sans-serif" }}>Loading Scripture…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!bibleData) return (
    <div style={{ padding:32, textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>
      Could not load Bible data.
    </div>
  );

  /* ── CHAPTERS VIEW ── */
  if (view === 'chapters' && selectedBook) {
    return (
      <div style={{ paddingBottom: 40 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24 }}>
          <button onClick={() => setView('books')} style={backBtnStyle}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Books
          </button>
        </div>
        <h2 style={{ fontFamily:"'Lora', Georgia, serif", fontSize:26, color:'var(--text)', marginBottom:6 }}>{selectedBook.name}</h2>
        <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:24, fontFamily:"'DM Sans', sans-serif" }}>{selectedBook.chapters.length} chapters</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:10 }}>
          {selectedBook.chapters.map((_, i) => (
            <button key={i} onClick={() => handleChapterSelect(i)} style={chapterBtnStyle}>
              {i + 1}
            </button>
          ))}
        </div>
        <style>{sharedStyles}</style>
      </div>
    );
  }

  /* ── BOOKS LIST VIEW ── */
  if (view === 'books') {
    const filtered = bibleData.books.filter(b => b.testament === testament);
    return (
      <div style={{ paddingBottom: 40 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24 }}>
          <button onClick={() => setView('home')} style={backBtnStyle}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Bible
          </button>
        </div>

        {/* Testament toggle */}
        <div style={{ display:'flex', background:'var(--surface)', borderRadius:10, padding:3, marginBottom:24, border:'1px solid rgba(139,111,71,0.15)' }}>
          {['OT','NT'].map(t => (
            <button key={t} onClick={() => setTestament(t)} style={{
              flex:1, padding:'8px 0', borderRadius:8, border:'none', cursor:'pointer',
              fontFamily:"'DM Sans', sans-serif", fontSize:14, fontWeight:500,
              background: testament === t ? 'var(--accent)' : 'transparent',
              color: testament === t ? '#fff' : 'var(--text-muted)',
              transition:'all 0.15s',
            }}>
              {t === 'OT' ? 'Old Testament' : 'New Testament'}
            </button>
          ))}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {filtered.map(book => (
            <button key={book.id} onClick={() => handleBookSelect(book)} style={bookRowStyle}>
              <span style={{ fontFamily:"'Lora', Georgia, serif", fontSize:16, color:'var(--text)' }}>{book.name}</span>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:12, color:'var(--text-muted)', fontFamily:"'DM Sans', sans-serif" }}>{book.chapters.length} ch</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </button>
          ))}
        </div>
        <style>{sharedStyles}</style>
      </div>
    );
  }

  /* ── HOME VIEW ── */
  return (
    <div style={{ paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:6, marginTop:8 }}>
        <div style={{ width:48, height:48, borderRadius:12, background:'#4a2e10', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width="22" height="30" viewBox="0 0 22 30" fill="none">
            <rect x="8.5" y="0" width="5" height="30" rx="2" fill="rgba(255,255,255,0.9)"/>
            <rect x="1" y="8" width="20" height="5" rx="2" fill="rgba(255,255,255,0.9)"/>
          </svg>
        </div>
        <div>
          <h1 style={{ fontFamily:"'Lora', Georgia, serif", fontSize:26, color:'var(--text)', margin:0, lineHeight:1.1 }}>Holy Bible</h1>
          <p style={{ fontSize:13, color:'var(--text-muted)', margin:0, fontFamily:"'DM Sans', sans-serif" }}>King James Version</p>
        </div>
      </div>

      {/* Verse of the Day */}
      {votdText && (
        <div style={{ background:'var(--surface)', borderRadius:14, padding:'18px 18px 14px', marginBottom:24, border:'1px solid rgba(139,111,71,0.15)', marginTop:20 }}>
          <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.08em', color:'var(--accent)', fontFamily:"'DM Sans', sans-serif", marginBottom:10, textTransform:'uppercase' }}>Verse of the Day</div>
          <p style={{ fontFamily:"'Lora', Georgia, serif", fontSize:16, color:'var(--text)', lineHeight:1.65, margin:'0 0 12px', fontStyle:'italic' }}>"{votdText}"</p>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:13, color:'var(--text-muted)', fontFamily:"'DM Sans', sans-serif" }}>— {votd.ref}</span>
            <button onClick={openVotdChapter} style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'none', color:'var(--accent)', fontSize:13, fontFamily:"'DM Sans', sans-serif", cursor:'pointer', padding:'4px 0', fontWeight:500 }}>
              Read chapter
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5h8M7 3.5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Browse */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.08em', color:'var(--text-muted)', fontFamily:"'DM Sans', sans-serif", marginBottom:12, textTransform:'uppercase' }}>Browse</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[
            { t:'OT', label:'Old Testament', count:'39 books', icon:'📜' },
            { t:'NT', label:'New Testament', count:'27 books', icon:'✝️' },
          ].map(({ t, label, count, icon }) => (
            <button key={t} onClick={() => { setTestament(t); setView('books'); }} style={quickCardStyle}>
              <span style={{ fontSize:22, marginBottom:6 }}>{icon}</span>
              <span style={{ fontFamily:"'Lora', Georgia, serif", fontSize:15, color:'var(--text)', fontWeight:600 }}>{label}</span>
              <span style={{ fontSize:12, color:'var(--text-muted)', fontFamily:"'DM Sans', sans-serif", marginTop:2 }}>{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Popular */}
      <div>
        <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.08em', color:'var(--text-muted)', fontFamily:"'DM Sans', sans-serif", marginBottom:12, textTransform:'uppercase' }}>Popular</div>
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {POPULAR_BOOKS.map(({ name, desc }) => {
            const book = bibleData.books.find(b => b.name === name);
            if (!book) return null;
            return (
              <button key={name} onClick={() => handleBookSelect(book)} style={bookRowStyle}>
                <div>
                  <div style={{ fontFamily:"'Lora', Georgia, serif", fontSize:16, color:'var(--text)' }}>{name}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:"'DM Sans', sans-serif", marginTop:2 }}>{desc}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            );
          })}
        </div>
      </div>

      <style>{sharedStyles}</style>
    </div>
  );
}

const backBtnStyle = {
  display:'flex', alignItems:'center', gap:4,
  background:'none', border:'none', color:'var(--accent)',
  fontSize:15, fontFamily:"'DM Sans', sans-serif",
  cursor:'pointer', padding:'4px 0', fontWeight:500,
};

const chapterBtnStyle = {
  padding:'14px 0', borderRadius:10,
  background:'var(--surface)', border:'1px solid rgba(139,111,71,0.15)',
  color:'var(--text)', fontSize:16, fontFamily:"'Lora', Georgia, serif",
  cursor:'pointer', transition:'background 0.15s',
  WebkitTapHighlightColor:'transparent',
};

const bookRowStyle = {
  display:'flex', alignItems:'center', justifyContent:'space-between',
  padding:'14px 16px', borderRadius:10,
  background:'var(--surface)', border:'1px solid rgba(139,111,71,0.1)',
  cursor:'pointer', textAlign:'left', marginBottom:6,
  WebkitTapHighlightColor:'transparent', transition:'opacity 0.15s',
};

const quickCardStyle = {
  display:'flex', flexDirection:'column', alignItems:'flex-start',
  padding:'16px', borderRadius:12,
  background:'var(--surface)', border:'1px solid rgba(139,111,71,0.15)',
  cursor:'pointer', textAlign:'left',
  WebkitTapHighlightColor:'transparent',
};

const sharedStyles = `
  @keyframes spin { to { transform: rotate(360deg); } }
  button:active { opacity: 0.75; }
`;