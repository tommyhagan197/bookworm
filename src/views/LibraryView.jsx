import { useState, useEffect } from 'react';
import { dbGetAll, dbDelete, dbGetAllKeys, dbClear, STORE_BOOKS, STORE_PAGES } from '../db/index.js';

function escHtml(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

export default function LibraryView({ onOpenBook, onAddBook, onShowConfirm }) {
  const [books, setBooks] = useState([]);

  async function load() {
    const all = await dbGetAll(STORE_BOOKS);
    all.sort((a,b) => b.addedAt - a.addedAt);
    setBooks(all);
  }

  useEffect(() => { load(); }, []);

  // Expose reload for parent
  useEffect(() => {
    window.__reloadLibrary = load;
    return () => { delete window.__reloadLibrary; };
  }, []);

  async function handleDelete(bookId) {
    onShowConfirm('Delete Book?', 'This will remove the book and all reading progress.', 'Delete Book', async () => {
      await dbDelete(STORE_BOOKS, bookId);
      const allKeys = await dbGetAllKeys(STORE_PAGES);
      for (const key of allKeys.filter(k => k.startsWith(bookId + ':'))) await dbDelete(STORE_PAGES, key);
      load();
    });
  }

  if (books.length === 0) {
    return (
      <div id="library-view" className="view active">
        <div className="view-header">
          <h1>Library</h1>
          <div className="subtitle">Your books</div>
        </div>
        <div className="scroll-content">
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <h2>Your library is empty</h2>
            <p>Add your first EPUB to start reading. Free books are available at Project Gutenberg and Standard Ebooks.</p>
            <button className="empty-cta" onClick={onAddBook}>Add an EPUB</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="library-view" className="view active">
      <div className="view-header">
        <h1>Library</h1>
        <div className="subtitle">Your books</div>
      </div>
      <div className="scroll-content">
        <div className="book-grid">
          {books.map(book => {
            const pct = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
            const colorClass = book.colorIndex > 0 ? `color-${book.colorIndex}` : '';
            const isNew = book.currentPage === 0;
            const isDone = book.totalPages > 0 && book.currentPage >= book.totalPages - 1;
            const badgeClass = isNew ? 'badge-new' : isDone ? 'badge-done' : 'badge-progress';
            const badgeText = isNew ? 'NEW' : isDone ? '✓ Done' : `${pct}%`;
            return (
              <div key={book.id} className="book-card" onClick={() => onOpenBook(book.id)}>
                <div className="book-cover">
                  <div className={`book-cover-art ${colorClass}`} />
                  {book.coverUrl && (
                    <img className="book-cover-img" src={book.coverUrl} alt="" loading="lazy" onError={e => e.target.style.display='none'} />
                  )}
                  {!book.coverUrl && <div className="book-cover-title">{book.title}</div>}
                </div>
                <div className="book-progress-bar">
                  <div className="book-progress-fill" style={{width: `${pct}%`}} />
                </div>
                <div className="book-info">
                  <div className="book-title">{book.title}</div>
                  <div className="book-author">{book.author}</div>
                  <div className="book-meta">
                    <span className={`book-badge ${badgeClass}`}>{badgeText}</span>
                    <button className="book-delete" onClick={e => { e.stopPropagation(); handleDelete(book.id); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
