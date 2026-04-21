import { useState, useEffect } from "react";
import { getSetting, setSetting, dbGetAll } from "../db/idb";

const THEMES = [
  { id: "sepia", label: "Sepia", bg: "#f5f0e8", text: "#3a2e1e" },
  { id: "light", label: "Light", bg: "#ffffff", text: "#1a1a1a" },
  { id: "dark",  label: "Dark",  bg: "#1a1714", text: "#e8e0d0" },
];

const FONT_SIZES = [
  { id: "small",  label: "S",  size: "15px" },
  { id: "medium", label: "M",  size: "17px" },
  { id: "large",  label: "L",  size: "19px" },
  { id: "xlarge", label: "XL", size: "21px" },
];

const GearIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6"/>
  </svg>
);

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
);

export default function ProfileView({ onPublish, onOpenBook }) {
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setThemeState] = useState("sepia");
  const [fontSize, setFontSizeState] = useState("medium");
  const [works, setWorks] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    getSetting("theme", "sepia").then(t => { setThemeState(t); applyTheme(t); });
    getSetting("fontSize", "medium").then(f => { setFontSizeState(f); applyFontSize(f); });
    loadWorks();
  }, []);

  async function loadWorks() {
    const all = await dbGetAll("books");
    setWorks(all.filter(b => b.type === "published"));
  }

  async function handleDeleteWork(work) {
    const { openDB } = await import("../db/idb");
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(["books", "pages"], "readwrite");
      tx.objectStore("books").delete(work.id);
      const pageStore = tx.objectStore("pages");
      const req = pageStore.openCursor();
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          if (cursor.key.startsWith(work.id + ":")) cursor.delete();
          cursor.continue();
        }
      };
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    setWorks(w => w.filter(x => x.id !== work.id));
    setConfirmDelete(null);
  }

  function applyTheme(t) {
    const th = THEMES.find(x => x.id === t) || THEMES[0];
    document.documentElement.style.setProperty("--bg", th.bg);
    document.documentElement.style.setProperty("--surface",
      t === "sepia" ? "#ede8df" : t === "light" ? "#f5f5f5" : "#252220");
    document.documentElement.style.setProperty("--text", th.text);
    document.documentElement.style.setProperty("--text-muted",
      t === "dark" ? "#8a7f72" : "#9c8b78");
    document.body.dataset.theme = t;
  }

  function applyFontSize(f) {
    const fs = FONT_SIZES.find(s => s.id === f) || FONT_SIZES[1];
    document.documentElement.style.setProperty("--reader-font-size", fs.size);
  }

  async function handleTheme(t) { setThemeState(t); applyTheme(t); await setSetting("theme", t); }
  async function handleFontSize(f) { setFontSizeState(f); applyFontSize(f); await setSetting("fontSize", f); }

  // ── Settings panel ──
  if (showSettings) {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        background: "var(--bg)", minHeight: "100%",
        paddingTop: "env(safe-area-inset-top, 44px)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "16px 20px 12px",
          borderBottom: "1px solid rgba(139,111,71,0.1)",
        }}>
          <button onClick={() => setShowSettings(false)} style={{
            background: "none", border: "none", padding: "4px",
            cursor: "pointer", color: "var(--text-muted)",
            WebkitTapHighlightColor: "transparent", display: "flex",
          }}>
            <BackIcon />
          </button>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "18px", color: "var(--text)" }}>Settings</div>
        </div>

        <div style={{ padding: "20px 20px 40px" }}>
          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "10px" }}>Appearance</div>

          {/* Theme */}
          <div style={{ background: "var(--surface)", borderRadius: "12px", padding: "16px", marginBottom: "10px", border: "1px solid rgba(139,111,71,0.1)" }}>
            <div style={{ fontSize: "15px", color: "var(--text)", fontWeight: "500", marginBottom: "2px" }}>Theme</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>Background colour while reading</div>
            <div style={{ display: "flex", gap: "12px", marginBottom: "6px" }}>
              {THEMES.map(t => (
                <button key={t.id} onClick={() => handleTheme(t.id)} style={{
                  width: "44px", height: "44px", borderRadius: "10px", cursor: "pointer",
                  background: t.bg,
                  border: `2px solid ${theme === t.id ? "var(--accent)" : "rgba(139,111,71,0.25)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  WebkitTapHighlightColor: "transparent",
                }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: t.text, opacity: 0.6, display: "block" }} />
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              {THEMES.map(t => (
                <span key={t.id} style={{
                  width: "44px", textAlign: "center", fontSize: "11px",
                  color: theme === t.id ? "var(--accent)" : "var(--text-muted)",
                  fontWeight: theme === t.id ? "500" : "normal",
                }}>{t.label}</span>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div style={{ background: "var(--surface)", borderRadius: "12px", padding: "16px", marginBottom: "24px", border: "1px solid rgba(139,111,71,0.1)" }}>
            <div style={{ fontSize: "15px", color: "var(--text)", fontWeight: "500", marginBottom: "2px" }}>Text size</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>Font size while reading</div>
            <div style={{ display: "flex", gap: "8px" }}>
              {FONT_SIZES.map(f => (
                <button key={f.id} onClick={() => handleFontSize(f.id)} style={{
                  flex: 1, padding: "10px 0",
                  background: fontSize === f.id ? "var(--accent)" : "rgba(139,111,71,0.08)",
                  border: `1.5px solid ${fontSize === f.id ? "var(--accent)" : "transparent"}`,
                  borderRadius: "8px", fontSize: "14px",
                  color: fontSize === f.id ? "#fff" : "var(--text)",
                  cursor: "pointer", WebkitTapHighlightColor: "transparent",
                }}>{f.label}</button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "10px" }}>Account</div>
          {["Reading Preferences", "Notifications", "Privacy"].map((item, i, arr) => (
            <div key={item} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "15px 0",
              borderBottom: i < arr.length - 1 ? "1px solid rgba(139,111,71,0.1)" : "none",
              fontSize: "15px", color: "var(--text)", cursor: "pointer",
            }}>
              <span>{item}</span>
              <ChevronRight />
            </div>
          ))}

          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: "24px 0 10px" }}>About</div>
          {[["BookWorm", "v1.0"], ["Books", "Project Gutenberg"]].map(([label, value]) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "13px 0", borderBottom: "1px solid rgba(139,111,71,0.1)",
              fontSize: "14px", color: "var(--text)",
            }}>
              <span>{label}</span>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Main profile ──
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      background: "var(--bg)", minHeight: "100%",
      paddingTop: "env(safe-area-inset-top, 44px)",
    }}>

      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 20px 0" }}>
        <button onClick={() => setShowSettings(true)} style={{
          background: "none", border: "none", padding: "4px",
          cursor: "pointer", color: "var(--text-muted)",
          WebkitTapHighlightColor: "transparent", display: "flex",
        }}>
          <GearIcon />
        </button>
      </div>

      <div style={{ padding: "12px 20px 0" }}>
        {/* Avatar + name */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: "var(--brand)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: "26px", color: "#fff", fontWeight: "normal" }}>T</span>
          </div>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: "var(--text)", lineHeight: 1.2 }}>Tommy Hagan</div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>@tommyhagan</div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px", lineHeight: 1.4 }}>Founder · BookWorm</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: "flex",
          borderTop: "1px solid rgba(139,111,71,0.12)",
          borderBottom: "1px solid rgba(139,111,71,0.12)",
          padding: "14px 0", marginBottom: "16px",
        }}>
          {[{ value: String(works.length), label: "Works" }, { value: "0", label: "Followers" }, { value: "0", label: "Following" }]
            .map(({ value, label }, i) => (
              <div key={label} style={{
                flex: 1, textAlign: "center",
                borderRight: i < 2 ? "1px solid rgba(139,111,71,0.12)" : "none",
              }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: "22px", color: "var(--text)" }}>{value}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
              </div>
            ))}
        </div>

        {/* Action pills */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "28px" }}>
          <button style={{
            flex: 1, padding: "13px",
            background: "var(--accent)", border: "none", borderRadius: "12px",
            color: "#fff", fontSize: "15px", fontWeight: "500", cursor: "pointer",
            WebkitTapHighlightColor: "transparent", letterSpacing: "0.01em",
          }} onClick={onPublish}>
            Publish
          </button>
          <button style={{
            flex: 1, padding: "13px",
            background: "none",
            border: "1.5px solid rgba(139,111,71,0.25)",
            borderRadius: "12px",
            color: "var(--text)", fontSize: "15px", fontWeight: "500", cursor: "pointer",
            WebkitTapHighlightColor: "transparent", letterSpacing: "0.01em",
          }}>
            Edit Profile
          </button>
        </div>

        {/* Works grid — Instagram style */}
        <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "12px" }}>Works</div>
        {works.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.6 }}>
            Nothing published yet. Tap Publish to share your first work.
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "2px",
            margin: "0 -20px",
          }}>
            {works.map(work => {
              let pressTimer = null;
              return (
                <button
                  key={work.id}
                  onTouchStart={() => { pressTimer = setTimeout(() => setConfirmDelete(work), 600); }}
                  onTouchEnd={() => clearTimeout(pressTimer)}
                  onTouchMove={() => clearTimeout(pressTimer)}
                  onClick={() => onOpenBook && onOpenBook(work.id)}
                  style={{
                    aspectRatio: "2/3",
                    background: work.color || "var(--brand)",
                    border: "none",
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <span style={{
                    fontFamily: "Georgia, serif",
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.95)",
                    textAlign: "center",
                    lineHeight: 1.3,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>{work.title}</span>
                </button>
              );
            })}
          </div>

          {confirmDelete && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100, padding: "0 0 40px" }}>
              <div style={{ background: "var(--surface)", borderRadius: "20px", padding: "24px", width: "calc(100% - 32px)", maxWidth: "400px", textAlign: "center" }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: "17px", marginBottom: "6px" }}>Delete "{confirmDelete.title}"?</div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>This permanently removes it from your works.</div>
                <button onClick={() => handleDeleteWork(confirmDelete)} style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "#ef5350", border: "none", color: "#fff", fontSize: "15px", fontWeight: "600", cursor: "pointer", marginBottom: "10px" }}>Delete</button>
                <button onClick={() => setConfirmDelete(null)} style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "15px", cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          )}
        )}
      </div>
    </div>
  );
}
