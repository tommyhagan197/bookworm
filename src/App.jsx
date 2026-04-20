import { useState, useEffect } from 'react';
import { openDB } from './db/index.js';
import { dbGet, dbPut, STORE_SETTINGS } from './db/index.js';
import LibraryView from './views/LibraryView.jsx';
import BrowseView from './views/BrowseView.jsx';
import UploadView from './views/UploadView.jsx';
import ProfileView from './views/ProfileView.jsx';
import CommunityView from './views/CommunityView.jsx';
import Reader from './components/Reader.jsx';

const FONT_SIZES = [14, 16, 18, 20, 23];

export default function App() {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState('library');
  const [readerBookId, setReaderBookId] = useState(null);

  // Settings
  const [theme, setThemeState] = useState('sepia');
  const [fontSizeIndex, setFontSizeIndex] = useState(2);
  const [pageAnimEnabled, setPageAnimEnabled] = useState(true);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  let toastTimer = null;

  // Loading overlay
  const [loadingVisible, setLoadingVisible] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Processing…');
  const [loadingPct, setLoadingPct] = useState(0);

  // Confirm dialog
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    openDB().then(async () => {
      // Load settings
      const themeSetting = await dbGet(STORE_SETTINGS, 'theme');
      const fontSetting = await dbGet(STORE_SETTINGS, 'fontSize');
      const animSetting = await dbGet(STORE_SETTINGS, 'pageAnim');
      if (themeSetting) applyTheme(themeSetting.value, false);
      if (fontSetting) { setFontSizeIndex(fontSetting.value); document.documentElement.style.setProperty('--font-size', FONT_SIZES[fontSetting.value] + 'px'); }
      if (animSetting) setPageAnimEnabled(animSetting.value);
      setReady(true);
    });
  }, []);

  function applyTheme(t, save = true) {
    setThemeState(t);
    document.body.setAttribute('data-theme', t);
    const themeColors = { sepia: '#f5f0e8', light: '#fafaf8', dark: '#1a1714' };
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColors[t] || '#f5f0e8');
    if (save) dbPut(STORE_SETTINGS, { key: 'theme', value: t });
  }

  function adjustFont(dir) {
    const next = Math.max(0, Math.min(4, fontSizeIndex + dir));
    setFontSizeIndex(next);
    document.documentElement.style.setProperty('--font-size', FONT_SIZES[next] + 'px');
    dbPut(STORE_SETTINGS, { key: 'fontSize', value: next });
  }

  function toggleAnim() {
    const next = !pageAnimEnabled;
    setPageAnimEnabled(next);
    dbPut(STORE_SETTINGS, { key: 'pageAnim', value: next });
  }

  function showToast(msg) {
    setToastMsg(msg);
    setToastVisible(true);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setToastVisible(false), 2500);
  }

  function showLoading(msg, pct) { setLoadingMsg(msg); setLoadingPct(pct || 0); setLoadingVisible(true); }
  function setProgress(msg, pct) { setLoadingMsg(msg); setLoadingPct(pct); }
  function hideLoading() { setLoadingVisible(false); }

  function showConfirm(title, msg, actionLabel, cb) {
    setConfirm({ title, msg, actionLabel, cb });
  }
  function hideConfirm() { setConfirm(null); }

  if (!ready) return null;

  if (readerBookId) {
    return (
      <>
        <Reader bookId={readerBookId} onClose={() => { setReaderBookId(null); if (window.__reloadLibrary) window.__reloadLibrary(); }} />
        <Toast msg={toastMsg} visible={toastVisible} />
      </>
    );
  }

  return (
    <div id="app">
      {view === 'library' && (
        <LibraryView
          onOpenBook={id => setReaderBookId(id)}
          onAddBook={() => setView('upload')}
          onShowConfirm={showConfirm}
        />
      )}
      {view === 'browse' && (
        <BrowseView onShowToast={showToast} active={view === 'browse'} />
      )}
      {view === 'upload' && (
        <UploadView
          onShowToast={showToast}
          onShowLoading={showLoading}
          onHideLoading={hideLoading}
          onSetProgress={setProgress}
          onDone={() => setView('library')}
        />
      )}
      {view === 'community' && <CommunityView />}
      {view === 'profile' && (
        <ProfileView
          theme={theme}
          fontSizeIndex={fontSizeIndex}
          pageAnimEnabled={pageAnimEnabled}
          onSetTheme={applyTheme}
          onAdjustFont={adjustFont}
          onToggleAnim={toggleAnim}
          onShowConfirm={showConfirm}
          onShowToast={showToast}
        />
      )}

      <nav id="bottom-nav">
        <button className={`nav-btn${view==='library'?' active':''}`} onClick={() => setView('library')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          Library
        </button>
        <button className={`nav-btn${view==='browse'?' active':''}`} onClick={() => setView('browse')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          Free Classics
        </button>
        <button className="nav-upload-pill" onClick={() => setView('upload')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12l7-7 7 7"/></svg>
          Add
        </button>
        <button className={`nav-btn${view==='community'?' active':''}`} onClick={() => setView('community')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Community
        </button>
        <button className={`nav-btn${view==='profile'?' active':''}`} onClick={() => setView('profile')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="8" r="4"/><path d="M6 20v-1a6 6 0 0 1 12 0v1"/></svg>
          Profile
        </button>
      </nav>

      <Toast msg={toastMsg} visible={toastVisible} />

      <div id="loading-overlay" className={loadingVisible ? 'show' : ''}>
        <div className="loading-logo">BookWorm</div>
        <div className="loading-msg">{loadingMsg}</div>
        <div className="loading-bar-track">
          <div className="loading-bar-fill" style={{width: loadingPct + '%'}} />
        </div>
      </div>

      {confirm && (
        <div id="confirm-overlay" className="show" onClick={hideConfirm}>
          <div className="confirm-sheet" onClick={e => e.stopPropagation()}>
            <div className="confirm-title">{confirm.title}</div>
            <div className="confirm-msg">{confirm.msg}</div>
            <div className="confirm-btns">
              <button className="confirm-danger" onClick={() => { hideConfirm(); confirm.cb(); }}>{confirm.actionLabel}</button>
              <button className="confirm-cancel" onClick={hideConfirm}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Toast({ msg, visible }) {
  return <div id="toast" className={visible ? 'show' : ''}>{msg}</div>;
}
