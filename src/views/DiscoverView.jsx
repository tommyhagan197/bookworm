export default function DiscoverView() {
  return (
    <div className="view-container">
      <h1 className="view-header">Discover</h1>
      <p className="view-subhead">Personalised picks, coming soon.</p>

      <div className="discover-genres">
        {["Literary Fiction","Mystery","Science Fiction","History","Philosophy","Poetry","Romance","Biography"].map((g) => (
          <button key={g} className="genre-pill">{g}</button>
        ))}
      </div>

      <div className="empty-state" style={{ marginTop: 40 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <p>For You recommendations arrive<br/>once you have read your first book.</p>
      </div>

      <style>{`
        .discover-genres {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
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
          transition: background 0.15s, border-color 0.15s;
        }
        .genre-pill:active {
          background: var(--accent);
          color: #fff;
          border-color: var(--accent);
        }
      `}</style>
    </div>
  );
}
