import { useState, useEffect } from 'react';
import { dbGetAll, dbClear, STORE_BOOKS, STORE_PAGES } from '../db/index.js';

const FONT_SIZES = [14, 16, 18, 20, 23];
const FONT_LABELS = ['Small', 'Medium', 'Standard', 'Large', 'X-Large'];

export default function ProfileView({ theme, fontSizeIndex, pageAnimEnabled, onSetTheme, onAdjustFont, onToggleAnim, onShowConfirm, onShowToast }) {
  const [stats, setStats] = useState({ books: 0, pages: 0, storage: '0 MB', storagePct: 0 });

  async function loadStats() {
    const books = await dbGetAll(STORE_BOOKS);
    const allPages = await dbGetAll(STORE_PAGES);
    const bytes = allPages.reduce((s,p) => s+((p.html?.length||0)*2), 0);
    const mb = (bytes/1024/1024).toFixed(1);
    setStats({
      books: books.length,
      pages: books.reduce((s,b) => s+(b.currentPage||0), 0).toLocaleString(),
      storage: mb + ' MB',
      storagePct: Math.min(100, (bytes/(50*1024*1024))*100)
    });
  }

  useEffect(() => { loadStats(); }, []);

  function handleClearLibrary() {
    onShowConfirm('Clear Library?', 'This will delete all books and reading progress. Cannot be undone.', 'Delete Everything', async () => {
      await dbClear(STORE_BOOKS);
      await dbClear(STORE_PAGES);
      if (window.__reloadLibrary) window.__reloadLibrary();
      loadStats();
      onShowToast('Library cleared');
    });
  }

  return (
    <div id="profile-view" className="view active">
      <div className="view-header">
        <h1>Profile</h1>
      </div>
      <div className="scroll-content">
        <div className="profile-header">
          <div className="profile-avatar">B</div>
          <div>
            <div className="profile-name">Reader</div>
            <div className="profile-sub">BookWorm member</div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card"><div className="stat-value">{stats.books}</div><div className="stat-label">Books</div></div>
          <div className="stat-card"><div className="stat-value">{stats.pages}</div><div className="stat-label">Pages Read</div></div>
          <div className="stat-card"><div className="stat-value">{stats.storage}</div><div className="stat-label">Storage</div></div>
        </div>

        <div className="section-card">
          <div className="section-header">Appearance</div>
          <div className="setting-row" style={{cursor:'default'}}>
            <span className="setting-label">Theme</span>
          </div>
          <div className="theme-picker">
            {['sepia','light','dark'].map(t => (
              <button key={t} className={`theme-btn ${t}${theme === t ? ' active' : ''}`} onClick={() => onSetTheme(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div className="setting-row" style={{cursor:'default'}}>
            <span className="setting-label">Font Size</span>
            <span className="setting-value">{FONT_SIZES[fontSizeIndex]}px</span>
          </div>
          <div className="font-size-row">
            <button className="font-size-btn" onClick={() => onAdjustFont(-1)}>A−</button>
            <div className="font-size-display">{FONT_LABELS[fontSizeIndex]}</div>
            <button className="font-size-btn" onClick={() => onAdjustFont(1)}>A+</button>
          </div>
          <div className="setting-row" onClick={onToggleAnim} style={{cursor:'pointer'}}>
            <span className="setting-label">Page Turn Animation</span>
            <div className={`toggle-track${pageAnimEnabled ? ' on' : ''}`}>
              <div className="toggle-thumb" />
            </div>
          </div>
        </div>

        <div className="section-card">
          <div className="section-header">Storage</div>
          <div className="storage-inner">
            <div className="storage-row">
              <span>Books stored on device</span>
              <span>{stats.storage}</span>
            </div>
            <div className="storage-bar-track">
              <div className="storage-bar-fill" style={{width: `${stats.storagePct}%`}} />
            </div>
          </div>
        </div>

        <button className="danger-btn" onClick={handleClearLibrary}>Clear Library</button>
      </div>
    </div>
  );
}
