import { useState, useRef } from "react";

const STORIES = [
  { id:1, title:"The Gift of the Magi", author:"O. Henry", genre:"Romance", color:"#7B4A6B", hook:"One dollar and eighty-seven cents. That was all. And sixty cents of it was in pennies.", preview:"Della counted it three times. One dollar and eighty-seven cents. And the next day would be Christmas. There was nothing left to do but flop down on the shabby little couch and howl — so Della did it, which instigates the moral reflection that life is made up of sobs, sniffles, and smiles, with sniffles predominating.", year:"1905" },
  { id:2, title:"The Yellow Wallpaper", author:"Charlotte Perkins Gilman", genre:"Literary Fiction", color:"#6B7A34", hook:"It is very seldom that mere ordinary people like John and myself secure ancestral halls for the summer.", preview:"John is a physician, and perhaps — I would not say it to a living soul, of course, but this is dead paper and a great relief to my mind — perhaps that is one reason I do not get well faster. You see, he does not believe I am sick. And what can one do?", year:"1892" },
  { id:3, title:"The Tell-Tale Heart", author:"Edgar Allan Poe", genre:"Mystery", color:"#2D3A5A", hook:"True! Nervous — very, very dreadfully nervous I had been and am; but why will you say that I am mad?", preview:"The disease had sharpened my senses — not destroyed — not dulled them. Above all was the sense of hearing acute. I heard all things in the heaven and in the earth. I heard many things in hell. How, then, am I mad?", year:"1843" },
  { id:4, title:"The Lottery", author:"Shirley Jackson", genre:"Literary Fiction", color:"#4A6741", hook:"The morning of June 27th was clear and sunny, with the fresh warmth of a full-summer day.", preview:"The flowers were blossoming profusely and the grass was richly green. The people of the village began to gather in the square, between the post office and the bank, around ten o\'clock; in some towns there were so many people that the lottery took two days.", year:"1948" },
  { id:5, title:"An Occurrence at Owl Creek Bridge", author:"Ambrose Bierce", genre:"Mystery", color:"#3D5A6B", hook:"A man stood upon a railroad bridge in northern Alabama, looking down into the swift water twenty feet below.", preview:"The man\'s hands were behind his back, the wrists bound with a cord. A rope closely encircled his neck. It was attached to a stout cross-timber above his head, and the slack fell to the level of his knees.", year:"1890" },
  { id:6, title:"The Necklace", author:"Guy de Maupassant", genre:"Literary Fiction", color:"#6B4A34", hook:"She was one of those pretty and charming girls, born into a family of clerks, with no dowry, no prospects.", preview:"She had no gowns, no jewels, nothing. And she loved nothing but that; she felt made for that. She would so have liked to please, to be envied, to be charming, to be sought after.", year:"1884" },
  { id:7, title:"The Secret Life of Walter Mitty", author:"James Thurber", genre:"Literary Fiction", color:"#5A3D6B", hook:"We\'re going through! The Commander\'s voice was like thin ice breaking.", preview:"He wore his full-dress uniform, with the heavily braided white cap pulled down rakishly over one cold gray eye. \"We can\'t make it, sir. It\'s spoiling for a hurricane, if you ask me.\" \"I\'m not asking you, Lieutenant Berg,\" said the Commander.", year:"1939" },
  { id:8, title:"The Metamorphosis", author:"Franz Kafka", genre:"Literary Fiction", color:"#3D6B4A", hook:"As Gregor Samsa awoke one morning from uneasy dreams he found himself transformed into a gigantic insect.", preview:"He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections. The bedding was hardly able to cover it and seemed ready to slide off any moment.", year:"1915" },
  { id:9, title:"Hills Like White Elephants", author:"Ernest Hemingway", genre:"Literary Fiction", color:"#7B6234", hook:"The hills across the dry valley of the Ebro were long and white.", preview:"On this side there was no shade and no trees and the station was between two lines of rails in the sun. Close against the side of the station there was the warm shadow of the building and a curtain made of strings of bamboo beads.", year:"1927" },
  { id:10, title:"The Celebrated Jumping Frog", author:"Mark Twain", genre:"Literary Fiction", color:"#6B5A2D", hook:"In compliance with the request of a friend, I called on good-natured, garrulous old Simon Wheeler.", preview:"I found Simon Wheeler dozing comfortably by the barroom stove of the dilapidated tavern in the decayed mining camp of Angel\'s, and I noticed that he was fat and bald-headed, and had an expression of winning gentleness upon his tranquil countenance.", year:"1865" },
];

const GENRES = ["All","Literary Fiction","Mystery","Romance"];
const SWIPE_THRESHOLD = 80;

export default function DiscoverView() {
  const [genre, setGenre] = useState("All");
  const [deck, setDeck] = useState([...STORIES]);
  const [flipped, setFlipped] = useState(false);
  const [drag, setDrag] = useState({ active:false, x:0, y:0, startX:0, startY:0 });
  const [flyOff, setFlyOff] = useState(null);
  const [toast, setToast] = useState(null);

  function handleGenre(g) {
    setGenre(g);
    setDeck(g === "All" ? [...STORIES] : STORIES.filter(s => s.genre === g));
    setFlipped(false);
    setFlyOff(null);
  }

  const top = deck[0];
  const next = deck[1];

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 1500);
  }

  function dismiss(direction) {
    if (!top) return;
    setFlyOff(direction);
    setFlipped(false);
    setTimeout(() => { setDeck(d => d.slice(1)); setFlyOff(null); }, 380);
    if (direction === "right") showToast("Added to shelf ✓");
    if (direction === "left") showToast("Skipped");
  }

  function onPointerDown(e) {
    if (flipped) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDrag({ active:true, x:0, y:0, startX:clientX, startY:clientY });
  }

  function onPointerMove(e) {
    if (!drag.active) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDrag(d => ({ ...d, x:clientX - d.startX, y:clientY - d.startY }));
  }

  function onPointerUp() {
    if (!drag.active) return;
    const dx = drag.x;
    const dy = drag.y;
    setDrag({ active:false, x:0, y:0, startX:0, startY:0 });
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) { setFlipped(f => !f); return; }
    if (dx > SWIPE_THRESHOLD) { dismiss("right"); return; }
    if (dx < -SWIPE_THRESHOLD) { dismiss("left"); return; }
  }

  const rotate = drag.active ? drag.x * 0.08 : 0;
  const tx = flyOff === "right" ? 600 : flyOff === "left" ? -600 : drag.active ? drag.x : 0;
  const ty = drag.active ? drag.y * 0.3 : 0;
  const showRight = drag.x > 30;
  const showLeft = drag.x < -30;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>

      <div style={{ display:"flex", gap:"8px", padding:"16px 16px 0", overflowX:"auto", flexShrink:0, scrollbarWidth:"none" }}>
        {GENRES.map(g => (
          <button key={g} onClick={() => handleGenre(g)} style={{
            flexShrink:0, background: genre===g ? "var(--accent)" : "var(--surface)",
            color: genre===g ? "#fff" : "var(--text)",
            border: genre===g ? "none" : "1px solid rgba(224,124,58,0.2)",
            borderRadius:"20px", padding:"7px 16px", fontSize:"13px",
            cursor:"pointer", WebkitTapHighlightColor:"transparent", transition:"all 0.15s",
          }}>{g}</button>
        ))}
      </div>

      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", padding:"16px" }}>

        {deck.length === 0 && (
          <div style={{ textAlign:"center", color:"var(--text-muted)", padding:"40px 24px" }}>
            <div style={{ fontSize:"40px", marginBottom:"12px" }}>📚</div>
            <div style={{ fontSize:"17px", fontFamily:"Georgia, serif", marginBottom:"8px" }}>You have seen them all</div>
            <div style={{ fontSize:"13px" }}>Change genre or check your shelf</div>
          </div>
        )}

        {next && (
          <div style={{
            position:"absolute", width:"calc(100% - 48px)", maxWidth:"340px",
            aspectRatio:"3/4", borderRadius:"20px", background:next.color,
            transform:"scale(0.94) translateY(12px)", transition:"transform 0.3s ease",
            boxShadow:"0 8px 32px rgba(0,0,0,0.18)",
          }} />
        )}

        {top && (
          <div
            onMouseDown={onPointerDown} onMouseMove={onPointerMove}
            onMouseUp={onPointerUp} onMouseLeave={onPointerUp}
            onTouchStart={onPointerDown} onTouchMove={onPointerMove} onTouchEnd={onPointerUp}
            style={{
              position:"absolute", width:"calc(100% - 48px)", maxWidth:"340px",
              aspectRatio:"3/4", borderRadius:"20px", background:top.color,
              cursor:"grab", userSelect:"none", WebkitUserSelect:"none",
              transform:`translate(${tx}px,${ty}px) rotate(${rotate}deg)`,
              transition: drag.active ? "none" : flyOff ? "transform 0.38s cubic-bezier(0.55,0,1,0.45)" : "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              boxShadow:"0 12px 40px rgba(0,0,0,0.22)", overflow:"hidden", touchAction:"none",
            }}
          >
            {showRight && (
              <div style={{ position:"absolute", top:"24px", left:"20px", border:"3px solid #4CAF50", borderRadius:"8px", padding:"6px 14px", color:"#4CAF50", fontSize:"18px", fontWeight:"700", opacity:Math.min(drag.x/100,1), transform:"rotate(-15deg)", zIndex:10 }}>ADD</div>
            )}
            {showLeft && (
              <div style={{ position:"absolute", top:"24px", right:"20px", border:"3px solid #ef5350", borderRadius:"8px", padding:"6px 14px", color:"#ef5350", fontSize:"18px", fontWeight:"700", opacity:Math.min(-drag.x/100,1), transform:"rotate(15deg)", zIndex:10 }}>SKIP</div>
            )}

            {!flipped ? (
              <div style={{ height:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"24px" }}>
                <div style={{ marginBottom:"10px" }}>
                  <span style={{ background:"rgba(255,255,255,0.18)", color:"#fff", fontSize:"11px", padding:"4px 10px", borderRadius:"20px", letterSpacing:"0.05em" }}>{top.genre}</span>
                </div>
                <div style={{ fontFamily:"Georgia, serif", fontSize:"24px", color:"#fff", fontWeight:"normal", lineHeight:1.2, marginBottom:"6px" }}>{top.title}</div>
                <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.7)", marginBottom:"12px" }}>{top.author} · {top.year}</div>
                <div style={{ fontSize:"14px", color:"rgba(255,255,255,0.85)", lineHeight:1.5, fontStyle:"italic" }}>"{top.hook}"</div>
                <div style={{ marginTop:"16px", fontSize:"12px", color:"rgba(255,255,255,0.4)", textAlign:"center" }}>Tap to preview · Swipe to decide</div>
              </div>
            ) : (
              <div style={{ height:"100%", display:"flex", flexDirection:"column", padding:"24px", background:"rgba(0,0,0,0.4)" }}>
                <div style={{ fontFamily:"Georgia, serif", fontSize:"16px", color:"#fff", lineHeight:1.3, marginBottom:"4px" }}>{top.title}</div>
                <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.6)", marginBottom:"20px" }}>{top.author}</div>
                <div style={{ flex:1, fontSize:"15px", color:"rgba(255,255,255,0.9)", lineHeight:1.7, fontFamily:"Georgia, serif", fontStyle:"italic", overflowY:"auto" }}>{top.preview}</div>
                <div style={{ marginTop:"16px", fontSize:"12px", color:"rgba(255,255,255,0.4)", textAlign:"center" }}>Tap to flip back</div>
              </div>
            )}
          </div>
        )}

        {toast && (
          <div style={{ position:"absolute", bottom:"8px", left:"50%", transform:"translateX(-50%)", background:"var(--text)", color:"var(--bg)", borderRadius:"20px", padding:"8px 20px", fontSize:"13px", fontWeight:"500", zIndex:20, pointerEvents:"none", whiteSpace:"nowrap" }}>{toast}</div>
        )}
      </div>

      {top && (
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:"24px", padding:"0 24px 24px", flexShrink:0 }}>
          <button onClick={() => dismiss("left")} style={{ width:"56px", height:"56px", borderRadius:"50%", background:"var(--surface)", border:"2px solid #ef5350", color:"#ef5350", fontSize:"22px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", WebkitTapHighlightColor:"transparent", boxShadow:"0 2px 12px rgba(0,0,0,0.1)" }}>✕</button>
          <button onClick={() => setFlipped(f => !f)} style={{ width:"44px", height:"44px", borderRadius:"50%", background:"var(--surface)", border:"1.5px solid rgba(224,124,58,0.3)", color:"var(--text-muted)", fontSize:"16px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", WebkitTapHighlightColor:"transparent" }}>👁</button>
          <button onClick={() => dismiss("right")} style={{ width:"56px", height:"56px", borderRadius:"50%", background:"var(--accent)", border:"none", color:"#fff", fontSize:"22px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", WebkitTapHighlightColor:"transparent", boxShadow:"0 4px 16px rgba(224,124,58,0.4)" }}>+</button>
        </div>
      )}
    </div>
  );
}
