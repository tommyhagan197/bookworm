import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

function colorFromName(name = "") {
  const colors = ["#6B5344","#4A6741","#2C4A6B","#7A5C2E","#4A6B5C","#6B4A5C"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function initials(name = "") {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

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
  const [l1, l2] = splitTitle(title);

  if (!cd) {
    return (
      <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs><linearGradient id={`ug_${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6B5344"/><stop offset="100%" stopColor="#6B534499"/></linearGradient></defs>
        <rect width="200" height="280" fill={`url(#ug_${uid})`}/>
        <rect width="200" height="4" fill="rgba(255,255,255,0.25)"/>
        <text x="16" y="160" fontFamily="Georgia,serif" fontSize="22" fill="white" fontWeight="bold">{l1}</text>
        {l2 && <text x="16" y="184" fontFamily="Georgia,serif" fontSize="22" fill="white" fontWeight="bold">{l2}</text>}
        <text x="16" y="210" fontFamily="Georgia,serif" fontSize="11" fill="rgba(255,255,255,0.7)">{author}</text>
      </svg>
    );
  }

  const PALETTE = [
    { id:"walnut",color:"#6B5344",dark:"#3D2B1F"},{id:"ink",color:"#2E3F5C",dark:"#1A2537"},
    {id:"moss",color:"#3A6B4A",dark:"#1E3D2A"},{id:"foxglove",color:"#8B3A62",dark:"#4D1F37"},
    {id:"mustard",color:"#8B7A35",dark:"#4D4219"},{id:"teal",color:"#2E7B7A",dark:"#1A4544"},
    {id:"espresso",color:"#3D2B1F",dark:"#1E1208"},{id:"ember",color:"#E07C3A",dark:"#A04E1A"},
    {id:"forest",color:"#1E3D2A",dark:"#0D1F14"},{id:"dusk",color:"#4D3A6B",dark:"#2A1F3D"},
    {id:"sand",color:"#C4936A",dark:"#8B5E3A"},{id:"cream",color:"#D4C09A",dark:"#A08B5A"},
  ];
  const pc = id => PALETTE.find(p => p.id === id) || PALETTE[0];
  const colors = (cd.colors || ["walnut"]).map(pc);
  const c0 = colors[0] || pc("walnut");
  const tp = cd.titlePos || "lower";
  const showAuthor = cd.showAuthor !== false;
  const ty = tp === "top" ? 60 : tp === "middle" ? 110 : 160;

  return (
    <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs><linearGradient id={`utg_${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={c0.color}/><stop offset="100%" stopColor={c0.dark}/></linearGradient></defs>
      <rect width="200" height="280" fill={`url(#utg_${uid})`}/>
      <rect width="200" height="4" fill="rgba(255,255,255,0.25)"/>
      <text x="16" y={ty} fontFamily="Georgia,serif" fontSize="22" fill="white" fontWeight="bold">{l1}</text>
      {l2 && <text x="16" y={ty+24} fontFamily="Georgia,serif" fontSize="22" fill="white" fontWeight="bold">{l2}</text>}
      {showAuthor && <text x="16" y={ty+44} fontFamily="Georgia,serif" fontSize="11" fill="rgba(255,255,255,0.75)">{author}</text>}
    </svg>
  );
}

export default function UserProfileView({ userId, currentUserId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [works, setWorks] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followList, setFollowList] = useState(null); // { type: "followers"|"following", users: [] }

  useEffect(() => {
    if (!userId) return;
    async function load() {
      const [
        { data: prof },
        { count: followers },
        { count: following },
        { data: worksData },
        { data: followRow },
      ] = await Promise.all([
        supabase.from("profiles").select("id, display_name, bio, avatar_url").eq("id", userId).single(),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
        supabase.from("works").select("*").eq("author_id", userId).order("created_at", { ascending: false }),
        supabase.from("follows").select("follower_id").eq("follower_id", currentUserId).eq("following_id", userId).maybeSingle(),
      ]);
      setProfile(prof);
      setFollowerCount(followers ?? 0);
      setFollowingCount(following ?? 0);
      setWorks(worksData || []);
      setIsFollowing(!!followRow);
      setLoading(false);
    }
    load();
  }, [userId, currentUserId]);

  async function openFollowList(type) {
    let ids = [];
    if (type === "followers") {
      const { data } = await supabase.from("follows").select("follower_id").eq("following_id", userId);
      ids = (data || []).map(r => r.follower_id);
    } else {
      const { data } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
      ids = (data || []).map(r => r.following_id);
    }
    if (ids.length === 0) { setFollowList({ type, users: [] }); return; }
    const { data: users } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids);
    setFollowList({ type, users: users || [] });
  }

  async function handleFollow() {
    if (!currentUserId || followLoading) return;
    setFollowLoading(true);
    if (isFollowing) {
      const { error } = await supabase.from("follows").delete()
        .eq("follower_id", currentUserId).eq("following_id", userId);
      if (!error) {
        setIsFollowing(false);
        setFollowerCount(c => c - 1);
      }
    } else {
      const { error } = await supabase.from("follows").insert({ follower_id: currentUserId, following_id: userId });
      if (!error) {
        setIsFollowing(true);
        setFollowerCount(c => c + 1);
      }
    }
    setFollowLoading(false);
  }

  const displayName = profile?.display_name || "Reader";
  const avatarColor = colorFromName(displayName);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "var(--bg)", zIndex: 200,
      display: "flex", flexDirection: "column", overflowY: "auto",
      WebkitOverflowScrolling: "touch",
    }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", padding: "56px 16px 12px",
        borderBottom: "1px solid var(--border)", flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "none", border: "none", color: "var(--accent)",
            fontSize: 15, fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer", padding: "4px 0", WebkitTapHighlightColor: "transparent",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Community
        </button>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
          Loading…
        </div>
      ) : (
        <div style={{ padding: "20px 20px 48px" }}>
          {/* Avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", background: avatarColor,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              overflow: "hidden",
            }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontFamily: "Georgia, serif", fontSize: 26, color: "#fff", fontWeight: "normal" }}>{initials(displayName)}</span>
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: "var(--text)", lineHeight: 1.2 }}>{displayName}</div>
              {profile?.bio && (
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.4 }}>{profile.bio}</div>
              )}
            </div>
          </div>

          {/* Stats bar */}
          <div style={{ display: "flex", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "14px 0", marginBottom: 16 }}>
            {[
              { value: String(works.length), label: "Works", onClick: null },
              { value: String(followerCount), label: "Followers", onClick: () => openFollowList("followers") },
              { value: String(followingCount), label: "Following", onClick: () => openFollowList("following") },
            ].map(({ value, label, onClick }, i) => (
              <div key={label} onClick={onClick} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid var(--border)" : "none", cursor: onClick ? "pointer" : "default" }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: "var(--text)" }}>{value}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Follow button */}
          <div style={{ marginBottom: 28 }}>
            <button
              onClick={handleFollow}
              disabled={followLoading}
              style={{
                width: "100%", padding: 13,
                background: isFollowing ? "none" : "var(--accent)",
                border: isFollowing ? "1.5px solid var(--border-2)" : "none",
                borderRadius: 12, color: isFollowing ? "var(--text)" : "#fff",
                fontSize: 15, fontWeight: 500, cursor: followLoading ? "default" : "pointer",
                fontFamily: "'DM Sans', sans-serif", opacity: followLoading ? 0.6 : 1,
                WebkitTapHighlightColor: "transparent", letterSpacing: "0.01em",
              }}
            >
              {followLoading ? "…" : isFollowing ? "Following" : "Follow"}
            </button>
          </div>

          {/* Works */}
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-ghost)", marginBottom: 16 }}>Works</div>

          {works.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
              Nothing published yet.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, maxWidth: 500 }}>
              {works.map(work => (
                <div key={work.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ aspectRatio: "200/280", borderRadius: 8, overflow: "hidden", background: "var(--surface)" }}>
                    <WorkCover work={work} />
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, lineHeight: 1.3 }}>{work.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {new Date(work.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Followers / Following list sheet */}
      {followList && (
        <>
          <div onClick={() => setFollowList(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300 }} />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 301,
            background: "var(--bg)", borderRadius: "20px 20px 0 0",
            maxHeight: "70vh", display: "flex", flexDirection: "column",
            paddingBottom: "env(safe-area-inset-bottom, 24px)",
            boxShadow: "0 -4px 32px rgba(0,0,0,0.2)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border)", position: "absolute", left: "50%", top: 10, transform: "translateX(-50%)" }} />
              <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: "var(--text)", textTransform: "capitalize" }}>{followList.type}</div>
              <button onClick={() => setFollowList(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 22, cursor: "pointer", padding: 0, lineHeight: 1, WebkitTapHighlightColor: "transparent" }}>×</button>
            </div>
            <div style={{ overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "0 20px" }}>
              {followList.users.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
                  No {followList.type} yet.
                </div>
              ) : followList.users.map(u => {
                const name = u.display_name || "Reader";
                const bg = colorFromName(name);
                const ini = name.slice(0, 2).toUpperCase();
                return (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: bg, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#fff" }}>{ini}</span>
                      }
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
