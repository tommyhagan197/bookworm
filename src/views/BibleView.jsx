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
      .then(r => { if (!r.ok) throw new Error('Bible data not found'); return r.json(); })
      .then(data => {
        setBibleData(data);
        const book = data.books.find(b => b.name === votd.book);
        if (book) {
          const text = book.chapters[votd.chapter - 1]?.[votd.verse - 1];
          if (text) setVotdText(text);
        }
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const handleBookSelect = useCallback((book) => { setSelectedBook(book); setView('chapters'); }, []);

  const handleChapterSelect = useCallback((chapterIndex) => {
    if (!selectedBook || !onOpenChapter) return;
    onOpenChapter({ book: selectedBook, chapterIndex, allBooks: bibleData.books });
  }, [selectedBook, bibleData, onOpenChapter]);

  if (loading) return (
    <div className="bible-loading">
      <div className="bible-loading-cross">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="13" y="2" width="6" height="28" rx="2" fill="var(--accent)"/>
          <rect x="2" y="11" width="28" height="6" rx="2" fill="var(--accent)"/>
        </svg>
      </div>
      <p>Loading Scripture...</p>
    </div>
  );

  if (error) return (
    <div className="bible-error">
      <p>Could not load Bible data.</p>
      <p className="bible-error-detail">Run: <code>node /tmp/buildbible.js</code></p>
    </div>
  );

  if (view === 'chapters' && selectedBook) {
    return (
      <div className="bible-view">
        <div className="bible-nav-header">
          <button className="bible-back-btn" onClick={() => setView('books')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Books
          </button>
          <h2 className="bible-nav-title">{selectedBook.name}</h2>
          <div style={{width:60}}/>
        </div>
        <div className="bible-chapter-grid">
          {selectedBook.chapters.map((_, i) => (
            <button key={i} className="bible-chapter-btn" onClick={() => handleChapterSelect(i)}>{i + 1}</button>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'books') {
    const filtered = bibleData.books.filter(b => b.testament === testament);
    return (
      <div className="bible-view">
        <div className="bible-nav-header">
          <button className="bible-back-btn" onClick={() => setView('home')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Bible
          </button>
          <div className="bible-testament-toggle">
            <button className={"bible-testament-btn" + (testament === 'OT' ? ' active' : '')} onClick={() => setTestament('OT')}>Old Testament</button>
            <button className={"bible-testament-btn" + (testament === 'NT' ? ' active' : '')} onClick={() => setTestament('NT')}>New Testament</button>
          </div>
          <div style={{width:60}}/>
        </div>
        <div className="bible-books-list">
          {filtered.map(book => (
            <button key={book.id} className="bible-book-row" onClick={() => handleBookSelect(book)}>
              <span className="bible-book-abbrev">{book.abbrev}</span>
              <span className="bible-book-name">{book.name}</span>
              <span className="bible-book-chapters">{book.chapters.length} ch</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="bible-book-chevron"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bible-view">
      <div className="bible-home-header">
        <div className="bible-home-title-row">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="11" y="2" width="6" height="24" rx="2" fill="var(--accent)"/>
            <rect x="2" y="11" width="24" height="6" rx="2" fill="var(--accent)"/>
          </svg>
          <h1 className="bible-home-title">Holy Bible</h1>
        </div>
        <p className="bible-home-translation">King James Version</p>
      </div>

      {votdText && (
        <div className="bible-votd-card">
          <div className="bible-votd-label">Verse of the Day</div>
          <p className="bible-votd-text">"{votdText}"</p>
          <div className="bible-votd-ref-row">
            <span className="bible-votd-ref">— {votd.ref}</span>
            <button className="bible-votd-read" onClick={() => {
              const book = bibleData.books.find(b => b.name === votd.book);
              if (book) onOpenChapter({ book, chapterIndex: votd.chapter - 1, allBooks: bibleData.books });
            }}>
              Read chapter
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      )}

      <div className="bible-quick-section">
        <h3 className="bible-section-label">Browse</h3>
        <div className="bible-quick-grid">
          <button className="bible-quick-card" onClick={() => { setTestament('OT'); setView('books'); }}>
            <span className="bible-quick-icon">📜</span>
            <span className="bible-quick-name">Old Testament</span>
            <span className="bible-quick-count">39 books</span>
          </button>
          <button className="bible-quick-card" onClick={() => { setTestament('NT'); setView('books'); }}>
            <span className="bible-quick-icon">✝</span>
            <span className="bible-quick-name">New Testament</span>
            <span className="bible-quick-count">27 books</span>
          </button>
        </div>
      </div>

      <div className="bible-quick-section">
        <h3 className="bible-section-label">Popular</h3>
        <div className="bible-popular-list">
          {[{name:'Psalms',desc:'Songs and prayers'},{name:'John',desc:'The Gospel of John'},{name:'Proverbs',desc:'Wisdom literature'},{name:'Romans',desc:"Paul's letter to Rome"},{name:'Genesis',desc:'In the beginning'},{name:'Matthew',desc:'The Gospel of Matthew'}].map(({name,desc}) => {
            const book = bibleData.books.find(b => b.name === name);
            if (!book) return null;
            return (
              <button key={name} className="bible-popular-row" onClick={() => handleBookSelect(book)}>
                <div>
                  <div className="bible-popular-name">{name}</div>
                  <div className="bible-popular-desc">{desc}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
