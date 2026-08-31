# dsh-cache-precision

English | [中文](README.zh.md)

> **Fork note.** This repository is a fork of
> [Cheng-cheng9669/dsh-cache-precision](https://github.com/Cheng-cheng9669/dsh-cache-precision),
> maintained here with a different precision policy — see
> [Differences from upstream](#differences-from-upstream).

Two in-place refinements to the DSH Web composer dock's built-in stats line:

1. **Adaptive-precision cache hit** (`缓存命中 12%` -> `缓存命中 12.35%`).
   Once the cache has warmed up, the integer part of the hit rate stops
   carrying information: climbing from 99% to 99.5% can easily take longer
   than the entire initial climb to 99%, and what you actually want to know
   at that point is *which* decimals follow the 99. The built-in readout
   shows an integer percentage and goes silent exactly there. This plugin
   rewrites the readout in place with **two decimals by default**, and adds
   a decimal only when the current precision would round-display a sub-100
   hit rate as `100%` — from 99.995% it shows three decimals, from 99.9995%
   four, and so on, up to what float64 can still distinguish (12 decimals).
   A true 100% keeps reading `100.00%`.

   That "never show 100% unless it is 100%" rule is not our invention: it is
   how DSH's own cache-hit formatter behaves (`formatCacheHitPercent` in
   `packages/client/ui-chat/src/client/chat/token-format.ts` of the
   deepseek-harness sources — ordinary precision by default, extra digits
   only when needed to tell a near-perfect rate apart from a perfect one).
   The cache should be reported as it is.

2. **A wider stats line.** On smaller screens — laptops in particular — the
   built-in line truncates to `...` once it outgrows the chat content width.
   We want to see the whole line, not an ellipsis: especially the
   input/output token counts, which matter more to us than the split between
   model time and tool-call time. The plugin widens the line beyond the chat
   content width (capped by the viewport) so the readouts and other dock
   items stop collapsing.

Both refinements read the same `tokenUsage` projection and re-apply
automatically after React re-renders.

## Differences from upstream

- Upstream always shows **three** decimals. We think two decimals are enough
  in ordinary use, and extra digits should appear only when they carry
  information — hence the adaptive policy above.
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
