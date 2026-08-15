# dsh-cache-precision

对 DSH Web 底部 composer dock 做两个**原位**优化：

1. 把内置的缓存命中率从整数百分比原位替换为 **3 位小数**
   （`缓存命中 12%` → `缓存命中 12.345%`）。
2. 加宽内置统计行（`max-width` 在聊天内容宽度基础上增加 260px，
   并以视口宽度为上限），避免更长的读数和其它 dock 条目被 `...` 截断。

两个优化都读取同一个 `tokenUsage` 投影，并在 React 重新渲染后自动重新应用。

## 安装

```sh
dsh plugin --profile web add D:\Dsh\tools\dsh-cache-precision
```

安装后重启 `dsh web`。

## 原理

- 内置 StatsLine 用 `Math.round()` 显示缓存命中率，本插件通过
  `MutationObserver` 找到原文案节点并原位改写。
- 缓存命中率口径与 DSH 一致：
  `cacheReadTokens / (uncachedInputTokens + cacheReadTokens + cacheWriteTokens)`。
- 不新增任何可见条目；其它统计信息（轮次、耗时、速度、tokens）保持不变。
- 不请求网络，不上传任何数据。

## 测试

```sh
npm test
```