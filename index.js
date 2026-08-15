export const name = 'dsh-cache-precision'

/**
 * Same prompt-side denominator DSH uses for its integer cache-hit badge:
 * uncached input + cache reads + cache writes.
 */
export function cacheHitPercent(usage, digits = 3) {
  if (!usage || typeof usage !== 'object') return null
  const denominator =
    (Number(usage.uncachedInputTokens) || 0) +
    (Number(usage.cacheReadTokens) || 0) +
    (Number(usage.cacheWriteTokens) || 0)
  if (!(denominator > 0)) return null
  const numerator = Number(usage.cacheReadTokens) || 0
  return Number((numerator / denominator) * 100).toFixed(Math.max(0, Math.min(6, digits)))
}

export function apply() {
  // Client-only plugin. The host row exists so `dsh plugin add` records this
  // package in the profile bundle roster and the web surface mounts client.js.
}