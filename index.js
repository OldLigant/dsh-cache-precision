export const name = 'dsh-cache-precision'

// Adaptive precision: the digit count grows just enough that a value below
// 100% never round-displays as 100% (at one base decimal, >= 99.95% shows
// two decimals, >= 99.995% three, ...). Detail surfaces show exactly one
// more decimal than the rough reading of the same value — a detail should
// always be the more detailed one. float64 stays faithful to ~14
// significant digits, so 12 decimals is the last place a near-100
// percentage can be told apart from 100; there the two meet.
export const MAX_PERCENT_DIGITS = 12

/**
 * Minimum digit count at this base that does not round-display a sub-100
 * value as 100%. Once a value survives at d digits it survives at every
 * higher precision, so adding digits is always safe.
 * @param percent - the ratio in percent.
 * @param baseDigits - the rough reading's decimal places.
 * @returns the rough reading's digit count, capped at MAX_PERCENT_DIGITS.
 */
export function percentDigits(percent, baseDigits = 1) {
  let digits = Math.max(0, Math.min(MAX_PERCENT_DIGITS, baseDigits))
  while (digits < MAX_PERCENT_DIGITS && percent < 100 && Number(percent.toFixed(digits)) >= 100) {
    digits++
  }
  return digits
}

export function formatPercent(percent, baseDigits = 1) {
  return percent.toFixed(percentDigits(percent, baseDigits))
}

/**
 * Detail-surface format: exactly one more decimal than the rough reading of
 * the same value, capped at MAX_PERCENT_DIGITS (where the two meet).
 */
export function formatDetailPercent(percent, baseDigits = 1) {
  return percent.toFixed(Math.min(MAX_PERCENT_DIGITS, percentDigits(percent, baseDigits) + 1))
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
