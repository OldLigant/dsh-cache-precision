import test from 'node:test'
import assert from 'node:assert/strict'
import { cacheHitPercent, formatPercent, MAX_PERCENT_DIGITS } from '../index.js'

test('defaults to two decimals', () => {
  const usage = { uncachedInputTokens: 1000, cacheReadTokens: 123, cacheWriteTokens: 0 }
  assert.equal(cacheHitPercent(usage), (123 / 1123 * 100).toFixed(2))
})

test('includes cache-write tokens in the denominator like DSH', () => {
  const usage = { uncachedInputTokens: 100, cacheReadTokens: 100, cacheWriteTokens: 800 }
  assert.equal(cacheHitPercent(usage), '10.00')
})

test('returns null when no input was billed', () => {
  assert.equal(cacheHitPercent(null), null)
  assert.equal(cacheHitPercent({}), null)
  assert.equal(cacheHitPercent({ uncachedInputTokens: 0, cacheReadTokens: 0 }), null)
})

test('extends to three decimals once two would round up to 100%', () => {
  // 99.9955% shows as "100.00%" at two decimals, so a third is added.
  const usage = { uncachedInputTokens: 9, cacheReadTokens: 199991, cacheWriteTokens: 0 }
  assert.equal(cacheHitPercent(usage), '99.996')
})

test('keeps extending one digit at a time below 100%', () => {
  // 99.99997% still rounds to 100.00% at two decimals; five digits resolve it.
  const usage = { uncachedInputTokens: 30, cacheReadTokens: 99999970, cacheWriteTokens: 0 }
  assert.equal(cacheHitPercent(usage), '99.99997')
})

test('stays within the supported precision for very high hit rates', () => {
  // 99.9999999995% needs ten decimals, under the float64-faithful cap.
  const usage = { uncachedInputTokens: 5, cacheReadTokens: 999999999995, cacheWriteTokens: 0 }
  assert.equal(cacheHitPercent(usage), '99.9999999995')
  assert.equal(MAX_PERCENT_DIGITS, 12)
})

test('true 100% keeps the default two decimals', () => {
  const usage = { uncachedInputTokens: 0, cacheReadTokens: 500, cacheWriteTokens: 0 }
  assert.equal(cacheHitPercent(usage), '100.00')
})

test('far-below-100 values stay compact', () => {
  const usage = { uncachedInputTokens: 3, cacheReadTokens: 1, cacheWriteTokens: 0 }
  assert.equal(cacheHitPercent(usage), '25.00')
})

test('formatPercent never round-displays a sub-100 value as 100%', () => {
  for (let miss = 1; miss <= 40; miss++) {
    const percent = (1 - miss / 1e6) * 100
    const text = formatPercent(percent)
    assert.equal(Number(text) < 100, true, `${percent} displayed as ${text}%`)
  }
})
