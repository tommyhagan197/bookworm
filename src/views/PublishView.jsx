import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthContext";

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
);

const PALETTE = [
  { id: "walnut",   label: "Walnut",   color: "#6B5344", dark: "#3D2B1F" },
  { id: "ink",      label: "Ink",      color: "#2E3F5C", dark: "#1A2537" },
  { id: "moss",     label: "Moss",     color: "#3A6B4A", dark: "#1E3D2A" },
  { id: "foxglove", label: "Foxglove", color: "#8B3A62", dark: "#4D1F37" },
  { id: "mustard",  label: "Mustard",  color: "#8B7A35", dark: "#4D4219" },
  { id: "teal",     label: "Teal",     color: "#2E7B7A", dark: "#1A4544" },
  { id: "espresso", label: "Espresso", color: "#3D2B1F", dark: "#1E1208" },
  { id: "ember",    label: "Ember",    color: "#E07C3A", dark: "#A04E1A" },
  { id: "forest",   label: "Forest",   color: "#1E3D2A", dark: "#0D1F14" },
  { id: "dusk",     label: "Dusk",     color: "#4D3A6B", dark: "#2A1F3D" },
  { id: "sand",     label: "Sand",     color: "#C4936A", dark: "#8B5E3A" },
  { id: "cream",    label: "Cream",    color: "#D4C09A", dark: "#A08B5A" },
];

const TEMPLATES = [
  {
    id: "gradient", name: "Gradient", slots: 1,
    render: (colors, title, author, showAuthor, titlePos) => {
      const c = colors[0] || PALETTE[0];
      const ty = titlePos === "top" ? 60 : titlePos === "middle" ? 110 : 160;
      return (
        <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs><linearGradient id="tg0" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={c.color}/><stop offset="100%" stopColor={c.dark}/></linearGradient></defs>
          <rect width="200" height="280" fill="url(#tg0)"/>
          <rect width="200" height="4" fill="rgba(255,255,255,0.25)"/>
          <line x1="16" y1={ty+30} x2="100" y2={ty+30} stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
          <text x="16" y={ty} fontFamily="Georgia,serif" fontSize="22" fill="white" fontWeight="bold">{splitTitle(title)[0]}</text>
          {splitTitle(title)[1] && <text x="16" y={ty+24} fontFamily="Georgia,serif" fontSize="22" fill="white" fontWeight="bold">{splitTitle(title)[1]}</text>}
          {showAuthor && <text x="16" y={ty+44} fontFamily="Georgia,serif" fontSize="11" fill="rgba(255,255,255,0.75)">{author}</text>}
        </svg>
      );
    },
  },
  {
    id: "split", name: "Split", slots: 2,
    render: (colors, title, author, showAuthor, titlePos) => {
      const c1 = colors[0]||PALETTE[0], c2 = colors[1]||PALETTE[7];
      const ty = titlePos === "top" ? 50 : titlePos === "middle" ? 120 : 200;
      return (
        <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <rect width="120" height="280" fill={c1.color}/><rect x="120" width="80" height="280" fill={c2.color}/>
          <rect width="200" height="3" fill="rgba(255,255,255,0.2)"/>
          <text x="12" y={ty} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{splitTitle(title)[0]}</text>
          {splitTitle(title)[1] && <text x="12" y={ty+22} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{splitTitle(title)[1]}</text>}
          {showAuthor && <text x="12" y={ty+(splitTitle(title)[1]?40:20)} fontFamily="Georgia,serif" fontSize="10" fill="rgba(255,255,255,0.75)">{author}</text>}
        </svg>
      );
    },
  },
  {
    id: "bands", name: "Bands", slots: 2,
    render: (colors, title, author, showAuthor, titlePos) => {
      const c1 = colors[0]||PALETTE[0], c2 = colors[1]||PALETTE[1];
      const ty = titlePos === "top" ? 50 : titlePos === "middle" ? 150 : 230;
      return (
        <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <rect width="200" height="100" fill={c1.color}/><rect y="100" width="200" height="6" fill="rgba(255,255,255,0.3)"/><rect y="106" width="200" height="174" fill={c2.color}/>
          <text x="14" y={ty} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{splitTitle(title)[0]}</text>
          {splitTitle(title)[1] && <text x="14" y={ty+22} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{splitTitle(title)[1]}</text>}
          {showAuthor && <text x="14" y={ty+(splitTitle(title)[1]?40:20)} fontFamily="Georgia,serif" fontSize="10" fill="rgba(255,255,255,0.75)">{author}</text>}
        </svg>
      );
    },
  },
  {
    id: "slash", name: "Slash", slots: 2,
    render: (colors, title, author, showAuthor, titlePos) => {
      const c1 = colors[0]||PALETTE[2], c2 = colors[1]||PALETTE[1];
      const ty = titlePos === "top" ? 50 : titlePos === "middle" ? 150 : 220;
      return (
        <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <rect width="200" height="280" fill={c1.color}/><polygon points="0,0 140,0 0,190" fill={c2.color}/>
          <text x="14" y={ty} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{splitTitle(title)[0]}</text>
          {splitTitle(title)[1] && <text x="14" y={ty+22} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{splitTitle(title)[1]}</text>}
          {showAuthor && <text x="14" y={ty+(splitTitle(title)[1]?40:20)} fontFamily="Georgia,serif" fontSize="10" fill="rgba(255,255,255,0.75)">{author}</text>}
        </svg>
      );
    },
  },
  {
    id: "arc", name: "Arc", slots: 3,
    render: (colors, title, author, showAuthor, titlePos) => {
      const c1 = colors[0]||PALETTE[3], c2 = colors[1]||PALETTE[3], c3 = colors[2]||PALETTE[7];
      const ty = titlePos === "top" ? 50 : titlePos === "middle" ? 150 : 220;
      return (
        <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <rect width="200" height="280" fill={c1.color}/><path d="M0,280 Q200,130 200,0 L200,280 Z" fill={c2.dark||c2.color}/><circle cx="50" cy="80" r="55" fill={c3.color} opacity="0.9"/>
          <text x="14" y={ty} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{splitTitle(title)[0]}</text>
          {splitTitle(title)[1] && <text x="14" y={ty+22} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{splitTitle(title)[1]}</text>}
          {showAuthor && <text x="14" y={ty+(splitTitle(title)[1]?40:20)} fontFamily="Georgia,serif" fontSize="10" fill="rgba(255,255,255,0.75)">{author}</text>}
        </svg>
      );
    },
  },
  {
    id: "dots", name: "Dots", slots: 1,
    render: (colors, title, author, showAuthor, titlePos) => {
      const c = colors[0]||PALETTE[1];
      const ty = titlePos === "top" ? 50 : titlePos === "middle" ? 150 : 220;
      const dots = [];
      for (let r=0;r<5;r++) for (let col=0;col<5;col++) dots.push({cx:24+col*40,cy:24+r*40});
      return (
        <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <rect width="200" height="280" fill={c.color}/>
          {dots.map((d,i)=><circle key={i} cx={d.cx} cy={d.cy} r="10" fill="rgba(255,255,255,0.18)"/>)}
          <text x="14" y={ty} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{splitTitle(title)[0]}</text>
          {splitTitle(title)[1] && <text x="14" y={ty+22} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{splitTitle(title)[1]}</text>}
          {showAuthor && <text x="14" y={ty+(splitTitle(title)[1]?40:20)} fontFamily="Georgia,serif" fontSize="10" fill="rgba(255,255,255,0.75)">{author}</text>}
        </svg>
      );
    },
  },
  {
    id: "stripes", name: "Stripes", slots: 1,
    render: (colors, title, author, showAuthor, titlePos) => {
      const c = colors[0]||PALETTE[0];
      const ty = titlePos === "top" ? 50 : titlePos === "middle" ? 150 : 220;
      return (
        <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <rect width="200" height="280" fill={c.color}/>
          {[-40,-20,0,20,40,60,80,100,120].map((o,i)=><line key={i} x1={o} y1="0" x2={o+280} y2="280" stroke="rgba(255,255,255,0.1)" strokeWidth="18"/>)}
          <text x="14" y={ty} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{splitTitle(title)[0]}</text>
          {splitTitle(title)[1] && <text x="14" y={ty+22} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{splitTitle(title)[1]}</text>}
          {showAuthor && <text x="14" y={ty+(splitTitle(title)[1]?40:20)} fontFamily="Georgia,serif" fontSize="10" fill="rgba(255,255,255,0.75)">{author}</text>}
        </svg>
      );
    },
  },
  {
    id: "frame", name: "Frame", slots: 1,
    render: (colors, title, author, showAuthor, titlePos) => {
      const c = colors[0]||PALETTE[0];
      const ty = titlePos === "top" ? 60 : titlePos === "middle" ? 140 : 210;
      return (
        <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <rect width="200" height="280" fill={c.dark||c.color}/>
          <rect x="10" y="10" width="180" height="260" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
          <rect x="16" y="16" width="168" height="248" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
          <text x="24" y={ty} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{splitTitle(title)[0]}</text>
          {splitTitle(title)[1] && <text x="24" y={ty+22} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{splitTitle(title)[1]}</text>}
          {showAuthor && <text x="24" y={ty+(splitTitle(title)[1]?40:20)} fontFamily="Georgia,serif" fontSize="10" fill="rgba(255,255,255,0.75)">{author}</text>}
        </svg>
      );
    },
  },
  {
    id: "chevron", name: "Chevron", slots: 2,
    render: (colors, title, author, showAuthor, titlePos) => {
      const c1 = colors[0]||PALETTE[2];
      const ty = titlePos === "top" ? 50 : titlePos === "middle" ? 140 : 220;
      return (
        <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <rect width="200" height="280" fill={c1.dark||c1.color}/>
          <polygon points="0,0 200,0 200,140" fill={c1.color}/><polygon points="0,280 200,280 0,140" fill={c1.color}/>
          <text x="14" y={ty} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{splitTitle(title)[0]}</text>
          {splitTitle(title)[1] && <text x="14" y={ty+22} fontFamily="Georgia,serif" fontSize="20" fill="white" fontWeight="bold">{splitTitle(title)[1]}</text>}
          {showAuthor && <text x="14" y={ty+(splitTitle(title)[1]?40:20)} fontFamily="Georgia,serif" fontSize="10" fill="rgba(255,255,255,0.75)">{author}</text>}
        </svg>
      );
    },
  },
];

function splitTitle(title) {
  if (!title) return ["Untitled", ""];
  const words = title.split(" ");
  if (words.length <= 2) return [title, ""];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

function CoverThumb({ template, colors, title, author, showAuthor, titlePos, selected, onClick }) {
  return (
    <button onClick={onClick} style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", gap:5, background:"none", border:"none", padding:0, cursor:"pointer", WebkitTapHighlightColor:"transparent" }}>
      <div style={{ width:64, height:90, borderRadius:3, overflow:"hidden", outline: selected ? "2.5px solid var(--accent)" : "1.5px solid rgba(139,111,71,0.15)", outlineOffset: selected ? 2 : 0 }}>
        {template.render(colors, title || "Title", author, showAuthor, titlePos)}
      </div>
      <span style={{ fontSize:9, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase" }}>{template.name}</span>
    </button>
  );
}

function ColorSlot({ index, color, active, onClick }) {
  return (
    <button onClick={onClick} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, background:"none", border:"none", padding:0, cursor:"pointer", WebkitTapHighlightColor:"transparent" }}>
      <div style={{ width:36, height:36, borderRadius:"50%", background:color?.color||"#ccc", border: active ? "3px solid var(--accent)" : "2px solid transparent", outline: active ? "none" : "1.5px solid rgba(139,111,71,0.2)", outlineOffset:1, transition:"border 0.15s" }}/>
      <span style={{ fontSize:9, color:"var(--text-muted)", letterSpacing:"0.06em", textTransform:"uppercase" }}>{index+1}</span>
    </button>
  );
}

export default function PublishView({ onClose, onPublished }) {
  const { profile, session } = useAuth();
  const authorName = profile?.display_name || session?.user?.email?.split("@")[0] || "Anonymous";

  const [step, setStep] = useState("compose");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [slotColors, setSlotColors] = useState([PALETTE[0], PALETTE[7], PALETTE[4]]);
  const [activeSlot, setActiveSlot] = useState(0);
  const [titlePos, setTitlePos] = useState("lower");
  const [showAuthor, setShowAuthor] = useState(true);

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const canContinue = title.trim().length > 0 && body.trim().length > 0;

  function handleSlotTap(idx) { setActiveSlot(idx); }

  function handlePickColor(p) {
    const updated = [...slotColors];
    updated[activeSlot] = p;
    setSlotColors(updated);
  }

  function colorsForTemplate() { return slotColors.slice(0, selectedTemplate.slots); }

  async function handlePublish() {
    if (publishing) return;
    setPublishing(true);
    setError("");

    try {
      const coverData = {
        templateId: selectedTemplate.id,
        colors: colorsForTemplate().map(c => c.id),
        titlePos,
        showAuthor,
        primaryColor: colorsForTemplate()[0]?.color || "#6B5344",
      };

      const { data, error: insertError } = await supabase
        .from("works")
        .insert({
          author_id: session.user.id,
          title: title.trim(),
          body: body.trim(),
          cover_data: coverData,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      onPublished(data.id);
    } catch (e) {
      console.error("Publish error:", e);
      setError("Something went wrong. Please try again.");
      setPublishing(false);
    }
  }

  // ── COVER STUDIO ─────────────────────────────────────────────────────────
  if (step === "cover") {
    const slotsNeeded = selectedTemplate.slots;
    const previewColors = colorsForTemplate();

    return (
      <div style={{ position:"fixed", inset:0, zIndex:200, background:"var(--bg)", display:"flex", flexDirection:"column", paddingTop:"env(safe-area-inset-top, 44px)", paddingBottom:"env(safe-area-inset-bottom, 20px)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid rgba(139,111,71,0.12)", flexShrink:0 }}>
          <button onClick={() => setStep("compose")} style={{ background:"none", border:"none", padding:"4px", cursor:"pointer", color:"var(--text-muted)", WebkitTapHighlightColor:"transparent", display:"flex" }}>
            <BackIcon />
          </button>
          <div style={{ fontFamily:"Georgia, serif", fontSize:"17px", color:"var(--text)" }}>Cover Studio</div>
          <button onClick={handlePublish} disabled={publishing} style={{ background:"var(--accent)", border:"none", borderRadius:"8px", padding:"7px 16px", color:"#fff", fontSize:"14px", fontWeight:"500", cursor: publishing ? "default" : "pointer", WebkitTapHighlightColor:"transparent", opacity: publishing ? 0.6 : 1 }}>
            {publishing ? "Publishing…" : "Publish"}
          </button>
        </div>

        <div style={{ flex:1, overflowY:"auto" }}>
          <div style={{ padding:"14px 0 4px 20px", fontSize:10, letterSpacing:"0.12em", color:"var(--text-muted)", textTransform:"uppercase" }}>Layout</div>
          <div style={{ display:"flex", gap:12, padding:"4px 20px 16px", overflowX:"auto" }}>
            {TEMPLATES.map(t => (
              <CoverThumb key={t.id} template={t} colors={slotColors.slice(0,t.slots)} title={title} author={authorName} showAuthor={showAuthor} titlePos={titlePos} selected={selectedTemplate.id===t.id} onClick={() => { setSelectedTemplate(t); setActiveSlot(0); }}/>
            ))}
          </div>

          <div style={{ height:"0.5px", background:"rgba(139,111,71,0.12)", margin:"0 20px" }}/>

          <div style={{ padding:"14px 0 6px 20px", fontSize:10, letterSpacing:"0.12em", color:"var(--text-muted)", textTransform:"uppercase" }}>{slotsNeeded===1 ? "Color" : "Colors — tap to select"}</div>
          <div style={{ display:"flex", gap:12, padding:"0 20px 12px", alignItems:"flex-start" }}>
            {Array.from({length:slotsNeeded}).map((_,i) => <ColorSlot key={i} index={i} color={slotColors[i]} active={activeSlot===i} onClick={() => handleSlotTap(i)}/>)}
          </div>

          <div style={{ display:"flex", flexWrap:"wrap", gap:10, padding:"6px 20px 16px", background:"rgba(139,111,71,0.05)", margin:"0 20px", borderRadius:12, border:"0.5px solid rgba(139,111,71,0.12)" }}>
            {PALETTE.map(p => (
              <button key={p.id} onClick={() => handlePickColor(p)} style={{ width:30, height:30, borderRadius:"50%", background:p.color, border: slotColors[activeSlot]?.id===p.id ? "3px solid var(--accent)" : "2px solid rgba(255,255,255,0.3)", cursor:"pointer", WebkitTapHighlightColor:"transparent", padding:0, flexShrink:0 }}/>
            ))}
          </div>

          <div style={{ height:"0.5px", background:"rgba(139,111,71,0.12)", margin:"16px 20px 0" }}/>

          <div style={{ padding:"14px 0 6px 20px", fontSize:10, letterSpacing:"0.12em", color:"var(--text-muted)", textTransform:"uppercase" }}>Title position</div>
          <div style={{ display:"flex", margin:"0 20px 16px", background:"rgba(255,255,255,0.5)", border:"0.5px solid rgba(139,111,71,0.2)", borderRadius:8, overflow:"hidden" }}>
            {["top","middle","lower"].map(pos => (
              <button key={pos} onClick={() => setTitlePos(pos)} style={{ flex:1, padding:"9px 4px", textAlign:"center", fontSize:13, color: titlePos===pos ? "#fff" : "var(--text-muted)", background: titlePos===pos ? "var(--accent)" : "transparent", border:"none", borderRight: pos!=="lower" ? "0.5px solid rgba(139,111,71,0.15)" : "none", cursor:"pointer", WebkitTapHighlightColor:"transparent", textTransform:"capitalize", transition:"all 0.15s" }}>
                {pos.charAt(0).toUpperCase()+pos.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ height:"0.5px", background:"rgba(139,111,71,0.12)", margin:"0 20px" }}/>

          <div style={{ padding:"14px 0 6px 20px", fontSize:10, letterSpacing:"0.12em", color:"var(--text-muted)", textTransform:"uppercase" }}>Author name</div>
          <div onClick={() => setShowAuthor(v=>!v)} style={{ display:"flex", alignItems:"center", gap:12, padding:"0 20px 16px", cursor:"pointer", WebkitTapHighlightColor:"transparent" }}>
            <div style={{ width:22, height:22, borderRadius:5, background: showAuthor ? "var(--accent)" : "rgba(139,111,71,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"background 0.15s" }}>
              {showAuthor && <svg width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M1 4l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <div>
              <div style={{ fontSize:14, color:"var(--text)" }}>Show author name</div>
              <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:1 }}>Appears beneath the title — {authorName}</div>
            </div>
          </div>

          <div style={{ height:"0.5px", background:"rgba(139,111,71,0.12)", margin:"0 20px" }}/>

          <div style={{ padding:"14px 0 6px 20px", fontSize:10, letterSpacing:"0.12em", color:"var(--text-muted)", textTransform:"uppercase" }}>Preview</div>
          <div style={{ display:"flex", justifyContent:"center", padding:"8px 20px 24px" }}>
            <div style={{ width:160, height:224, borderRadius:6, overflow:"hidden", boxShadow:"4px 6px 18px rgba(0,0,0,0.25)" }}>
              {selectedTemplate.render(previewColors, title||"Untitled", authorName, showAuthor, titlePos)}
            </div>
          </div>

          {error && <div style={{ padding:"0 20px 16px", fontSize:13, color:"#c0392b", textAlign:"center" }}>{error}</div>}
        </div>
      </div>
    );
  }

  // ── COMPOSE SCREEN ───────────────────────────────────────────────────────
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"var(--bg)", display:"flex", flexDirection:"column", paddingTop:"env(safe-area-inset-top, 44px)", paddingBottom:"env(safe-area-inset-bottom, 20px)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid rgba(139,111,71,0.12)", flexShrink:0 }}>
        <button onClick={onClose} style={{ background:"none", border:"none", padding:"4px", cursor:"pointer", color:"var(--text-muted)", WebkitTapHighlightColor:"transparent", display:"flex" }}>
          <BackIcon />
        </button>
        <div style={{ fontFamily:"Georgia, serif", fontSize:"17px", color:"var(--text)" }}>New Work</div>
        <button onClick={() => setStep("cover")} disabled={!canContinue} style={{ background: canContinue ? "var(--accent)" : "rgba(139,111,71,0.15)", border:"none", borderRadius:"8px", padding:"7px 16px", color: canContinue ? "#fff" : "var(--text-muted)", fontSize:"14px", fontWeight:"500", cursor: canContinue ? "pointer" : "default", WebkitTapHighlightColor:"transparent", transition:"all 0.15s" }}>
          Next
        </button>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"20px 20px 0" }}>
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Title" maxLength={120}
          style={{ width:"100%", border:"none", outline:"none", background:"transparent", fontFamily:"Georgia, serif", fontSize:"24px", fontWeight:"normal", color:"var(--text)", marginBottom:"16px", boxSizing:"border-box" }}
        />
        <div style={{ height:"1px", background:"rgba(139,111,71,0.12)", marginBottom:"16px" }}/>
        <textarea
          value={body} onChange={e => setBody(e.target.value)}
          placeholder="Write your story… or paste it in."
          style={{ width:"100%", border:"none", outline:"none", background:"transparent", fontFamily:"Georgia, serif", fontSize:"17px", lineHeight:"1.7", color:"var(--text)", resize:"none", minHeight:"60vh", boxSizing:"border-box" }}
        />
      </div>

      <div style={{ padding:"10px 20px", borderTop:"1px solid rgba(139,111,71,0.1)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <span style={{ fontSize:"13px", color:"var(--text-muted)" }}>{wordCount} {wordCount===1?"word":"words"}</span>
      </div>
    </div>
  );
}
