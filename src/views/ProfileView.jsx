import { useState, useEffect } from "react";
import { getSetting, setSetting } from "../db/idb";

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

const GearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

export default function ProfileView() {
  const [tab, setTab] = useState("profile");
  const [theme, setThemeState] = useState("sepia");
  const [fontSize, setFontSizeState] = useState("medium");

  useEffect(() => {
    getSetting("theme", "sepia").then(t => { setThemeState(t); applyTheme(t); });
    getSetting("fontSize", "medium").then(f => { setFontSizeState(f); applyFontSize(f); });
  }, []);

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

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      background: "var(--bg)",
      minHeight: "100%",
      paddingTop: "env(safe-area-inset-top, 44px)",
    }}>

      {/* ── Header ── */}
      <div style={{ padding: "20px 20px 0" }}>

        {/* Avatar + name row */}
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

        {/* Stats row */}
        <div style={{
          display: "flex",
          borderTop: "1px solid rgba(139,111,71,0.12)",
          borderBottom: "1px solid rgba(139,111,71,0.12)",
          padding: "14px 0",
          marginBottom: "16px",
        }}>
          {[{ value: "0", label: "Shelved" }, { value: "0", label: "Followers" }, { value: "0", label: "Following" }]
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

        {/* Publish button */}
        <button style={{
          width: "100%", padding: "13px",
          background: "var(--accent)", border: "none", borderRadius: "12px",
          color: "#fff", fontSize: "15px", fontWeight: "500", cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
          marginBottom: "20px", letterSpacing: "0.01em",
        }}>
          Publish a Story
        </button>

        {/* Tab toggle */}
        <div style={{
          display: "flex", background: "var(--surface)",
          borderRadius: "10px", padding: "3px", marginBottom: "20px",
          border: "1px solid rgba(139,111,71,0.12)",
        }}>
          {["profile", "settings"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "8px 0",
              background: tab === t ? "var(--accent)" : "none",
              border: "none", borderRadius: "8px",
              fontSize: "14px",
              color: tab === t ? "#fff" : "var(--text-muted)",
              cursor: "pointer", WebkitTapHighlightColor: "transparent",
              textTransform: "capitalize", transition: "all 0.15s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            }}>
              {t === "settings" && <GearIcon />}
              {t === "profile" ? "Profile" : "Settings"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Profile tab ── */}
      {tab === "profile" && (
        <div style={{ padding: "0 20px 40px" }}>
          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "10px" }}>Account</div>
          {["Reading Preferences", "Notifications", "Privacy"].map((item, i, arr) => (
            <div key={item} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "15px 0",
              borderBottom: i < arr.length - 1 ? "1px solid rgba(139,111,71,0.1)" : "none",
              fontSize: "15px", color: "var(--text)", cursor: "pointer",
            }}>
              <span>{item}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* ── Settings tab ── */}
      {tab === "settings" && (
        <div style={{ padding: "0 20px 40px" }}>
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

          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "10px" }}>About</div>
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
      )}
    </div>
  );
}
