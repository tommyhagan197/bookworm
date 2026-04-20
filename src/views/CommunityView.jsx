import { useState, useEffect } from "react";

const GUTENDEX_BASE = "https://gutendex.com/books";
const COVER_COLORS = [
  "#6B5234","#4A6741","#2D5A7B","#7B4A6B","#6B6234","#3D6B6B","#7B5A3D","#4A4A7B"
];
function coverColor(id) { return COVER_COLORS[Math.abs(id) % COVER_COLORS.length]; }

const MOCK_CLUBS = [
  { id: 1, name: "Victorian Classics", members: 142, currentBook: "Middlemarch", emoji: "🏛️" },
  { id: 2, name: "Sci-Fi Explorers",   members: 89,  currentBook: "The Time Machine", emoji: "🚀" },
  { id: 3, name: "Philosophy Circle",  members: 67,  currentBook: "Thus Spoke Zarathustra", emoji: "🦁" },
];

export default function CommunityView() {
  const [trending, setTrending] = useState([]);
  const [activeSection, setActiveSection] = useState("trending"); // trending | clubs

  useEffect(() => {
    if (activeSection === "trending" && trending.length === 0) fetchTrending();
  }, [activeSection]);

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
      <h1 className="view-header">Community</h1>

      {/* Section toggle */}
      <div className="comm-toggle">
        <button
          className={"comm-toggle-btn" + (activeSection === "trending" ? " active" : "")}
          onClick={() => setActiveSection("trending")}
        >Trending</button>
        <button
          className={"comm-toggle-btn" + (activeSection === "clubs" ? " active" : "")}
          onClick={() => setActiveSection("clubs")}
        >Book Clubs</button>
      </div>

      {activeSection === "trending" && (
        <>
          <p className="view-subhead">Most read on Project Gutenberg right now</p>
          <div className="comm-trending-grid">
            {trending.length === 0
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="comm-trending-skeleton" />
                ))
              : trending.map((book, i) => (
                  <div key={book.id} className="comm-trending-card">
                    <div className="comm-rank">#{i + 1}</div>
                    <div className="comm-trending-cover" style={{ background: coverColor(book.id) }}>
                      <span className="comm-cover-title">{book.title}</span>
                    </div>
                    <div className="comm-trending-title">{book.title}</div>
                    <div className="comm-trending-author">{book.authors?.[0]?.name || "Unknown"}</div>
                  </div>
                ))
            }
          </div>
        </>
      )}

      {activeSection === "clubs" && (
        <>
          <p className="view-subhead">Groups reading together — join anytime</p>
          <div className="clubs-list">
            {MOCK_CLUBS.map(club => (
              <div key={club.id} className="club-card">
                <div className="club-emoji">{club.emoji}</div>
                <div className="club-info">
                  <div className="club-name">{club.name}</div>
                  <div className="club-now">Now reading: <em>{club.currentBook}</em></div>
                  <div className="club-members">{club.members} members</div>
                </div>
                <button className="club-join-btn">Join</button>
              </div>
            ))}
            <div className="club-coming-soon">
              More clubs &amp; live discussion coming soon.
            </div>
          </div>
        </>
      )}

      <style>{`
        .comm-toggle {
          display: flex;
          gap: 0;
          background: var(--surface);
          border-radius: 10px;
          padding: 3px;
          margin-bottom: 16px;
          border: 1px solid rgba(139,111,71,0.12);
        }
        .comm-toggle-btn {
          flex: 1;
          padding: 8px 0;
          background: none;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .comm-toggle-btn.active {
          background: var(--accent);
          color: #fff;
        }
        .comm-trending-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .comm-trending-skeleton {
          aspect-ratio: 2/3;
          background: var(--surface);
          border-radius: 8px;
          animation: pulse 1.4s ease-in-out infinite;
        }
        @keyframes pulse {
          0%,100% { opacity: 1; } 50% { opacity: 0.5; }
        }
        .comm-trending-card {
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: relative;
        }
        .comm-rank {
          position: absolute;
          top: 6px;
          left: 6px;
          background: rgba(0,0,0,0.55);
          color: #fff;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 5px;
          border-radius: 4px;
          z-index: 1;
        }
        .comm-trending-cover {
          aspect-ratio: 2/3;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px 6px;
          box-shadow: 2px 3px 8px rgba(0,0,0,0.18);
        }
        .comm-cover-title {
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
        .comm-trending-title {
          font-size: 11px;
          font-weight: 500;
          color: var(--text);
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .comm-trending-author {
          font-size: 10px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .clubs-list { display: flex; flex-direction: column; gap: 10px; }
        .club-card {
          display: flex;
          align-items: center;
          gap: 14px;
          background: var(--surface);
          border-radius: 14px;
          padding: 16px;
          border: 1px solid rgba(139,111,71,0.1);
        }
        .club-emoji {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(139,111,71,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }
        .club-info { flex: 1; min-width: 0; }
        .club-name { font-family: Georgia, serif; font-size: 16px; color: var(--text); margin-bottom: 2px; }
        .club-now { font-size: 12px; color: var(--text-muted); }
        .club-now em { font-style: italic; color: var(--text); }
        .club-members { font-size: 11px; color: var(--text-muted); margin-top: 3px; }
        .club-join-btn {
          padding: 7px 14px;
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          flex-shrink: 0;
          -webkit-tap-highlight-color: transparent;
        }
        .club-coming-soon {
          text-align: center;
          font-size: 13px;
          color: var(--text-muted);
          padding: 16px 0 4px;
        }
      `}</style>
    </div>
  );
}
