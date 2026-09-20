# Hologrow 的东京手帐

个人行程伴侣，不是通用旅行规划器。

小红书、高德、圆周轨迹只记住地点和怎么走。这本手帐补上每一站还需要的东西：

- 这一站有哪些店
- 什么值得买
- 拍照机位：站哪、什么角度、画面长什么样
- 按当天路线、天气感和街区气质写的穿搭
- 小红书风格的站姿 / 穿搭参考（原创精选卡片，**不会抓取小红书**；以后可把笔记链接贴进数据里的 `url`）

当前示例是 **Hologrow · 东京四日**（浅草 / 原宿表参道 / 新宿中目黑 / 下北泽代官山）。把数据换成你的真实行程时，不必改页面结构。

## 本地运行

需要 Node.js 20+。

```bash
npm install
npm run dev
```

浏览器打开 [http://127.0.0.1:4317](http://127.0.0.1:4317)。

```bash
npm run build
npm start -- --hostname 127.0.0.1 --port 4317
```

## 换成你的真实行程

入口在 [`src/data/index.ts`](src/data/index.ts)，示例数据在 [`src/data/tokyo/`](src/data/tokyo/)。

1. 保持 [`src/data/types.ts`](src/data/types.ts) 里的 `Trip` / `Day` / `Stop` 类型
2. 按天新增模块（或改现有 `day-1.ts` … `day-4.ts`）
3. 在 [`src/data/tokyo/index.ts`](src/data/tokyo/index.ts) 组装成一份 `Trip`
4. 若要完全换一份行程，新建目录后改 `getTrip()` 的导出即可

站点顺序对应圆周轨迹里的停靠点；店铺、必买、机位、穿搭是每一站往下展开的字段。

## 技术栈

Next.js（App Router）· TypeScript · Tailwind CSS · shadcn/ui
