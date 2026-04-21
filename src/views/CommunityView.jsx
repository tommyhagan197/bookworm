import { useState } from "react";

// ── Seed data ──────────────────────────────────────────────────────────────
// Structured exactly as it will arrive from Supabase when the backend lands.
// club.color maps to the generated-cover palette already used in Shelf/Discover.

const CLUBS = [
  {
    id: "c1",
    name: "The Slow Readers",
    description: "One chapter a day. No rushing. No spoilers.",
    currentBook: "Middlemarch",
    author: "George Eliot",
    chapter: "Chapter 12 of 86",
    members: 47,
    color: "#6B5344",   // Walnut
    joined: true,
  },
  {
    id: "c2",
    name: "Classics Collective",
    description: "Public domain only. We read what Amazon doesn't sell.",
    currentBook: "Moby-Dick",
    author: "Herman Melville",
    chapter: "Chapter 3 of 135",
    members: 112,
    color: "#4A6741",   // Moss
    joined: false,
  },
  {
    id: "c3",
    name: "Night Owls",
    description: "Reading after midnight since 2023. Dark mode mandatory.",
    currentBook: "Jane Eyre",
    author: "Charlotte Brontë",
    chapter: "Chapter 19 of 38",
    members: 31,
    color: "#2C4A6B",   // Ink
    joined: false,
  },
  {
    id: "c4",
    name: "Sentence Worshippers",
    description: "We stop to re-read beautiful sentences. Progress is slow. Worth it.",
    currentBook: "The Master & Margarita",
    author: "Mikhail Bulgakov",
    chapter: "Chapter 7 of 32",
    members: 23,
    color: "#7A5C2E",   // Leather
    joined: false,
  },
  {
    id: "c5",
    name: "Gutenberg Brigade",
    description: "If it's free and brilliant, we'll read it together.",
    currentBook: "Walden",
    author: "Henry David Thoreau",
    chapter: "Chapter 2 of 18",
    members: 68,
    color: "#4A6B5C",   // Teal
    joined: false,
  },
];

const FRIENDS_ACTIVITY = [
  {
    id: "f1",
    name: "Maya",
    initials: "M",
    color: "#6B5344",
    action: "finished",
    book: "Middlemarch",
    time: "2 hours ago",
  },
  {
    id: "f2",
    name: "Jordan",
    initials: "J",
    color: "#4A6741",
    action: "started",
    book: "The Brothers Karamazov",
    time: "Yesterday",
  },
  {
    id: "f3",
    name: "Priya",
    initials: "P",
    color: "#7A5C2E",
    action: "reviewed",
    book: "Jane Eyre",
    review: "Probably the best first-person voice in all of 19th century fiction.",
    time: "2 days ago",
  },
  {
    id: "f4",
    name: "Sam",
    initials: "S",
    color: "#2C4A6B",
    action: "finished",
    book: "Moby-Dick",
    time: "3 days ago",
  },
  {
    id: "f5",
    name: "Leila",
    initials: "L",
    color: "#4A6B5C",
    action: "started",
    book: "Siddhartha",
    time: "4 days ago",
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────

function Avatar({ initials, color, size = 36 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: "#F5F0E8",
        fontSize: size * 0.38,
        fontFamily: "'Lora', Georgia, serif",
        fontWeight: 600,
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </div>
  );
}

function ClubCard({ club, onJoin }) {
  const [joining, setJoining] = useState(false);

  function handleJoin() {
    if (club.joined) return;
    setJoining(true);
    setTimeout(() => {
      onJoin(club.id);
      setJoining(false);
    }, 600);
  }

  return (
    <div
      style={{
        background: "var(--surface, #EDE8DF)",
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      {/* Color band */}
      <div
        style={{
          height: 6,
          background: club.color,
          opacity: 0.85,
        }}
      />

      <div style={{ padding: "16px 16px 14px" }}>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 6,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                fontFamily: "'Lora', Georgia, serif",
                color: "var(--ink, #2C2416)",
                letterSpacing: "-0.01em",
                lineHeight: 1.25,
                marginBottom: 2,
              }}
            >
              {club.name}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-faded, #7A6E5F)",
                letterSpacing: "0.02em",
              }}
            >
              {club.members} members
            </div>
          </div>

          {/* Join / Joined button */}
          <button
            onClick={handleJoin}
            style={{
              flexShrink: 0,
              padding: "7px 16px",
              borderRadius: 20,
              border: club.joined
                ? "1.5px solid var(--ink-faded, #7A6E5F)"
                : "none",
              background: club.joined
                ? "transparent"
                : joining
                ? "var(--accent-deep, #C0602A)"
                : "var(--accent, #E07C3A)",
              color: club.joined
                ? "var(--ink-faded, #7A6E5F)"
                : "#fff",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              letterSpacing: "0.01em",
              cursor: club.joined ? "default" : "pointer",
              transition: "background 0.15s ease",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {club.joined ? "Joined" : joining ? "Joining…" : "Join"}
          </button>
        </div>

        {/* Description */}
        <p
          style={{
            margin: "0 0 12px",
            fontSize: 13.5,
            lineHeight: 1.5,
            color: "var(--ink-secondary, #5C5040)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          {club.description}
        </p>

        {/* Current read */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            background: "var(--bg, #F5F0E8)",
            borderRadius: 10,
          }}
        >
          {/* Mini cover */}
          <div
            style={{
              width: 28,
              height: 40,
              borderRadius: 3,
              background: club.color,
              flexShrink: 0,
              opacity: 0.85,
              boxShadow: "1px 1px 4px rgba(0,0,0,0.18)",
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: "var(--ink-faded, #7A6E5F)",
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              Now reading
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'Lora', Georgia, serif",
                color: "var(--ink, #2C2416)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {club.currentBook}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-faded, #7A6E5F)",
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
            >
              {club.chapter}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FriendRow({ activity }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "14px 0",
        borderBottom: "1px solid var(--surface, #EDE8DF)",
      }}
    >
      <Avatar initials={activity.initials} color={activity.color} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.4,
            color: "var(--ink, #2C2416)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          <span style={{ fontWeight: 600 }}>{activity.name}</span>
          {" "}
          <span style={{ color: "var(--ink-secondary, #5C5040)" }}>
            {activity.action}
          </span>
          {" "}
          <span style={{ fontStyle: "italic", fontFamily: "'Lora', Georgia, serif" }}>
            {activity.book}
          </span>
        </div>
        {activity.review && (
          <div
            style={{
              marginTop: 6,
              padding: "8px 12px",
              background: "var(--surface, #EDE8DF)",
              borderRadius: 8,
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--ink-secondary, #5C5040)",
              fontFamily: "'Lora', Georgia, serif",
              fontStyle: "italic",
            }}
          >
            "{activity.review}"
          </div>
        )}
        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            color: "var(--ink-faded, #7A6E5F)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            letterSpacing: "0.02em",
          }}
        >
          {activity.time}
        </div>
      </div>
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────

export default function CommunityView() {
  const [tab, setTab] = useState("clubs");
  const [clubs, setClubs] = useState(CLUBS);

  function handleJoin(clubId) {
    setClubs((prev) =>
      prev.map((c) => (c.id === clubId ? { ...c, joined: true } : c))
    );
  }

  const joinedClubs = clubs.filter((c) => c.joined);
  const browseClubs = clubs.filter((c) => !c.joined);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg, #F5F0E8)",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* Header */}
      <div
        style={{
          paddingTop: "env(safe-area-inset-top, 44px)",
          paddingLeft: 20,
          paddingRight: 20,
          paddingBottom: 0,
          background: "var(--bg, #F5F0E8)",
        }}
      >
        <div
          style={{
            paddingTop: 16,
            paddingBottom: 16,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              fontFamily: "'Lora', Georgia, serif",
              color: "var(--ink, #2C2416)",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
            }}
          >
            Community
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "var(--ink-faded, #7A6E5F)",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              letterSpacing: "0.01em",
            }}
          >
            Book clubs and friends activity
          </p>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            gap: 0,
            background: "var(--surface, #EDE8DF)",
            borderRadius: 10,
            padding: 3,
            marginBottom: 20,
          }}
        >
          {["clubs", "friends"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 8,
                border: "none",
                background: tab === t ? "var(--bg, #F5F0E8)" : "transparent",
                color:
                  tab === t
                    ? "var(--ink, #2C2416)"
                    : "var(--ink-faded, #7A6E5F)",
                fontSize: 14,
                fontWeight: tab === t ? 600 : 400,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow:
                  tab === t ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
                WebkitTapHighlightColor: "transparent",
                textTransform: "capitalize",
              }}
            >
              {t === "clubs" ? "Book Clubs" : "Friends"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "0 16px 32px" }}>
        {tab === "clubs" && (
          <>
            {/* Joined clubs */}
            {joinedClubs.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--ink-faded, #7A6E5F)",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    marginBottom: 10,
                  }}
                >
                  Your Clubs
                </div>
                {joinedClubs.map((club) => (
                  <ClubCard key={club.id} club={club} onJoin={handleJoin} />
                ))}
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--ink-faded, #7A6E5F)",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    marginTop: 20,
                    marginBottom: 10,
                  }}
                >
                  Browse Clubs
                </div>
              </>
            )}

            {browseClubs.length === 0 && joinedClubs.length > 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 0",
                  color: "var(--ink-faded, #7A6E5F)",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: 14,
                }}
              >
                You've joined every club. More coming soon.
              </div>
            )}

            {browseClubs.map((club) => (
              <ClubCard key={club.id} club={club} onJoin={handleJoin} />
            ))}

            {/* Empty state — no clubs at all */}
            {clubs.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 24px",
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 16 }}>📚</div>
                <div
                  style={{
                    fontSize: 18,
                    fontFamily: "'Lora', Georgia, serif",
                    fontWeight: 600,
                    color: "var(--ink, #2C2416)",
                    marginBottom: 8,
                  }}
                >
                  No clubs yet
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "var(--ink-faded, #7A6E5F)",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    lineHeight: 1.5,
                  }}
                >
                  Book clubs are coming soon. You'll be able to read
                  together, assign chapters, and discuss in-line.
                </div>
              </div>
            )}
          </>
        )}

        {tab === "friends" && (
          <>
            {FRIENDS_ACTIVITY.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 24px",
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 16 }}>👥</div>
                <div
                  style={{
                    fontSize: 18,
                    fontFamily: "'Lora', Georgia, serif",
                    fontWeight: 600,
                    color: "var(--ink, #2C2416)",
                    marginBottom: 8,
                  }}
                >
                  No friends yet
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "var(--ink-faded, #7A6E5F)",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    lineHeight: 1.5,
                  }}
                >
                  When your friends join BookWorm, their reading activity
                  will appear here.
                </div>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--ink-faded, #7A6E5F)",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    marginBottom: 2,
                  }}
                >
                  Recent Activity
                </div>
                {FRIENDS_ACTIVITY.map((activity) => (
                  <FriendRow key={activity.id} activity={activity} />
                ))}

                {/* Invite nudge */}
                <div
                  style={{
                    marginTop: 28,
                    padding: "18px 16px",
                    background: "var(--surface, #EDE8DF)",
                    borderRadius: 12,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontFamily: "'Lora', Georgia, serif",
                      fontWeight: 600,
                      color: "var(--ink, #2C2416)",
                      marginBottom: 4,
                    }}
                  >
                    Invite a reader
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--ink-faded, #7A6E5F)",
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      lineHeight: 1.45,
                      marginBottom: 14,
                    }}
                  >
                    Reading is better shared. Send someone the link.
                  </div>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: "BookWorm",
                          text: "Reading, refined. Free books, beautiful reader.",
                          url: "https://bookworm-dpq.pages.dev",
                        });
                      }
                    }}
                    style={{
                      padding: "10px 24px",
                      borderRadius: 20,
                      border: "none",
                      background: "var(--accent, #E07C3A)",
                      color: "#fff",
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      cursor: "pointer",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    Share BookWorm
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
