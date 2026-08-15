# dsh-cache-precision

Rewrites the built-in cache-hit percentage **in place** with three decimals.

- Reads the same `tokenUsage` projection as the built-in stats line.
- Replaces only the `缓存命中 12%` / `Cache hit 12%` text node; all other
  stats groups remain exactly as DSH renders them.
- Hover tooltip is inherited from the original line.
- Re-applies automatically after React re-renders (MutationObserver + debounce).

## Install

```sh
dsh plugin --profile web add D:\Dsh\tools\dsh-cache-precision
```

Restart `dsh web`.