import test from 'node:test'
import assert from 'node:assert/strict'
import { cacheHitPercent, formatPercent, MAX_PERCENT_DIGITS } from '../index.js'

test('defaults to one decimal, the rough pill reading', () => {
  const usage = { uncachedInputTokens: 1000, cacheReadTokens: 123, cacheWriteTokens: 0 }
  assert.equal(cacheHitPercent(usage), (123 / 1123 * 100).toFixed(1))
})

test('includes cache-write tokens in the denominator like DSH', () => {
  const usage = { uncachedInputTokens: 100, cacheReadTokens: 100, cacheWriteTokens: 800 }
  assert.equal(cacheHitPercent(usage), '10.0')
})

test('detail dialogs request two decimals through the base digits', () => {
  assert.equal(formatPercent(123 / 1123 * 100, 2), (123 / 1123 * 100).toFixed(2))
  assert.equal(formatPercent(123 / 1123 * 100, 1), (123 / 1123 * 100).toFixed(1))
})

test('returns null when no input was billed', () => {
  assert.equal(cacheHitPercent(null), null)
  assert.equal(cacheHitPercent({}), null)
  assert.equal(cacheHitPercent({ uncachedInputTokens: 0, cacheReadTokens: 0 }), null)
})

test('extends decimals once the base precision would round up to 100%', () => {
  // 99.9955% reads as "100.0%" at one decimal, so more digits are added.
  const usage = { uncachedInputTokens: 9, cacheReadTokens: 199991, cacheWriteTokens: 0 }
  assert.equal(cacheHitPercent(usage), '99.996')
})

test('keeps extending one digit at a time below 100%', () => {
  // 99.99997% still rounds to 100.0% at one decimal; five digits resolve it.
  const usage = { uncachedInputTokens: 30, cacheReadTokens: 99999970, cacheWriteTokens: 0 }
  assert.equal(cacheHitPercent(usage), '99.99997')
})

test('stays within the supported precision for very high hit rates', () => {
  // 99.9999999995% needs ten decimals, under the float64-faithful cap.
  const usage = { uncachedInputTokens: 5, cacheReadTokens: 999999999995, cacheWriteTokens: 0 }
  assert.equal(cacheHitPercent(usage), '99.9999999995')
  assert.equal(MAX_PERCENT_DIGITS, 12)
})

test('true 100% keeps the default one decimal', () => {
  const usage = { uncachedInputTokens: 0, cacheReadTokens: 500, cacheWriteTokens: 0 }
  assert.equal(cacheHitPercent(usage), '100.0')
})

test('far-below-100 values stay compact', () => {
  const usage = { uncachedInputTokens: 3, cacheReadTokens: 1, cacheWriteTokens: 0 }
  assert.equal(cacheHitPercent(usage), '25.0')
})

test('base digits are clamped to the supported range', () => {
  assert.equal(formatPercent(25, -2), '25')
  assert.equal(formatPercent(25, 99), '25.000000000000')
})

test('formatPercent never round-displays a sub-100 value as 100%', () => {
  for (let base = 0; base <= 2; base++) {
    for (let miss = 1; miss <= 40; miss++) {
      const percent = (1 - miss / 1e6) * 100
      const text = formatPercent(percent, base)
      assert.equal(Number(text) < 100, true, `${percent} (base ${base}) displayed as ${text}%`)
    }
  }
})
