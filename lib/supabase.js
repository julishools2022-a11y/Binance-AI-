// lib/supabase.js
//
// Logs each triggered alert so the dashboard (and your demo video) has a
// history to show, not just a live "it fired once" moment.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function logAlert({ symbol, trigger_type, trigger_detail, explanation, ticker_snapshot }) {
  const { error } = await supabase.from("agent_alerts").insert({
    symbol,
    trigger_type,
    trigger_detail,
    explanation,
    ticker_snapshot,
  });

  if (error) {
    console.error("Supabase log error:", error);
  }
}

export async function getRecentAlerts(limit = 50) {
  const { data, error } = await supabase
    .from("agent_alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}
