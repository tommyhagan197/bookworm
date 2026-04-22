// trackEvent.js
// Lightweight event logger. Import and call anywhere in the app.
// Falls back silently on error — never blocks the user.
//
// Usage:
//   import { trackEvent } from './trackEvent';
//   trackEvent('tab_switch', { tab: 'library' });
//   trackEvent('book_added', { title: 'Middlemarch', source: 'gutenberg' });
//   trackEvent('reading_session_start', { book_id: '...' });

import { supabase } from './supabase';

export async function trackEvent(eventName, properties = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Don't track unauthenticated events

    await supabase.from('events').insert({
      user_id: user.id,
      event_name: eventName,
      properties,
    });
  } catch {
    // Silent fail — analytics should never break the app
  }
}
