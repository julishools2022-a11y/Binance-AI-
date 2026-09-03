// lib/triggers.js
//
// Pure functions for deciding whether a ticker snapshot warrants an alert.
// Keeping this separate from the MCP/LLM calls makes it easy to unit test
// and to tune thresholds without touching network code.

/**
 * @param {object} ticker - result of get24hrTicker()
 * @param {object} config
 * @param {number} config.priceChangeThreshold - percent, e.g. 3 for +/-3%
 * @param {number} [config.avgVolume] - optional rolling average volume for comparison
 * @param {number} [config.volumeSpikeMultiplier] - e.g. 1.5 = 50% above average
 * @returns {Array<{type: string, detail: string}>}
 */
export function checkTrigger(ticker, config) {
  const triggers = [];

  const pctChange = parseFloat(ticker.priceChangePercent);
  const volume = parseFloat(ticker.volume);
  const symbol = ticker.symbol;

  if (!Number.isNaN(pctChange) && Math.abs(pctChange) >= config.priceChangeThreshold) {
    const direction = pctChange > 0 ? "up" : "down";
    triggers.push({
      type: "price_move",
      detail: `${symbol} is ${direction} ${Math.abs(pctChange).toFixed(2)}% over the last 24h`,
    });
  }

  if (
    config.avgVolume &&
    config.volumeSpikeMultiplier &&
    !Number.isNaN(volume) &&
    volume >= config.avgVolume * config.volumeSpikeMultiplier
  ) {
    triggers.push({
      type: "volume_spike",
      detail: `${symbol} volume (${volume.toFixed(0)}) is ${(volume / config.avgVolume).toFixed(
        1
      )}x its recent average`,
    });
  }

  return triggers;
}

/**
 * Rolling average volume from an array of klines
 * (Binance kline format: [openTime, open, high, low, close, volume, ...])
 */
export function averageVolumeFromKlines(klines) {
  if (!Array.isArray(klines) || klines.length === 0) return null;
  const volumes = klines.map((k) => parseFloat(k[5])).filter((v) => !Number.isNaN(v));
  if (volumes.length === 0) return null;
  return volumes.reduce((a, b) => a + b, 0) / volumes.length;
}
