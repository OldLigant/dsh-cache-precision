/* dsh-cache-precision client half: in-place precise cache-hit percentage.
 *
 * The built-in StatsLine renders "缓存命中 12%" with Math.round(). This
 * plugin mounts an invisible entry in the same composer dock, reads the same
 * tokenUsage projection, and rewrites only the cache-hit text node in place
 * to three decimals. Every other stats group stays untouched.
 */
window.__ModuleLoader__.load({
  id: 'dsh-cache-precision',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    var React = require('react')

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

    function patchTextNode(node, value) {
      var text = node.nodeValue
      if (!text) return false
      var match = text.match(/^(缓存命中|Cache hit)\s+\d+(?:\.\d+)?%$/)
      if (!match) return false
      var next = match[1] + ' ' + value.percent.toFixed(3) + '%'
      if (text === next) return false
      node.nodeValue = next
      return true
    }

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

    function applyPatch(usage, root) {
      var value = cacheHitPercent(usage)
      if (!value || !root || typeof document === 'undefined') return 0
      var changed = 0
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      var node
      while ((node = walker.nextNode())) {
        var text = node.nodeValue || ''
        if (/^(缓存命中|Cache hit)\s+\d+(?:\.\d+)?%$/.test(text)) widenStatsRoot(node)
        if (patchTextNode(node, value)) changed++
      }
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