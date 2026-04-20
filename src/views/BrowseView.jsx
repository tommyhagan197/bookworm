import { useState, useEffect, useRef } from 'react';
import { dbGetAll, STORE_BOOKS } from '../db/index.js';
import { processEpubBuffer } from '../reader/pipeline.js';

const PROXY_BASE = 'https://bookworm-proxy.tommyhagan197.workers.dev';
const GUTENDEX_BASE = 'https://gutendex.com/books';
const POPULAR_IDS = [1342, 84, 11, 1661, 2701, 98, 345, 174, 76, 5200];

function pickEpubUrl(formats) {
  if (!formats) return null;
  const epubs = Object.entries(formats).filter(([mime]) => mime.toLowerCase().includes('epub+zip')).map(([,url]) => url);
  if (!epubs.length) return null;
  return epubs.find(u => /noimages/i.test(u)) || epubs[0];
}

function pickCoverUrl(formats) {
  if (!formats) return null;
  for (const [mime, url] of Object.entries(formats)) {
    if (typeof url === 'string' && mime.toLowerCase().startsWith('image/')) return url;
  }
  return null;
}

function formatDownloads(n) {
  if (typeof n !== 'number' || n < 0 || !isFinite(n)) return '';
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1).replace(/\.0$/,'') + 'M downloads';
  if (n >= 1_000) return (n/1_000).toFixed(1).replace(/\.0$/,'') + 'k downloads';
  return n.toLocaleString() + ' downloads';
}

export default function BrowseView({ onShowToast, active }) {
  const [results, setResults] = useState([]);
  const [sectionLabel, setSectionLabel] = useState('Popular Classics');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [libraryIds, setLibraryIds] = useState(new Set());
  const [downloading, setDownloading] = useState({});
  const abortRef = useRef(null);
  const searchTimer = useRef(null);
  const inited = useRef(false);

  async function loadLibraryIds() {
    const books = await dbGetAll(STORE_BOOKS);
    setLibraryIds(new Set(books.filter(b => typeof b.gutenbergId === 'number').map(b => b.gutenbergId)));
  }

  async function loadPopular() {
    setLoading(true); setError(false);
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    try {
      const resp = await fetch(`${GUTENDEX_BASE}?ids=${POPULAR_IDS.join(',')}`, { signal: abortRef.current.signal });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      const byId = new Map((data.results||[]).map(b => [b.id, b]));
      setResults(POPULAR_IDS.map(id => byId.get(id)).filter(Boolean).filter(b => pickEpubUrl(b.formats)));
      setSectionLabel('Popular Classics');
      setLoading(false);
    } catch(e) {
      if (e.name === 'AbortError') return;
      setError(true); setLoading(false);
    }
  }

  async function doSearch(q) {
    setLoading(true); setError(false);
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    try {
      const resp = await fetch(`${GUTENDEX_BASE}?search=${encodeURIComponent(q)}`, { signal: abortRef.current.signal });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      const res = (data.results||[]).slice(0,30).filter(b => pickEpubUrl(b.formats));
      setResults(res);
      setSectionLabel(`Results for "${q}"`);
      setLoading(false);
    } catch(e) {
      if (e.name === 'AbortError') return;
      setError(true); setLoading(false);
    }
  }

  useEffect(() => {
    if (active && !inited.current) {
      inited.current = true;
      loadLibraryIds();
      loadPopular();
    }
  }, [active]);

  function onInput(e) {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(searchTimer.current);
    if (!v.trim()) { loadPopular(); return; }
    if (v.trim().length < 2) return;
    searchTimer.current = setTimeout(() => doSearch(v.trim()), 400);
  }

  function clearSearch() {
    setQuery('');
    loadPopular();
  }

  async function handleDownload(book) {
    if (libraryIds.has(book.id)) { onShowToast('Already in your library'); return; }
    const epubUrl = pickEpubUrl(book.formats);
    const coverUrl = pickCoverUrl(book.formats);
    const author = (book.authors && book.authors[0] && book.authors[0].name) || 'Unknown author';
    setDownloading(d => ({...d, [book.id]: true}));
    try {
      const proxyUrl = `${PROXY_BASE}/?url=${encodeURIComponent(epubUrl)}`;
      const resp = await fetch(proxyUrl);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const buffer = await resp.arrayBuffer();
      if (!buffer || buffer.byteLength < 1000) throw new Error('Empty response');
      await processEpubBuffer(buffer, book.title + '.epub', {
        silent: true,
        gutenbergId: book.id,
        metaTitle: book.title,
        metaAuthor: author,
        coverUrl: coverUrl || undefined
      });
      setLibraryIds(s => new Set([...s, book.id]));
      onShowToast('Added to Library');
      if (window.__reloadLibrary) window.__reloadLibrary();
    } catch(e) {
      console.error('[Browse] download failed:', e);
      onShowToast('Download failed. Try again.');
    }
    setDownloading(d => ({...d, [book.id]: false}));
  }

  const colorClasses = ['','color-1','color-2','color-3','color-4','color-5'];

  return (
    <div id="browse-view" className="view active">
      <div className="view-header">
        <h1>Free Classics</h1>
        <div className="subtitle">70,000+ public domain books</div>
      </div>
      <div className="browse-search-wrap">
        <svg className="browse-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="search"
          className="browse-search"
          placeholder="Search by title or author"
          value={query}
          onChange={onInput}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        {query && (
          <button type="button" className="browse-search-clear show" onClick={clearSearch} aria-label="Clear search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        )}
      </div>
      <div className="scroll-content" id="browse-scroll">
        {loading && (
          <div className="browse-list">
            {[1,2,3].map(i => (
              <div key={i} className="browse-skeleton">
                <div className="skeleton-cover" />
                <div className="skeleton-lines">
                  <div className="skeleton-line w1" /><div className="skeleton-line w2" /><div className="skeleton-line w3" />
                </div>
                <div className="skeleton-btn" />
              </div>
            ))}
          </div>
        )}
        {!loading && error && (
          <div className="browse-status">
            <div className="browse-status-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
            </div>
            <h3>Couldn't connect</h3>
            <p>Check your connection and try again.</p>
            <button type="button" className="browse-retry-btn" onClick={query.trim() ? () => doSearch(query.trim()) : loadPopular}>Retry</button>
          </div>
        )}
        {!loading && !error && results.length === 0 && (
          <div className="browse-status">
            <div className="browse-status-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </div>
            <h3>No books found{query ? ` for "${query}"` : ''}</h3>
            <p>Try a different title or author — for example, "dickens" or "frankenstein".</p>
          </div>
        )}
        {!loading && !error && results.length > 0 && (
          <>
            <div className="browse-section-label">{sectionLabel}</div>
            <div className="browse-list">
              {results.map(book => {
                const author = (book.authors && book.authors[0] && book.authors[0].name) || 'Unknown author';
                const coverUrl = pickCoverUrl(book.formats);
                const colorClass = colorClasses[book.id % 6];
                const inLib = libraryIds.has(book.id);
                const isDown = downloading[book.id];
                return (
                  <div key={book.id} className="browse-card">
                    <div className={`browse-card-cover ${colorClass}`}>
                      {coverUrl && <img className="browse-cover-img" src={coverUrl} alt="" loading="lazy" onError={e => e.target.style.display='none'} />}
                    </div>
                    <div className="browse-card-body">
                      <div className="browse-card-title">{book.title}</div>
                      <div className="browse-card-author">{author}</div>
                      {book.download_count > 0 && <div className="browse-card-downloads">{formatDownloads(book.download_count)}</div>}
                    </div>
                    {inLib ? (
                      <button className="browse-card-btn in-library" disabled>✓ In Library</button>
                    ) : (
                      <button
                        className={`browse-card-btn${isDown ? ' loading' : ''}`}
                        onClick={() => handleDownload(book)}
                        disabled={isDown}
                      >
                        {isDown ? (
                          <svg className="browse-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeWidth="2.5" strokeLinecap="round"/>
                          </svg>
                        ) : 'Add to Library'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
