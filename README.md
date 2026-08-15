# dsh-cache-precision

English | [中文](README.zh.md)

Two in-place composer-dock refinements:

1. Rewrites the built-in cache-hit percentage with **three decimals**
   (`缓存命中 12%` -> `缓存命中 12.345%`).
2. Widens the built-in stats line (`max-width` grows beyond the chat content
   width) so the extra precision and other dock items no longer truncate with
   `...`.

Both read the same `tokenUsage` projection and re-apply automatically after
React re-renders.

## Install

```sh
dsh plugin --profile web add D:\Dsh\tools\dsh-cache-precision
```

Restart `dsh web`.
