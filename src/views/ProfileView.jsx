import { useState, useEffect } from "react";
import { getSetting, setSetting } from "../db/idb";

const THEMES = [
  { id: "sepia", label: "Sepia", bg: "#f5f0e8", text: "#3a2e1e" },
  { id: "light", label: "Light", bg: "#ffffff", text: "#1a1a1a" },
  { id: "dark",  label: "Dark",  bg: "#1a1714", text: "#e8e0d0" },
];

const FONT_SIZES = [
  { id: "small",  label: "S", size: "15px" },
  { id: "medium", label: "M", size: "17px" },
  { id: "large",  label: "L", size: "19px" },
  { id: "xlarge", label: "XL", size: "21px" },
];

export default function ProfileView() {
  const [theme, setThemeState] = useState("sepia");
  const [fontSize, setFontSizeState] = useState("medium");

  useEffect(() => {
    getSetting("theme", "sepia").then(t => {
      setThemeState(t);
      applyTheme(t);
    });
    getSetting("fontSize", "medium").then(f => {
      setFontSizeState(f);
      applyFontSize(f);
    });
  }, []);

  function applyTheme(t) {
    const theme = THEMES.find(th => th.id === t) || THEMES[0];
    document.documentElement.style.setProperty("--bg", theme.bg);
    document.documentElement.style.setProperty("--surface",
      t === "sepia" ? "#ede8df" : t === "light" ? "#f5f5f5" : "#252220"
    );
    document.documentElement.style.setProperty("--text", theme.text);
    document.documentElement.style.setProperty("--text-muted",
      t === "dark" ? "#8a7f72" : "#9c8b78"
    );
    document.body.dataset.theme = t;
  }

  function applyFontSize(f) {
    const fs = FONT_SIZES.find(s => s.id === f) || FONT_SIZES[1];
    document.documentElement.style.setProperty("--reader-font-size", fs.size);
  }

  async function handleTheme(t) {
    setThemeState(t);
    applyTheme(t);
    await setSetting("theme", t);
  }

  async function handleFontSize(f) {
    setFontSizeState(f);
    applyFontSize(f);
    await setSetting("fontSize", f);
  }

  return (
    <div className="view-container">
      <h1 className="view-header">Profile</h1>

      {/* Reading section label */}
      <div className="settings-section-label">Reading</div>

      {/* Theme */}
      <div className="settings-row">
        <div className="settings-row-label">
          <span className="settings-row-title">Theme</span>
          <span className="settings-row-sub">Background colour while reading</span>
        </div>
        <div className="theme-picker">
          {THEMES.map(t => (
            <button
              key={t.id}
              className={"theme-swatch" + (theme === t.id ? " active" : "")}
              style={{ background: t.bg, border: `2px solid ${theme === t.id ? "var(--accent)" : "rgba(139,111,71,0.25)"}` }}
              onClick={() => handleTheme(t.id)}
              aria-label={t.label}
            >
              <span className="theme-swatch-dot" style={{ background: t.text }} />
            </button>
          ))}
        </div>
        <div className="theme-label-row">
          {THEMES.map(t => (
            <span key={t.id} className={"theme-label" + (theme === t.id ? " active" : "")}>{t.label}</span>
          ))}
        </div>
      </div>

      {/* Font size */}
      <div className="settings-row">
        <div className="settings-row-label">
          <span className="settings-row-title">Text size</span>
          <span className="settings-row-sub">Font size while reading</span>
        </div>
        <div className="fontsize-picker">
          {FONT_SIZES.map(f => (
            <button
              key={f.id}
              className={"fontsize-btn" + (fontSize === f.id ? " active" : "")}
              onClick={() => handleFontSize(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* About section */}
      <div className="settings-section-label" style={{ marginTop: 28 }}>About</div>
      <div className="settings-row-plain">
        <span>BookWorm</span>
        <span className="settings-row-value">v1.0</span>
      </div>
      <div className="settings-row-plain">
        <span>Books are public domain</span>
        <span className="settings-row-value">Project Gutenberg</span>
      </div>

      <style>{`
        .settings-section-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin: 20px 0 10px;
        }
        .settings-row {
          background: var(--surface);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 10px;
          border: 1px solid rgba(139,111,71,0.1);
        }
        .settings-row-label { margin-bottom: 14px; }
        .settings-row-title {
          display: block;
          font-size: 15px;
          color: var(--text);
          font-weight: 500;
          margin-bottom: 2px;
        }
        .settings-row-sub {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
        }
        .theme-picker {
          display: flex;
          gap: 12px;
          margin-bottom: 6px;
        }
        .theme-swatch {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          -webkit-tap-highlight-color: transparent;
          transition: transform 0.1s;
        }
        .theme-swatch:active { transform: scale(0.93); }
        .theme-swatch-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          opacity: 0.6;
        }
        .theme-label-row {
          display: flex;
          gap: 12px;
        }
        .theme-label {
          width: 44px;
          text-align: center;
          font-size: 11px;
          color: var(--text-muted);
        }
        .theme-label.active { color: var(--accent); font-weight: 500; }
        .fontsize-picker {
          display: flex;
          gap: 8px;
        }
        .fontsize-btn {
          flex: 1;
          padding: 10px 0;
          background: rgba(139,111,71,0.08);
          border: 1.5px solid transparent;
          border-radius: 8px;
          font-size: 14px;
          color: var(--text);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: all 0.15s;
        }
        .fontsize-btn.active {
          background: var(--accent);
          color: #fff;
          border-color: var(--accent);
        }
        .settings-row-plain {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 13px 0;
          border-bottom: 1px solid rgba(139,111,71,0.1);
          font-size: 14px;
          color: var(--text);
        }
        .settings-row-plain:last-child { border-bottom: none; }
        .settings-row-value {
          font-size: 13px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
