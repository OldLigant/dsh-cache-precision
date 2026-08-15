/* dsh-cache-precision client half: precise cache-hit readout in the composer dock. */
window.__ModuleLoader__.load({
  id: 'dsh-cache-precision',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    var React = require('react')

    var css = [
      '.dsh-cachep-line{display:inline-flex;align-items:center;gap:6px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);white-space:nowrap}',
      '.dsh-cachep-value{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;font-weight:600}',
    ].join('\n')
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin="dsh-cache-precision"]') === null) {
      var styleTag = document.createElement('style')
      styleTag.dataset.plugin = 'dsh-cache-precision'
      styleTag.textContent = css
      document.head.appendChild(styleTag)
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

    function CacheLine(props) {
      var useProjection = props.useProjection
      var usage = useProjection ? useProjection('tokenUsage') : undefined
      var value = cacheHitPercent(usage)
      if (!value) return null
      var text = '缓存命中 ' + value.percent.toFixed(3) + '%'
      var tip = '精确缓存命中率\n' + value.percent.toFixed(3) + '%\n命中 ' + value.hit + ' / 输入 ' + value.input + ' tokens'
      return React.createElement('div', { className: 'dsh-cachep-line', title: tip },
        React.createElement('span', { className: 'dsh-cachep-label' }, '缓存命中'),
        React.createElement('span', { className: 'dsh-cachep-value' }, value.percent.toFixed(3) + '%')
      )
    }

    var inject = ['slots']

    function apply(ctx) {
      ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register(
        { name: 'conversation.composer.dock', id: 'cache-precision', order: 2, label: '缓存命中(3位)' },
        CacheLine,
      ))
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})