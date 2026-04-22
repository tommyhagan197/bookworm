import { useState, useEffect } from "react";
import { openDB } from "../db/idb";

const COVER_COLORS = [
  { bg: "#6B5344", spine: "#4a3228" },
  { bg: "#4A6741", spine: "#2e4228" },
  { bg: "#2D5A7B", spine: "#1a3a52" },
  { bg: "#7B4A6B", spine: "#522e47" },
  { bg: "#8B6234", spine: "#5c3f1e" },
  { bg: "#3D6B6B", spine: "#234444" },
  { bg: "#704214", spine: "#4a2a0a" },
  { bg: "#4A5A7B", spine: "#2e3a52" },
];

function coverColor(bookId) {
  const hash = bookId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COVER_COLORS[hash % COVER_COLORS.length];
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

function BookCover({ book }) {
  const colors = coverColor(book.id);
  const progress = book.progress || 0;

  return (
    <div style={{
      width: "100%",
      aspectRatio: "2/3",
      borderRadius: 6,
      overflow: "hidden",
      display: "flex",
      boxShadow: "4px 6px 16px rgba(0,0,0,0.28), inset -3px 0 8px rgba(0,0,0,0.15)",
      marginBottom: 8,
      position: "relative",
    }}>
      {/* Spine */}
      <div style={{
        width: 14,
        background: colors.spine,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: 1,
          height: "60%",
          background: "rgba(255,255,255,0.08)",
        }}/>
      </div>

      {/* Cover face */}
      <div style={{
        flex: 1,
        background: colors.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "14px 10px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Subtle texture overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%, rgba(0,0,0,0.12) 100%)",
          pointerEvents: "none",
        }}/>

        {/* Decorative top line */}
        <div style={{
          position: "absolute", top: 10, left: 12, right: 12,
          height: 1, background: "rgba(255,255,255,0.2)",
        }}/>

        {/* Title */}
        <div style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: 11,
          fontWeight: 600,
          color: "rgba(255,255,255,0.95)",
          textAlign: "center",
          lineHeight: 1.4,
          letterSpacing: "0.02em",
          zIndex: 1,
          marginBottom: 8,
          display: "-webkit-box",
          WebkitLineClamp: 5,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {book.title}
        </div>

        {/* Divider */}
        <div style={{
          width: 24, height: 1,
          background: "rgba(255,255,255,0.3)",
          marginBottom: 8, zIndex: 1,
        }}/>

        {/* Author */}
        {book.author && (
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 8,
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            zIndex: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {book.author}
          </div>
        )}

        {/* Decorative bottom line */}
        <div style={{
          position: "absolute", bottom: 10, left: 12, right: 12,
          height: 1, background: "rgba(255,255,255,0.2)",
        }}/>

        {/* Progress indicator */}
        {progress > 0 && progress < 1 && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: 3, background: "rgba(0,0,0,0.2)",
          }}>
            <div style={{
              width: Math.round(progress * 100) + "%",
              height: "100%",
              background: "rgba(255,255,255,0.5)",
            }}/>
          </div>
        )}
      </div>
    </div>
  );
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
          let pressTimer = null;
          return (
            <button
              key={book.id}
              className="shelf-card"
              onTouchStart={() => { pressTimer = setTimeout(() => handleLongPress(book), 600); }}
              onTouchEnd={() => clearTimeout(pressTimer)}
              onTouchMove={() => clearTimeout(pressTimer)}
              onClick={() => onOpenBook && onOpenBook(book.id)}
            >
              <BookCover book={book} />
              <div className="shelf-meta">
                <span className="shelf-title">{book.title}</span>
                {book.author && <span className="shelf-author">{book.author}</span>}
              </div>
            </button>
          );
        })}
      </div>

      {confirmDelete && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:100, padding:"0 0 40px" }}>
          <div style={{ background:"var(--surface)", borderRadius:20, padding:24, width:"calc(100% - 32px)", maxWidth:400, textAlign:"center" }}>
            <div style={{ fontFamily:"Georgia, serif", fontSize:17, marginBottom:6 }}>Remove "{confirmDelete.title}"?</div>
            <div style={{ fontSize:13, color:"var(--text-muted)", marginBottom:20 }}>This removes it from your shelf. You can re-add it anytime.</div>
            <button onClick={() => handleDelete(confirmDelete)} style={{ width:"100%", padding:14, borderRadius:12, background:"#ef5350", border:"none", color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer", marginBottom:10 }}>Remove</button>
            <button onClick={() => setConfirmDelete(null)} style={{ width:"100%", padding:14, borderRadius:12, background:"transparent", border:"none", color:"var(--text-muted)", fontSize:15, cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      <style>{`
        .shelf-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px 16px; align-items: start; }
        .shelf-card { background: none; border: none; cursor: pointer; text-align: left; padding: 0; -webkit-tap-highlight-color: transparent; width: 100%; }
        .shelf-meta { display: flex; flex-direction: column; gap: 2px; }
        .shelf-title { font-size: 12px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'Lora', Georgia, serif; }
        .shelf-author { font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'DM Sans', sans-serif; }
      `}</style>
    </div>
  );
}