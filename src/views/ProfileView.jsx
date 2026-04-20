export default function ProfileView() {
  return (
    <div className="view-container">
      <h1 className="view-header">Profile</h1>
      <p className="view-subhead">Your reading life.</p>

      <div className="profile-card">
        <div className="profile-avatar">📖</div>
        <div>
          <div className="profile-name">Reader</div>
          <div className="profile-since">Member since 2026</div>
        </div>
      </div>

      <div className="profile-stats">
        {[
          { label: "Books Read", value: "—" },
          { label: "This Year", value: "—" },
          { label: "Pages", value: "—" },
        ].map(({ label, value }) => (
          <div key={label} className="profile-stat">
            <span className="profile-stat-value">{value}</span>
            <span className="profile-stat-label">{label}</span>
          </div>
        ))}
      </div>

      <div className="profile-section-label">Account</div>
      {["Sign In / Create Account", "Reading Preferences", "Appearance"].map((item) => (
        <div key={item} className="profile-row">
          <span>{item}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      ))}

      <style>{`
        .profile-card {
          display: flex;
          align-items: center;
          gap: 14px;
          background: var(--surface);
          border-radius: 14px;
          padding: 18px 16px;
          margin-bottom: 20px;
          border: 1px solid rgba(139,111,71,0.12);
        }
        .profile-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(139,111,71,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }
        .profile-name { font-family: Georgia, serif; font-size: 18px; color: var(--text); }
        .profile-since { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        .profile-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 28px;
        }
        .profile-stat {
          background: var(--surface);
          border-radius: 12px;
          padding: 14px 10px;
          text-align: center;
          border: 1px solid rgba(139,111,71,0.12);
        }
        .profile-stat-value {
          display: block;
          font-family: Georgia, serif;
          font-size: 22px;
          color: var(--accent);
        }
        .profile-stat-label {
          display: block;
          font-size: 10px;
          color: var(--text-muted);
          margin-top: 2px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .profile-section-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        .profile-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid rgba(139,111,71,0.1);
          font-size: 15px;
          color: var(--text);
          cursor: pointer;
        }
        .profile-row:last-child { border-bottom: none; }
        .profile-row svg { color: var(--text-muted); }
      `}</style>
    </div>
  );
}
