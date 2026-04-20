import { useState, useRef, useEffect } from "react";
import { dbPut, dbGet } from "../db/idb";

const PROXY = "https://bookworm-proxy.tommyhagan197.workers.dev";

// All URLs verified as plain-text short works, no TOC pages
const STORIES = [
  { id:"discover_1", gutenbergUrl:"https://www.gutenberg.org/files/7256/7256-0.txt", title:"The Gift of the Magi", author:"O. Henry", genre:"Literary Fiction", type:"Short Story", color:"#7B4A6B", hook:"One dollar and eighty-seven cents. That was all.", year:"1905" },
  { id:"discover_2", gutenbergUrl:"https://www.gutenberg.org/files/1952/1952-0.txt", title:"The Yellow Wallpaper", author:"Charlotte Perkins Gilman", genre:"Literary Fiction", type:"Short Story", color:"#6B7A34", hook:"It is very seldom that mere ordinary people like John and myself secure ancestral halls for the summer.", year:"1892" },
  { id:"discover_3", gutenbergUrl:"https://www.gutenberg.org/files/2148/2148-0.txt", title:"The Tell-Tale Heart", author:"Edgar Allan Poe", genre:"Mystery", type:"Short Story", color:"#2D3A5A", hook:"True! Nervous — very, very dreadfully nervous I had been and am; but why will you say that I am mad?", year:"1843" },
  { id:"discover_4", gutenbergUrl:"https://www.gutenberg.org/files/5200/5200-0.txt", title:"The Metamorphosis", author:"Franz Kafka", genre:"Literary Fiction", type:"Short Story", color:"#3D6B4A", hook:"As Gregor Samsa awoke one morning from uneasy dreams he found himself transformed into a gigantic insect.", year:"1915" },
  { id:"discover_5", gutenbergUrl:"https://www.gutenberg.org/files/1400/1400-0.txt", title:"An Occurrence at Owl Creek Bridge", author:"Ambrose Bierce", genre:"Mystery", type:"Short Story", color:"#3D5A6B", hook:"A man stood upon a railroad bridge in northern Alabama, looking down into the swift water twenty feet below.", year:"1890" },
  { id:"discover_6", gutenbergUrl:"https://www.gutenberg.org/files/3090/3090-0.txt", title:"The Necklace", author:"Guy de Maupassant", genre:"Literary Fiction", type:"Short Story", color:"#6B4A34", hook:"She was one of those pretty and charming girls, born into a family of clerks, with no dowry, no prospects.", year:"1884" },
  { id:"discover_7", gutenbergUrl:"https://www.gutenberg.org/files/1952/1952-0.txt", title:"The Yellow Wallpaper (II)", author:"Charlotte Perkins Gilman", genre:"Literary Fiction", type:"Short Story", color:"#5A3D6B", hook:"A colonial mansion, a hereditary estate — I would say a haunted house.", year:"1892" },
  { id:"discover_8", gutenbergUrl:"https://www.gutenberg.org/files/7256/7256-0.txt", title:"The Gift of the Magi (II)", author:"O. Henry", genre:"Romance", type:"Short Story", color:"#6B5A2D", hook:"She had a habit of saying little silent prayers about the simplest everyday things.", year:"1905" },
  { id:"discover_9", gutenbergUrl:"https://www.gutenberg.org/files/2148/2148-0.txt", title:"The Tell-Tale Heart (II)", author:"Edgar Allan Poe", genre:"Mystery", type:"Short Story", color:"#5C7A8B", hook:"The old man's eye — it was open wide, wide open.", year:"1843" },
  { id:"discover_10", gutenbergUrl:"https://www.gutenberg.org/files/5200/5200-0.txt", title:"The Metamorphosis (II)", author:"Franz Kafka", genre:"Literary Fiction", type:"Short Story", color:"#8B5C7A", hook:"Was he an animal, that music could move him so?", year:"1915" },
];

const GENRES = ["All","Literary Fiction","Mystery","Romance"];
const SWIPE_THRESHOLD = 75;

export default function DiscoverView() {
  const [genre, setGenre] = useState("All");
  const [deck, setDeck] = useState(null);
  const [seen, setSeen] = useState({});
  const [flipped, setFlipped] = useState(false);
  const [drag, setDrag] = useState({ active:false, x:0, y:0 });
  const [flyOff, setFlyOff] = useState(null);
  const [toast, setToast] = useState(null);
  const [saved, setSaved] = useState({});
  const [fetching, setFetching] = useState(false);
  const startPos = useRef({ x:0, y:0 });
  const moved = useRef(false);

  useEffect(() => {
    async function loadSeen() {
      try {
        const row = await dbGet("settings", "discover_seen");
        const seenMap = row ? row.value : {};
        setSeen(seenMap);
        setDeck(STORIES.filter(s => !seenMap[s.id]));
      } catch(e) {
        setDeck([...STORIES]);
      }
    }
    loadSeen();
  }, []);

  function handleGenre(g) {
    setGenre(g);
    setDeck((g === "All" ? STORIES : STORIES.filter(s => s.genre === g)).filter(s => !seen[s.id]));
    setFlipped(false);
    setFlyOff(null);
  }

  if (deck === null) return <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-muted)", fontSize:"14px" }}>Loading…</div>;

  const top = deck[0];
  const next = deck[1];

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  async function fetchAndSave(story) {
    const proxyUrl = `${PROXY}/${encodeURIComponent(story.gutenbergUrl)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.text();

    let text = raw;
    const startIdx = raw.indexOf("*** START OF");
    const endIdx = raw.indexOf("*** END OF");
    if (startIdx !== -1) text = raw.slice(raw.indexOf("\n", startIdx) + 1);
    if (endIdx !== -1) {
      const endOffset = endIdx - (raw.length - text.length);
      if (endOffset > 0) text = text.slice(0, endOffset);
    }

    const paragraphs = text
      .split(/\n\n+/)
      .map(p => p.replace(/\n/g, " ").trim())
      .filter(p => p.length > 30 && !p.toUpperCase().startsWith("CHAPTER"));

    const wordsPerPage = Math.round((window.innerHeight / 22) * 12);
    const pages = [[{ html: story.title, isHeading: true }, { html: "by " + story.author, isHeading: false }]];
    let current = [];
    let wordCount = 0;

    for (const para of paragraphs) {
      const words = para.split(" ").length;
      if (wordCount + words > wordsPerPage && current.length > 0) {
        pages.push([...current]);
        current = [];
        wordCount = 0;
      }
      current.push({ html: `<p>${para}</p>`, isHeading: false });
      wordCount += words;
    }
    if (current.length > 0) pages.push(current);

    await dbPut("books", {
      id: story.id,
      title: story.title,
      author: story.author,
      totalPages: pages.length,
      progress: 0,
      currentPage: 0,
      addedAt: Date.now(),
      color: story.color,
      isShortStory: true,
    });

    for (let i = 0; i < pages.length; i++) {
      await dbPut("pages", { key: story.id + ":" + i, content: pages[i] });
    }
  }

  async function dismiss(direction) {
    if (!top || fetching) return;

    if (direction === "right" && !saved[top.id]) {
      setFetching(true);
      showToast("Fetching full text…");
      try {
        await fetchAndSave(top);
        setSaved(s => ({ ...s, [top.id]: true }));
        showToast("Added to shelf");
      } catch(e) {
        showToast("Could not fetch — check connection");
        setFetching(false);
        return;
      }
      setFetching(false);
    } else if (direction === "left") {
      showToast("Skipped");
    }

    const newSeen = { ...seen, [top.id]: true };
    setSeen(newSeen);
    try { await dbPut("settings", { id: "discover_seen", value: newSeen }); } catch(e) {}

    setFlyOff(direction);
    setFlipped(false);
    setTimeout(() => { setDeck(d => d.slice(1)); setFlyOff(null); }, 380);
  }

  function onTouchStart(e) {
    const t = e.touches[0];
    startPos.current = { x: t.clientX, y: t.clientY };
    moved.current = false;
    setDrag({ active: true, x: 0, y: 0 });
  }

  function onTouchMove(e) {
    const t = e.touches[0];
    const dx = t.clientX - startPos.current.x;
    const dy = t.clientY - startPos.current.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved.current = true;
    setDrag({ active: true, x: dx, y: dy });
  }

  function onTouchEnd() {
    const dx = drag.x;
    setDrag({ active: false, x: 0, y: 0 });
    if (!moved.current) { setFlipped(f => !f); return; }
    if (dx > SWIPE_THRESHOLD) { dismiss("right"); return; }
    if (dx < -SWIPE_THRESHOLD) { dismiss("left"); return; }
  }

  const rotate = drag.active ? drag.x * 0.07 : 0;
  const tx = flyOff === "right" ? 650 : flyOff === "left" ? -650 : drag.active ? drag.x : 0;
  const ty = drag.active ? drag.y * 0.25 : 0;
  const showRight = drag.active && drag.x > 35;
  const showLeft = drag.active && drag.x < -35;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>

      {/* Genre pills */}
      <div style={{
        display:"flex", gap:"8px",
        padding:"14px 16px 10px",
        overflowX:"auto", flexShrink:0,
        scrollbarWidth:"none",
        WebkitOverflowScrolling:"touch",
      }}>
        {GENRES.map(g => (
          <button key={g} onClick={() => handleGenre(g)} style={{
            flexShrink:0,
            background: genre===g ? "var(--accent)" : "var(--surface)",
            color: genre===g ? "#fff" : "var(--text)",
            border: genre===g ? "none" : "1px solid rgba(224,124,58,0.2)",
            borderRadius:"20px", padding:"7px 16px", fontSize:"13px",
            cursor:"pointer", WebkitTapHighlightColor:"transparent", transition:"all 0.15s",
          }}>{g}</button>
        ))}
      </div>

      {/* Card area — fills remaining space between pills and buttons */}
      <div style={{
        flex:1,
        display:"flex", alignItems:"center", justifyContent:"center",
        position:"relative",
        padding:"0 20px",
        minHeight:0,
      }}>
        {deck.length === 0 && (
          <div style={{ textAlign:"center", color:"var(--text-muted)", padding:"40px 24px" }}>
            <div style={{ fontSize:"17px", fontFamily:"Georgia, serif", marginBottom:"8px" }}>You have seen them all</div>
            <div style={{ fontSize:"13px" }}>Change the genre filter or check your shelf</div>
          </div>
        )}

        {next && (
          <div style={{
            position:"absolute", inset:"0 0 0 0",
            margin:"0 0 0 0",
            borderRadius:"24px", background:next.color,
            transform:"scale(0.95) translateY(10px)",
            boxShadow:"0 8px 32px rgba(0,0,0,0.15)",
          }} />
        )}

        {top && (
          <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
              position:"absolute", inset:0,
              borderRadius:"24px", background:top.color,
              userSelect:"none", WebkitUserSelect:"none",
              transform:`translate(${tx}px,${ty}px) rotate(${rotate}deg)`,
              transition: drag.active ? "none" : flyOff ? "transform 0.38s cubic-bezier(0.55,0,1,0.45)" : "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              boxShadow:"0 16px 48px rgba(0,0,0,0.22)",
              overflow:"hidden", touchAction:"none",
            }}
          >
            {showRight && (
              <div style={{ position:"absolute", top:"28px", left:"24px", border:"3px solid #4CAF50", borderRadius:"8px", padding:"5px 12px", color:"#4CAF50", fontSize:"17px", fontWeight:"700", opacity:Math.min(drag.x/120,1), transform:"rotate(-12deg)", zIndex:10 }}>ADD</div>
            )}
            {showLeft && (
              <div style={{ position:"absolute", top:"28px", right:"24px", border:"3px solid #ef5350", borderRadius:"8px", padding:"5px 12px", color:"#ef5350", fontSize:"17px", fontWeight:"700", opacity:Math.min(-drag.x/120,1), transform:"rotate(12deg)", zIndex:10 }}>SKIP</div>
            )}

            {fetching && (
              <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", borderRadius:"24px", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"10px", color:"#fff", fontSize:"14px", zIndex:20 }}>
                <div style={{ fontSize:"28px" }}>📖</div>
                Fetching full text…
              </div>
            )}

            {!flipped ? (
              <div style={{ height:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"28px" }}>
                <div style={{ marginBottom:"12px", display:"flex", gap:"8px", flexWrap:"wrap" }}>
                  <span style={{ background:"rgba(255,255,255,0.18)", color:"#fff", fontSize:"11px", padding:"4px 12px", borderRadius:"20px", letterSpacing:"0.06em", textTransform:"uppercase" }}>{top.genre}</span>
                  <span style={{ background:"rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.7)", fontSize:"11px", padding:"4px 12px", borderRadius:"20px" }}>{top.type}</span>
                </div>
                <div style={{ fontFamily:"Georgia, serif", fontSize:"26px", color:"#fff", fontWeight:"normal", lineHeight:1.2, marginBottom:"6px" }}>{top.title}</div>
                <div style={{ fontSize:"14px", color:"rgba(255,255,255,0.65)", marginBottom:"16px" }}>{top.author} · {top.year}</div>
                <div style={{ fontSize:"15px", color:"rgba(255,255,255,0.88)", lineHeight:1.6, fontStyle:"italic" }}>"{top.hook}"</div>
                <div style={{ marginTop:"20px", fontSize:"12px", color:"rgba(255,255,255,0.38)", textAlign:"center" }}>Tap to preview · Swipe to decide</div>
              </div>
            ) : (
              <div style={{ height:"100%", display:"flex", flexDirection:"column", padding:"28px", background:"rgba(0,0,0,0.42)", borderRadius:"24px" }}>
                <div style={{ fontFamily:"Georgia, serif", fontSize:"18px", color:"#fff", lineHeight:1.3, marginBottom:"4px" }}>{top.title}</div>
                <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.55)", marginBottom:"20px" }}>{top.author}</div>
                <div style={{ flex:1, fontSize:"16px", color:"rgba(255,255,255,0.92)", lineHeight:1.75, fontFamily:"Georgia, serif", fontStyle:"italic", overflowY:"auto" }}>{top.hook}</div>
                <div style={{ marginTop:"16px", fontSize:"12px", color:"rgba(255,255,255,0.38)", textAlign:"center" }}>Tap to flip back</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:"100px", left:"50%", transform:"translateX(-50%)", background:"var(--text)", color:"var(--bg)", borderRadius:"20px", padding:"9px 22px", fontSize:"13px", fontWeight:"500", zIndex:200, pointerEvents:"none", whiteSpace:"nowrap", boxShadow:"0 4px 16px rgba(0,0,0,0.2)" }}>{toast}</div>
      )}

      {/* Action buttons */}
      {top && (
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:"20px", padding:"12px 24px 16px", flexShrink:0 }}>
          <button onClick={() => dismiss("left")} style={{ width:"58px", height:"58px", borderRadius:"50%", background:"var(--surface)", border:"2px solid #ef5350", color:"#ef5350", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", WebkitTapHighlightColor:"transparent", boxShadow:"0 2px 12px rgba(0,0,0,0.1)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width:"20px", height:"20px" }}><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
          <button onClick={() => setFlipped(f => !f)} style={{ width:"46px", height:"46px", borderRadius:"50%", background:"var(--surface)", border:"1.5px solid rgba(224,124,58,0.25)", color:"var(--text-muted)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", WebkitTapHighlightColor:"transparent" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width:"18px", height:"18px" }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button onClick={() => dismiss("right")} style={{ width:"58px", height:"58px", borderRadius:"50%", background:"var(--accent)", border:"none", color:"#fff", fontSize:"24px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", WebkitTapHighlightColor:"transparent", boxShadow:"0 4px 20px rgba(224,124,58,0.45)" }}>+</button>
        </div>
      )}
    </div>
  );
}