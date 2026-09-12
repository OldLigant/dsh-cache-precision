# dsh-cache-precision

English | [中文](README.zh.md)

> **Fork note.** This repository is a fork of
> [Cheng-cheng9669/dsh-cache-precision](https://github.com/Cheng-cheng9669/dsh-cache-precision),
> maintained here with a different precision policy — see
> [Differences from upstream](#differences-from-upstream).

Adaptive-precision cache-hit readouts for the DSH Web composer, everywhere
the hit rate shows up. Targeting the 0.1.5-rc.2 stats pills; on older
builds with the single StatsLine row the label rewrite still applies.

1. **The usage pill label** (`6.8M tok · 缓存命中 97%`) is the rough,
   at-a-glance reading — rewritten in place to **one decimal**
   (`缓存命中 96.96%` -> `缓存命中 97.0%`). Once the cache has warmed up,
   the integer part stops moving: climbing from 99% to 99.5% can easily
   take longer than the entire initial climb to 99%, and one decimal keeps
   that crawl visible without turning a glance into a detail view.

2. **Both usage dialogs** — the pill's session-wide Token-usage dialog and
   each turn's 本轮用量 dialog — are where you actually inspect the
   numbers, so they always show **exactly one more decimal than the pill
   label** for the same value: a detail should be the more detailed
   reading, not repeat it. The built-in session dialog shows an integer
   there and the per-turn dialog only one; both are rewritten to sit one
   step above the pill, and when the pill climbs to two decimals near
   100%, the dialogs climb with it to three.

3. **Adaptive precision everywhere.** On every surface, extra decimals are
   added exactly when the current precision would round-display a sub-100
   hit rate as `100%` — from 99.95% at one base decimal it shows two, from
   99.995% three, and so on, up to what float64 can still distinguish
   (12 decimals). A true 100% keeps the plain reading. That "never show
   100% unless it is 100%" rule is not our invention: it is how DSH's own
   cache-hit formatter behaves (`formatCacheHitPercent` in
   `packages/client/ui-chat/src/client/chat/token-format.ts` of the
   deepseek-harness sources). The cache is reported as it is.

The session dialog is patched from the same `tokenUsage` projection dsh
reads; the per-turn dialog is recomputed from the exact bucket counts it
already displays, so it stays consistent with the row it sits in. The
stats row is also widened past the chat content width (viewport-capped) so
the longer readout is not collapsed into an ellipsis, and everything
re-applies automatically after React re-renders.

## Differences from upstream

- Upstream always shows **three** decimals on the single stats row. We
  split precision by surface instead: one decimal for the rough pill
  label, two in the detail dialogs — extra digits should appear where they
  carry information, not everywhere at once.
- The dynamic-precision ladder deliberately follows DSH's own statline
  formatter: report the cache as it is; a rate that has not fully hit must
  never read as 100%.

## Install

```sh
dsh plugin --profile web add github:OldLigant/dsh-cache-precision
```

Restart `dsh web`. To pick up later changes, re-run the install spec through
`dsh plugin --profile web update dsh-cache-precision`.

The package is plain JavaScript with no build step, so nothing needs to be
allowlisted under the profile's `pnpm-workspace.yaml`.
