import { useState } from "react";

// ── Seed data ──────────────────────────────────────────────────────────────

const CLUBS = [
  {
    id: "c1",
    name: "The Slow Readers",
    description: "One chapter a day. No rushing. No spoilers.",
    currentBook: "Middlemarch",
    author: "George Eliot",
    chapter: "Chapter 12 of 86",
    members: 47,
    activeThisWeek: 31,
    color: "#6B5344",
    joined: true,
    streak: 5,
    genre: "Literary Fiction",
  },
  {
    id: "c2",
    name: "Classics Collective",
    description: "Public domain only. We read what Amazon doesn't sell.",
    currentBook: "Moby-Dick",
    author: "Herman Melville",
    chapter: "Chapter 3 of 135",
    members: 112,
    activeThisWeek: 78,
    color: "#4A6741",
    joined: false,
    streak: 0,
    genre: "Classic Literature",
  },
  {
    id: "c3",
    name: "Night Owls",
    description: "Reading after midnight since 2023. Dark mode mandatory.",
    currentBook: "Jane Eyre",
    author: "Charlotte Brontë",
    chapter: "Chapter 19 of 38",
    members: 31,
    activeThisWeek: 19,
    color: "#2C4A6B",
    joined: false,
    streak: 0,
    genre: "Classic Literature",
  },
  {
    id: "c4",
    name: "Sentence Worshippers",
    description: "We stop to re-read beautiful sentences. Progress is slow. Worth it.",
    currentBook: "The Master & Margarita",
    author: "Mikhail Bulgakov",
    chapter: "Chapter 7 of 32",
    members: 23,
    activeThisWeek: 18,
    color: "#7A5C2E",
    joined: false,
    streak: 0,
    genre: "Literary Fiction",
  },
  {
    id: "c5",
    name: "Gutenberg Brigade",
    description: "If it's free and brilliant, we'll read it together.",
    currentBook: "Walden",
    author: "Henry David Thoreau",
    chapter: "Chapter 2 of 18",
    members: 68,
    activeThisWeek: 41,
    color: "#4A6B5C",
    joined: false,
    streak: 0,
    genre: "Philosophy",
  },
  {
    id: "c6",
    name: "The Philosophy Circle",
    description: "Slow reads, long discussions. We argue in good faith.",
    currentBook: "Meditations",
    author: "Marcus Aurelius",
    chapter: "Book IV of XII",
    members: 39,
    activeThisWeek: 27,
    color: "#6B4A6B",
    joined: false,
    streak: 0,
    genre: "Philosophy",
    trending: true,
  },
  {
    id: "c7",
    name: "Short Story Sundays",
    description: "One short story every Sunday. Discuss Monday morning.",
    currentBook: "Dubliners",
    author: "James Joyce",
    chapter: "Story 4 of 15",
    members: 55,
    activeThisWeek: 44,
    color: "#6B6234",
    joined: false,
    streak: 0,
    genre: "Short Fiction",
  },
];

const FRIENDS_ACTIVITY = [
  { id: "f1", name: "Maya", initials: "M", color: "#6B5344", action: "finished", book: "Middlemarch", time: "2 hours ago" },
  { id: "f2", name: "Jordan", initials: "J", color: "#4A6741", action: "started", book: "The Brothers Karamazov", time: "Yesterday" },
  { id: "f3", name: "Priya", initials: "P", color: "#7A5C2E", action: "reviewed", book: "Jane Eyre", review: "Probably the best first-person voice in all of 19th century fiction.", time: "2 days ago" },
  { id: "f4", name: "Sam", initials: "S", color: "#2C4A6B", action: "finished", book: "Moby-Dick", time: "3 days ago" },
  { id: "f5", name: "Leila", initials: "L", color: "#4A6B5C", action: "started", book: "Siddhartha", time: "4 days ago" },
];

const INITIAL_NOTIFICATIONS = [
  { id: "n1", type: "invite", from: "Maya", fromInitials: "M", fromColor: "#6B5344", club: "Sentence Worshippers", clubId: "c4", time: "1 hour ago", read: false },
  { id: "n2", type: "invite", from: "Jordan", fromInitials: "J", fromColor: "#4A6741", club: "Night Owls", clubId: "c3", time: "Yesterday", read: false },
  { id: "n3", type: "activity", from: "The Slow Readers", fromInitials: "SR", fromColor: "#6B5344", message: "12 members read this week — you're keeping up.", time: "2 days ago", read: true },
];

const TRENDING_PASSAGES = [
  { id: "p1", quote: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.", book: "Pride and Prejudice", author: "Jane Austen", highlights: 1842, color: "#6B5344" },
  { id: "p2", quote: "Call me Ishmael. Some years ago — never mind how long precisely — having little money in my pocket and nothing particular to interest me on shore, I thought I would sail about a little.", book: "Moby-Dick", author: "Herman Melville", highlights: 973, color: "#2C4A6B" },
  { id: "p3", quote: "We are all alone, born alone, die alone, and — in spite of True Romance magazines — we shall all someday look back on our lives and see that, in spite of our company, we were alone the whole way.", book: "The Rum Diary", author: "Hunter S. Thompson", highlights: 2104, color: "#7A5C2E" },
  { id: "p4", quote: "Not all those who wander are lost.", book: "The Fellowship of the Ring", author: "J.R.R. Tolkien", highlights: 3891, color: "#4A6741" },
  { id: "p5", quote: "The most important things are the hardest to say. They are the things you get ashamed of, because words diminish them.", book: "The Body", author: "Stephen King", highlights: 1456, color: "#4A6B5C" },
  { id: "p6", quote: "I took a deep breath and listened to the old brag of my heart: I am, I am, I am.", book: "The Bell Jar", author: "Sylvia Plath", highlights: 2788, color: "#6B4A6B" },
];

const MOST_READ = [
  { id: "mr1", title: "Middlemarch", author: "George Eliot", readers: 312, color: "#6B5344" },
  { id: "mr2", title: "Jane Eyre", author: "Charlotte Brontë", readers: 289, color: "#2C4A6B" },
  { id: "mr3", title: "Moby-Dick", author: "Herman Melville", readers: 241, color: "#4A6741" },
  { id: "mr4", title: "Walden", author: "Henry David Thoreau", readers: 198, color: "#7A5C2E" },
  { id: "mr5", title: "Frankenstein", author: "Mary Shelley", readers: 176, color: "#4A6B5C" },
  { id: "mr6", title: "Siddhartha", author: "Hermann Hesse", readers: 154, color: "#6B4A3A" },
];

const GENRES = ["All", "Literary Fiction", "Classic Literature", "Philosophy", "Short Fiction", "Poetry"];

// ── Avatar ─────────────────────────────────────────────────────────────────

function Avatar({ initials, color, size = 36 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#F5F0E8", fontSize: size * 0.38, fontFamily: "'Lora', Georgia, serif", fontWeight: 600, letterSpacing: "0.02em" }}>
      {initials}
    </div>
  );
}

// ── ClubCard ───────────────────────────────────────────────────────────────

function ClubCard({ club, onJoin }) {
  const [joining, setJoining] = useState(false);

  function handleJoin() {
    if (club.joined) return;
    setJoining(true);
    setTimeout(() => { onJoin(club.id); setJoining(false); }, 600);
  }

  function handleInvite() {
    if (navigator.share) {
      navigator.share({
        title: `Join me in ${club.name}`,
        text: `I'm reading ${club.currentBook} with ${club.name} on BookWorm — join us.`,
        url: "https://bookworm-dpq.pages.dev",
      });
    }
  }

  return (
    <div style={{ background: "var(--surface, #EDE8DF)", borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ height: 5, background: club.color, opacity: 0.85 }} />
      <div style={{ padding: "16px 16px 14px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2, flexWrap: "wrap" }}>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Lora', Georgia, serif", color: "var(--ink, #2C2416)", letterSpacing: "-0.01em", lineHeight: 1.25 }}>
                {club.name}
              </div>
              {club.streak > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <span style={{ fontSize: 13 }}>🔥</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#E07C3A", fontFamily: "'DM Sans', system-ui, sans-serif" }}>{club.streak}</span>
                </div>
              )}
              {club.trending && !club.joined && (
                <div style={{ padding: "2px 7px", borderRadius: 20, background: "rgba(224,124,58,0.12)", border: "1px solid rgba(224,124,58,0.3)" }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#C0602A", fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: "0.04em" }}>trending</span>
                </div>
              )}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-faded, #7A6E5F)", letterSpacing: "0.02em" }}>{club.members} members</div>
          </div>
          <button onClick={handleJoin} style={{ flexShrink: 0, padding: "7px 16px", borderRadius: 20, border: club.joined ? "1.5px solid var(--ink-faded, #7A6E5F)" : "none", background: club.joined ? "transparent" : joining ? "var(--accent-deep, #C0602A)" : "var(--accent, #E07C3A)", color: club.joined ? "var(--ink-faded, #7A6E5F)" : "#fff", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: "0.01em", cursor: club.joined ? "default" : "pointer", transition: "background 0.15s ease", WebkitTapHighlightColor: "transparent" }}>
            {club.joined ? "Joined" : joining ? "Joining…" : "Join"}
          </button>
        </div>

        <p style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.5, color: "var(--ink-secondary, #5C5040)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          {club.description}
        </p>

        {/* Current read tile */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--bg, #F5F0E8)", borderRadius: 10 }}>
          <div style={{ width: 28, height: 40, borderRadius: 3, background: club.color, flexShrink: 0, opacity: 0.85, boxShadow: "1px 1px 4px rgba(0,0,0,0.18)" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, letterSpacing: "0.08em", color: "var(--ink-faded, #7A6E5F)", textTransform: "uppercase", marginBottom: 2 }}>Now reading</div>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Lora', Georgia, serif", color: "var(--ink, #2C2416)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{club.currentBook}</div>
            <div style={{ fontSize: 11, color: "var(--ink-faded, #7A6E5F)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>{club.chapter}</div>
          </div>
        </div>

        {/* Pulse + invite row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: club.activeThisWeek > club.members * 0.5 ? "#4A8C3F" : "#A89070" }} />
            <span style={{ fontSize: 11, color: "var(--ink-faded, #7A6E5F)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              {club.activeThisWeek} reading this week
            </span>
          </div>
          {club.joined && (
            <button onClick={handleInvite} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 12, color: "var(--accent, #E07C3A)", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, letterSpacing: "0.02em", WebkitTapHighlightColor: "transparent" }}>
              Invite →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── FriendRow ──────────────────────────────────────────────────────────────

function FriendRow({ activity }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 0", borderBottom: "1px solid var(--surface, #EDE8DF)" }}>
      <Avatar initials={activity.initials} color={activity.color} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, lineHeight: 1.4, color: "var(--ink, #2C2416)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          <span style={{ fontWeight: 600 }}>{activity.name}</span>{" "}
          <span style={{ color: "var(--ink-secondary, #5C5040)" }}>{activity.action}</span>{" "}
          <span style={{ fontStyle: "italic", fontFamily: "'Lora', Georgia, serif" }}>{activity.book}</span>
        </div>
        {activity.review && (
          <div style={{ marginTop: 6, padding: "8px 12px", background: "var(--surface, #EDE8DF)", borderRadius: 8, fontSize: 13, lineHeight: 1.5, color: "var(--ink-secondary, #5C5040)", fontFamily: "'Lora', Georgia, serif", fontStyle: "italic" }}>
            "{activity.review}"
          </div>
        )}
        <div style={{ marginTop: 4, fontSize: 11, color: "var(--ink-faded, #7A6E5F)", fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: "0.02em" }}>{activity.time}</div>
      </div>
    </div>
  );
}

// ── PassageCard ────────────────────────────────────────────────────────────

function PassageCard({ passage }) {
  return (
    <div style={{ background: "var(--surface, #EDE8DF)", borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ height: 4, background: passage.color, opacity: 0.75 }} />
      <div style={{ padding: "18px 18px 16px" }}>
        <div style={{ fontSize: 48, lineHeight: 0.6, fontFamily: "'Lora', Georgia, serif", color: passage.color, opacity: 0.4, marginBottom: 10, userSelect: "none" }}>"</div>
        <p style={{ margin: "0 0 14px", fontSize: 15, lineHeight: 1.65, fontFamily: "'Lora', Georgia, serif", fontStyle: "italic", color: "var(--ink, #2C2416)" }}>{passage.quote}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Lora', Georgia, serif", color: "var(--ink, #2C2416)" }}>{passage.book}</div>
            <div style={{ fontSize: 11, color: "var(--ink-faded, #7A6E5F)", fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 1 }}>{passage.author}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "var(--bg, #F5F0E8)", borderRadius: 20 }}>
            <span style={{ fontSize: 12 }}>✦</span>
            <span style={{ fontSize: 12, fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, color: "var(--ink-faded, #7A6E5F)" }}>{passage.highlights.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MostReadStrip ──────────────────────────────────────────────────────────

function MostReadStrip() {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-faded, #7A6E5F)", fontFamily: "'DM Sans', system-ui, sans-serif", marginBottom: 12, paddingLeft: 16 }}>
        Most read this week
      </div>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingLeft: 16, paddingRight: 16, paddingBottom: 4, WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {MOST_READ.map((book, i) => (
          <div key={book.id} style={{ flexShrink: 0, width: 90 }}>
            <div style={{ width: 90, height: 126, borderRadius: 8, background: book.color, marginBottom: 8, position: "relative", boxShadow: "2px 3px 8px rgba(0,0,0,0.2)", display: "flex", alignItems: "flex-end", padding: "8px 7px" }}>
              <div style={{ position: "absolute", top: 7, left: 7, width: 20, height: 20, borderRadius: "50%", background: "rgba(245,240,232,0.92)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, fontFamily: "'DM Sans', system-ui, sans-serif", color: book.color }}>{i + 1}</div>
              <div style={{ fontSize: 9, fontFamily: "'Lora', Georgia, serif", fontStyle: "italic", color: "rgba(245,240,232,0.85)", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{book.title}</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', system-ui, sans-serif", color: "var(--ink, #2C2416)", lineHeight: 1.3, marginBottom: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{book.title}</div>
            <div style={{ fontSize: 10, color: "var(--ink-faded, #7A6E5F)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>{book.readers} readers</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── NotificationDrawer ─────────────────────────────────────────────────────

function NotificationDrawer({ notifications, onClose, onAcceptInvite, onDeclineInvite }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(44,36,22,0.35)", zIndex: 200, backdropFilter: "blur(2px)" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(320px, 88vw)", background: "var(--bg, #F5F0E8)", zIndex: 201, display: "flex", flexDirection: "column", boxShadow: "-4px 0 32px rgba(44,36,22,0.18)" }}>
        <div style={{ paddingTop: "max(env(safe-area-inset-top, 44px), 44px)", padding: "max(env(safe-area-inset-top, 44px), 44px) 20px 0", paddingBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, borderBottom: "1px solid var(--surface, #EDE8DF)" }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: "'Lora', Georgia, serif", color: "var(--ink, #2C2416)", letterSpacing: "-0.01em" }}>Notifications</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", padding: "4px 8px", cursor: "pointer", fontSize: 22, color: "var(--ink-faded, #7A6E5F)", WebkitTapHighlightColor: "transparent", lineHeight: 1 }}>✕</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 24px" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
              <div style={{ fontSize: 15, fontFamily: "'Lora', Georgia, serif", color: "var(--ink-faded, #7A6E5F)" }}>Nothing yet</div>
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} style={{ padding: "14px 20px", borderBottom: "1px solid var(--surface, #EDE8DF)", background: n.read ? "transparent" : "rgba(224,124,58,0.04)" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ paddingTop: 6, flexShrink: 0 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: n.read ? "transparent" : "var(--accent, #E07C3A)" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {n.type === "invite" ? (
                      <>
                        <div style={{ fontSize: 14, lineHeight: 1.45, color: "var(--ink, #2C2416)", fontFamily: "'DM Sans', system-ui, sans-serif", marginBottom: 10 }}>
                          <span style={{ fontWeight: 600 }}>{n.from}</span> invited you to join{" "}
                          <span style={{ fontStyle: "italic", fontFamily: "'Lora', Georgia, serif" }}>{n.club}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => onAcceptInvite(n)} style={{ padding: "7px 16px", borderRadius: 20, border: "none", background: "var(--accent, #E07C3A)", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', system-ui, sans-serif", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                            Join club
                          </button>
                          <button onClick={() => onDeclineInvite(n.id)} style={{ padding: "7px 16px", borderRadius: 20, border: "1.5px solid var(--ink-faded, #7A6E5F)", background: "transparent", color: "var(--ink-faded, #7A6E5F)", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', system-ui, sans-serif", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                            Decline
                          </button>
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 14, lineHeight: 1.45, color: "var(--ink-secondary, #5C5040)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                        <span style={{ fontWeight: 600 }}>{n.from}</span> — {n.message}
                      </div>
                    )}
                    <div style={{ marginTop: 6, fontSize: 11, color: "var(--ink-faded, #7A6E5F)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>{n.time}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

// ── ExploreSheet ───────────────────────────────────────────────────────────

function ExploreSheet({ allClubs, onClose, onJoin }) {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");

  const filtered = allClubs.filter((c) => {
    if (c.joined) return false;
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.currentBook.toLowerCase().includes(search.toLowerCase());
    const matchesGenre = genre === "All" || c.genre === genre;
    return matchesSearch && matchesGenre;
  });

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(44,36,22,0.4)", zIndex: 200, backdropFilter: "blur(2px)" }} />
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, height: "82vh", background: "var(--bg, #F5F0E8)", borderRadius: "20px 20px 0 0", zIndex: 201, display: "flex", flexDirection: "column", boxShadow: "0 -8px 40px rgba(44,36,22,0.18)" }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--surface, #EDE8DF)" }} />
        </div>
        {/* Sheet header */}
        <div style={{ padding: "8px 20px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: "'Lora', Georgia, serif", color: "var(--ink, #2C2416)", letterSpacing: "-0.01em" }}>Explore Clubs</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", padding: "4px 8px", cursor: "pointer", fontSize: 22, color: "var(--ink-faded, #7A6E5F)", WebkitTapHighlightColor: "transparent", lineHeight: 1 }}>✕</button>
          </div>
          {/* Search */}
          <div style={{ position: "relative", marginBottom: 12 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "var(--ink-faded, #7A6E5F)", pointerEvents: "none" }}>⌕</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clubs or books…" style={{ width: "100%", padding: "11px 14px 11px 34px", borderRadius: 12, border: "none", background: "var(--surface, #EDE8DF)", fontSize: 14, fontFamily: "'DM Sans', system-ui, sans-serif", color: "var(--ink, #2C2416)", outline: "none", boxSizing: "border-box" }} />
          </div>
          {/* Genre pills */}
          <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 14, scrollbarWidth: "none" }}>
            {GENRES.map((g) => (
              <button key={g} onClick={() => setGenre(g)} style={{ flexShrink: 0, padding: "6px 13px", borderRadius: 20, border: genre === g ? "none" : "1.5px solid var(--surface, #EDE8DF)", background: genre === g ? "var(--ink, #2C2416)" : "var(--surface, #EDE8DF)", color: genre === g ? "var(--bg, #F5F0E8)" : "var(--ink-faded, #7A6E5F)", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', system-ui, sans-serif", cursor: "pointer", WebkitTapHighlightColor: "transparent", whiteSpace: "nowrap" }}>
                {g}
              </button>
            ))}
          </div>
        </div>
        {/* Club list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 32px", WebkitOverflowScrolling: "touch" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: 14, color: "var(--ink-faded, #7A6E5F)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>No clubs match that search.</div>
            </div>
          ) : (
            filtered.map((club) => (
              <ClubCard key={club.id} club={club} onJoin={(id) => { onJoin(id); }} />
            ))
          )}
        </div>
      </div>
    </>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────

export default function CommunityView() {
  const [mainTab, setMainTab] = useState("trending");
  const [communityTab, setCommunityTab] = useState("clubs");
  const [clubs, setClubs] = useState(CLUBS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showExplore, setShowExplore] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const joinedClubs = clubs.filter((c) => c.joined);

  function handleJoin(clubId) {
    setClubs((prev) => prev.map((c) => (c.id === clubId ? { ...c, joined: true } : c)));
  }

  function handleAcceptInvite(notification) {
    handleJoin(notification.clubId);
    setNotifications((prev) => prev.map((n) => n.id === notification.id ? { ...n, read: true } : n));
  }

  function handleDeclineInvite(notifId) {
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--bg, #F5F0E8)", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>

      {/* ── Header ── */}
      <div style={{ paddingTop: "env(safe-area-inset-top, 44px)", paddingLeft: 20, paddingRight: 20, paddingBottom: 0, background: "var(--bg, #F5F0E8)" }}>
        <div style={{ paddingTop: 16, paddingBottom: 16, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, fontFamily: "'Lora', Georgia, serif", color: "var(--ink, #2C2416)", letterSpacing: "-0.02em", lineHeight: 1.15 }}>Community</h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--ink-faded, #7A6E5F)", fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: "0.01em" }}>
              {mainTab === "trending" ? "What readers are highlighting right now" : "Book clubs and friends activity"}
            </p>
          </div>
          {/* Bell */}
          <button onClick={() => setShowNotifications(true)} style={{ background: "none", border: "none", padding: "4px", cursor: "pointer", position: "relative", marginTop: 4, WebkitTapHighlightColor: "transparent" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ink, #2C2416)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <div style={{ position: "absolute", top: 2, right: 2, width: 9, height: 9, borderRadius: "50%", background: "var(--accent, #E07C3A)", border: "1.5px solid var(--bg, #F5F0E8)" }} />
            )}
          </button>
        </div>

        {/* Top toggle */}
        <div style={{ display: "flex", gap: 0, background: "var(--surface, #EDE8DF)", borderRadius: 10, padding: 3, marginBottom: 20 }}>
          {["trending", "community"].map((t) => (
            <button key={t} onClick={() => setMainTab(t)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: mainTab === t ? "var(--bg, #F5F0E8)" : "transparent", color: mainTab === t ? "var(--ink, #2C2416)" : "var(--ink-faded, #7A6E5F)", fontSize: 14, fontWeight: mainTab === t ? 600 : 400, fontFamily: "'DM Sans', system-ui, sans-serif", cursor: "pointer", transition: "all 0.15s ease", boxShadow: mainTab === t ? "0 1px 3px rgba(0,0,0,0.10)" : "none", WebkitTapHighlightColor: "transparent", textTransform: "capitalize" }}>
              {t === "trending" ? "Trending" : "Community"}
            </button>
          ))}
        </div>
      </div>

      {/* ── TRENDING ── */}
      {mainTab === "trending" && (
        <div style={{ flex: 1, paddingBottom: 32 }}>
          <MostReadStrip />
          <div style={{ padding: "20px 16px 0" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-faded, #7A6E5F)", fontFamily: "'DM Sans', system-ui, sans-serif", marginBottom: 12 }}>
              Trending passages
            </div>
            {TRENDING_PASSAGES.map((passage) => (
              <PassageCard key={passage.id} passage={passage} />
            ))}
          </div>
        </div>
      )}

      {/* ── COMMUNITY ── */}
      {mainTab === "community" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Inner toggle */}
          <div style={{ paddingLeft: 20, paddingRight: 20 }}>
            <div style={{ display: "flex", gap: 0, background: "var(--surface, #EDE8DF)", borderRadius: 10, padding: 3, marginBottom: 20 }}>
              {["clubs", "friends"].map((t) => (
                <button key={t} onClick={() => setCommunityTab(t)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: communityTab === t ? "var(--bg, #F5F0E8)" : "transparent", color: communityTab === t ? "var(--ink, #2C2416)" : "var(--ink-faded, #7A6E5F)", fontSize: 14, fontWeight: communityTab === t ? 600 : 400, fontFamily: "'DM Sans', system-ui, sans-serif", cursor: "pointer", transition: "all 0.15s ease", boxShadow: communityTab === t ? "0 1px 3px rgba(0,0,0,0.10)" : "none", WebkitTapHighlightColor: "transparent" }}>
                  {t === "clubs" ? "Book Clubs" : "Friends"}
                </button>
              ))}
            </div>
          </div>

          {/* Clubs */}
          {communityTab === "clubs" && (
            <div style={{ flex: 1, padding: "0 16px 32px" }}>
              {joinedClubs.length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-faded, #7A6E5F)", fontFamily: "'DM Sans', system-ui, sans-serif", marginBottom: 10 }}>
                    Your Clubs
                  </div>
                  {joinedClubs.map((club) => (
                    <ClubCard key={club.id} club={club} onJoin={handleJoin} />
                  ))}
                </>
              )}

              {/* Explore button */}
              <button onClick={() => setShowExplore(true)} style={{ width: "100%", padding: "14px 0", marginTop: joinedClubs.length > 0 ? 8 : 0, borderRadius: 14, border: "1.5px dashed var(--ink-faded, #7A6E5F)", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                <span style={{ fontSize: 18, lineHeight: 1, color: "var(--ink-faded, #7A6E5F)" }}>+</span>
                <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', system-ui, sans-serif", color: "var(--ink-faded, #7A6E5F)", letterSpacing: "0.01em" }}>Explore clubs</span>
              </button>

              {joinedClubs.length === 0 && (
                <div style={{ textAlign: "center", padding: "24px 24px 0" }}>
                  <div style={{ fontSize: 14, color: "var(--ink-faded, #7A6E5F)", fontFamily: "'Lora', Georgia, serif", fontStyle: "italic", lineHeight: 1.6 }}>
                    Reading is better together.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Friends */}
          {communityTab === "friends" && (
            <div style={{ flex: 1, padding: "0 16px 32px" }}>
              {FRIENDS_ACTIVITY.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 24px" }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>👥</div>
                  <div style={{ fontSize: 18, fontFamily: "'Lora', Georgia, serif", fontWeight: 600, color: "var(--ink, #2C2416)", marginBottom: 8 }}>No friends yet</div>
                  <div style={{ fontSize: 14, color: "var(--ink-faded, #7A6E5F)", fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1.5 }}>When your friends join BookWorm, their reading activity will appear here.</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-faded, #7A6E5F)", fontFamily: "'DM Sans', system-ui, sans-serif", marginBottom: 2 }}>Recent Activity</div>
                  {FRIENDS_ACTIVITY.map((activity) => (
                    <FriendRow key={activity.id} activity={activity} />
                  ))}
                  <div style={{ marginTop: 28, padding: "18px 16px", background: "var(--surface, #EDE8DF)", borderRadius: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontFamily: "'Lora', Georgia, serif", fontWeight: 600, color: "var(--ink, #2C2416)", marginBottom: 4 }}>Invite a reader</div>
                    <div style={{ fontSize: 13, color: "var(--ink-faded, #7A6E5F)", fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1.45, marginBottom: 14 }}>Reading is better shared. Send someone the link.</div>
                    <button onClick={() => { if (navigator.share) { navigator.share({ title: "BookWorm", text: "Reading, refined. Free books, beautiful reader.", url: "https://bookworm-dpq.pages.dev" }); } }} style={{ padding: "10px 24px", borderRadius: 20, border: "none", background: "var(--accent, #E07C3A)", color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', system-ui, sans-serif", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                      Share BookWorm
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Overlays */}
      {showNotifications && (
        <NotificationDrawer
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onAcceptInvite={handleAcceptInvite}
          onDeclineInvite={handleDeclineInvite}
        />
      )}
      {showExplore && (
        <ExploreSheet
          allClubs={clubs}
          onClose={() => setShowExplore(false)}
          onJoin={(id) => { handleJoin(id); setShowExplore(false); }}
        />
      )}
    </div>
  );
}
