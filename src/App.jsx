import { useState, useEffect, createContext, useContext } from "react";
import BrowseView from "./views/BrowseView";
import ShelfView from "./views/ShelfView";
import DiscoverView from "./views/DiscoverView";
import CommunityView from "./views/CommunityView";
import ProfileView from "./views/ProfileView";
import ReaderView from "./views/ReaderView";
import PublishView from "./views/PublishView";
import WorkReaderView from "./views/WorkReaderView";
import BibleView from "./views/BibleView";
import BibleReaderView from "./views/BibleReaderView";
import AuthScreen from "./auth/AuthScreen";
import { useAuth } from "./auth/AuthContext";
import "./App.css";

export const ThemeContext = createContext({ theme: "night", setTheme: () => {} });
export function useTheme() { return useContext(ThemeContext); }

const THEMES = ["night", "sepia", "paper"];

function loadTheme() {
  try { return localStorage.getItem("bw-theme") || "paper"; } catch { return "paper"; }
}

export default function App() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState("library");
  const [readerBookId, setReaderBookId] = useState(null);
  const [showPublish, setShowPublish] = useState(false);
  const [openWork, setOpenWork] = useState(null); // work object from Supabase
  const [theme, setThemeState] = useState(loadTheme);

  // Bible state
  const [showBible, setShowBible] = useState(false);
  const [bibleChapter, setBibleChapter] = useState(null);

  function setTheme(t) {
    if (!THEMES.includes(t)) return;
    setThemeState(t);
    try { localStorage.setItem("bw-theme", t); } catch {}
  }

  function openBook(bookId) { setReaderBookId(bookId); }
  function closeReader() { setReaderBookId(null); }

  function handlePublished() {
    setShowPublish(false);
    setActiveTab("profile");
  }

  function openBible() { setBibleChapter(null); setShowBible(true); }
  function closeBible() { setShowBible(false); setBibleChapter(null); }
  function openBibleChapter(chapterInfo) { setBibleChapter(chapterInfo); }
  function navigateBibleChapter(chapterInfo) { setBibleChapter(chapterInfo); }

  if (session === undefined) {
    return (
      <div style={{ minHeight: "100dvh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 22, color: "#f0ece4", letterSpacing: "-0.01em" }}>BookWorm</div>
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  function renderTab() {
    switch (activeTab) {
      case "shelf":     return <ShelfView onOpenBook={openBook} onOpenBible={openBible} />;
      case "library":   return <BrowseView onOpenBook={openBook} onOpenBible={openBible} />;
      case "discover":  return <DiscoverView />;
      case "community": return <CommunityView />;
      case "profile":   return (
        <ProfileView
          onPublish={() => setShowPublish(true)}
          onOpenWork={work => setOpenWork(work)}
        />
      );
      default: return <BrowseView onOpenBook={openBook} onOpenBible={openBible} />;
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className="app-shell" data-theme={theme}>
        <main className="tab-content">{renderTab()}</main>

        <nav className="bottom-nav">
          <button className={"nav-btn" + (activeTab === "shelf" ? " active" : "")} onClick={() => setActiveTab("shelf")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="7" height="18" rx="1"/>
              <rect x="9.5" y="5" width="5" height="16" rx="1"/>
              <rect x="15.5" y="7" width="6.5" height="14" rx="1"/>
            </svg>
            <span>Shelf</span>
          </button>

          <button className={"nav-btn" + (activeTab === "library" ? " active" : "")} onClick={() => setActiveTab("library")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <span>Library</span>
          </button>

          <div className="nav-center-slot">
            <button className={"nav-center-btn" + (activeTab === "discover" ? " active" : "")} onClick={() => setActiveTab("discover")} aria-label="Discover">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
                <path d="M11 8v6M8 11h6" strokeWidth="1.6"/>
              </svg>
            </button>
            <span className={"nav-center-label" + (activeTab === "discover" ? " active" : "")}>Discover</span>
          </div>

          <button className={"nav-btn" + (activeTab === "community" ? " active" : "")} onClick={() => setActiveTab("community")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Community</span>
          </button>

          <button className={"nav-btn" + (activeTab === "profile" ? " active" : "")} onClick={() => setActiveTab("profile")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Profile</span>
          </button>
        </nav>

        {readerBookId && <ReaderView bookId={readerBookId} onClose={closeReader} />}
        {showPublish && <PublishView onClose={() => setShowPublish(false)} onPublished={handlePublished} />}

        {openWork && (
          <WorkReaderView
            work={openWork}
            onClose={() => setOpenWork(null)}
            onDeleted={() => {
              setOpenWork(null);
              // Force profile to reload by toggling tab
              setActiveTab("library");
              setTimeout(() => setActiveTab("profile"), 50);
            }}
          />
        )}

        {showBible && !bibleChapter && (
          <div className="bible-overlay">
            <div className="bible-overlay-topbar">
              <button className="bible-overlay-close" onClick={closeBible}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Library
              </button>
            </div>
            <div className="bible-overlay-content">
              <BibleView onOpenChapter={openBibleChapter} />
            </div>
          </div>
        )}

        {showBible && bibleChapter && (
          <BibleReaderView
            book={bibleChapter.book}
            chapterIndex={bibleChapter.chapterIndex}
            allBooks={bibleChapter.allBooks}
            onClose={closeBible}
            onNavigate={navigateBibleChapter}
          />
        )}
      </div>

      <style>{`
        .bible-overlay { position: fixed; inset: 0; background: var(--bg); z-index: 200; display: flex; flex-direction: column; }
        .bible-overlay-topbar { display: flex; align-items: center; padding: 56px 16px 12px; border-bottom: 1px solid rgba(139,111,71,0.12); }
        .bible-overlay-close { display: flex; align-items: center; gap: 4px; background: none; border: none; color: var(--accent); font-size: 15px; font-family: 'DM Sans', sans-serif; cursor: pointer; padding: 4px 0; -webkit-tap-highlight-color: transparent; }
        .bible-overlay-content { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 0 16px 40px; }
      `}</style>
    </ThemeContext.Provider>
  );
}
