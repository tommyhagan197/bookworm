import { useState } from "react";
import { supabase } from "../lib/supabase";

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
);

const DotsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1" fill="currentColor"/>
    <circle cx="12" cy="12" r="1" fill="currentColor"/>
    <circle cx="12" cy="19" r="1" fill="currentColor"/>
  </svg>
);

export default function WorkReaderView({ work, onClose, onDeleted, onEdit }) {
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(work.title || "");
  const [editBody, setEditBody] = useState(work.body || "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    const { error } = await supabase.from("works").delete().eq("id", work.id);
    if (!error) {
      onDeleted && onDeleted(work.id);
    } else {
      console.error("Delete error:", error);
      setDeleting(false);
      setShowMenu(false);
    }
  }

  async function handleSaveEdit() {
    if (saving) return;
    if (!editTitle.trim() || !editBody.trim()) return;
    setSaving(true);
    setSaveError("");
    const { error } = await supabase
      .from("works")
      .update({ title: editTitle.trim(), body: editBody.trim() })
      .eq("id", work.id);
    if (!error) {
      // Update local work object and exit edit mode
      work.title = editTitle.trim();
      work.body = editBody.trim();
      setEditMode(false);
    } else {
      setSaveError("Couldn't save. Please try again.");
    }
    setSaving(false);
  }

  const wordCount = editBody.trim() ? editBody.trim().split(/\s+/).length : 0;

  // ── EDIT MODE ─────────────────────────────────────────────────────────────
  if (editMode) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "var(--bg)",
        display: "flex", flexDirection: "column",
        paddingTop: "env(safe-area-inset-top, 44px)",
        paddingBottom: "env(safe-area-inset-bottom, 20px)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: "1px solid rgba(139,111,71,0.12)",
          flexShrink: 0,
        }}>
          <button onClick={() => setEditMode(false)} style={{
            background: "none", border: "none", padding: "4px",
            cursor: "pointer", color: "var(--text-muted)",
            WebkitTapHighlightColor: "transparent", display: "flex",
          }}>
            <BackIcon />
          </button>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "17px", color: "var(--text)" }}>Edit Work</div>
          <button
            onClick={handleSaveEdit}
            disabled={saving || !editTitle.trim() || !editBody.trim()}
            style={{
              background: "var(--accent)", border: "none", borderRadius: "8px",
              padding: "7px 16px", color: "#fff",
              fontSize: "14px", fontWeight: "500",
              cursor: saving ? "default" : "pointer",
              opacity: saving ? 0.6 : 1,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }}>
          <input
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            placeholder="Title"
            maxLength={120}
            style={{
              width: "100%", border: "none", outline: "none",
              background: "transparent",
              fontFamily: "Georgia, serif",
              fontSize: "24px", fontWeight: "normal",
              color: "var(--text)", marginBottom: "16px",
              boxSizing: "border-box",
            }}
          />
          <div style={{ height: "1px", background: "rgba(139,111,71,0.12)", marginBottom: "16px" }}/>
          <textarea
            value={editBody}
            onChange={e => setEditBody(e.target.value)}
            placeholder="Write your story…"
            style={{
              width: "100%", border: "none", outline: "none",
              background: "transparent",
              fontFamily: "Georgia, serif",
              fontSize: "17px", lineHeight: "1.7",
              color: "var(--text)", resize: "none",
              minHeight: "60vh", boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{
          padding: "10px 20px",
          borderTop: "1px solid rgba(139,111,71,0.1)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
          {saveError && <span style={{ fontSize: "13px", color: "#c0392b" }}>{saveError}</span>}
        </div>
      </div>
    );
  }

  // ── READ MODE ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "var(--bg)",
      display: "flex", flexDirection: "column",
      paddingTop: "env(safe-area-inset-top, 44px)",
      paddingBottom: "env(safe-area-inset-bottom, 20px)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px",
        borderBottom: "1px solid rgba(139,111,71,0.12)",
        flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
          background: "none", border: "none", padding: "4px",
          cursor: "pointer", color: "var(--text-muted)",
          WebkitTapHighlightColor: "transparent", display: "flex",
        }}>
          <BackIcon />
        </button>
        <div style={{
          fontFamily: "Georgia, serif", fontSize: "17px",
          color: "var(--text)", textAlign: "center",
          flex: 1, margin: "0 12px",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {work.title}
        </div>

        {/* Three-dot menu */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowMenu(v => !v)}
            style={{
              background: "none", border: "none", padding: "4px",
              cursor: "pointer", color: "var(--text-muted)",
              WebkitTapHighlightColor: "transparent", display: "flex",
            }}
          >
            <DotsIcon />
          </button>

          {showMenu && (
            <>
              {/* Backdrop to close menu */}
              <div
                onClick={() => setShowMenu(false)}
                style={{ position: "fixed", inset: 0, zIndex: 10 }}
              />
              <div style={{
                position: "absolute", top: "100%", right: 0,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                minWidth: "140px",
                zIndex: 11,
                overflow: "hidden",
              }}>
                <button
                  onClick={() => { setShowMenu(false); setEditMode(true); }}
                  style={{
                    width: "100%", padding: "13px 16px",
                    background: "none", border: "none",
                    borderBottom: "1px solid var(--border)",
                    textAlign: "left", fontSize: "15px",
                    color: "var(--text)", cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                    display: "flex", alignItems: "center", gap: "10px",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    width: "100%", padding: "13px 16px",
                    background: "none", border: "none",
                    textAlign: "left", fontSize: "15px",
                    color: "#ef5350", cursor: deleting ? "default" : "pointer",
                    WebkitTapHighlightColor: "transparent",
                    opacity: deleting ? 0.6 : 1,
                    display: "flex", alignItems: "center", gap: "10px",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "32px 24px 60px",
        WebkitOverflowScrolling: "touch",
      }}>
        <h1 style={{
          fontFamily: "Georgia, serif",
          fontSize: "26px", fontWeight: "normal",
          color: "var(--text)", lineHeight: 1.3,
          marginBottom: "8px", marginTop: 0,
        }}>
          {work.title}
        </h1>
        <div style={{
          fontSize: "13px", color: "var(--text-muted)",
          marginBottom: "32px",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {new Date(work.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </div>
        <div style={{
          fontFamily: "Georgia, serif",
          fontSize: "18px", lineHeight: "1.8",
          color: "var(--text)",
          whiteSpace: "pre-wrap",
        }}>
          {work.body}
        </div>
      </div>
    </div>
  );
}
