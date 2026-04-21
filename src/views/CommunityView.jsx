import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { trackEvent } from "./trackEvent";

// ── Seed data for Book Clubs (Supabase backend not yet built) ──────────────
const CLUBS = [
  {
    id: "c1",
    name: "The Slow Readers",
    description: "One chapter a day. No rushing. No spoilers.",
    currentBook: "Middlemarch",
    author: "George Eliot",
    chapter: "Chapter 12 of 86",
    members: 47,
    color: "#6B5344",
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
    color: "#4A6741",
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
    color: "#2C4A6B",
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
    color: "#7A5C2E",
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
    color: "#4A6B5C",
    joined: false,
  },
];

// Deterministic color from username string
function colorFromUsername(username = "") {
  const colors = ["#6B5344", "#4A6741", "#2C4A6B", "#7A5C2E", "#4A6B5C", "#6B4A5C"];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function initials(profile) {
  if (!profile) return "?";
  const name = profile.display_name || profile.username || "";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

// ── Avatar ─────────────────────────────────────────────────────────────────
function Avatar({ profile, size = 36 }) {
  const color = colorFromUsername(profile?.username || "");
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
      {initials(profile)}
    </div>
  );
}

// ── ClubCard ───────────────────────────────────────────────────────────────
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
      <div style={{ height: 6, background: club.color, opacity: 0.85 }} />
      <div style={{ padding: "16px 16px 14px" }}>
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
          <button
            onClick={handleJoin}
            style={{
              flexShrink: 0,
              padding: "7px 16px",
              borderRadius: 20,
              border: club.joined ? "1.5px solid var(--ink-faded, #7A6E5F)" : "none",
              background: club.joined
                ? "transparent"
                : joining
                ? "var(--accent-deep, #C0602A)"
                : "var(--accent, #E07C3A)",
              color: club.joined ? "var(--ink-faded, #7A6E5F)" : "#fff",
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

// ── UserSearchResult ───────────────────────────────────────────────────────
function UserSearchResult({ profile, isFollowing, onFollow, onUnfollow, loading }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderBottom: "1px solid var(--surface, #EDE8DF)",
      }}
    >
      <Avatar profile={profile} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            color: "var(--ink, #2C2416)",
            marginBottom: 1,
          }}
        >
          {profile.display_name || profile.username}
        </div>
        {profile.display_name && (
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-faded, #7A6E5F)",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            @{profile.username}
          </div>
        )}
      </div>
      <button
        onClick={() => isFollowing ? onUnfollow(profile.id) : onFollow(profile.id)}
        disabled={loading}
        style={{
          flexShrink: 0,
          padding: "7px 16px",
          borderRadius: 20,
          border: isFollowing ? "1.5px solid var(--ink-faded, #7A6E5F)" : "none",
          background: isFollowing ? "transparent" : "var(--accent, #E07C3A)",
          color: isFollowing ? "var(--ink-faded, #7A6E5F)" : "#fff",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "'DM Sans', system-ui, sans-serif",
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.6 : 1,
          transition: "all 0.15s ease",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {loading ? "…" : isFollowing ? "Following" : "Follow"}
      </button>
    </div>
  );
}

// ── FriendsTab ─────────────────────────────────────────────────────────────
function FriendsTab() {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [followingProfiles, setFollowingProfiles] = useState([]);
  const [loadingFollow, setLoadingFollow] = useState({}); // { [profileId]: bool }
  const [searching, setSearching] = useState(false);
  const [view, setView] = useState("feed"); // "feed" | "search"

  // Load current user + their follows on mount
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

      // Get IDs of everyone this user follows
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (follows && follows.length > 0) {
        const ids = follows.map((f) => f.following_id);
        setFollowingIds(new Set(ids));

        // Fetch their profiles
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, display_name")
          .in("id", ids);

        setFollowingProfiles(profiles || []);
      }
    }
    load();
  }, []);

  // Search profiles by username
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .ilike("username", `%${searchQuery.trim()}%`)
        .neq("id", currentUser?.id || "")
        .limit(10);

      setSearchResults(data || []);
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUser]);

  async function handleFollow(profileId) {
    if (!currentUser) return;
    setLoadingFollow((prev) => ({ ...prev, [profileId]: true }));

    const { error } = await supabase.from("follows").insert({
      follower_id: currentUser.id,
      following_id: profileId,
    });

    if (!error) {
      setFollowingIds((prev) => new Set([...prev, profileId]));
      trackEvent("follow_user", { following_id: profileId });

      // Add to following profiles list
      const profile = searchResults.find((p) => p.id === profileId);
      if (profile) {
        setFollowingProfiles((prev) => [...prev, profile]);
      }
    }

    setLoadingFollow((prev) => ({ ...prev, [profileId]: false }));
  }

  async function handleUnfollow(profileId) {
    if (!currentUser) return;
    setLoadingFollow((prev) => ({ ...prev, [profileId]: true }));

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", currentUser.id)
      .eq("following_id", profileId);

    if (!error) {
      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(profileId);
        return next;
      });
      setFollowingProfiles((prev) => prev.filter((p) => p.id !== profileId));
      trackEvent("unfollow_user", { unfollowed_id: profileId });
    }

    setLoadingFollow((prev) => ({ ...prev, [profileId]: false }));
  }

  const showSearch = searchQuery.length > 0;

  return (
    <div>
      {/* Search bar */}
      <div
        style={{
          position: "relative",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--ink-faded, #7A6E5F)",
            pointerEvents: "none",
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          🔍
        </div>
        <input
          type="text"
          placeholder="Find readers by username…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "11px 12px 11px 36px",
            borderRadius: 12,
            border: "none",
            background: "var(--surface, #EDE8DF)",
            fontSize: 14,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            color: "var(--ink, #2C2416)",
            outline: "none",
            WebkitAppearance: "none",
          }}
        />
        {searchQuery.length > 0 && (
          <button
            onClick={() => setSearchQuery("")}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--ink-faded, #7A6E5F)",
              fontSize: 18,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Search results */}
      {showSearch && (
        <>
          {searching ? (
            <div
              style={{
                textAlign: "center",
                padding: "24px 0",
                color: "var(--ink-faded, #7A6E5F)",
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 14,
              }}
            >
              Searching…
            </div>
          ) : searchResults.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "24px 0",
                color: "var(--ink-faded, #7A6E5F)",
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 14,
              }}
            >
              No readers found for "{searchQuery}"
            </div>
          ) : (
            searchResults.map((profile) => (
              <UserSearchResult
                key={profile.id}
                profile={profile}
                isFollowing={followingIds.has(profile.id)}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
                loading={!!loadingFollow[profile.id]}
              />
            ))
          )}
        </>
      )}

      {/* Following list / feed */}
      {!showSearch && (
        <>
          {followingProfiles.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 24px",
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
                Find your first reader
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "var(--ink-faded, #7A6E5F)",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  lineHeight: 1.5,
                }}
              >
                Search for readers above and follow them to see their reading activity here.
              </div>
            </div>
          ) : (
            <>
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
                Following · {followingProfiles.length}
              </div>
              {followingProfiles.map((profile) => (
                <div
                  key={profile.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 0",
                    borderBottom: "1px solid var(--surface, #EDE8DF)",
                  }}
                >
                  <Avatar profile={profile} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                        color: "var(--ink, #2C2416)",
                      }}
                    >
                      {profile.display_name || profile.username}
                    </div>
                    {profile.display_name && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--ink-faded, #7A6E5F)",
                          fontFamily: "'DM Sans', system-ui, sans-serif",
                        }}
                      >
                        @{profile.username}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleUnfollow(profile.id)}
                    disabled={!!loadingFollow[profile.id]}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      border: "1.5px solid var(--ink-faded, #7A6E5F)",
                      background: "transparent",
                      color: "var(--ink-faded, #7A6E5F)",
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      cursor: "pointer",
                      opacity: loadingFollow[profile.id] ? 0.5 : 1,
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    {loadingFollow[profile.id] ? "…" : "Following"}
                  </button>
                </div>
              ))}
            </>
          )}

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
        </>
      )}
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────
export default function CommunityView() {
  const [tab, setTab] = useState("clubs");
  const [clubs, setClubs] = useState(CLUBS);

  function handleTabSwitch(t) {
    setTab(t);
    trackEvent("community_tab_switch", { tab: t });
  }

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
        <div style={{ paddingTop: 16, paddingBottom: 16 }}>
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
              onClick={() => handleTabSwitch(t)}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 8,
                border: "none",
                background: tab === t ? "var(--bg, #F5F0E8)" : "transparent",
                color: tab === t ? "var(--ink, #2C2416)" : "var(--ink-faded, #7A6E5F)",
                fontSize: 14,
                fontWeight: tab === t ? 600 : 400,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
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

            {clubs.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 24px" }}>
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
                  Book clubs are coming soon. You'll be able to read together,
                  assign chapters, and discuss in-line.
                </div>
              </div>
            )}
          </>
        )}

        {tab === "friends" && <FriendsTab />}
      </div>
    </div>
  );
}
