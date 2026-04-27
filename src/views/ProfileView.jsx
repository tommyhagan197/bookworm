import { useState, useEffect } from "react";
import { getSetting, setSetting, dbGetAll } from "../db/idb";
import { useTheme } from "../App";
import { useAuth } from "../auth/AuthContext";

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

// Reconstruct cover SVG from stored coverData
const PALETTE = [
  { id: "walnut",   color: "#6B5344", dark: "#3D2B1F" },
  { id: "ink",      color: "#2E3F5C", dark: "#1A2537" },
  { id: "moss",     color: "#3A6B4A", dark: "#1E3D2A" },
  { id: "foxglove", color: "#8B3A62", dark: "#4D1F37" },
  { id: "mustard",  color: "#8B7A35", dark: "#4D4219" },
  { id: "teal",     color: "#2E7B7A", dark: "#1A4544" },
  { id: "espresso", color: "#3D2B1F", dark: "#1E1208" },
  { id: "ember",    color: "#E07C3A", dark: "#A04E1A" },
  { id: "forest",   color: "#1E3D2A", dark: "#0D1F14" },
  { id: "dusk",     color: "#4D3A6B", dark: "#2A1F3D" },
  { id: "sand",     color: "#C4936A", dark: "#8B5E3A" },
  { id: "cream",    color: "#D4C09A", dark: "#A08B5A" },
];

function getPaletteColor(id) {
  return PALETTE.find(p => p.id === id) || PALETTE[0];
}

function WorkCover({ book }) {
  const color = book.color || "#6B5344";
  const title = book.title || "Untitled";
  const words = title.split(" ");
  const line1 = words.slice(0, Math.ceil(words.length / 2)).join(" ");
  const line2 = words.slice(Math.ceil(words.length / 2)).join(" ");

  return (
    <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <linearGradient id={`wg_${book.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color}/>
          <stop offset="100%" stopColor={color + "aa"}/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="200" height="280" fill={`url(#wg_${book.id})`}/>
      <rect x="0" y="0" width="200" height="4" fill="rgba(255,255,255,0.25)"/>
      <text x="16" y="160" fontFamily="Georgia,serif" fontSize="22" fill="white" fontWeight="bold">{line1}</text>
      {line2 && <text x="16" y="184" fontFamily="Georgia,serif" fontSize="22" fill="white" fontWeight="bold">{line2}</text>}
      <text x="16" y="210" fontFamily="Georgia,serif" fontSize="11" fill="rgba(255,255,255,0.7)">{book.author}</text>
    </svg>
  );
}

function ThemeTile({ id, label, active, onClick }) {
  const configs = {
    night: { preview: "#0a0a0a", line: "#3a3228", labelBg: "#070707", labelColor: active ? "#E07C3A" : "#2a2a2a", border: "#111" },
    sepia: { preview: "#F5F0E8", line: "#c4b8a4", labelBg: "#EDE7DA", labelColor: active ? "#C0602A" : "#b5a898", border: "#DDD5C6" },
    paper: { preview: "#ffffff", line: "#d8d8d8", labelBg: "#f8f8f8", labelColor: active ? "#E07C3A" : "#c0c0c0", border: "#ebebeb" },
  };
  const c = configs[id];
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, borderRadius: "10px", overflow: "hidden", padding: 0, cursor: "pointer",
        border: `${active ? "1.5px" : "0.5px"} solid ${active ? "#E07C3A" : c.border}`,
        background: "none", WebkitTapHighlightColor: "transparent",
        transition: "border-color 0.15s ease",
      }}
    >
      <div style={{ background: c.preview, padding: "10px 8px 8px", display: "flex", flexDirection: "column", gap: "5px" }}>
        <div style={{ height: "5px", borderRadius: "3px", background: c.line, opacity: 0.7 }} />
        <div style={{ height: "5px", borderRadius: "3px", background: c.line, opacity: 0.5, width: "60%" }} />
        <div style={{ height: "5px", borderRadius: "3px", background: c.line, opacity: 0.7 }} />
      </div>
      <div style={{
        background: c.labelBg, borderTop: `0.5px solid ${c.border}`,
        padding: "5px 8px 7px", textAlign: "center",
        fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase",
        color: c.labelColor, fontWeight: active ? "500" : "400",
        transition: "color 0.15s ease",
      }}>
        {label}
      </div>
    </button>
  );
}

export default function ProfileView({ onPublish, onOpenBook }) {
  const { theme, setTheme } = useTheme();
  const { profile, signOut, session } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSizeState] = useState("medium");
  const [publishedWorks, setPublishedWorks] = useState([]);

  useEffect(() => {
    getSetting("fontSize", "medium").then(f => {
      setFontSizeState(f);
      applyFontSize(f);
    });
    loadPublishedWorks();
  }, []);

  async function loadPublishedWorks() {
    const allBooks = await dbGetAll("books");
    const works = allBooks.filter(b => b.type === "published");
    works.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    setPublishedWorks(works);
  }

  function applyFontSize(f) {
    const fs = FONT_SIZES.find(s => s.id === f) || FONT_SIZES[1];
    document.documentElement.style.setProperty("--reader-font-size", fs.size);
  }

  async function handleTheme(t) {
    setTheme(t);
    await setSetting("theme", t);
  }

  async function handleFontSize(f) {
    setFontSizeState(f);
    applyFontSize(f);
    await setSetting("fontSize", f);
  }

  const displayName = profile?.display_name || session?.user?.email?.split("@")[0] || "Reader";
  const handle = "@" + displayName.toLowerCase().replace(/\s+/g, "");
  const initials = displayName.charAt(0).toUpperCase();

  // ── Settings panel ──
  if (showSettings) {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        background: "var(--bg)", minHeight: "100%",
        paddingTop: "env(safe-area-inset-top, 44px)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "16px 20px 12px",
          borderBottom: "1px solid var(--border)",
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
          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-ghost)", marginBottom: "10px" }}>Appearance</div>

          <div style={{ background: "var(--surface)", borderRadius: "12px", padding: "16px", marginBottom: "10px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "15px", color: "var(--text)", fontWeight: "500", marginBottom: "2px" }}>Theme</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>App and reading background</div>
            <div style={{ display: "flex", gap: "10px" }}>
              <ThemeTile id="night" label="Night" active={theme === "night"} onClick={() => handleTheme("night")} />
              <ThemeTile id="sepia" label="Sepia" active={theme === "sepia"} onClick={() => handleTheme("sepia")} />
              <ThemeTile id="paper" label="Paper" active={theme === "paper"} onClick={() => handleTheme("paper")} />
            </div>
          </div>

          <div style={{ background: "var(--surface)", borderRadius: "12px", padding: "16px", marginBottom: "24px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "15px", color: "var(--text)", fontWeight: "500", marginBottom: "2px" }}>Text size</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>Font size while reading</div>
            <div style={{ display: "flex", gap: "8px" }}>
              {FONT_SIZES.map(f => (
                <button key={f.id} onClick={() => handleFontSize(f.id)} style={{
                  flex: 1, padding: "10px 0",
                  background: fontSize === f.id ? "var(--accent)" : "var(--surface-2)",
                  border: `1.5px solid ${fontSize === f.id ? "var(--accent)" : "transparent"}`,
                  borderRadius: "8px", fontSize: "14px",
                  color: fontSize === f.id ? "#fff" : "var(--text)",
                  cursor: "pointer", WebkitTapHighlightColor: "transparent",
                }}>{f.label}</button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-ghost)", marginBottom: "10px" }}>Account</div>

          <div style={{ background: "var(--surface)", borderRadius: "12px", marginBottom: "10px", border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: "12px", color: "var(--text-ghost)", marginBottom: "2px" }}>Signed in as</div>
              <div style={{ fontSize: "14px", color: "var(--text)" }}>{session?.user?.email}</div>
            </div>
            {["Reading Preferences", "Notifications", "Privacy"].map((item, i, arr) => (
              <div key={item} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "15px 16px",
                borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                fontSize: "15px", color: "var(--text)", cursor: "pointer",
              }}>
                <span>{item}</span>
                <ChevronRight />
              </div>
            ))}
          </div>

          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-ghost)", margin: "24px 0 10px" }}>About</div>
          {[["BookWorm", "v1.0"], ["Books", "Project Gutenberg"]].map(([label, value]) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "13px 0", borderBottom: "1px solid var(--border)",
              fontSize: "14px", color: "var(--text)",
            }}>
              <span>{label}</span>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{value}</span>
            </div>
          ))}

          <button
            onClick={signOut}
            style={{
              width: "100%", marginTop: "24px", padding: "14px",
              background: "none", border: "1.5px solid #ef5350",
              borderRadius: "12px", color: "#ef5350",
              fontSize: "15px", fontWeight: "500", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Sign out
          </button>
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
            background: "#6B5344",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: "26px", color: "#fff", fontWeight: "normal" }}>{initials}</span>
          </div>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: "var(--text)", lineHeight: 1.2 }}>{displayName}</div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>{handle}</div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px", lineHeight: 1.4 }}>{session?.user?.email}</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: "flex",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          padding: "14px 0", marginBottom: "16px",
        }}>
          {[
            { value: String(publishedWorks.length), label: "Works" },
            { value: "0", label: "Followers" },
            { value: "0", label: "Following" },
          ].map(({ value, label }, i) => (
            <div key={label} style={{
              flex: 1, textAlign: "center",
              borderRight: i < 2 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: "22px", color: "var(--text)" }}>{value}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "28px" }}>
          <button
            onClick={onPublish}
            style={{
              flex: 1, padding: "13px",
              background: "var(--accent)", border: "none", borderRadius: "12px",
              color: "#fff", fontSize: "15px", fontWeight: "500", cursor: "pointer",
              WebkitTapHighlightColor: "transparent", letterSpacing: "0.01em",
            }}
          >
            Publish
          </button>
          <button style={{
            flex: 1, padding: "13px",
            background: "none",
            border: "1.5px solid var(--border-2)",
            borderRadius: "12px",
            color: "var(--text)", fontSize: "15px", fontWeight: "500", cursor: "pointer",
            WebkitTapHighlightColor: "transparent", letterSpacing: "0.01em",
          }}>
            Edit Profile
          </button>
        </div>

        {/* Works */}
        <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-ghost)", marginBottom: "16px" }}>Works</div>

        {publishedWorks.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "48px 20px",
            color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.6,
          }}>
            Nothing published yet. Tap Publish to share your first work.
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "16px",
            paddingBottom: "40px",
          }}>
            {publishedWorks.map(book => (
              <div
                key={book.id}
                onClick={() => onOpenBook && onOpenBook(book.id)}
                style={{ cursor: "pointer" }}
              >
                <div style={{
                  width: "100%",
                  aspectRatio: "200/280",
                  borderRadius: "6px",
                  overflow: "hidden",
                  boxShadow: "2px 4px 12px rgba(0,0,0,0.18)",
                  marginBottom: "8px",
                }}>
                  <WorkCover book={book} />
                </div>
                <div style={{ fontSize: "13px", color: "var(--text)", fontWeight: "500", lineHeight: 1.3 }}>{book.title}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {book.totalPages === 1 ? "1 page" : `${book.totalPages} pages`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
