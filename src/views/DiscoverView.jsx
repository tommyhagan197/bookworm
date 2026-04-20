import { useState, useEffect } from "react";

const GUTENDEX_BASE = "https://gutendex.com/books";

const COVER_COLORS = [
  "#6B5344","#4A6741","#2D5A7B","#7B4A6B","#8B6234","#3D6B6B","#704214","#4A5A7B"
];

function coverColor(title) {
  const hash = (title || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COVER_COLORS[hash % COVER_COLORS.length];
}

const GENRES = ["Literary Fiction","Mystery","Science Fiction","History","Philosophy","Poetry","Romance","Biography"];

export default function DiscoverView() {
  const [trending, setTrending] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);

  useEffect(() => {
    fetchTrending();
  }, []);

  async function fetchTrending() {
    try {
      const res = await fetch(`${GUTENDEX_BASE}?sort=popular&languages=en`);
      const data = await res.json();
      setTrending(data.results.slice(0, 12));
    } catch (e) {
      console.error("Trending fetch failed", e);
    }
  }

  return (
    <div className="view-container">
      <h1 className="view-header">Discover</h1>

      {/* Genre pills */}
      <div className="discover-genres">
        {GENRES.map(g => (
          <button
            key={g}
            className={"genre-pill" + (selectedGenre === g ? " active" : "")}
            onClick={() => setSelectedGenre(selectedGenre === g ? null : g)}
          >{g}</button>
        ))}
      </div>

      {/* Trending */}
      <div className="discover-section-label">Most read on BookWorm</div>
      <div className="discover-grid">
        {trending.length === 0
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="discover-skeleton" />
            ))
          : trending.map((book, i) => (
              <div key={book.id} className="discover-card">
                <div className="discover-rank">#{i + 1}</div>
                <div className="discover-cover" style={{ background: coverColor(book.title) }}>
                  <span className="discover-cover-title">{book.title}</span>
                </div>
                <div className="discover-title">{book.title}</div>
                <div className="discover-author">{book.authors?.[0]?.name || "Unknown"}</div>
              </div>
            ))
        }
      </div>

      <style>{`
        .discover-genres {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }
        .genre-pill {
          background: var(--surface);
          border: 1px solid rgba(139,111,71,0.25);
          border-radius: 20px;
          padding: 6px 14px;
          font-size: 13px;
          color: var(--text);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: all 0.15s;
        }
        .genre-pill.active {
          background: var(--accent);
          color: #fff;
          border-color: var(--accent);
        }
        .discover-section-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin-bottom: 14px;
        }
        .discover-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .discover-skeleton {
          aspect-ratio: 2/3;
          background: var(--surface);
          border-radius: 8px;
          animation: pulse 1.4s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .discover-card {
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: relative;
        }
        .discover-rank {
          position: absolute;
          top: 6px;
          left: 6px;
          background: rgba(0,0,0,0.5);
          color: #fff;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 5px;
          border-radius: 4px;
          z-index: 1;
        }
        .discover-cover {
          aspect-ratio: 2/3;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px 6px;
          box-shadow: 2px 3px 8px rgba(0,0,0,0.18);
        }
        .discover-cover-title {
          font-family: Georgia, serif;
          font-size: 8px;
          color: rgba(255,255,255,0.92);
          text-align: center;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 5;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .discover-title {
          font-size: 11px;
          font-weight: 500;
          color: var(--text);
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .discover-author {
          font-size: 10px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
}
