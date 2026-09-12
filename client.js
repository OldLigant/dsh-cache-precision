/* dsh-cache-precision client half: in-place precise cache-hit percentage.
 *
 * dsh 0.1.5-rc.2 shows the cache hit in three places: the usage pill's
 * label ("缓存命中 97%") under the composer, the pill's Token-usage
 * dialog, and each turn's 本轮用量 dialog. The pill label is the rough
 * reading and keeps one decimal; both detail dialogs always show exactly
 * one more decimal than that rough reading — a detail should be the more
 * detailed one. Everywhere the precision extends just enough that a value
 * below 100% never round-displays as 100% — the ladder dsh's own formatter
 * follows. The session dialog is patched from the tokenUsage projection;
 * the per-turn dialog is recomputed from the exact bucket counts it
 * already displays.
 */

window.__ModuleLoader__.load({
  id: 'dsh-cache-precision',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    var React = require('react')

    // float64 stays faithful to ~14 significant digits, so 12 decimals is
    // the last place a near-100 percentage can still be told apart from 100.
    var MAX_PERCENT_DIGITS = 12

    function percentDigits(percent, baseDigits) {
      var digits = Math.max(0, Math.min(MAX_PERCENT_DIGITS, baseDigits))
      while (digits < MAX_PERCENT_DIGITS && percent < 100 && Number(percent.toFixed(digits)) >= 100) {
        digits++
      }
      return digits
    }

    function formatPercent(percent, baseDigits) {
      return percent.toFixed(percentDigits(percent, baseDigits))
    }

    // Detail surfaces show exactly one more decimal than the rough reading
    // of the same value, so a detail is always the more detailed one.
    function formatDetailPercent(percent, baseDigits) {
      return percent.toFixed(Math.min(MAX_PERCENT_DIGITS, percentDigits(percent, baseDigits) + 1))
    }

    function cacheHitPercent(usage) {
      if (!usage) return null
      var denominator =
        (Number(usage.uncachedInputTokens) || 0) +
        (Number(usage.cacheReadTokens) || 0) +
        (Number(usage.cacheWriteTokens) || 0)
      if (!(denominator > 0)) return null
      return {
        percent: ((Number(usage.cacheReadTokens) || 0) / denominator) * 100,
        hit: Number(usage.cacheReadTokens) || 0,
        input: denominator,
      }
    }

    var PILL_LABEL = /^(缓存命中|Cache hit)\s+\d+(?:\.\d+)?%$/
    var BARE_PERCENT = /^\d+(?:\.\d+)?%$/
    var HIT_LABELS = ['缓存命中', 'Cache hit']

    function patchTextNode(node, percent, baseDigits) {
      var text = node.nodeValue
      if (!text) return false
      var match = text.match(PILL_LABEL)
      if (!match) return false
      var next = match[1] + ' ' + formatPercent(percent, baseDigits) + '%'
      if (text === next) return false
      node.nodeValue = next
      return true
    }

    // The stats row elides with ellipsis when overlong; widen its root past
    // the chat content width (viewport-capped) so the readout stays whole.
    function widenStatsRoot(node) {
      var el = node.parentElement
      for (var depth = 0; el && depth < 6; depth++, el = el.parentElement) {
        var cls = typeof el.className === 'string' ? el.className : ''
        if (cls.indexOf('_root') < 0) continue
        var text = el.textContent || ''
        if (text.indexOf('缓存命中') < 0 && text.indexOf('Cache hit') < 0) return
        el.style.maxWidth = 'min(calc(var(--dsh-chat-content-width) + 260px), calc(100vw - 48px))'
        el.style.width = '100%'
        el.style.boxSizing = 'border-box'
        return
      }
    }

    // Rough surface: the pill label under the composer, one decimal.
    function patchPillLabels(value, root) {
      var changed = 0
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      var node
      while ((node = walker.nextNode())) {
        var text = node.nodeValue || ''
        if (PILL_LABEL.test(text)) widenStatsRoot(node)
        if (patchTextNode(node, value.percent, 1)) changed++
      }
      return changed
    }

    function hitRateDd(dl) {
      var rows = dl.children
      for (var i = 0; i < rows.length; i++) {
        var el = rows[i]
        if (el.tagName !== 'DT') continue
        var label = (el.textContent || '').trim()
        if (HIT_LABELS.indexOf(label) < 0) continue
        var dd = el.nextElementSibling
        if (dd && dd.tagName === 'DD') return dd
      }
      return null
    }

    function percentNode(dd) {
      var node = dd.firstChild
      while (node) {
        if (node.nodeType === Node.TEXT_NODE && BARE_PERCENT.test(node.nodeValue || '')) return node
        node = node.nextSibling
      }
      return null
    }

    function setPercentNode(node, text) {
      if (node.nodeValue === text) return 0
      node.nodeValue = text
      return 1
    }

    // Session Token-usage dialog: its rows mirror the tokenUsage projection,
    // so patch the hit rate straight from the projection at detail precision.
    function patchSessionDialog(value, root) {
      var dl = root.querySelector('dl[data-session-stats-usage]')
      if (!dl) return 0
      var dd = hitRateDd(dl)
      if (!dd) return 0
      var node = percentNode(dd)
      if (!node) return 0
      return setPercentNode(node, formatDetailPercent(value.percent, 1) + '%')
    }

    function exactCount(text) {
      var digits = (text || '').replace(/\D+/g, '')
      return digits === '' ? undefined : Number(digits)
    }

    function dialogBucketCounts(dl) {
      var counts = {}
      var rows = dl.children
      for (var i = 0; i < rows.length; i++) {
        var el = rows[i]
        if (el.tagName !== 'DT') continue
        var label = (el.textContent || '').trim()
        var dd = el.nextElementSibling
        if (!dd || dd.tagName !== 'DD') continue
        // exactCount folds "1,332,992 tok" to 1332992; the output row's
        // reasoning suffix never matters — the hit-rate math needs no output.
        if (label === '未缓存输入' || label === 'Uncached input') counts.uncached = exactCount(dd.textContent)
        else if (label === '缓存读取' || label === 'Cached input') counts.read = exactCount(dd.textContent)
        else if (label === '缓存写入' || label === 'Cache write') counts.write = exactCount(dd.textContent)
      }
      return counts
    }

    // Per-turn 本轮用量 dialog: the projection carries session totals, not
    // this turn's, so recompute the ratio from the exact bucket counts the
    // dialog itself displays — same denominator dsh uses (prompt-side input).
    function patchTurnDialogs(root) {
      var changed = 0
      var dialogs = root.querySelectorAll('dl[data-turn-usage-details]')
      for (var i = 0; i < dialogs.length; i++) {
        var dl = dialogs[i]
        var dd = hitRateDd(dl)
        if (!dd) continue
        var counts = dialogBucketCounts(dl)
        if (!(counts.read > 0)) continue
        var denominator = (counts.uncached || 0) + counts.read + (counts.write || 0)
        if (!(denominator > 0)) continue
        var node = percentNode(dd)
        if (!node) continue
        changed += setPercentNode(
          node,
          formatDetailPercent((counts.read / denominator) * 100, 1) + '%',
        )
      }
      return changed
    }

    function applyPatch(usage, root) {
      var value = cacheHitPercent(usage)
      if (!value || !root || typeof document === 'undefined') return 0
      var changed = patchPillLabels(value, root)
      changed += patchSessionDialog(value, root)
      changed += patchTurnDialogs(root)
      return changed
    }

    function PatchEntry(props) {
      var useProjection = props.useProjection
      var usage = useProjection ? useProjection('tokenUsage') : undefined
      var rootRef = React.useRef(null)

      React.useLayoutEffect(function () {
        var root = document && document.body ? document.body : null
        var timer = null

        function scan() {
          applyPatch(usage, root)
        }

        scan()
        var observer = typeof MutationObserver === 'undefined' ? null : new MutationObserver(function () {
          if (timer !== null) return
          timer = setTimeout(function () {
            timer = null
            scan()
          }, 100)
        })
        if (observer && root) observer.observe(root, { childList: true, subtree: true, characterData: true })

        return function () {
          if (timer !== null) clearTimeout(timer)
          if (observer) observer.disconnect()
        }
      }, [usage])

      return null
    }

    var inject = ['slots']

    function apply(ctx) {
      ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register(
        { name: 'conversation.composer.dock', id: 'cache-precision-patch', order: 99, label: '' },
        PatchEntry,
      ))
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
