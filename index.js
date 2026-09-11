export const name = 'dsh-cache-precision'

// Adaptive precision: extended just enough that a value below 100% never
// round-displays as 100% (at one base decimal, >= 99.95% shows 2 decimals,
// >= 99.995% shows 3, ...). float64 stays faithful to ~14 significant
// digits, so 12 decimals is the last place a near-100 percentage can be
// told apart from 100.
export const MAX_PERCENT_DIGITS = 12

export function formatPercent(percent, baseDigits = 1) {
  let digits = Math.max(0, Math.min(MAX_PERCENT_DIGITS, baseDigits))
  let text = percent.toFixed(digits)
  while (digits < MAX_PERCENT_DIGITS && percent < 100 && Number(text) >= 100) {
    text = percent.toFixed(++digits)
  }
  return text
}

/**
 * Same prompt-side denominator DSH uses for its integer cache-hit badge:
 * uncached input + cache reads + cache writes.
 */
export function cacheHitPercent(usage) {
  if (!usage || typeof usage !== 'object') return null
  const denominator =
    (Number(usage.uncachedInputTokens) || 0) +
    (Number(usage.cacheReadTokens) || 0) +
    (Number(usage.cacheWriteTokens) || 0)
  if (!(denominator > 0)) return null
  const numerator = Number(usage.cacheReadTokens) || 0
  return formatPercent((numerator / denominator) * 100)
}

export function apply() {
  // Client-only plugin. The host row exists so `dsh plugin add` records this
  // package in the profile bundle roster and the web surface mounts client.js.
}
