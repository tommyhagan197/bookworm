import { supabase } from "./lib/supabase";

export async function trackEvent(eventName, properties = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("events").insert({
      user_id: user.id,
      event_name: eventName,
      properties,
    });
  } catch {
    // Silent fail
  }
}
