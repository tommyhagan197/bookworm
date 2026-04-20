import { useState, useEffect } from "react";
import { openDB } from "../db/idb";

// Brand palette — 8 distinct cover colors from the BookWorm brand guide
const COVER_COLORS = [
  { bg: "#6B5344", label: "Walnut" },
  { bg: "#4A6741", label: "Moss" },
  { bg: "#2D5A7B", label: "Ink" },
  { bg: "#7B4A6B", label: "Foxglove" },
  { bg: "#8B6234", label: "Mustard" },
  { bg: "#3D6B6B", label: "Teal" },
  { bg: "#704214", label: "Leather" },
  { bg: "#4A5A7B", label: "Slate" },
];

function coverColor(bookId) {
  // Use the unique part of the bookId (the random suffix) to pick color
  const hash = bookId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COVER_COLORS[hash % COVER_COLORS.length].bg;
}

async function getAllBooks() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction("books", "readonly").objectStore("books").getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export default function ShelfView({ onOpenBook }) {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    getAllBooks().then(b => setBooks(b.sort((a, z) => z.addedAt - a.addedAt))).catch(console.error);
  }, []);

  if (books.length === 0) {
    return (
      <div className="view-container">
        <h1 className="view-header">Your Shelf</h1>
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <rect x="2" y="3" width="7" height="18" rx="1"/>
            <rect x="9.5" y="5" width="5" height="16" rx="1"/>
            <rect x="15.5" y="7" width="6.5" height="14" rx="1"/>
          </svg>
          <p>Your shelf is empty.<br/>Browse the Library to find your first book.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container">
      <h1 className="view-header">Your Shelf</h1>
      <p className="view-subhead">{books.length} {books.length === 1 ? "book" : "books"}</p>
      <div className="shelf-grid">
        {books.map((book) => {
          const bg = book.color || coverColor(book.id);
          const progress = book.progress || 0;
          return (
            <button
              key={book.id}
              className="shelf-card"
              onClick={() => onOpenBook && onOpenBook(book.id)}
            >
              <div className="shelf-cover" style={{ background: bg }}>
                <span className="shelf-cover-title">{book.title}</span>
                {book.author && <span className="shelf-cover-author">{book.author}</span>}
              </div>
              <div className="shelf-meta">
                <span className="shelf-title">{book.title}</span>
                {book.author && <span className="shelf-author">{book.author}</span>}
                {progress > 0 && (
                  <div className="shelf-progress-bar">
                    <div className="shelf-progress-fill" style={{ width: Math.round(progress * 100) + "%" }} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <style>{`
        .shelf-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .shelf-card {
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          padding: 0;
          -webkit-tap-highlight-color: transparent;
          width: 100%;
        }
        .shelf-cover {
          width: 100%;
          aspect-ratio: 2/3;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 10px 8px;
          box-shadow: 3px 4px 12px rgba(0,0,0,0.22);
          overflow: hidden;
          margin-bottom: 8px;
        }
        .shelf-cover-title {
          font-family: Georgia, serif;
          font-size: 10px;
          color: rgba(255,255,255,0.95);
          text-align: center;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .shelf-cover-author {
          font-size: 8px;
          color: rgba(255,255,255,0.6);
          text-align: center;
          margin-top: 5px;
        }
        .shelf-meta { display: flex; flex-direction: column; gap: 2px; }
        .shelf-title {
          font-size: 11px;
          font-weight: 500;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .shelf-author {
          font-size: 10px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .shelf-progress-bar {
          height: 2px;
          background: rgba(139,111,71,0.2);
          border-radius: 2px;
          margin-top: 5px;
          overflow: hidden;
        }
        .shelf-progress-fill {
          height: 100%;
          background: var(--accent);
          border-radius: 2px;
          transition: width 0.3s ease;
        }
      `}</style>
    </div>
  );
}
