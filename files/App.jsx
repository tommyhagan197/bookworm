import { useAuth } from "./auth/AuthContext.jsx";
import AuthScreen from "./auth/AuthScreen.jsx";

// ── Paste your existing App.jsx content below this line,
// replacing everything from "export default function App()" onward.
// The shell below is the auth wall — your tab nav and views slot in exactly
// where the comment says. ──────────────────────────────────────────────────

import { useState } from "react";

// Import all your existing views
import ShelfView from "./views/ShelfView.jsx";
import LibraryView from "./views/LibraryView.jsx";
import DiscoverView from "./views/DiscoverView.jsx";
import CommunityView from "./views/CommunityView.jsx";
import ProfileView from "./views/ProfileView.jsx";

export default function App() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState("shelf");

  // ── Loading splash ──────────────────────────────────────────────────────
  if (session === undefined) {
    return (
      <div style={{
        minHeight: "100dvh",
        background: "var(--bg, #F5F0E8)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: "var(--accent, #E07C3A)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(224,124,58,0.3)",
          animation: "pulse 1.6s ease-in-out infinite",
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>
    );
  }

  // ── Auth wall ───────────────────────────────────────────────────────────
  if (!session) {
    return <AuthScreen />;
  }

  // ── Main app (authenticated) ────────────────────────────────────────────
  const tabs = [
    { id: "shelf",     label: "Shelf",     icon: ShelfIcon },
    { id: "library",   label: "Library",   icon: LibraryIcon },
    { id: "discover",  label: "Discover",  icon: DiscoverIcon },
    { id: "community", label: "Community", icon: CommunityIcon },
    { id: "profile",   label: "Profile",   icon: ProfileIcon },
  ];

  return (
    <div style={{
      height: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg, #F5F0E8)",
      overflow: "hidden",
    }}>
      {/* View area */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {activeTab === "shelf"     && <ShelfView />}
        {activeTab === "library"   && <LibraryView />}
        {activeTab === "discover"  && <DiscoverView />}
        {activeTab === "community" && <CommunityView />}
        {activeTab === "profile"   && <ProfileView />}
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex",
        background: "var(--bg, #F5F0E8)",
        borderTop: "1px solid var(--surface, #EDE8DF)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        flexShrink: 0,
      }}>
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "10px 0 8px", gap: 3,
                background: "none", border: "none", cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <Icon active={active} />
              <span style={{
                fontSize: 10, fontWeight: active ? 600 : 400,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                color: active ? "var(--accent, #E07C3A)" : "var(--ink-faded, #7A6E5F)",
                letterSpacing: "0.02em",
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab icons ──────────────────────────────────────────────────────────────

function ShelfIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? "var(--accent, #E07C3A)" : "var(--ink-faded, #7A6E5F)"}
      strokeWidth={active ? "2" : "1.6"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function LibraryIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? "var(--accent, #E07C3A)" : "var(--ink-faded, #7A6E5F)"}
      strokeWidth={active ? "2" : "1.6"} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function DiscoverIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? "var(--accent, #E07C3A)" : "var(--ink-faded, #7A6E5F)"}
      strokeWidth={active ? "2" : "1.6"} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function CommunityIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? "var(--accent, #E07C3A)" : "var(--ink-faded, #7A6E5F)"}
      strokeWidth={active ? "2" : "1.6"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ProfileIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? "var(--accent, #E07C3A)" : "var(--ink-faded, #7A6E5F)"}
      strokeWidth={active ? "2" : "1.6"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
