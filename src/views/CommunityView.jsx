import { useState } from "react";

const MOCK_CLUBS = [
  { id: 1, name: "Victorian Classics", members: 142, currentBook: "Middlemarch", emoji: "🏛️", genre: "Literary Fiction" },
  { id: 2, name: "Sci-Fi Explorers",   members: 89,  currentBook: "The Time Machine", emoji: "🚀", genre: "Science Fiction" },
  { id: 3, name: "Philosophy Circle",  members: 67,  currentBook: "Thus Spoke Zarathustra", emoji: "🦁", genre: "Philosophy" },
  { id: 4, name: "Mystery & Noir",     members: 54,  currentBook: "The Moonstone", emoji: "🔍", genre: "Mystery" },
];

const MOCK_FRIENDS = [
  { id: 1, name: "Sarah K.", reading: "Pride and Prejudice", progress: 62, avatar: "S" },
  { id: 2, name: "Marcus T.", reading: "Moby Dick", progress: 23, avatar: "M" },
  { id: 3, name: "Priya R.", reading: "Frankenstein", progress: 88, avatar: "P" },
];

export default function CommunityView() {
  const [activeSection, setActiveSection] = useState("clubs");

  return (
    <div className="view-container">
      <h1 className="view-header">Community</h1>

      <div className="comm-toggle">
        <button
          className={"comm-toggle-btn" + (activeSection === "clubs" ? " active" : "")}
          onClick={() => setActiveSection("clubs")}
        >Book Clubs</button>
        <button
          className={"comm-toggle-btn" + (activeSection === "friends" ? " active" : "")}
          onClick={() => setActiveSection("friends")}
        >Friends</button>
      </div>

      {activeSection === "clubs" && (
        <>
          <p className="view-subhead">Read together, discuss weekly.</p>
          <div className="clubs-list">
            {MOCK_CLUBS.map(club => (
              <div key={club.id} className="club-card">
                <div className="club-emoji">{club.emoji}</div>
                <div className="club-info">
                  <div className="club-name">{club.name}</div>
                  <div className="club-genre">{club.genre}</div>
                  <div className="club-now">Now reading: <em>{club.currentBook}</em></div>
                  <div className="club-members">{club.members} members</div>
                </div>
                <button className="club-join-btn">Join</button>
              </div>
            ))}
            <div className="clubs-coming-soon">
              Create your own club — coming soon.
            </div>
          </div>
        </>
      )}

      {activeSection === "friends" && (
        <>
          <p className="view-subhead">What your friends are reading.</p>
          <div className="friends-list">
            {MOCK_FRIENDS.map(f => (
              <div key={f.id} className="friend-card">
                <div className="friend-avatar">{f.avatar}</div>
                <div className="friend-info">
                  <div className="friend-name">{f.name}</div>
                  <div className="friend-reading">Reading <em>{f.reading}</em></div>
                  <div className="friend-progress-wrap">
                    <div className="friend-progress-bar">
                      <div className="friend-progress-fill" style={{ width: f.progress + "%" }} />
                    </div>
                    <span className="friend-pct">{f.progress}%</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="clubs-coming-soon">
              Add friends — coming soon.
            </div>
          </div>
        </>
      )}

      <style>{`
        .comm-toggle {
          display: flex;
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
        .comm-toggle-btn.active { background: var(--accent); color: #fff; }

        /* Clubs */
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
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(139,111,71,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }
        .club-info { flex: 1; min-width: 0; }
        .club-name { font-family: Georgia, serif; font-size: 16px; color: var(--text); margin-bottom: 1px; }
        .club-genre { font-size: 11px; color: var(--accent); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
        .club-now { font-size: 12px; color: var(--text-muted); }
        .club-now em { font-style: italic; color: var(--text); }
        .club-members { font-size: 11px; color: var(--text-muted); margin-top: 3px; }
        .club-join-btn {
          padding: 7px 16px;
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          flex-shrink: 0;
          -webkit-tap-highlight-color: transparent;
        }
        .clubs-coming-soon {
          text-align: center;
          font-size: 13px;
          color: var(--text-muted);
          padding: 12px 0 4px;
        }

        /* Friends */
        .friends-list { display: flex; flex-direction: column; gap: 10px; }
        .friend-card {
          display: flex;
          align-items: center;
          gap: 14px;
          background: var(--surface);
          border-radius: 14px;
          padding: 16px;
          border: 1px solid rgba(139,111,71,0.1);
        }
        .friend-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--accent);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: Georgia, serif;
          font-size: 18px;
          flex-shrink: 0;
        }
        .friend-info { flex: 1; min-width: 0; }
        .friend-name { font-size: 15px; font-weight: 500; color: var(--text); margin-bottom: 2px; }
        .friend-reading { font-size: 12px; color: var(--text-muted); margin-bottom: 8px; }
        .friend-reading em { font-style: italic; color: var(--text); }
        .friend-progress-wrap { display: flex; align-items: center; gap: 8px; }
        .friend-progress-bar {
          flex: 1;
          height: 3px;
          background: rgba(139,111,71,0.15);
          border-radius: 3px;
          overflow: hidden;
        }
        .friend-progress-fill {
          height: 100%;
          background: var(--accent);
          border-radius: 3px;
        }
        .friend-pct { font-size: 11px; color: var(--text-muted); min-width: 28px; text-align: right; }
      `}</style>
    </div>
  );
}
