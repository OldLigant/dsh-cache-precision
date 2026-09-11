# dsh-cache-precision

[English](README.md) | 中文

> **Fork 说明。** 本仓库是
> [Cheng-cheng9669/dsh-cache-precision](https://github.com/Cheng-cheng9669/dsh-cache-precision)
> 的 fork,在精度策略上与上游做了不同的取舍,见
> [与上游的不同](#与上游的不同)。

对 DSH Web composer 上所有出现缓存命中率的地方做**原位**自适应精度改写。
针对 0.1.5-rc.2 的极简 pills 统计行;旧的整行 StatsLine 构建下,标签改写
依然生效。

1. **用量 pill 标签**(`6.8M tok · 缓存命中 97%`)是粗略的一瞥读数——
   原位改写为 **1 位小数**(`缓存命中 96.96%` → `缓存命中 97.0%`)。
   缓存一旦热起来,整数部分就不再变化了:从 99% 爬到 99.5% 花的时间,
   有时比从 0 爬到 99% 的整个过程还长;1 位小数足以看见这段爬行,又不至于
   把一瞥变成细看。

2. **两个用量详情弹窗**——pill 点开的会话级"Token 用量"弹窗和每轮的
   "本轮用量"弹窗——才是真正查看数字的地方,所以给 **2 位小数**。内置的
   会话弹窗在这里只显示整数,每轮弹窗只有 1 位;都改写为 2 位,让详情
   配得上 pill 的提示。

3. **所有地方都保持自适应精度。** 只要当前位数会把不足 100% 的值四舍五入
   显示成 `100%`,就加一位——1 位基准下达到 99.95% 显示 2 位,达到
   99.995% 显示 3 位,以此类推,直到浮点数还能可靠区分的上限(12 位);
   真正的 100% 保持朴素显示。"没全部命中就绝不能显示 100%" 这条规则不是
   我们发明的:dsh 自己的缓存命中率格式化逻辑(deepseek-harness 源码中
   `packages/client/ui-chat/src/client/chat/token-format.ts` 的
   `formatCacheHitPercent`)就是这么做的。缓存有多少,就汇报多少。

会话弹窗直接从 dsh 读取的同一个 `tokenUsage` 投影改写;每轮弹窗则用它
自己显示的精确分桶数字反算,和所在行的数字保持自洽。统计行同时加宽到
聊天内容宽度之外(以视口为上限),更长的读数不会被折叠成省略号;一切
都在 React 重新渲染后自动重新应用。

## 与上游的不同

- 上游在单一的统计行上任何时候都显示 **3** 位小数;本 fork 改为按显示面
  分精度:粗略的 pill 标签 1 位,详情弹窗 2 位——小数位应当出现在有
  信息量的地方,而不是处处都是。
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

## 测试

```sh
npm test
```
