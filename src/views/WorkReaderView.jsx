import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";

const FONT_SIZES = [14, 15, 16, 17, 18];
const LINE_HEIGHTS = [1.7, 1.9, 2.1];
const PADDING_H = 28;
const PADDING_V = 76;

function paginateText(body, availableHeight, fontSize, lineHeight) {
  if (!body) return [];
  const paragraphs = body.split(/\n+/).filter(p => p.trim().length > 0);
  const paras = paragraphs.map(p => ({ html: p.trim(), isHeading: false }));

  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed; top: -9999px; left: 0;
    width: calc(100vw - ${PADDING_H * 2}px);
    font-family: 'Lora', Georgia, serif;
    font-size: ${fontSize}px; line-height: ${lineHeight};
    visibility: hidden; pointer-events: none; box-sizing: border-box;
  `;
  document.body.appendChild(container);

  const pages = [];
  let current = [];
  let height = 0;
  const paraGap = fontSize * 0.85;

  for (const para of paras) {
    const el = document.createElement("p");
    el.innerHTML = para.html;
    el.style.cssText = `margin: 0 0 ${paraGap}px; text-align: justify; hyphens: auto; -webkit-hyphens: auto;`;
    container.appendChild(el);
    const h = el.getBoundingClientRect().height + paraGap;
    container.removeChild(el);
    if (height + h > availableHeight && current.length > 0) {
      pages.push(current);
      current = [];
      height = 0;
    }
    current.push(para);
    height += h;
  }
  if (current.length > 0) pages.push(current);
  document.body.removeChild(container);
  return pages;
}

export default function WorkReaderView({ work: initialWork, onClose, onDeleted }) {
  const [work, setWork] = useState(initialWork);
  const [pages, setPages] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [paginating, setPaginating] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [hudVisible, setHudVisible] = useState(false);
  const [fontSizeIdx, setFontSizeIdx] = useState(2);
  const [lineHeightIdx, setLineHeightIdx] = useState(2);
  const [showSettings, setShowSettings] = useState(false);

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(work.title || "");
  const [editBody, setEditBody] = useState(work.body || "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const hudTimer = useRef(null);

  const fontSize = FONT_SIZES[fontSizeIdx];
  const lineHeight = LINE_HEIGHTS[lineHeightIdx];
  const availableHeight = window.innerHeight - PADDING_V * 2 - 60;

  useEffect(() => {
    repaginate(work.body, fontSize, lineHeight);
  }, [work.body, fontSizeIdx, lineHeightIdx]);

  function repaginate(body, fs, lh) {
    setPaginating(true);
    setPageIndex(0);
    // Small delay so UI renders first
    setTimeout(() => {
      const result = paginateText(body, availableHeight, fs, lh);
      setPages(result.length > 0 ? result : [[{ html: body, isHeading: false }]]);
      setPaginating(false);
    }, 50);
  }

  function goNext() {
    if (pageIndex < pages.length - 1) setPageIndex(p => p + 1);
  }

  function goPrev() {
    if (pageIndex > 0) setPageIndex(p => p - 1);
  }

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) { toggleHud(); return; }
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 35) {
      if (showSettings) { setShowSettings(false); return; }
      if (dx < 0) goNext();
      else goPrev();
    }
  }

  function toggleHud() {
    if (showSettings) { setShowSettings(false); setHudVisible(false); return; }
    setHudVisible(v => {
      clearTimeout(hudTimer.current);
      if (!v) hudTimer.current = setTimeout(() => setHudVisible(false), 4000);
      return !v;
    });
  }

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
    if (saving || !editTitle.trim() || !editBody.trim()) return;
    setSaving(true);
    setSaveError("");
    const { error } = await supabase
      .from("works")
      .update({ title: editTitle.trim(), body: editBody.trim() })
      .eq("id", work.id);
    if (!error) {
      const updated = { ...work, title: editTitle.trim(), body: editBody.trim() };
      setWork(updated);
      setEditMode(false);
    } else {
      setSaveError("Couldn't save. Please try again.");
    }
    setSaving(false);
  }

  const progress = pages.length > 1 ? Math.round((pageIndex / (pages.length - 1)) * 100) : 100;
  const currentPage = pages[pageIndex] || [];
  const wordCount = editBody.trim() ? editBody.trim().split(/\s+/).length : 0;

  // ── EDIT MODE ─────────────────────────────────────────────────────────────
  if (editMode) {
    return (
      <div style={{ position:"fixed", inset:0, zIndex:300, background:"var(--bg)", display:"flex", flexDirection:"column", paddingTop:"env(safe-area-inset-top, 44px)", paddingBottom:"env(safe-area-inset-bottom, 20px)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid rgba(139,111,71,0.12)", flexShrink:0 }}>
          <button onClick={() => setEditMode(false)} style={{ background:"none", border:"none", padding:"4px", cursor:"pointer", color:"var(--text-muted)", WebkitTapHighlightColor:"transparent", display:"flex" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div style={{ fontFamily:"Georgia, serif", fontSize:"17px", color:"var(--text)" }}>Edit Work</div>
          <button onClick={handleSaveEdit} disabled={saving || !editTitle.trim() || !editBody.trim()} style={{ background:"var(--accent)", border:"none", borderRadius:"8px", padding:"7px 16px", color:"#fff", fontSize:"14px", fontWeight:"500", cursor: saving?"default":"pointer", opacity: saving?0.6:1, WebkitTapHighlightColor:"transparent" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"20px 20px 0" }}>
          <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" maxLength={120}
            style={{ width:"100%", border:"none", outline:"none", background:"transparent", fontFamily:"Georgia, serif", fontSize:"24px", fontWeight:"normal", color:"var(--text)", marginBottom:"16px", boxSizing:"border-box" }}
          />
          <div style={{ height:"1px", background:"rgba(139,111,71,0.12)", marginBottom:"16px" }}/>
          <textarea value={editBody} onChange={e => setEditBody(e.target.value)} placeholder="Write your story…"
            style={{ width:"100%", border:"none", outline:"none", background:"transparent", fontFamily:"Georgia, serif", fontSize:"17px", lineHeight:"1.7", color:"var(--text)", resize:"none", minHeight:"60vh", boxSizing:"border-box" }}
          />
        </div>
        <div style={{ padding:"10px 20px", borderTop:"1px solid rgba(139,111,71,0.1)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <span style={{ fontSize:"13px", color:"var(--text-muted)" }}>{wordCount} {wordCount===1?"word":"words"}</span>
          {saveError && <span style={{ fontSize:"13px", color:"#c0392b" }}>{saveError}</span>}
        </div>
      </div>
    );
  }

  // ── READ MODE ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:300, background:"var(--bg)", display:"flex", flexDirection:"column", overflow:"hidden", touchAction:"pan-y" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Close button */}
      <button
        className={"rdr-close" + (hudVisible ? " hud-open" : "")}
        onTouchEnd={e => { e.stopPropagation(); onClose(); }}
        onClick={onClose}
        style={{ position:"fixed", top:"calc(env(safe-area-inset-top, 0px) + 12px)", left:"12px", zIndex:20, width:"44px", height:"44px", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(245,240,232,0.9)", border:"none", borderRadius:"50%", cursor:"pointer", color:"var(--text)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", WebkitTapHighlightColor:"transparent", boxShadow:"0 1px 6px rgba(0,0,0,0.12)", transition:"opacity 0.2s", opacity: hudVisible ? 0 : 1, pointerEvents: hudVisible ? "none" : "auto" }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ width:20, height:20 }}>
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>

      {/* Three-dot menu button — top right, always visible */}
      <div style={{ position:"fixed", top:"calc(env(safe-area-inset-top, 0px) + 12px)", right:"12px", zIndex:21 }}>
        <button
          onTouchEnd={e => { e.stopPropagation(); setShowMenu(v => !v); }}
          onClick={e => { e.stopPropagation(); setShowMenu(v => !v); }}
          style={{ width:"44px", height:"44px", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(245,240,232,0.9)", border:"none", borderRadius:"50%", cursor:"pointer", color:"var(--text-muted)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", WebkitTapHighlightColor:"transparent", boxShadow:"0 1px 6px rgba(0,0,0,0.12)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
          </svg>
        </button>

        {showMenu && (
          <>
            <div onClick={() => setShowMenu(false)} style={{ position:"fixed", inset:0, zIndex:10 }}/>
            <div style={{ position:"absolute", top:"52px", right:0, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"10px", boxShadow:"0 4px 20px rgba(0,0,0,0.15)", minWidth:"140px", zIndex:11, overflow:"hidden" }}>
              <button
                onClick={() => { setShowMenu(false); setEditMode(true); }}
                style={{ width:"100%", padding:"13px 16px", background:"none", border:"none", borderBottom:"1px solid var(--border)", textAlign:"left", fontSize:"15px", color:"var(--text)", cursor:"pointer", WebkitTapHighlightColor:"transparent", display:"flex", alignItems:"center", gap:"10px" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ width:"100%", padding:"13px 16px", background:"none", border:"none", textAlign:"left", fontSize:"15px", color:"#ef5350", cursor: deleting?"default":"pointer", WebkitTapHighlightColor:"transparent", opacity: deleting?0.6:1, display:"flex", alignItems:"center", gap:"10px" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* HUD top */}
      <div style={{ position:"fixed", top:0, left:0, right:0, paddingTop:"env(safe-area-inset-top, 0px)", height:"calc(env(safe-area-inset-top, 0px) + 52px)", display:"flex", alignItems:"flex-end", justifyContent:"center", paddingBottom:"10px", paddingLeft:"60px", paddingRight:"60px", background:"linear-gradient(to bottom, var(--bg) 60%, transparent)", zIndex:10, opacity: hudVisible?1:0, transition:"opacity 0.2s", pointerEvents:"none" }}>
        <div style={{ fontFamily:"Georgia, serif", fontSize:"13px", color:"var(--text-muted)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{work.title}</div>
      </div>

      {/* Page content */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        {paginating ? (
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"16px", color:"var(--text-muted)", fontSize:"15px" }}>
            <div style={{ width:"28px", height:"28px", border:"2.5px solid rgba(139,111,71,0.2)", borderTopColor:"var(--accent)", borderRadius:"50%", animation:"rspin 0.7s linear infinite" }}/>
          </div>
        ) : (
          <div style={{ flex:1, padding:`${PADDING_V}px ${PADDING_H}px`, overflow:"hidden" }}>
            {currentPage.map((para, i) => (
              <p key={i} style={{ fontFamily:"'Lora', Georgia, serif", fontSize:`${fontSize}px`, lineHeight:`${lineHeight}`, color:"var(--text)", margin:`0 0 ${fontSize * 0.85}px`, textAlign:"justify", hyphens:"auto", WebkitHyphens:"auto" }}
                dangerouslySetInnerHTML={{ __html: para.html }}
              />
            ))}
          </div>
        )}
      </div>

      {/* HUD bottom */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, padding:`10px 16px calc(env(safe-area-inset-bottom, 0px) + 14px)`, background:"linear-gradient(to top, var(--bg) 70%, transparent)", zIndex:10, opacity: hudVisible?1:0, pointerEvents: hudVisible?"auto":"none", transition:"opacity 0.2s" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontSize:"12px", color:"var(--text-muted)", fontFamily:"'DM Sans', sans-serif", minWidth:"32px" }}>{progress}%</span>
          <div style={{ flex:1, height:"2px", background:"rgba(139,111,71,0.2)", borderRadius:"2px", overflow:"hidden" }}>
            <div style={{ height:"100%", background:"var(--accent)", borderRadius:"2px", width:`${progress}%`, transition:"width 0.3s" }}/>
          </div>
          <span style={{ fontSize:"12px", color:"var(--text-muted)", fontFamily:"'DM Sans', sans-serif", minWidth:"52px", textAlign:"right" }}>{pageIndex + 1} / {pages.length}</span>
          <button
            onTouchEnd={e => { e.stopPropagation(); setShowSettings(s => !s); }}
            onClick={e => { e.stopPropagation(); setShowSettings(s => !s); }}
            style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", padding:"6px", WebkitTapHighlightColor:"transparent" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ width:18, height:18, display:"block" }}>
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </button>
        </div>

        {showSettings && (
          <div
            onTouchStart={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
            style={{ marginTop:"12px", padding:"14px 16px", background:"var(--surface)", borderRadius:"12px", border:"1px solid rgba(139,111,71,0.12)" }}
          >
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
              <span style={{ fontSize:"13px", color:"var(--text-muted)", fontFamily:"'DM Sans', sans-serif" }}>Text size</span>
              <div style={{ display:"flex", gap:"6px" }}>
                {FONT_SIZES.map((sz, i) => (
                  <button key={i}
                    onTouchEnd={e => { e.stopPropagation(); setFontSizeIdx(i); }}
                    onClick={() => setFontSizeIdx(i)}
                    style={{ padding:"6px 10px", borderRadius:"6px", border:`1px solid ${fontSizeIdx===i?"var(--accent)":"rgba(139,111,71,0.2)"}`, background: fontSizeIdx===i?"var(--accent)":"transparent", color: fontSizeIdx===i?"#fff":"var(--text-muted)", fontSize:"12px", fontFamily:"'DM Sans', sans-serif", cursor:"pointer", WebkitTapHighlightColor:"transparent" }}
                  >
                    {["S","M","L","XL","XXL"][i]}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:"13px", color:"var(--text-muted)", fontFamily:"'DM Sans', sans-serif" }}>Spacing</span>
              <div style={{ display:"flex", gap:"6px" }}>
                {LINE_HEIGHTS.map((lh, i) => (
                  <button key={i}
                    onTouchEnd={e => { e.stopPropagation(); setLineHeightIdx(i); }}
                    onClick={() => setLineHeightIdx(i)}
                    style={{ padding:"6px 10px", borderRadius:"6px", border:`1px solid ${lineHeightIdx===i?"var(--accent)":"rgba(139,111,71,0.2)"}`, background: lineHeightIdx===i?"var(--accent)":"transparent", color: lineHeightIdx===i?"#fff":"var(--text-muted)", fontSize:"12px", fontFamily:"'DM Sans', sans-serif", cursor:"pointer", WebkitTapHighlightColor:"transparent" }}
                  >
                    {["Tight","Normal","Airy"][i]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes rspin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
