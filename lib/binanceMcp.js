// lib/binanceMcp.js
//
// Market data client for the Alert & Analysis Agent.
//
// Binance's Agent OS MCP server (agent.binance.com/mcp/agentic) requires an
// interactive OAuth login for every client — fine for apps like Claude or
// ChatGPT where a person is present to approve access, but not workable for
// an unattended cron job with nobody there to click "Approve."
//
// Binance's public REST API serves the exact same market data (no MCP layer)
// with zero authentication required, so this agent calls that directly.
// The function names below are kept the same as the original MCP version so
// the rest of the app (triggers.js, check-alerts.js) didn't need to change.

const BASE_URL = process.env.BINANCE_REST_URL || "https://api.binance.com";

/**
 * Fetch 24hr rolling ticker stats for a symbol.
 * Returns { symbol, priceChangePercent, volume, lastPrice, ... }
 */
export async function get24hrTicker(symbol) {
  const res = await fetch(`${BASE_URL}/api/v3/ticker/24hr?symbol=${symbol}`);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Binance ticker error ${res.status}: ${body}`);
  }

  return res.json();
}

/**
 * Fetch recent klines (candlesticks) for volume-average calculations.
 * interval e.g. "1h", limit e.g. 24 for a rolling 24h average.
 * Returns an array of arrays: [openTime, open, high, low, close, volume, ...]
 */
export async function getKlines(symbol, interval = "1h", limit = 24) {
  const res = await fetch(
    `${BASE_URL}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Binance klines error ${res.status}: ${body}`);
  }

  return res.json();
}
