# Alert & Analysis Agent

Binance Agent OS Mini Hackathon — Track A submission.

## What it does

Watches a list of trading pairs through **Binance Agent OS's MCP server**,
detects meaningful price moves or volume spikes, asks an LLM (Groq) to
explain the move in plain language, logs it to Supabase, and emails an
alert via Resend.

```
Vercel Cron (every 15 min)
  → api/check-alerts.js
    → lib/binanceMcp.js   (MCP call: spot.ticker24hr, spot.klines)
    → lib/triggers.js     (rule check: % move, volume spike)
    → lib/groq.js         (LLM explains the trigger)
    → lib/supabase.js     (log for history / dashboard)
    → lib/resend.js       (email the alert)
```

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `BINANCE_AGENT_OS_TOKEN` — from the Binance Agent OS developer dashboard
   - `GROQ_API_KEY`
   - `RESEND_API_KEY` + `ALERT_FROM_EMAIL` + `ALERT_EMAIL`
   - `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
3. Run `supabase/schema.sql` against your Supabase project (SQL editor or CLI).
4. `vercel dev` to test locally, or hit `/api/check-alerts` directly.
5. Deploy: `vercel --prod`. The cron in `vercel.json` runs every 15 minutes automatically.

## Tuning

- `WATCHLIST` — comma-separated symbols, e.g. `BTCUSDT,ETHUSDT,SOLUSDT`
- `PRICE_CHANGE_THRESHOLD` — percent move (24h) that triggers an alert
- `VOLUME_SPIKE_MULTIPLIER` — how far above the rolling 24h average volume counts as a spike

## Next steps (post-MVP)

- [ ] Simple dashboard page reading from `agent_alerts` (reuse Campus Circle's React/Vercel pattern)
- [ ] WhatsApp delivery alongside email (reuse the Cloud API bot pattern)
- [ ] Per-symbol custom thresholds instead of one global config

## Submission checklist

- [ ] Repost the hackathon announcement (Binance + Binance Arabic follow)
- [ ] Record a short demo video (show a triggered alert end-to-end)
- [ ] Push this repo to GitHub, public
- [ ] Reply/quote the original post with video + GitHub link
- [ ] Complete the Binance survey
- [ ] Submit before Sept 8, 2026, 23:59 UTC
