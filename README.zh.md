# dsh-cache-precision

[English](README.md) | 中文

> **Fork 说明。** 本仓库是
> [Cheng-cheng9669/dsh-cache-precision](https://github.com/Cheng-cheng9669/dsh-cache-precision)
> 的 fork,在精度策略上与上游做了不同的取舍,见
> [与上游的不同](#与上游的不同)。

对 DSH Web 底部 composer dock 内置统计行做两个**原位**优化:

1. **自适应精度的缓存命中率**（`缓存命中 12%` → `缓存命中 12.35%`）。
   缓存一旦热起来,命中率的整数部分就不再变化了:从 99% 爬到 99.5% 花的
   时间,有时比从 0 爬到 99% 的整个过程还长,而这个阶段真正想知道的是
   99 后面的小数到底是多少。内置读数恰好在这里失效——它只显示整数
   百分比。本插件把读数原位改写为**默认 2 位小数**;只有当当前位数会把
   不足 100% 的值四舍五入显示成 `100%` 时才加一位——达到 99.995% 显示
   3 位,达到 99.9995% 显示 4 位,以此类推,直到浮点数还能可靠区分的上限
   （12 位）。真正的 100% 保持显示 `100.00%`。

   "没全部命中就绝不能显示 100%" 这条规则不是我们发明的:dsh 自己的
   缓存命中率格式化逻辑（deepseek-harness 源码中
   `packages/client/ui-chat/src/client/chat/token-format.ts` 的
   `formatCacheHitPercent`）就是这么做的——平时用普通精度,只在需要区分
   "接近全命中" 和 "全命中" 时才多给几位。缓存有多少,就汇报多少。

2. **加宽统计行。** 在小屏幕（尤其是笔记本）上,内置统计行超出聊天内容
   宽度后会被截断成省略号。我们更希望看到完整内容,而不是一个 `...`:
   尤其是输入/输出 token 到底是多少——这才是最关心的;至于模型耗时和
   工具调用耗时各自的占比,反而没有那么重要。插件把统计行加宽到聊天
   内容宽度之外（以视口宽度为上限）,读数和其它 dock 条目不再被截断。

两个优化都读取同一个 `tokenUsage` 投影,并在 React 重新渲染后自动重新应用。

## 与上游的不同

- 上游任何时候都显示 **3** 位小数;我们认为日常 2 位足够,小数位应当在
  有信息量的时候才出现——即上面的自适应策略。
- 动态精度的阶梯刻意沿用 dsh 官方 statline 的格式化逻辑:缓存有多少
  汇报多少,不能没全部命中就给 100%。

## 安装

```sh
dsh plugin --profile web add github:OldLigant/dsh-cache-precision
```

安装后重启 `dsh web`。以后更新:

```sh
dsh plugin --profile web update dsh-cache-precision
```

包是纯 JavaScript、无构建步骤,不需要在 profile 的 `pnpm-workspace.yaml`
里 allowlist 任何构建脚本。

## 原理

- 内置 StatsLine 默认按整数百分比显示缓存命中率,本插件通过
  `MutationObserver` 找到原文案节点并原位改写。
- 缓存命中率口径与 DSH 一致:
  `cacheReadTokens / (uncachedInputTokens + cacheReadTokens + cacheWriteTokens)`。
- 不新增任何可见条目;其它统计信息（轮次、耗时、速度、tokens）保持不变。
- 不请求网络,不上传任何数据。

## 测试

```sh
npm test
```
