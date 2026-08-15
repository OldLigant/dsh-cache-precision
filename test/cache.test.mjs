import test from 'node:test'
import assert from 'node:assert/strict'
import { cacheHitPercent } from '../index.js'

test('returns three-decimal cache-hit percentage', () => {
  const usage = { uncachedInputTokens: 1000, cacheReadTokens: 123, cacheWriteTokens: 0 }
  assert.equal(cacheHitPercent(usage), (123 / 1123 * 100).toFixed(3))
})

test('includes cache-write tokens in the denominator like DSH', () => {
  const usage = { uncachedInputTokens: 100, cacheReadTokens: 100, cacheWriteTokens: 800 }
  assert.equal(cacheHitPercent(usage), '10.000')
})

test('returns null when no input was billed', () => {
  assert.equal(cacheHitPercent(null), null)
  assert.equal(cacheHitPercent({}), null)
  assert.equal(cacheHitPercent({ uncachedInputTokens: 0, cacheReadTokens: 0 }), null)
})

test('digits are clamped to a sane range', () => {
  const usage = { uncachedInputTokens: 3, cacheReadTokens: 1, cacheWriteTokens: 0 }
  assert.equal(cacheHitPercent(usage, 6), '25.000000')
  assert.equal(cacheHitPercent(usage, -2), '25')
})