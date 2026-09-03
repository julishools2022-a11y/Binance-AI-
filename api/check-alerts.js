// api/check-alerts.js
//
// Vercel serverless function, called on a schedule (see vercel.json) and
// also callable manually (GET/POST) for testing or for the demo video.

import { get24hrTicker, getKlines } from "../lib/binanceMcp.js";
import { checkTrigger, averageVolumeFromKlines } from "../lib/triggers.js";
import { explainMove } from "../lib/groq.js";
import { sendAlertEmail } from "../lib/resend.js";
import { logAlert } from "../lib/supabase.js";

const WATCHLIST = (process.env.WATCHLIST || "BTCUSDT,ETHUSDT,SOLUSDT")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const ALERT_EMAIL = process.env.ALERT_EMAIL;

const CONFIG = {
  priceChangeThreshold: parseFloat(process.env.PRICE_CHANGE_THRESHOLD || "3"),
  volumeSpikeMultiplier: parseFloat(process.env.VOLUME_SPIKE_MULTIPLIER || "1.5"),
};

export default async function handler(req, res) {
  const results = [];

  for (const symbol of WATCHLIST) {
    try {
      const ticker = await get24hrTicker(symbol);
      if (!ticker) {
        results.push({ symbol, error: "no ticker data returned" });
        continue;
      }

      // Optional: pull recent klines to get a rolling volume average for
      // the volume-spike check. Skips gracefully if it fails.
      let avgVolume;
      try {
        const klines = await getKlines(symbol, "1h", 24);
        avgVolume = averageVolumeFromKlines(klines);
      } catch (e) {
        console.warn(`Kline fetch failed for ${symbol}:`, e.message);
      }

      const triggers = checkTrigger(ticker, { ...CONFIG, avgVolume });

      for (const trigger of triggers) {
        const explanation = await explainMove(symbol, ticker, trigger.detail);

        await logAlert({
          symbol,
          trigger_type: trigger.type,
          trigger_detail: trigger.detail,
          explanation,
          ticker_snapshot: ticker,
        });

        if (ALERT_EMAIL) {
          await sendAlertEmail({
            to: ALERT_EMAIL,
            symbol,
            triggerDetail: trigger.detail,
            explanation,
          });
        }

        results.push({ symbol, trigger: trigger.type, detail: trigger.detail, explanation });
      }

      if (triggers.length === 0) {
        results.push({ symbol, trigger: null });
      }
    } catch (err) {
      console.error(`Error processing ${symbol}:`, err);
      results.push({ symbol, error: err.message });
    }
  }

  res.status(200).json({ checked_at: new Date().toISOString(), watchlist: WATCHLIST, results });
}
