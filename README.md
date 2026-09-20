# Xenia 的行程站

把圆周旅迹（pitravel.cn）的公开分享链接贴进来，生成可执行的个人行程：每一站的店、必买、拍照机位、当天穿搭，以及带平台 / 配图 / 摘录 / 链接的笔记证据卡。

默认行程是 Xenia 的贵州路线（从分享链接导入），不是东京示例。

- 圆周旅迹公开分享是原料，不是日计划。导入后会按片区重排、加上时间块、合并重复回酒店，时间线里可以对照「原顺序」
- 读取你粘贴的小红书 / 抖音 / Instagram **公开页**（或 Instagram oEmbed）；系统也会公开检索并预挂真实帖子链接
- 不会登录，也不会走 App 接口。公开页打不开就保存链接并标「网页读不全」，不会把示例图冒充成真帖
- 东京四日只作为「填入示例」的演示，生成后会标示例

## 本地运行

需要 Node.js 20+。

```bash
npm install
npm run dev
```

浏览器打开 [http://127.0.0.1:4317](http://127.0.0.1:4317)。开发服务器绑定 `0.0.0.0:4317`。

```bash
npm run build
npm start
```

## 导入真实行程

1. 打开首页，粘贴圆周旅迹分享链接（形如 `https://www.pitravel.cn/web/journey/detail/{id}`）
2. 点「导入并生成行程」
3. 行程必须是公开分享：好友不登录也能打开

也可以在「手动粘贴地点」里按「第1天」分段，一行一个地点。

## 粘贴笔记链接

首页和每一站都可以贴一条或多条小红书 / 抖音 / Instagram 链接。服务端只请求公开 HTML（小红书会优先试手机版页面里的 `__INITIAL_STATE__`）和 Instagram oEmbed，抽出标题、摘录和配图，按店名挂到对应站点。

如果页面跳登录或只有空壳，仍会保存原链接，证据卡标「网页读不全」。

默认导入快照在 [`src/data/imported/pitravel-7662387918598377796.json`](src/data/imported/pitravel-7662387918598377796.json)，规划逻辑在 [`src/lib/plan-itinerary.ts`](src/lib/plan-itinerary.ts)，贴过的公开笔记在 [`src/data/research/guizhou-posts.json`](src/data/research/guizhou-posts.json)。

## 技术栈

Next.js（App Router）· TypeScript · Tailwind CSS · shadcn/ui
