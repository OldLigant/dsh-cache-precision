# dsh-cache-precision

Adds a three-decimal cache-hit readout to the DSH Web composer dock.

- Reads the same `tokenUsage` projection as the built-in stats line.
- Denominator matches DSH: `uncachedInputTokens + cacheReadTokens + cacheWriteTokens`.
- Hover shows exact token counts (hit / input).
- The built-in integer badge is left untouched; this plugin adds the precise value beside it.

## Install

```sh
dsh plugin --profile web add D:\Dsh\tools\dsh-cache-precision
```

Restart `dsh web`, then look at the bottom dock of any conversation.