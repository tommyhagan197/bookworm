export default function CommunityView() {
  return (
    <div className="view-container">
      <h1 className="view-header">Community</h1>
      <p className="view-subhead">Book clubs, reviews &amp; friends.</p>

      <div className="community-sections">
        {[
          { label: "Book Clubs", desc: "Read together, discuss weekly." },
          { label: "Friends", desc: "See what your friends are reading." },
          { label: "Most Popular", desc: "Trending in the BookWorm community." },
        ].map(({ label, desc }) => (
          <div key={label} className="community-card">
            <span className="community-card-title">{label}</span>
            <span className="community-card-desc">{desc}</span>
            <span className="community-card-soon">Coming soon</span>
          </div>
        ))}
      </div>

      <style>{`
        .community-sections { display: flex; flex-direction: column; gap: 12px; }
        .community-card {
          background: var(--surface);
          border-radius: 12px;
          padding: 18px 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          border: 1px solid rgba(139,111,71,0.12);
        }
        .community-card-title {
          font-family: Georgia, serif;
          font-size: 17px;
          color: var(--text);
        }
        .community-card-desc {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.4;
        }
        .community-card-soon {
          font-size: 11px;
          color: var(--accent);
          margin-top: 6px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
      `}</style>
    </div>
  );
}
