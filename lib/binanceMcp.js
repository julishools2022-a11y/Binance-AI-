// lib/binanceMcp.js
//
// Thin wrapper around Binance's Agent OS MCP server (Streamable HTTP transport).
// Docs: https://binance.com/agent-os
//
// Auth: Agent OS issues a token/API key when you register your agent in the
// Binance developer dashboard. Put it in BINANCE_AGENT_OS_TOKEN.

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_URL = process.env.BINANCE_MCP_URL || "https://agent.binance.com/mcp/agentic";

let clientPromise = null;

async function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
        requestInit: {
          headers: {
            Authorization: `Bearer ${process.env.BINANCE_AGENT_OS_TOKEN}`,
          },
        },
      });

      const client = new Client(
        { name: "alert-analysis-agent", version: "1.0.0" },
        { capabilities: {} }
      );

      await client.connect(transport);
      return client;
    })();
  }
  return clientPromise;
}

/**
 * Fetch 24hr rolling ticker stats for a symbol via the Binance MCP tool.
 * Returns the parsed JSON payload (priceChangePercent, volume, lastPrice, etc.)
 */
export async function get24hrTicker(symbol) {
  const client = await getClient();

  const result = await client.callTool({
    name: "spot.ticker24hr",
    arguments: { symbol },
  });

  const textBlock = result.content?.find((c) => c.type === "text");
  if (!textBlock) return null;

  try {
    return JSON.parse(textBlock.text);
  } catch {
    // Some tool responses may already be structured — fall back to raw text.
    return textBlock.text;
  }
}

/**
 * Optional: fetch recent klines for volume-average calculations.
 * interval e.g. "1h", limit e.g. 24 for a rolling 24h average.
 */
export async function getKlines(symbol, interval = "1h", limit = 24) {
  const client = await getClient();

  const result = await client.callTool({
    name: "spot.klines",
    arguments: { symbol, interval, limit },
  });

  const textBlock = result.content?.find((c) => c.type === "text");
  if (!textBlock) return [];

  try {
    return JSON.parse(textBlock.text);
  } catch {
    return [];
  }
}
