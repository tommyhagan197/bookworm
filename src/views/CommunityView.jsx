import { useState } from 'react';

const CLUBS = [
  {
    name: 'Sunday Classics', dotColor: '#e07c3a', members: 8, week: 3, totalWeeks: 4,
    book: { title: 'Meditations', author: 'Marcus Aurelius', coverClass: 'color-4', dueDay: 'Sunday', daysLeft: 3, yourPct: 68 },
    progress: [
      { initials: 'SR', name: 'Sarah R.', bg: '#c4a265', pct: 100, done: true },
      { initials: 'JM', name: 'James M.', bg: '#e07c3a', pct: 82 },
      { initials: 'You', name: 'You', bg: '#8b7dd8', pct: 68, isYou: true },
      { initials: 'LP', name: 'Lena P.', bg: '#e58c4a', pct: 45 },
    ],
    extraMembers: 4,
    nextBook: { title: 'The Brothers Karamazov', author: 'Dostoevsky', startDate: 'Apr 28', coverClass: 'color-1' },
    stats: { booksRead: 12, activeMembers: 8, months: 6 },
    streak: 11, booksDone: 4,
    streakDays: ['M','T','W','T','F','S','S'], streakRead: [true,true,true,true,true,false,false], streakToday: 4,
    discussion: [
      { initials: 'SR', bg: '#c4a265', name: 'Sarah R.', loc: 'Book IV', text: '"You have power over your mind, not outside events." — this one sat with me for a long time.' },
      { initials: 'JM', bg: '#e07c3a', name: 'James M.', loc: 'Book VI', text: "The repetition is intentional. He's writing to himself. That changes how you read it." },
      { initials: 'You', bg: '#8b7dd8', name: 'You', loc: 'Book III', text: 'Just hit the passage about impermanence. Feels more urgent in 2025 than it probably did then.' },
    ]
  },
  {
    name: 'Sci-Fi Fridays', dotColor: '#6366f1', members: 12, week: 2, totalWeeks: 4,
    book: { title: 'Foundation', author: 'Isaac Asimov', coverClass: 'color-1', dueDay: 'Friday', daysLeft: 2, yourPct: 51 },
    progress: [
      { initials: 'RH', name: 'Rachel H.', bg: '#6366f1', pct: 100, done: true },
      { initials: 'MK', name: 'Mike K.', bg: '#e07c3a', pct: 91 },
      { initials: 'You', name: 'You', bg: '#8b7dd8', pct: 51, isYou: true },
      { initials: 'BN', name: 'Ben N.', bg: '#22c55e', pct: 34 },
    ],
    extraMembers: 8,
    nextBook: { title: 'Foundation and Empire', author: 'Isaac Asimov', startDate: 'May 2', coverClass: 'color-1' },
    stats: { booksRead: 7, activeMembers: 12, months: 3 },
    streak: 7, booksDone: 3,
    streakDays: ['M','T','W','T','F','S','S'], streakRead: [true,true,false,true,true,false,false], streakToday: 4,
    discussion: [
      { initials: 'RH', bg: '#6366f1', name: 'Rachel H.', loc: 'Part II', text: "The Encyclopedists section is slow but once you hit Part II everything clicks. Push through." },
      { initials: 'MK', bg: '#e07c3a', name: 'Mike K.', loc: 'Part III', text: 'Asimov wrote this in 1942. The political structures he invented feel ripped from today.' },
      { initials: 'You', bg: '#8b7dd8', name: 'You', loc: 'Part II', text: 'Just got to the fall of Anacreon. This thing moves fast once it gets going.' },
    ]
  }
];

export default function CommunityView() {
  const [activeIdx, setActiveIdx] = useState(0);
  const club = CLUBS[activeIdx];
  const b = club.book;

  return (
    <div id="community-view" className="view active">
      <div className="view-header">
        <h1>Community</h1>
        <div className="subtitle">Your book clubs</div>
      </div>
      <div className="scroll-content" id="community-scroll">
        <div className="club-tabs-wrap">
          <div className="club-tabs">
            {CLUBS.map((c,i) => (
              <button key={i} className={`club-tab${i === activeIdx ? ' active' : ''}`} onClick={() => setActiveIdx(i)}>
                <span className="club-tab-dot" style={{background: c.dotColor}} />
                {c.name}
                <span className="club-tab-count">{c.members}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="club-reading-card">
          <div className="club-reading-meta">
            <span className="club-reading-week">Week {club.week} of {club.totalWeeks} · {club.members} members reading</span>
            <button className="club-invite-btn">Invite</button>
          </div>
          <div className="club-book-row">
            <div className="club-book-thumb"><div className={`book-cover-art ${b.coverClass}`} /></div>
            <div className="club-book-details">
              <div className="club-book-title">{b.title}</div>
              <div className="club-book-author">{b.author}</div>
              <div className="club-book-due">Due {b.dueDay} · {b.daysLeft} days left</div>
              <div className="club-book-bar-track"><div className="club-book-bar-fill" style={{width:`${b.yourPct}%`}} /></div>
              <div className="club-book-pct">You're {b.yourPct}% through</div>
            </div>
          </div>
        </div>

        <div className="streak-row">
          <div className="streak-stat-card"><div className="streak-value">{club.streak}</div><div className="streak-label">day streak</div></div>
          <div className="streak-stat-card"><div className="streak-value">{club.booksDone}</div><div className="streak-label">books done</div></div>
        </div>

        <div className="streak-days-card">
          <div className="streak-days-label">This week</div>
          <div className="streak-days-row">
            {club.streakDays.map((day,i) => {
              const cls = club.streakRead[i] ? 'read' : i === club.streakToday ? 'today' : '';
              return <div key={i} className="streak-day"><div className={`streak-day-dot${cls ? ' '+cls : ''}`}>{day}</div></div>;
            })}
          </div>
        </div>

        <div className="section-card">
          <div className="section-header">Club Progress</div>
          {club.progress.map((m,i) => (
            <div key={i} className="member-row">
              <div className="member-avatar" style={{background:m.bg}}>{m.initials}</div>
              <div className={`member-name${m.isYou ? ' member-you' : ''}`}>{m.name}</div>
              <div className="member-bar-wrap"><div className="member-bar-fill" style={{width:`${m.pct}%`}} /></div>
              {m.done ? <span className="member-done">Done</span> : <span className="member-pct">{m.pct}%</span>}
            </div>
          ))}
          {club.extraMembers > 0 && (
            <div className="member-more">
              <div className="member-more-avatar">+{club.extraMembers}</div>
              <div className="member-more-text">{club.extraMembers} more members</div>
            </div>
          )}
        </div>

        <div className="next-up-card">
          <div className="next-up-header">Next Up</div>
          <div className="next-up-row">
            <div className="next-up-cover"><div className={`book-cover-art ${club.nextBook.coverClass}`} /></div>
            <div>
              <div className="next-up-title">{club.nextBook.title}</div>
              <div className="next-up-date">Starts {club.nextBook.startDate}</div>
            </div>
          </div>
        </div>

        <div className="section-card" style={{marginBottom:20}}>
          <div className="section-header">Discussion</div>
          {club.discussion.map((d,i) => (
            <div key={i} className="discussion-item">
              <div className="discussion-meta">
                <div className="discussion-avatar" style={{background:d.bg}}>{d.initials}</div>
                <div className="discussion-who">{d.name}</div>
                <div className="discussion-dot" />
                <div className="discussion-where">{d.loc}</div>
              </div>
              <div className="discussion-text">{d.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
