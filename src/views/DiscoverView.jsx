import { useState, useRef, useEffect } from "react";
import { dbPut, dbGet } from "../db/idb";

const PROXY = "https://bookworm-proxy.tommyhagan197.workers.dev";

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

async function fetchAndSave(story) {
  const proxyUrl = `${PROXY}/${encodeURIComponent(story.gutenbergUrl)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const raw = await res.text();

  // Strip Gutenberg header and footer
  const startIdx = raw.indexOf("*** START OF");
  const endIdx = raw.indexOf("*** END OF");
  const begin = startIdx !== -1 ? raw.indexOf("\n", startIdx) + 1 : 0;
  const end = endIdx !== -1 ? endIdx : raw.length;
  const text = raw.slice(begin, end);

  // Split into paragraphs — join single-newline lines first, then split on blank lines
  const paragraphs = text
    .split(/\r?\n\r?\n+/)
    .map(block => block.replace(/\r?\n/g, " ").trim())
    .filter(p => p.length > 0);

  // Paginate
  const wordsPerPage = Math.round((window.innerHeight / 22) * 10);
  const titlePage = [
    { html: story.title, isHeading: true },
    { html: "by " + story.author, isHeading: false },
  ];
  const pages = [titlePage];
  let current = [];
  let wordCount = 0;

  for (const para of paragraphs) {
    const words = para.split(/\s+/).length;
    if (wordCount + words > wordsPerPage && current.length > 0) {
      pages.push([...current]);
      current = [];
      wordCount = 0;
    }
    current.push({ html: `<p>${para}</p>`, isHeading: false });
    wordCount += words;
  }
  if (current.length > 0) pages.push([...current]);

  // Save book record
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

  // Save pages
  for (let i = 0; i < pages.length; i++) {
    await dbPut("pages", { key: story.id + ":" + i, content: pages[i] });
  }

  return pages.length;
}

export default function DiscoverView() {
  const [genre, setGenre] = useState("All");
  const [deck, setDeck] = useState(null);
  const [seen, setSeen] = useState({});
  const [flipped, setFlipped] = useState(false);
  const [drag, setDrag] = useState({ active: false, x: 0, y: 0 });
  const [flyOff, setFlyOff] = useState(null);
  const [toast, setToast] = useState(null);
  const [fetching, setFetching] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const moved = useRef(false);
  const saved = useRef({});

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

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function dismiss(direction) {
    if (!top || fetching || flyOff) return;

    if (direction === "right" && !saved.current[top.id]) {
      setFetching(true);
      try {
        const pageCount = await fetchAndSave(top);
        saved.current[top.id] = true;
        showToast(`Added — ${pageCount} pages`);
      } catch(e) {
        showToast("Could not fetch — check connection");
        setFetching(false);
        return;
      }
      setFetching(false);
    } else if (direction === "left") {
      showToast("Skipped");
    }

    // Mark seen
    const newSeen = { ...seen, [top.id]: true };
    setSeen(newSeen);
    try { await dbPut("settings", { id: "discover_seen", value: newSeen }); } catch(e) {}

    // Animate card away
    setFlipped(false);
    setFlyOff(direction);
    setTimeout(() => {
      setDeck(d => d.slice(1));
      setFlyOff(null);
    }, 380);
  }

  function onTouchStart(e) {
    if (fetching) return;
    const t = e.touches[0];
    startPos.current = { x: t.clientX, y: t.clientY };
    moved.current = false;
    setDrag({ active: true, x: 0, y: 0 });
  }

  function onTouchMove(e) {
    if (!drag.active) return;
    const t = e.touches[0];
    const dx = t.clientX - startPos.current.x;
    const dy = t.clientY - startPos.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved.current = true;
    setDrag({ active: true, x: dx, y: dy });
  }

  function onTouchEnd() {
    if (!drag.active) return;
    const dx = drag.x;
    setDrag({ active: false, x: 0, y: 0 });
    if (!moved.current) { setFlipped(f => !f); return; }
    if (dx > SWIPE_THRESHOLD) { dismiss("right"); return; }
    if (dx < -SWIPE_THRESHOLD) { dismiss("left"); return; }
  }

  if (deck === null) return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-muted)", fontSize:"14px" }}>
      Loading…
    </div>
  );

  const top = deck[0];
  const next = deck[1];
  const rotate = drag.active ? drag.x * 0.07 : 0;
  const tx = flyOff === "right" ? 650 : flyOff === "left" ? -650 : drag.active ? drag.x : 0;
  const ty = drag.active ? drag.y * 0.2 : 0;
  const showRight = drag.active && drag.x > 35;
  const showLeft = drag.active && drag.x < -35;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>

      {/* Genre pills */}
      <div style={{ display:"flex", gap:"8px",padding:"calc(env(safe-area-inset-top, 14px) + 14px) 16px 10px", overflowX:"auto", flexShrink:0, scrollbarWidth:"none" }}>
        {GENRES.map(g => (
          <button key={g} onClick={() => handleGenre(g)} style={{
            flexShrink: 0,
            background: genre === g ? "var(--accent)" : "var(--surface)",
            color: genre === g ? "#fff" : "var(--text)",
            border: genre === g ? "none" : "1px solid rgba(224,124,58,0.2)",
            borderRadius: "20px", padding: "7px 16px", fontSize: "13px",
            cursor: "pointer", WebkitTapHighlightColor: "transparent",
          }}>{g}</button>
        ))}
      </div>

      {/* Card area */}
      <div style={{ flex:1, position:"relative", margin:"0 20px", minHeight:0 }}>

        {deck.length === 0 && (
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"var(--text-muted)", textAlign:"center", gap:"8px" }}>
            <div style={{ fontSize:"17px", fontFamily:"Georgia, serif" }}>You've seen them all</div>
            <div style={{ fontSize:"13px" }}>Change the filter or check your shelf</div>
          </div>
        )}

        {/* Back card */}
        {next && (
          <div style={{
            position:"absolute", inset:0,
            borderRadius:"24px", background:next.color,
            transform:"scale(0.95) translateY(12px)",
            boxShadow:"0 8px 32px rgba(0,0,0,0.15)",
          }} />
        )}

        {/* Top card */}
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
              transition: drag.active ? "none" : flyOff ? "transform 0.35s cubic-bezier(0.55,0,1,0.45), opacity 0.35s" : "transform 0.25s ease",
              opacity: flyOff ? 0 : 1,
              boxShadow:"0 16px 48px rgba(0,0,0,0.22)",
              overflow:"hidden", touchAction:"none",
            }}
          >
            {/* Swipe indicators */}
            {showRight && <div style={{ position:"absolute", top:"24px", left:"20px", border:"3px solid #4CAF50", borderRadius:"8px", padding:"4px 10px", color:"#4CAF50", fontSize:"16px", fontWeight:"700", opacity:Math.min(drag.x/100,1), transform:"rotate(-12deg)", zIndex:10 }}>ADD</div>}
            {showLeft && <div style={{ position:"absolute", top:"24px", right:"20px", border:"3px solid #ef5350", borderRadius:"8px", padding:"4px 10px", color:"#ef5350", fontSize:"16px", fontWeight:"700", opacity:Math.min(-drag.x/100,1), transform:"rotate(12deg)", zIndex:10 }}>SKIP</div>}

            {/* Fetch loading overlay */}
            {fetching && (
              <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"12px", zIndex:20, borderRadius:"24px" }}>
                <div style={{ color:"#fff", fontSize:"15px" }}>Fetching full text…</div>
              </div>
            )}

            {/* Card front */}
            {!flipped ? (
              <div style={{ height:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"28px" }}>
                <div style={{ display:"flex", gap:"8px", marginBottom:"14px", flexWrap:"wrap" }}>
                  <span style={{ background:"rgba(255,255,255,0.2)", color:"#fff", fontSize:"11px", padding:"4px 12px", borderRadius:"20px", letterSpacing:"0.06em", textTransform:"uppercase" }}>{top.genre}</span>
                  <span style={{ background:"rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.75)", fontSize:"11px", padding:"4px 12px", borderRadius:"20px" }}>{top.type}</span>
                </div>
                <div style={{ fontFamily:"Georgia, serif", fontSize:"26px", color:"#fff", lineHeight:1.2, marginBottom:"6px" }}>{top.title}</div>
                <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.6)", marginBottom:"18px" }}>{top.author} · {top.year}</div>
                <div style={{ fontSize:"15px", color:"rgba(255,255,255,0.9)", lineHeight:1.65, fontFamily:"Georgia, serif", fontStyle:"italic" }}>"{top.hook}"</div>
                <div style={{ marginTop:"24px", fontSize:"12px", color:"rgba(255,255,255,0.35)", textAlign:"center" }}>Tap to preview · Swipe to decide</div>
              </div>
            ) : (
              <div style={{ height:"100%", display:"flex", flexDirection:"column", padding:"28px", background:"rgba(0,0,0,0.45)", borderRadius:"24px" }}>
                <div style={{ fontFamily:"Georgia, serif", fontSize:"17px", color:"#fff", lineHeight:1.3, marginBottom:"4px" }}>{top.title}</div>
                <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.5)", marginBottom:"20px" }}>{top.author}</div>
                <div style={{ flex:1, fontSize:"15px", color:"rgba(255,255,255,0.9)", lineHeight:1.75, fontFamily:"Georgia, serif", fontStyle:"italic", overflowY:"auto" }}>{top.hook}</div>
                <div style={{ marginTop:"16px", fontSize:"12px", color:"rgba(255,255,255,0.35)", textAlign:"center" }}>Tap to flip back</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:"160px", left:"50%", transform:"translateX(-50%)", background:"var(--text)", color:"var(--bg)", borderRadius:"20px", padding:"9px 20px", fontSize:"13px", fontWeight:"500", zIndex:200, pointerEvents:"none", whiteSpace:"nowrap", boxShadow:"0 4px 16px rgba(0,0,0,0.2)" }}>
          {toast}
        </div>
      )}

      {/* Action buttons */}
      {top && (
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:"20px", padding:"8px 24px 12px", flexShrink:0 }}>
          <button
            onClick={() => dismiss("left")}
            disabled={fetching}
            style={{ width:"58px", height:"58px", borderRadius:"50%", background:"var(--surface)", border:"2px solid #ef5350", color:"#ef5350", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", WebkitTapHighlightColor:"transparent", opacity: fetching ? 0.4 : 1 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width:"20px", height:"20px" }}><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
          <button
            onClick={() => !fetching && setFlipped(f => !f)}
            style={{ width:"46px", height:"46px", borderRadius:"50%", background:"var(--surface)", border:"1.5px solid rgba(224,124,58,0.25)", color:"var(--text-muted)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", WebkitTapHighlightColor:"transparent", opacity: fetching ? 0.4 : 1 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width:"18px", height:"18px" }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button
            onClick={() => dismiss("right")}
            disabled={fetching}
            style={{ width:"58px", height:"58px", borderRadius:"50%", background:"var(--accent)", border:"none", color:"#fff", fontSize:"24px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", WebkitTapHighlightColor:"transparent", boxShadow:"0 4px 20px rgba(224,124,58,0.45)", opacity: fetching ? 0.6 : 1 }}
          >+</button>
        </div>
      )}
    </div>
  );
}