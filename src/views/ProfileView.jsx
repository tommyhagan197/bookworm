import { useState, useEffect } from "react";
import { getSetting, setSetting } from "../db/idb";
import { useTheme } from "../App";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../lib/supabase";

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

function pc(id) { return PALETTE.find(p => p.id === id) || PALETTE[0]; }

function splitTitle(title) {
  if (!title) return ["Untitled", ""];
  const words = title.split(" ");
  if (words.length <= 2) return [title, ""];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

function WorkCover({ work }) {
  const title = work.title || "Untitled";
  const author = work.author_name || "";
  const cd = work.cover_data;
  const uid = work.id.replace(/[^a-z0-9]/gi, "").slice(0, 12);

  if (!cd) {
    const [l1, l2] = splitTitle(title);
    return (
      <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs><linearGradient id={`fg_${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6B5344"/><stop offset="100%" stopColor="#6B534499"/></linearGradient></defs>
        <rect width="200" height="280" fill={`url(#fg_${uid})`}/>
        <rect width="200" height="4" fill="rgba(255,255,255,0.25)"/>
        <text x="16" y="160" fontFamily="Georgia,serif" fontSize="22" fill="white" fontWeight="bold">{l1}</text>
        {l2 && <text x="16" y="184" fontFamily="Georgia,serif" fontSize="22" fill="white" fontWeight="bold">{l2}</text>}
        <text x="16" y="210" fontFamily="Georgia,serif" fontSize="11" fill="rgba(255,255,255,0.7)">{author}</text>
      </svg>
    );
  }

  const colors = (cd.colors || ["walnut"]).map(pc);
  const c0 = colors[0] || pc("walnut");
  const c1 = colors[1] || pc("ember");
  const c2 = colors[2] || pc("ember");
  const tp = cd.titlePos || "lower";
  const showAuthor = cd.showAuthor !== false;
  const templateId = cd.templateId || "gradient";
  const [l1, l2] = splitTitle(title);
  const ty = tp === "top" ? 60 : tp === "middle" ? 110 : 160;

  if (templateId === "gradient") return (
    <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs><linearGradient id={`tg_${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={c0.color}/><stop offset="100%" stopColor={c0.dark}/></linearGradient></defs>
      <rect width="200" height="280" fill={`url(#tg_${uid})`}/>
      <rect width="200" height="4" fill="rgba(255,255,255,0.25)"/>
      <line x1="16" y1={ty+30} x2="100" y2={ty+30} stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
      <text x="16" y={ty} fontFamily="Georgia,serif" fontSize="22" fill="white" fontWeight="bold">{l1}</text>
      {l2 && <text x="16" y={ty+24} fontFamily="Georgia,serif" fontSize="22" fill="white" fontWeight="bold">{l2}</text>}
      {showAuthor && <text x="16" y={ty+44} fontFamily="Georgia,serif" fontSize="11" fill="rgba(255,255,255,0.75)">{author}</text>}
    </svg>
  );
  if (templateId === "split") { const ty2=tp==="top"?50:tp==="middle"?120:200; return (
    <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width="120" height="280" fill={c0.color}/><rect x="120" width="80" height="280" fill={c1.color}/>
      <rect width="200" height="3" fill="rgba(255,255,255,0.2)"/>
      <text x="12" y={ty2} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{l1}</text>
      {l2 && <text x="12" y={ty2+22} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{l2}</text>}
      {showAuthor && <text x="12" y={ty2+(l2?40:20)} fontFamily="Georgia,serif" fontSize="10" fill="rgba(255,255,255,0.75)">{author}</text>}
    </svg>
  );}
  if (templateId === "bands") { const ty2=tp==="top"?50:tp==="middle"?150:230; return (
    <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width="200" height="100" fill={c0.color}/><rect y="100" width="200" height="6" fill="rgba(255,255,255,0.3)"/><rect y="106" width="200" height="174" fill={c1.color}/>
      <text x="14" y={ty2} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{l1}</text>
      {l2 && <text x="14" y={ty2+22} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{l2}</text>}
      {showAuthor && <text x="14" y={ty2+(l2?40:20)} fontFamily="Georgia,serif" fontSize="10" fill="rgba(255,255,255,0.75)">{author}</text>}
    </svg>
  );}
  if (templateId === "slash") { const ty2=tp==="top"?50:tp==="middle"?150:220; return (
    <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width="200" height="280" fill={c0.color}/><polygon points="0,0 140,0 0,190" fill={c1.color}/>
      <text x="14" y={ty2} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{l1}</text>
      {l2 && <text x="14" y={ty2+22} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{l2}</text>}
      {showAuthor && <text x="14" y={ty2+(l2?40:20)} fontFamily="Georgia,serif" fontSize="10" fill="rgba(255,255,255,0.75)">{author}</text>}
    </svg>
  );}
  if (templateId === "arc") { const ty2=tp==="top"?50:tp==="middle"?150:220; return (
    <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width="200" height="280" fill={c0.color}/><path d="M0,280 Q200,130 200,0 L200,280 Z" fill={c1.dark||c1.color}/><circle cx="50" cy="80" r="55" fill={c2.color} opacity="0.9"/>
      <text x="14" y={ty2} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{l1}</text>
      {l2 && <text x="14" y={ty2+22} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{l2}</text>}
      {showAuthor && <text x="14" y={ty2+(l2?40:20)} fontFamily="Georgia,serif" fontSize="10" fill="rgba(255,255,255,0.75)">{author}</text>}
    </svg>
  );}
  if (templateId === "dots") { const ty2=tp==="top"?50:tp==="middle"?150:220; const dots=[]; for(let r=0;r<5;r++) for(let col=0;col<5;col++) dots.push({cx:24+col*40,cy:24+r*40}); return (
    <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width="200" height="280" fill={c0.color}/>
      {dots.map((d,i)=><circle key={i} cx={d.cx} cy={d.cy} r="10" fill="rgba(255,255,255,0.18)"/>)}
      <text x="14" y={ty2} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{l1}</text>
      {l2 && <text x="14" y={ty2+22} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{l2}</text>}
      {showAuthor && <text x="14" y={ty2+(l2?40:20)} fontFamily="Georgia,serif" fontSize="10" fill="rgba(255,255,255,0.75)">{author}</text>}
    </svg>
  );}
  if (templateId === "stripes") { const ty2=tp==="top"?50:tp==="middle"?150:220; return (
    <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width="200" height="280" fill={c0.color}/>
      {[-40,-20,0,20,40,60,80,100,120].map((o,i)=><line key={i} x1={o} y1="0" x2={o+280} y2="280" stroke="rgba(255,255,255,0.1)" strokeWidth="18"/>)}
      <text x="14" y={ty2} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{l1}</text>
      {l2 && <text x="14" y={ty2+22} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{l2}</text>}
      {showAuthor && <text x="14" y={ty2+(l2?40:20)} fontFamily="Georgia,serif" fontSize="10" fill="rgba(255,255,255,0.75)">{author}</text>}
    </svg>
  );}
  if (templateId === "frame") { const ty2=tp==="top"?60:tp==="middle"?140:210; return (
    <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width="200" height="280" fill={c0.dark||c0.color}/>
      <rect x="10" y="10" width="180" height="260" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
      <rect x="16" y="16" width="168" height="248" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
      <text x="24" y={ty2} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{l1}</text>
      {l2 && <text x="24" y={ty2+22} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{l2}</text>}
      {showAuthor && <text x="24" y={ty2+(l2?40:20)} fontFamily="Georgia,serif" fontSize="10" fill="rgba(255,255,255,0.75)">{author}</text>}
    </svg>
  );}
  if (templateId === "chevron") { const ty2=tp==="top"?50:tp==="middle"?140:220; return (
    <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width="200" height="280" fill={c0.dark||c0.color}/>
      <polygon points="0,0 200,0 200,140" fill={c0.color}/><polygon points="0,280 200,280 0,140" fill={c0.color}/>
      <text x="14" y={ty2} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{l1}</text>
      {l2 && <text x="14" y={ty2+22} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{l2}</text>}
      {showAuthor && <text x="14" y={ty2+(l2?40:20)} fontFamily="Georgia,serif" fontSize="10" fill="rgba(255,255,255,0.75)">{author}</text>}
    </svg>
  );}
  return (
    <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width="200" height="280" fill={c0.color}/>
      <text x="16" y="160" fontFamily="Georgia,serif" fontSize="22" fill="white" fontWeight="bold">{l1}</text>
      {l2 && <text x="16" y="184" fontFamily="Georgia,serif" fontSize="22" fill="white" fontWeight="bold">{l2}</text>}
    </svg>
  );
}

// Work card with cover + ... menu
function WorkCard({ work, onOpen, onDeleted, onEdited }) {
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e) {
    e.stopPropagation();
    if (deleting) return;
    setDeleting(true);
    const { error } = await supabase.from("works").delete().eq("id", work.id);
    if (!error) onDeleted(work.id);
    else { setDeleting(false); setShowMenu(false); }
  }

  return (
    <div style={{ cursor:"pointer", position:"relative" }}>
      {/* Cover — tapping opens reader */}
      <div
        onClick={onOpen}
        style={{ width:"100%", aspectRatio:"200/280", borderRadius:"6px", overflow:"hidden", boxShadow:"2px 4px 12px rgba(0,0,0,0.18)", marginBottom:"8px", position:"relative" }}
      >
        <WorkCover work={work} />

        {/* ... button overlaid on top-right of cover */}
        <button
          onClick={e => { e.stopPropagation(); setShowMenu(v => !v); }}
          style={{
            position:"absolute", top:"8px", right:"8px",
            width:"28px", height:"28px",
            background:"rgba(0,0,0,0.45)",
            border:"none", borderRadius:"50%",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", WebkitTapHighlightColor:"transparent",
            backdropFilter:"blur(4px)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/>
          </svg>
        </button>
      </div>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          <div onClick={() => setShowMenu(false)} style={{ position:"fixed", inset:0, zIndex:50 }}/>
          <div style={{ position:"absolute", top:"8px", right:"8px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"10px", boxShadow:"0 4px 20px rgba(0,0,0,0.18)", minWidth:"130px", zIndex:51, overflow:"hidden" }}>
            <button
              onClick={e => { e.stopPropagation(); setShowMenu(false); onOpen(); }}
              style={{ width:"100%", padding:"12px 14px", background:"none", border:"none", borderBottom:"1px solid var(--border)", textAlign:"left", fontSize:"14px", color:"var(--text)", cursor:"pointer", WebkitTapHighlightColor:"transparent", display:"flex", alignItems:"center", gap:"8px" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Read
            </button>
            <button
              onClick={e => { e.stopPropagation(); setShowMenu(false); onEdited && onEdited(work); }}
              style={{ width:"100%", padding:"12px 14px", background:"none", border:"none", borderBottom:"1px solid var(--border)", textAlign:"left", fontSize:"14px", color:"var(--text)", cursor:"pointer", WebkitTapHighlightColor:"transparent", display:"flex", alignItems:"center", gap:"8px" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{ width:"100%", padding:"12px 14px", background:"none", border:"none", textAlign:"left", fontSize:"14px", color:"#ef5350", cursor: deleting?"default":"pointer", WebkitTapHighlightColor:"transparent", opacity: deleting?0.6:1, display:"flex", alignItems:"center", gap:"8px" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </>
      )}

      <div style={{ fontSize:"13px", color:"var(--text)", fontWeight:"500", lineHeight:1.3 }}>{work.title}</div>
      <div style={{ fontSize:"11px", color:"var(--text-muted)", marginTop:"2px" }}>
        {new Date(work.created_at).toLocaleDateString("en-US", {month:"short", day:"numeric", year:"numeric"})}
      </div>
    </div>
  );
}

function ThemeTile({ id, label, active, onClick }) {
  const configs = {
    night: { preview:"#0a0a0a", line:"#3a3228", labelBg:"#070707", labelColor: active?"#E07C3A":"#2a2a2a", border:"#111" },
    sepia: { preview:"#F5F0E8", line:"#c4b8a4", labelBg:"#EDE7DA", labelColor: active?"#C0602A":"#b5a898", border:"#DDD5C6" },
    paper: { preview:"#ffffff", line:"#d8d8d8", labelBg:"#f8f8f8", labelColor: active?"#E07C3A":"#c0c0c0", border:"#ebebeb" },
  };
  const c = configs[id];
  return (
    <button onClick={onClick} style={{ flex:1, borderRadius:"10px", overflow:"hidden", padding:0, cursor:"pointer", border:`${active?"1.5px":"0.5px"} solid ${active?"#E07C3A":c.border}`, background:"none", WebkitTapHighlightColor:"transparent", transition:"border-color 0.15s ease" }}>
      <div style={{ background:c.preview, padding:"10px 8px 8px", display:"flex", flexDirection:"column", gap:"5px" }}>
        <div style={{ height:"5px", borderRadius:"3px", background:c.line, opacity:0.7 }}/>
        <div style={{ height:"5px", borderRadius:"3px", background:c.line, opacity:0.5, width:"60%" }}/>
        <div style={{ height:"5px", borderRadius:"3px", background:c.line, opacity:0.7 }}/>
      </div>
      <div style={{ background:c.labelBg, borderTop:`0.5px solid ${c.border}`, padding:"5px 8px 7px", textAlign:"center", fontSize:"10px", letterSpacing:"0.08em", textTransform:"uppercase", color:c.labelColor, fontWeight:active?"500":"400", transition:"color 0.15s ease" }}>{label}</div>
    </button>
  );
}

export default function ProfileView({ onPublish, onOpenWork }) {
  const { theme, setTheme } = useTheme();
  const { profile, signOut, session } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSizeState] = useState("medium");
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSetting("fontSize", "medium").then(f => { setFontSizeState(f); applyFontSize(f); });
    if (session?.user?.id) loadWorks();
  }, [session?.user?.id]);

  async function loadWorks() {
    setLoading(true);
    const { data, error } = await supabase
      .from("works").select("*")
      .eq("author_id", session.user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setWorks(data);
    setLoading(false);
  }

  function applyFontSize(f) {
    const fs = FONT_SIZES.find(s => s.id === f) || FONT_SIZES[1];
    document.documentElement.style.setProperty("--reader-font-size", fs.size);
  }

  async function handleTheme(t) { setTheme(t); await setSetting("theme", t); }
  async function handleFontSize(f) { setFontSizeState(f); applyFontSize(f); await setSetting("fontSize", f); }

  const displayName = profile?.display_name || session?.user?.email?.split("@")[0] || "Reader";
  const handle = "@" + displayName.toLowerCase().replace(/\s+/g, "");
  const initials = displayName.charAt(0).toUpperCase();

  if (showSettings) {
    return (
      <div style={{ display:"flex", flexDirection:"column", background:"var(--bg)", minHeight:"100%", paddingTop:"env(safe-area-inset-top, 44px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"16px 20px 12px", borderBottom:"1px solid var(--border)" }}>
          <button onClick={() => setShowSettings(false)} style={{ background:"none", border:"none", padding:"4px", cursor:"pointer", color:"var(--text-muted)", WebkitTapHighlightColor:"transparent", display:"flex" }}><BackIcon /></button>
          <div style={{ fontFamily:"Georgia, serif", fontSize:"18px", color:"var(--text)" }}>Settings</div>
        </div>
        <div style={{ padding:"20px 20px 40px" }}>
          <div style={{ fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-ghost)", marginBottom:"10px" }}>Appearance</div>
          <div style={{ background:"var(--surface)", borderRadius:"12px", padding:"16px", marginBottom:"10px", border:"1px solid var(--border)" }}>
            <div style={{ fontSize:"15px", color:"var(--text)", fontWeight:"500", marginBottom:"2px" }}>Theme</div>
            <div style={{ fontSize:"12px", color:"var(--text-muted)", marginBottom:"14px" }}>App and reading background</div>
            <div style={{ display:"flex", gap:"10px" }}>
              <ThemeTile id="night" label="Night" active={theme==="night"} onClick={() => handleTheme("night")}/>
              <ThemeTile id="sepia" label="Sepia" active={theme==="sepia"} onClick={() => handleTheme("sepia")}/>
              <ThemeTile id="paper" label="Paper" active={theme==="paper"} onClick={() => handleTheme("paper")}/>
            </div>
          </div>
          <div style={{ background:"var(--surface)", borderRadius:"12px", padding:"16px", marginBottom:"24px", border:"1px solid var(--border)" }}>
            <div style={{ fontSize:"15px", color:"var(--text)", fontWeight:"500", marginBottom:"2px" }}>Text size</div>
            <div style={{ fontSize:"12px", color:"var(--text-muted)", marginBottom:"14px" }}>Font size while reading</div>
            <div style={{ display:"flex", gap:"8px" }}>
              {FONT_SIZES.map(f => (
                <button key={f.id} onClick={() => handleFontSize(f.id)} style={{ flex:1, padding:"10px 0", background: fontSize===f.id?"var(--accent)":"var(--surface-2)", border:`1.5px solid ${fontSize===f.id?"var(--accent)":"transparent"}`, borderRadius:"8px", fontSize:"14px", color: fontSize===f.id?"#fff":"var(--text)", cursor:"pointer", WebkitTapHighlightColor:"transparent" }}>{f.label}</button>
              ))}
            </div>
          </div>
          <div style={{ fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-ghost)", marginBottom:"10px" }}>Account</div>
          <div style={{ background:"var(--surface)", borderRadius:"12px", marginBottom:"10px", border:"1px solid var(--border)", overflow:"hidden" }}>
            <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--border)" }}>
              <div style={{ fontSize:"12px", color:"var(--text-ghost)", marginBottom:"2px" }}>Signed in as</div>
              <div style={{ fontSize:"14px", color:"var(--text)" }}>{session?.user?.email}</div>
            </div>
            {["Reading Preferences","Notifications","Privacy"].map((item,i,arr) => (
              <div key={item} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"15px 16px", borderBottom: i<arr.length-1?"1px solid var(--border)":"none", fontSize:"15px", color:"var(--text)", cursor:"pointer" }}>
                <span>{item}</span><ChevronRight/>
              </div>
            ))}
          </div>
          <div style={{ fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-ghost)", margin:"24px 0 10px" }}>About</div>
          {[["BookWorm","v1.0"],["Books","Project Gutenberg"]].map(([label,value]) => (
            <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 0", borderBottom:"1px solid var(--border)", fontSize:"14px", color:"var(--text)" }}>
              <span>{label}</span><span style={{ fontSize:"13px", color:"var(--text-muted)" }}>{value}</span>
            </div>
          ))}
          <button onClick={signOut} style={{ width:"100%", marginTop:"24px", padding:"14px", background:"none", border:"1.5px solid #ef5350", borderRadius:"12px", color:"#ef5350", fontSize:"15px", fontWeight:"500", cursor:"pointer", fontFamily:"'DM Sans', sans-serif", WebkitTapHighlightColor:"transparent" }}>Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", background:"var(--bg)", minHeight:"100%", paddingTop:"env(safe-area-inset-top, 44px)" }}>
      <div style={{ display:"flex", justifyContent:"flex-end", padding:"12px 20px 0" }}>
        <button onClick={() => setShowSettings(true)} style={{ background:"none", border:"none", padding:"4px", cursor:"pointer", color:"var(--text-muted)", WebkitTapHighlightColor:"transparent", display:"flex" }}><GearIcon /></button>
      </div>

      <div style={{ padding:"12px 20px 0" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"16px" }}>
          <div style={{ width:"72px", height:"72px", borderRadius:"50%", background:"#6B5344", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <span style={{ fontFamily:"Georgia, serif", fontSize:"26px", color:"#fff", fontWeight:"normal" }}>{initials}</span>
          </div>
          <div>
            <div style={{ fontFamily:"Georgia, serif", fontSize:"20px", color:"var(--text)", lineHeight:1.2 }}>{displayName}</div>
            <div style={{ fontSize:"13px", color:"var(--text-muted)", marginTop:"2px" }}>{handle}</div>
            <div style={{ fontSize:"13px", color:"var(--text-muted)", marginTop:"4px", lineHeight:1.4 }}>{session?.user?.email}</div>
          </div>
        </div>

        <div style={{ display:"flex", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)", padding:"14px 0", marginBottom:"16px" }}>
          {[{value:String(works.length),label:"Works"},{value:"0",label:"Followers"},{value:"0",label:"Following"}].map(({value,label},i) => (
            <div key={label} style={{ flex:1, textAlign:"center", borderRight: i<2?"1px solid var(--border)":"none" }}>
              <div style={{ fontFamily:"Georgia, serif", fontSize:"22px", color:"var(--text)" }}>{value}</div>
              <div style={{ fontSize:"11px", color:"var(--text-muted)", marginTop:"2px", textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", gap:"10px", marginBottom:"28px" }}>
          <button onClick={onPublish} style={{ flex:1, padding:"13px", background:"var(--accent)", border:"none", borderRadius:"12px", color:"#fff", fontSize:"15px", fontWeight:"500", cursor:"pointer", WebkitTapHighlightColor:"transparent", letterSpacing:"0.01em" }}>Publish</button>
          <button style={{ flex:1, padding:"13px", background:"none", border:"1.5px solid var(--border-2)", borderRadius:"12px", color:"var(--text)", fontSize:"15px", fontWeight:"500", cursor:"pointer", WebkitTapHighlightColor:"transparent", letterSpacing:"0.01em" }}>Edit Profile</button>
        </div>

        <div style={{ fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-ghost)", marginBottom:"16px" }}>Works</div>

        {loading ? (
          <div style={{ textAlign:"center", padding:"48px 20px", color:"var(--text-muted)", fontSize:"14px" }}>Loading…</div>
        ) : works.length === 0 ? (
          <div style={{ textAlign:"center", padding:"48px 20px", color:"var(--text-muted)", fontSize:"14px", lineHeight:1.6 }}>
            Nothing published yet. Tap Publish to share your first work.
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:"16px", paddingBottom:"40px", maxWidth:"500px" }}>
            {works.map(work => (
              <WorkCard
                key={work.id}
                work={work}
                onOpen={() => onOpenWork && onOpenWork(work)}
                onDeleted={id => setWorks(ws => ws.filter(w => w.id !== id))}
                onEdited={work => onOpenWork && onOpenWork(work)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
