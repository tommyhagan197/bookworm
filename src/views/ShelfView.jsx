import { useState, useEffect } from "react";
import { openDB } from "../db/idb";

const COVER_COLORS = [
  { bg: "#6B5344" }, { bg: "#4A6741" }, { bg: "#2D5A7B" }, { bg: "#7B4A6B" },
  { bg: "#8B6234" }, { bg: "#3D6B6B" }, { bg: "#704214" }, { bg: "#4A5A7B" },
];

function coverColor(bookId) {
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

async function deleteBook(bookId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["books", "pages"], "readwrite");
    tx.objectStore("books").delete(bookId);
    const pageStore = tx.objectStore("pages");
    const req = pageStore.openCursor();
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        if (cursor.key.startsWith(bookId + ":")) cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export default function ShelfView({ onOpenBook }) {
  const [books, setBooks] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    getAllBooks()
      .then(b => setBooks(b.filter(x => x.type !== "published").sort((a, z) => z.addedAt - a.addedAt)))
      .catch(console.error);
  }, []);

  function handleLongPress(book) { setConfirmDelete(book); }

  async function handleDelete(book) {
    await deleteBook(book.id);
    setBooks(b => b.filter(x => x.id !== book.id));
    setConfirmDelete(null);
  }

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
          let pressTimer = null;
          return (
            <button
              key={book.id}
              className="shelf-card"
              onTouchStart={() => { pressTimer = setTimeout(() => handleLongPress(book), 600); }}
              onTouchEnd={() => { clearTimeout(pressTimer); }}
              onTouchMove={() => { clearTimeout(pressTimer); }}
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

      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100, padding: "0 0 40px" }}>
          <div style={{ background: "var(--surface)", borderRadius: "20px", padding: "24px", width: "calc(100% - 32px)", maxWidth: "400px", textAlign: "center" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: "17px", marginBottom: "6px" }}>Remove "{confirmDelete.title}"?</div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>This removes it from your shelf. You can re-add it anytime.</div>
            <button onClick={() => handleDelete(confirmDelete)} style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "#ef5350", border: "none", color: "#fff", fontSize: "15px", fontWeight: "600", cursor: "pointer", marginBottom: "10px" }}>Remove</button>
            <button onClick={() => setConfirmDelete(null)} style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "15px", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      <style>{`
        .shelf-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; align-items: start; }
        .shelf-card { background: none; border: none; cursor: pointer; text-align: left; padding: 0; -webkit-tap-highlight-color: transparent; width: 100%; }
        .shelf-cover { width: 100%; height: 180px; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 8px; box-shadow: 3px 4px 12px rgba(0,0,0,0.22); overflow: hidden; margin-bottom: 8px; }
        .shelf-cover-title { font-family: Georgia, serif; font-size: 10px; color: rgba(255,255,255,0.95); text-align: center; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
        .shelf-cover-author { font-size: 8px; color: rgba(255,255,255,0.6); text-align: center; margin-top: 5px; }
        .shelf-meta { display: flex; flex-direction: column; gap: 2px; }
        .shelf-title { font-size: 11px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .shelf-author { font-size: 10px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .shelf-progress-bar { height: 2px; background: rgba(139,111,71,0.2); border-radius: 2px; margin-top: 5px; overflow: hidden; }
        .shelf-progress-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.3s ease; }
      `}</style>
    </div>
  );
}
