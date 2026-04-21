import { useState, useEffect } from "react";
import { useAuth } from "./auth/AuthContext.jsx";
import AuthScreen from "./auth/AuthScreen.jsx";
import BrowseView from "./views/BrowseView";
import ShelfView from "./views/ShelfView";
import DiscoverView from "./views/DiscoverView";
import CommunityView from "./views/CommunityView";
import ProfileView from "./views/ProfileView";
import ReaderView from "./views/ReaderView";
import PublishView from "./views/PublishView";
import BibleView from "./views/BibleView";
import BibleReaderView from "./views/BibleReaderView";
import { getSetting } from "./db/idb";
import "./App.css";

const THEME_VARS = {
  sepia: { "--bg": "#f5f0e8", "--surface": "#ede8df", "--text": "#3a2e1e", "--text-muted": "#9c8b78" },
  light: { "--bg": "#ffffff", "--surface": "#f5f5f5", "--text": "#1a1a1a", "--text-muted": "#9c8b78" },
  dark:  { "--bg": "#1a1714", "--surface": "#252220", "--text": "#e8e0d0", "--text-muted": "#8a7f72" },
};

export default function App() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState("library");
  const [readerBookId, setReaderBookId] = useState(null);
  const [showPublish, setShowPublish] = useState(false);
  const [bibleState, setBibleState] = useState(null);

  useEffect(() => {
    getSetting("theme", "sepia").then(t => {
      const vars = THEME_VARS[t] || THEME_VARS.sepia;
      Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
      document.body.dataset.theme = t;
    });
    getSetting("fontSize", "medium").then(f => {
      const sizes = { small: "15px", medium: "17px", large: "19px", xlarge: "21px" };
      document.documentElement.style.setProperty("--reader-font-size", sizes[f] || "17px");
    });
  }, []);

  if (session === undefined) return null;
  if (!session) return <AuthScreen />;

  function openBook(bookId) { setReaderBookId(bookId); }
  function closeReader() { setReaderBookId(null); }
  function handlePublished() { setShowPublish(false); setActiveTab("profile"); }

  function renderTab() {
    switch (activeTab) {
      case "shelf":     return <ShelfView onOpenBook={openBook} />;
      case "library":   return <BrowseView onOpenBook={openBook} onOpenBible={() => setActiveTab("bible")} />;
      case "discover":  return <DiscoverView />;
      case "community": return <CommunityView />;
      case "profile":   return <ProfileView onPublish={() => setShowPublish(true)} onOpenBook={openBook} />;
      case "bible":     return <BibleView onOpenChapter={(state) => setBibleState(state)} />;
      default:          return <BrowseView onOpenBook={openBook} onOpenBible={() => setActiveTab("bible")} />;
    }
  }

  return (
    <div className="app-shell">
      <main className="tab-content">{renderTab()}</main>
      <nav className="bottom-nav">
        <button className={"nav-btn" + (activeTab === "shelf" ? " active" : "")} onClick={() => setActiveTab("shelf")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="7" height="18" rx="1"/><rect x="9.5" y="5" width="5" height="16" rx="1"/><rect x="15.5" y="7" width="6.5" height="14" rx="1"/></svg>
          <span>Shelf</span>
        </button>
        <button className={"nav-btn" + (activeTab === "library" || activeTab === "bible" ? " active" : "")} onClick={() => setActiveTab("library")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          <span>Library</span>
        </button>
        <div className="nav-center-slot">
          <button className={"nav-center-btn" + (activeTab === "discover" ? " active" : "")} onClick={() => setActiveTab("discover")} aria-label="Discover">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6" strokeWidth="1.6"/></svg>
          </button>
          <span className={"nav-center-label" + (activeTab === "discover" ? " active" : "")}>Discover</span>
        </div>
        <button className={"nav-btn" + (activeTab === "community" ? " active" : "")} onClick={() => setActiveTab("community")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span>Community</span>
        </button>
        <button className={"nav-btn" + (activeTab === "profile" ? " active" : "")} onClick={() => setActiveTab("profile")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>Profile</span>
        </button>
      </nav>
      {readerBookId && <ReaderView bookId={readerBookId} onClose={closeReader} />}
      {bibleState && (
        <BibleReaderView
          book={bibleState.book}
          chapterIndex={bibleState.chapterIndex}
          allBooks={bibleState.allBooks}
          onClose={() => setBibleState(null)}
          onNavigate={(s) => setBibleState(s)}
        />
      )}
      {showPublish && <PublishView onClose={() => setShowPublish(false)} onPublished={handlePublished} />}
    </div>
  );
}
