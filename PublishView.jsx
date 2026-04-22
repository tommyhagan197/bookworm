import { useState } from "react";
import { dbPut, getSetting } from "../db/idb";

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
);

function generateId() {
  return "pub_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

const COVER_COLORS = [
  "#6B5344", "#4a6b7c", "#5a6b4a", "#7c4a6b", "#8b6914", "#4a5e7c",
];

export default function PublishView({ onClose, onPublished }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const canPublish = title.trim().length > 0 && body.trim().length > 0;

  async function handlePublish() {
    if (!canPublish || publishing) return;
    setPublishing(true);
    setError("");

    try {
      const id = generateId();
      const color = COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)];

      // Paginate the body into pages (~300 words each)
      const words = body.trim().split(/\s+/);
      const WORDS_PER_PAGE = 300;
      const pages = [];
      for (let i = 0; i < words.length; i += WORDS_PER_PAGE) {
        const chunk = words.slice(i, i + WORDS_PER_PAGE).join(" ");
        pages.push(`<p>${chunk}</p>`);
      }

      // Save book record
      await dbPut("books", {
        id,
        title: title.trim(),
        author: "Tommy Hagan",
        color,
        type: "published",
        pageCount: pages.length,
        addedAt: Date.now(),
      });

      // Save pages
      for (let i = 0; i < pages.length; i++) {
        await dbPut("pages", { id: `${id}:${i}`, html: pages[i] });
      }

      onPublished(id);
    } catch (e) {
      setError("Something went wrong. Please try again.");
      setPublishing(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
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
        <div style={{ fontFamily: "Georgia, serif", fontSize: "17px", color: "var(--text)" }}>New Work</div>
        <button
          onClick={handlePublish}
          disabled={!canPublish || publishing}
          style={{
            background: canPublish ? "var(--accent)" : "rgba(139,111,71,0.15)",
            border: "none", borderRadius: "8px",
            padding: "7px 16px",
            color: canPublish ? "#fff" : "var(--text-muted)",
            fontSize: "14px", fontWeight: "500",
            cursor: canPublish ? "pointer" : "default",
            WebkitTapHighlightColor: "transparent",
            transition: "all 0.15s",
          }}
        >
          {publishing ? "Publishing…" : "Publish"}
        </button>
      </div>

      {/* Compose area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title"
          maxLength={120}
          style={{
            width: "100%", border: "none", outline: "none",
            background: "transparent",
            fontFamily: "Georgia, serif",
            fontSize: "24px", fontWeight: "normal",
            color: "var(--text)",
            marginBottom: "16px",
            boxSizing: "border-box",
          }}
        />
        <div style={{
          height: "1px",
          background: "rgba(139,111,71,0.12)",
          marginBottom: "16px",
        }} />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write your story…"
          style={{
            width: "100%", border: "none", outline: "none",
            background: "transparent",
            fontFamily: "Georgia, serif",
            fontSize: "17px", lineHeight: "1.7",
            color: "var(--text)",
            resize: "none",
            minHeight: "60vh",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Footer — word count + error */}
      <div style={{
        padding: "10px 20px",
        borderTop: "1px solid rgba(139,111,71,0.1)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        {error
          ? <span style={{ fontSize: "13px", color: "#c0392b" }}>{error}</span>
          : <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
        }
      </div>
    </div>
  );
}
