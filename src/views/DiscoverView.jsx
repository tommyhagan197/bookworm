import { useState, useRef, useEffect } from "react";
import { dbPut, dbGet, dbGetAll } from "../db/idb";

const STORIES = [
  { id:"discover_1", title:"The Gift of the Magi", author:"O. Henry", genre:"Romance", type:"Short Story", color:"#7B4A6B", hook:"One dollar and eighty-seven cents. That was all. And sixty cents of it was in pennies.", preview:"Della counted it three times. One dollar and eighty-seven cents. And the next day would be Christmas. There was nothing left to do but flop down on the shabby little couch and howl — so Della did it, which instigates the moral reflection that life is made up of sobs, sniffles, and smiles, with sniffles predominating.", year:"1905" },
  { id:"discover_2", title:"The Yellow Wallpaper", author:"Charlotte Perkins Gilman", genre:"Literary Fiction", type:"Short Story", color:"#6B7A34", hook:"It is very seldom that mere ordinary people like John and myself secure ancestral halls for the summer.", preview:"John is a physician, and perhaps — I would not say it to a living soul, of course, but this is dead paper and a great relief to my mind — perhaps that is one reason I do not get well faster. You see, he does not believe I am sick. And what can one do?", year:"1892" },
  { id:"discover_3", title:"The Tell-Tale Heart", author:"Edgar Allan Poe", genre:"Mystery", type:"Short Story", color:"#2D3A5A", hook:"True! Nervous — very, very dreadfully nervous I had been and am; but why will you say that I am mad?", preview:"The disease had sharpened my senses — not destroyed — not dulled them. Above all was the sense of hearing acute. I heard all things in the heaven and in the earth. I heard many things in hell. How, then, am I mad?", year:"1843" },
  { id:"discover_4", title:"The Lottery", author:"Shirley Jackson", genre:"Literary Fiction", type:"Short Story", color:"#4A6741", hook:"The morning of June 27th was clear and sunny, with the fresh warmth of a full-summer day.", preview:"The flowers were blossoming profusely and the grass was richly green. The people of the village began to gather in the square, between the post office and the bank, around ten o\'clock.", year:"1948" },
  { id:"discover_5", title:"An Occurrence at Owl Creek Bridge", author:"Ambrose Bierce", genre:"Mystery", type:"Short Story", color:"#3D5A6B", hook:"A man stood upon a railroad bridge in northern Alabama, looking down into the swift water twenty feet below.", preview:"The man\'s hands were behind his back, the wrists bound with a cord. A rope closely encircled his neck. It was attached to a stout cross-timber above his head, and the slack fell to the level of his knees.", year:"1890" },
  { id:"discover_6", title:"The Necklace", author:"Guy de Maupassant", genre:"Literary Fiction", type:"Short Story", color:"#6B4A34", hook:"She was one of those pretty and charming girls, born into a family of clerks, with no dowry, no prospects.", preview:"She had no gowns, no jewels, nothing. And she loved nothing but that; she felt made for that. She would so have liked to please, to be envied, to be charming, to be sought after.", year:"1884" },
  { id:"discover_7", title:"The Secret Life of Walter Mitty", author:"James Thurber", genre:"Literary Fiction", type:"Short Story", color:"#5A3D6B", hook:"We\'re going through! The Commander\'s voice was like thin ice breaking.", preview:"He wore his full-dress uniform, with the heavily braided white cap pulled down rakishly over one cold gray eye. \"We can\'t make it, sir. It\'s spoiling for a hurricane, if you ask me.\" \"I\'m not asking you, Lieutenant Berg,\" said the Commander.", year:"1939" },
  { id:"discover_8", title:"The Metamorphosis", author:"Franz Kafka", genre:"Literary Fiction", type:"Short Story", color:"#3D6B4A", hook:"As Gregor Samsa awoke one morning from uneasy dreams he found himself transformed into a gigantic insect.", preview:"He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections. The bedding was hardly able to cover it and seemed ready to slide off any moment.", year:"1915" },
  { id:"discover_9", title:"Hills Like White Elephants", author:"Ernest Hemingway", genre:"Literary Fiction", type:"Short Story", color:"#7B6234", hook:"The hills across the dry valley of the Ebro were long and white.", preview:"On this side there was no shade and no trees and the station was between two lines of rails in the sun. Close against the side of the station there was the warm shadow of the building and a curtain made of strings of bamboo beads.", year:"1927" },
  { id:"discover_10", title:"The Celebrated Jumping Frog", author:"Mark Twain", genre:"Literary Fiction", type:"Short Story", color:"#6B5A2D", hook:"In compliance with the request of a friend, I called on good-natured, garrulous old Simon Wheeler.", preview:"I found Simon Wheeler dozing comfortably by the barroom stove of the dilapidated tavern in the decayed mining camp of Angel\'s, and I noticed that he was fat and bald-headed, and had an expression of winning gentleness upon his tranquil countenance.", year:"1865" },
];

const GENRES = ["All","Literary Fiction","Mystery","Romance"];
const SWIPE_THRESHOLD = 75;

export default function DiscoverView() {
  const [genre, setGenre] = useState("All");
  const [deck, setDeck] = useState(null); // null = loading
  const [seen, setSeen] = useState({});
  const [flipped, setFlipped] = useState(false);
  const [drag, setDrag] = useState({ active:false, x:0, y:0 });
  const [flyOff, setFlyOff] = useState(null);
  const [toast, setToast] = useState(null);
  const [saved, setSaved] = useState({});
  const startPos = useRef({ x:0, y:0 });
  const moved = useRef(false);

  // Load seen IDs from IndexedDB on mount
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
    setTimeout(() => setToast(null), 1600);
  }

  async function dismiss(direction) {
    if (!top) return;
    // Mark as seen immediately
    const newSeen = { ...seen, [top.id]: true };
    setSeen(newSeen);
    try { await dbPut("settings", { id: "discover_seen", value: newSeen }); } catch(e) {}

    if (direction === "right" && !saved[top.id]) {
      try {
        // Split preview into readable pages — each paragraph is a content block
        const paragraphs = top.preview.split(/\n+/).filter(Boolean);
        const pages = [];
        let current = [];
        let wordCount = 0;
        const wordsPerPage = Math.round((window.innerHeight / 22) * 12);
        for (const para of paragraphs) {
          const words = para.split(" ").length;
          if (wordCount + words > wordsPerPage && current.length > 0) {
            pages.push(current);
            current = [];
            wordCount = 0;
          }
          current.push({ html: para, isHeading: false });
          wordCount += words;
        }
        if (current.length > 0) pages.push(current);
        // Always show title as first page heading
        pages.unshift([{ html: top.title, isHeading: true }, { html: "by " + top.author, isHeading: false }]);
        const totalPages = pages.length;
        await dbPut("books", {
          id: top.id,
          title: top.title,
          author: top.author,
          totalPages,
          progress: 0,
          currentPage: 0,
          addedAt: Date.now(),
          color: top.color,
          isShortStory: true,
        });
        // Write each page
        for (let i = 0; i < pages.length; i++) {
          await dbPut("pages", { key: top.id + ":" + i, content: pages[i] });
        }
        setSaved(s => ({ ...s, [top.id]: true }));
      } catch(e) { console.error("Save failed", e); }
      showToast("Added to shelf");
    } else if (direction === "left") {
      showToast("Skipped");
    }
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
    if (!moved.current) {
      setFlipped(f => !f);
      return;
    }
    if (dx > SWIPE_THRESHOLD) { dismiss("right"); return; }
    if (dx < -SWIPE_THRESHOLD) { dismiss("left"); return; }
  }

  const rotate = drag.active ? drag.x * 0.07 : 0;
  const tx = flyOff === "right" ? 650 : flyOff === "left" ? -650 : drag.active ? drag.x : 0;
  const ty = drag.active ? drag.y * 0.25 : 0;
  const showRight = drag.active && drag.x > 35;
  const showLeft  = drag.active && drag.x < -35;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>

      {/* Genre pills */}
      <div style={{ display:"flex", gap:"8px", padding:"14px 16px 0", overflowX:"auto", flexShrink:0, scrollbarWidth:"none" }}>
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

      {/* Card area */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", padding:"12px 20px 8px" }}>

        {deck.length === 0 && (
          <div style={{ textAlign:"center", color:"var(--text-muted)", padding:"40px 24px" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ width:"48px", height:"48px", marginBottom:"12px", opacity:0.3 }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <div style={{ fontSize:"17px", fontFamily:"Georgia, serif", marginBottom:"8px" }}>You have seen them all</div>
            <div style={{ fontSize:"13px" }}>Change the genre filter or check your shelf</div>
          </div>
        )}

        {/* Background card */}
        {next && (
          <div style={{
            position:"absolute", inset:"12px 20px 8px",
            borderRadius:"24px", background:next.color,
            transform:"scale(0.95) translateY(14px)",
            transition:"transform 0.3s ease",
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
              position:"absolute", inset:"12px 20px 8px",
              borderRadius:"24px", background:top.color,
              userSelect:"none", WebkitUserSelect:"none",
              transform:`translate(${tx}px,${ty}px) rotate(${rotate}deg)`,
              transition: drag.active ? "none" : flyOff ? "transform 0.38s cubic-bezier(0.55,0,1,0.45)" : "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              boxShadow:"0 16px 48px rgba(0,0,0,0.22)",
              overflow:"hidden", touchAction:"none",
            }}
          >
            {/* Swipe labels */}
            {showRight && (
              <div style={{ position:"absolute", top:"28px", left:"24px", border:"3px solid #4CAF50", borderRadius:"8px", padding:"5px 12px", color:"#4CAF50", fontSize:"17px", fontWeight:"700", opacity:Math.min(drag.x/120,1), transform:"rotate(-12deg)", zIndex:10, letterSpacing:"0.05em" }}>ADD</div>
            )}
            {showLeft && (
              <div style={{ position:"absolute", top:"28px", right:"24px", border:"3px solid #ef5350", borderRadius:"8px", padding:"5px 12px", color:"#ef5350", fontSize:"17px", fontWeight:"700", opacity:Math.min(-drag.x/120,1), transform:"rotate(12deg)", zIndex:10, letterSpacing:"0.05em" }}>SKIP</div>
            )}

            {!flipped ? (
              <div style={{ height:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"28px" }}>
                <div style={{ marginBottom:"12px" }}>
                  <span style={{ background:"rgba(255,255,255,0.18)", color:"#fff", fontSize:"11px", padding:"4px 12px", borderRadius:"20px", letterSpacing:"0.06em", textTransform:"uppercase" }}>{top.genre}</span>
                {top.type && <span style={{ background:"rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.7)", fontSize:"11px", padding:"4px 12px", borderRadius:"20px", letterSpacing:"0.06em", marginLeft:"6px" }}>{top.type}</span>}
                </div>
                <div style={{ fontFamily:"Georgia, serif", fontSize:"26px", color:"#fff", fontWeight:"normal", lineHeight:1.2, marginBottom:"6px" }}>{top.title}</div>
                <div style={{ fontSize:"14px", color:"rgba(255,255,255,0.65)", marginBottom:"16px" }}>{top.author} · {top.year}</div>
                <div style={{ fontSize:"15px", color:"rgba(255,255,255,0.88)", lineHeight:1.6, fontStyle:"italic" }}>"{top.hook}"</div>
                <div style={{ marginTop:"20px", fontSize:"12px", color:"rgba(255,255,255,0.38)", textAlign:"center", letterSpacing:"0.02em" }}>Tap to preview · Swipe to decide</div>
              </div>
            ) : (
              <div style={{ height:"100%", display:"flex", flexDirection:"column", padding:"28px", background:"rgba(0,0,0,0.42)", borderRadius:"24px" }}>
                <div style={{ fontFamily:"Georgia, serif", fontSize:"18px", color:"#fff", lineHeight:1.3, marginBottom:"4px" }}>{top.title}</div>
                <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.55)", marginBottom:"20px" }}>{top.author}</div>
                <div style={{ flex:1, fontSize:"16px", color:"rgba(255,255,255,0.92)", lineHeight:1.75, fontFamily:"Georgia, serif", fontStyle:"italic", overflowY:"auto" }}>{top.preview}</div>
                <div style={{ marginTop:"16px", fontSize:"12px", color:"rgba(255,255,255,0.38)", textAlign:"center" }}>Tap to flip back</div>
              </div>
            )}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div style={{ position:"absolute", bottom:"16px", left:"50%", transform:"translateX(-50%)", background:"var(--text)", color:"var(--bg)", borderRadius:"20px", padding:"9px 22px", fontSize:"13px", fontWeight:"500", zIndex:20, pointerEvents:"none", whiteSpace:"nowrap", boxShadow:"0 4px 16px rgba(0,0,0,0.2)" }}>{toast}</div>
        )}
      </div>

      {/* Action buttons */}
      {top && (
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:"20px", padding:"8px 24px 20px", flexShrink:0 }}>
          <button onClick={() => dismiss("left")} style={{ width:"58px", height:"58px", borderRadius:"50%", background:"var(--surface)", border:"2px solid #ef5350", color:"#ef5350", fontSize:"20px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", WebkitTapHighlightColor:"transparent", boxShadow:"0 2px 12px rgba(0,0,0,0.1)", transition:"transform 0.1s" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width:"20px", height:"20px" }}><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
          <button onClick={() => setFlipped(f => !f)} style={{ width:"46px", height:"46px", borderRadius:"50%", background:"var(--surface)", border:"1.5px solid rgba(224,124,58,0.25)", color:"var(--text-muted)", fontSize:"15px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", WebkitTapHighlightColor:"transparent" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width:"18px", height:"18px" }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button onClick={() => dismiss("right")} style={{ width:"58px", height:"58px", borderRadius:"50%", background:"var(--accent)", border:"none", color:"#fff", fontSize:"24px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", WebkitTapHighlightColor:"transparent", boxShadow:"0 4px 20px rgba(224,124,58,0.45)", transition:"transform 0.1s" }}>+</button>
        </div>
      )}
    </div>
  );
}
