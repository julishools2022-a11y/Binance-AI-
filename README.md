# Alert & Analysis Agent

**Binance Agent OS Mini Hackathon — Track A (Data & Analysis)**

## What it does

Most price alerts just throw numbers at you. This one explains them.

This agent watches live Binance market data for BTC, ETH, and SOL. When a
coin makes a meaningful move — a real price swing or a volume spike — it
doesn't just flag it. It asks an LLM (Groq) to write a short, plain-language
explanation of what's actually happening, so the alert is something you can
understand at a glance, not just react to.

Every alert gets logged with full history in Supabase, there's a live
dashboard (styled around Binance's own black-and-yellow look) showing recent
alerts as they come in, and when a trigger fires it also emails the
explanation directly — no need to keep checking a screen.

```
Vercel Cron (daily)
  → api/check-alerts.js
    → lib/binanceMcp.js   (Binance public REST API: 24hr ticker, klines)
    → lib/triggers.js     (rule check: % move, volume spike)
    → lib/groq.js         (LLM explains the trigger)
    → lib/supabase.js     (log for history / dashboard)
    → lib/resend.js       (email the alert)

index.html               (live dashboard, reads alert history directly from Supabase)
```

## A note on the name

The file is still called `binanceMcp.js` for historical reasons, but it no
longer talks to Binance's Agent OS MCP server directly. That server requires
an interactive OAuth login for every client — which works fine for an app
like Claude or ChatGPT where a person is there to click "Approve," but not
for an unattended daily cron job with nobody watching. So this agent instead
calls Binance's public REST API, which serves the same market data with zero
authentication required. The "agent" part of this project is the reasoning
layer on top — deciding when something's worth flagging, and explaining it —
not the raw data fetch.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `GROQ_API_KEY`
   - `RESEND_API_KEY` + `ALERT_FROM_EMAIL` + `ALERT_EMAIL`
   - `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
   - `WATCHLIST`, `PRICE_CHANGE_THRESHOLD`, `VOLUME_SPIKE_MULTIPLIER`
3. Run `supabase/schema.sql` against your Supabase project (SQL editor or CLI) —
   this creates the `agent_alerts` table and a public read-only policy so the
   dashboard can display it.
4. Deploy to Vercel. Set `vercel.json`'s `regions` to somewhere Binance
   doesn't geo-block (this project uses `cpt1`, Cape Town) — Binance restricts
   API access from the US, UK, EEA, Hong Kong, and Singapore, and Vercel's
   default region is US-based.
5. The cron in `vercel.json` runs once daily (Vercel's Hobby plan limit). You
   can also trigger a check anytime by visiting `/api/check-alerts` directly.
6. Visit the root URL to see the live dashboard.

## Tuning

- `WATCHLIST` — comma-separated symbols, e.g. `BTCUSDT,ETHUSDT,SOLUSDT`
- `PRICE_CHANGE_THRESHOLD` — percent move (24h) that triggers an alert
- `VOLUME_SPIKE_MULTIPLIER` — how far above the rolling 24h average volume counts as a spike

## Built entirely on a phone

No laptop, no terminal, for any of this. The code was written and reviewed
here, then moved to GitHub through its mobile web upload, deployed through
Vercel's mobile site, and wired up to Supabase the same way. Debugging a
geo-blocked serverless region and a deprecated LLM model — from a phone
browser, reading logs on a small screen — was its own kind of challenge, but
it's a real, working agent end to end.

## Possible next steps

- WhatsApp delivery alongside email
- Per-symbol custom thresholds instead of one global config
- Pulling in real news context (e.g. via a web-search-capable model) so
  explanations reference actual events, not just price math
  
