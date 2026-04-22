import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

function colorFromUsername(username = "") {
  const colors = ["#6B5344","#4A6741","#2C4A6B","#7A5C2E","#4A6B5C","#6B4A5C"];
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function initials(profile) {
  const name = profile?.display_name || profile?.username || "";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

function Avatar({ profile, size = 36 }) {
  const color = colorFromUsername(profile?.username || "");
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%", background:color,
      display:"flex", alignItems:"center", justifyContent:"center",
      flexShrink:0, color:"#F5F0E8", fontSize:size * 0.38,
      fontFamily:"'Lora', Georgia, serif", fontWeight:600, letterSpacing:"0.02em",
    }}>
      {initials(profile)}
    </div>
  );
}

function UserSearchResult({ profile, isFollowing, onFollow, onUnfollow, loading }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:12, padding:"12px 0",
      borderBottom:"1px solid rgba(139,111,71,0.1)",
    }}>
      <Avatar profile={profile} size={40}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:15, fontWeight:600, fontFamily:"'DM Sans', sans-serif", color:"var(--text)", marginBottom:1 }}>
          {profile.display_name || profile.username}
        </div>
        {profile.display_name && (
          <div style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"'DM Sans', sans-serif" }}>
            @{profile.username}
          </div>
        )}
      </div>
      <button
        onClick={() => isFollowing ? onUnfollow(profile.id) : onFollow(profile.id)}
        disabled={loading}
        style={{
          flexShrink:0, padding:"7px 16px", borderRadius:20,
          border: isFollowing ? "1.5px solid rgba(139,111,71,0.3)" : "none",
          background: isFollowing ? "transparent" : "var(--accent)",
          color: isFollowing ? "var(--text-muted)" : "#fff",
          fontSize:13, fontWeight:600, fontFamily:"'DM Sans', sans-serif",
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.6 : 1, transition:"all 0.15s",
          WebkitTapHighlightColor:"transparent",
        }}
      >
        {loading ? "…" : isFollowing ? "Following" : "Follow"}
      </button>
    </div>
  );
}

function FriendsTab() {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [followingProfiles, setFollowingProfiles] = useState([]);
  const [loadingFollow, setLoadingFollow] = useState({});
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);
      const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
      if (follows?.length > 0) {
        const ids = follows.map(f => f.following_id);
        setFollowingIds(new Set(ids));
        const { data: profiles } = await supabase.from("profiles").select("id, username, display_name").in("id", ids);
        setFollowingProfiles(profiles || []);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setSearching(false); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase.from("profiles").select("id, username, display_name")
        .ilike("username", `%${searchQuery.trim()}%`).neq("id", currentUser?.id || "").limit(10);
      setSearchResults(data || []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentUser]);

  async function handleFollow(profileId) {
    if (!currentUser) return;
    setLoadingFollow(p => ({ ...p, [profileId]: true }));
    const { error } = await supabase.from("follows").insert({ follower_id: currentUser.id, following_id: profileId });
    if (!error) {
      setFollowingIds(p => new Set([...p, profileId]));
      const profile = searchResults.find(p => p.id === profileId);
      if (profile) setFollowingProfiles(p => [...p, profile]);
    }
    setLoadingFollow(p => ({ ...p, [profileId]: false }));
  }

  async function handleUnfollow(profileId) {
    if (!currentUser) return;
    setLoadingFollow(p => ({ ...p, [profileId]: true }));
    const { error } = await supabase.from("follows").delete().eq("follower_id", currentUser.id).eq("following_id", profileId);
    if (!error) {
      setFollowingIds(p => { const n = new Set(p); n.delete(profileId); return n; });
      setFollowingProfiles(p => p.filter(x => x.id !== profileId));
    }
    setLoadingFollow(p => ({ ...p, [profileId]: false }));
  }

  const showSearch = searchQuery.length > 0;

  return (
    <div>
      <div style={{ position:"relative", marginBottom:20 }}>
        <svg style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)", pointerEvents:"none" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input
          type="text" placeholder="Find readers by username…" value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width:"100%", boxSizing:"border-box", padding:"11px 12px 11px 36px",
            borderRadius:12, border:"1px solid rgba(139,111,71,0.2)",
            background:"var(--surface)", fontSize:14,
            fontFamily:"'DM Sans', sans-serif", color:"var(--text)", outline:"none", WebkitAppearance:"none",
          }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", fontSize:18, padding:4 }}>×</button>
        )}
      </div>

      {showSearch && (
        <>
          {searching ? (
            <div style={{ textAlign:"center", padding:"24px 0", color:"var(--text-muted)", fontFamily:"'DM Sans', sans-serif", fontSize:14 }}>Searching…</div>
          ) : searchResults.length === 0 ? (
            <div style={{ textAlign:"center", padding:"24px 0", color:"var(--text-muted)", fontFamily:"'DM Sans', sans-serif", fontSize:14 }}>No readers found for "{searchQuery}"</div>
          ) : searchResults.map(profile => (
            <UserSearchResult key={profile.id} profile={profile} isFollowing={followingIds.has(profile.id)}
              onFollow={handleFollow} onUnfollow={handleUnfollow} loading={!!loadingFollow[profile.id]}/>
          ))}
        </>
      )}

      {!showSearch && (
        <>
          {followingProfiles.length === 0 ? (
            <div style={{ textAlign:"center", padding:"48px 24px" }}>
              <div style={{ width:56, height:56, borderRadius:14, background:"var(--surface)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", border:"1px solid rgba(139,111,71,0.15)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
              </div>
              <div style={{ fontSize:17, fontFamily:"'Lora', Georgia, serif", fontWeight:600, color:"var(--text)", marginBottom:8 }}>Find your first reader</div>
              <div style={{ fontSize:14, color:"var(--text-muted)", fontFamily:"'DM Sans', sans-serif", lineHeight:1.5 }}>Search for readers above and follow them to see their reading activity here.</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'DM Sans', sans-serif", marginBottom:8 }}>
                Following · {followingProfiles.length}
              </div>
              {followingProfiles.map(profile => (
                <div key={profile.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:"1px solid rgba(139,111,71,0.1)" }}>
                  <Avatar profile={profile} size={38}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:15, fontWeight:600, fontFamily:"'DM Sans', sans-serif", color:"var(--text)" }}>{profile.display_name || profile.username}</div>
                    {profile.display_name && <div style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"'DM Sans', sans-serif" }}>@{profile.username}</div>}
                  </div>
                  <button onClick={() => handleUnfollow(profile.id)} disabled={!!loadingFollow[profile.id]} style={{ padding:"6px 14px", borderRadius:20, border:"1.5px solid rgba(139,111,71,0.3)", background:"transparent", color:"var(--text-muted)", fontSize:12, fontWeight:600, fontFamily:"'DM Sans', sans-serif", cursor:"pointer", opacity:loadingFollow[profile.id] ? 0.5 : 1, WebkitTapHighlightColor:"transparent" }}>
                    {loadingFollow[profile.id] ? "…" : "Following"}
                  </button>
                </div>
              ))}
            </>
          )}

          <div style={{ marginTop:28, padding:"18px 16px", background:"var(--surface)", borderRadius:12, textAlign:"center", border:"1px solid rgba(139,111,71,0.1)" }}>
            <div style={{ fontSize:14, fontFamily:"'Lora', Georgia, serif", fontWeight:600, color:"var(--text)", marginBottom:4 }}>Invite a reader</div>
            <div style={{ fontSize:13, color:"var(--text-muted)", fontFamily:"'DM Sans', sans-serif", lineHeight:1.45, marginBottom:14 }}>Reading is better shared. Send someone the link.</div>
            <button onClick={() => navigator.share?.({ title:"BookWorm", text:"Reading, refined. Free books, beautiful reader.", url:"https://bookworm-dpq.pages.dev" })} style={{ padding:"10px 24px", borderRadius:20, border:"none", background:"var(--accent)", color:"#fff", fontSize:14, fontWeight:600, fontFamily:"'DM Sans', sans-serif", cursor:"pointer", WebkitTapHighlightColor:"transparent" }}>
              Share BookWorm
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function BookClubsTab() {
  return (
    <div style={{ padding:"8px 0" }}>
      {/* Coming soon cards */}
      <div style={{ background:"var(--surface)", borderRadius:16, padding:"28px 20px", textAlign:"center", marginBottom:12, border:"1px solid rgba(139,111,71,0.1)" }}>
        <div style={{ width:52, height:52, borderRadius:14, background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", border:"1px solid rgba(139,111,71,0.15)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <div style={{ fontFamily:"'Lora', Georgia, serif", fontSize:18, fontWeight:600, color:"var(--text)", marginBottom:8 }}>Join a Book Club</div>
        <div style={{ fontSize:14, color:"var(--text-muted)", fontFamily:"'DM Sans', sans-serif", lineHeight:1.55, marginBottom:20 }}>
          Read together. Assign chapters. Discuss in-line. Book Clubs are coming soon — real readers, real conversations, anchored to a book.
        </div>
        <div style={{ display:"inline-block", padding:"6px 14px", borderRadius:20, background:"rgba(224,124,58,0.1)", border:"1px solid rgba(224,124,58,0.25)", color:"var(--accent)", fontSize:12, fontWeight:600, fontFamily:"'DM Sans', sans-serif", letterSpacing:"0.04em" }}>
          Coming soon
        </div>
      </div>

      <div style={{ background:"var(--surface)", borderRadius:16, padding:"28px 20px", textAlign:"center", border:"1px solid rgba(139,111,71,0.1)" }}>
        <div style={{ width:52, height:52, borderRadius:14, background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", border:"1px solid rgba(139,111,71,0.15)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
        <div style={{ fontFamily:"'Lora', Georgia, serif", fontSize:18, fontWeight:600, color:"var(--text)", marginBottom:8 }}>Start a Book Club</div>
        <div style={{ fontSize:14, color:"var(--text-muted)", fontFamily:"'DM Sans', sans-serif", lineHeight:1.55, marginBottom:20 }}>
          Pick a book, invite readers, set a pace. Your club, your rules. Launching alongside the full social layer.
        </div>
        <div style={{ display:"inline-block", padding:"6px 14px", borderRadius:20, background:"rgba(224,124,58,0.1)", border:"1px solid rgba(224,124,58,0.25)", color:"var(--accent)", fontSize:12, fontWeight:600, fontFamily:"'DM Sans', sans-serif", letterSpacing:"0.04em" }}>
          Coming soon
        </div>
      </div>
    </div>
  );
}

export default function CommunityView() {
  const [tab, setTab] = useState("clubs");

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", background:"var(--bg)", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
      <div style={{ paddingTop:"env(safe-area-inset-top, 44px)", paddingLeft:20, paddingRight:20, background:"var(--bg)" }}>
        <div style={{ paddingTop:16, paddingBottom:16 }}>
          <h1 style={{ margin:0, fontSize:28, fontWeight:700, fontFamily:"'Lora', Georgia, serif", color:"var(--text)", letterSpacing:"-0.02em", lineHeight:1.15 }}>Community</h1>
          <p style={{ margin:"4px 0 0", fontSize:13, color:"var(--text-muted)", fontFamily:"'DM Sans', sans-serif" }}>Book clubs and friends</p>
        </div>
        <div style={{ display:"flex", background:"var(--surface)", borderRadius:10, padding:3, marginBottom:20, border:"1px solid rgba(139,111,71,0.1)" }}>
          {["clubs","friends"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex:1, padding:"8px 0", borderRadius:8, border:"none",
              background: tab === t ? "var(--bg)" : "transparent",
              color: tab === t ? "var(--text)" : "var(--text-muted)",
              fontSize:14, fontWeight: tab === t ? 600 : 400,
              fontFamily:"'DM Sans', sans-serif", cursor:"pointer",
              transition:"all 0.15s", boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              WebkitTapHighlightColor:"transparent", textTransform:"capitalize",
            }}>
              {t === "clubs" ? "Book Clubs" : "Friends"}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex:1, padding:"0 16px 32px" }}>
        {tab === "clubs" ? <BookClubsTab /> : <FriendsTab />}
      </div>
    </div>
  );
}