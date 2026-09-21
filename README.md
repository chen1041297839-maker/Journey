# Xenia 的行程站

把圆周旅迹（pitravel.cn）的公开分享链接贴进来，生成可执行的个人行程。每一站先看**抽出来的要点**：店铺、必买、机位（站位 / 角度 / 时段）、穿搭、价格、避坑。小红书 / 抖音 / Instagram 原帖只留一行「来源」链接，不当主界面。

默认行程是 Xenia 的贵州路线（从分享链接导入）。

- 圆周旅迹公开分享的站点顺序是准绳。导入后默认按原顺序显示；规划建议只在确认框里，点「采用建议」才会改
- 读取你粘贴的小红书 / 抖音 / Instagram **公开页**（或 Instagram oEmbed）；系统也会公开检索并预挂真实帖子链接
- 不会登录，也不会走 App 接口。评论不在公开 HTML 里就标「评论网页读不到」。公开配图会存进 `public/evidence` 并贴在对应要点旁边；被拦的标「配图读不到」
- 已保存的封面/包装/清单图会用本机 tesseract（`chi_sim+eng`）再加一次画面识字，抽店名、菜单、价格、机位写进要点；吃不准的行标「识别不确定」。没下载过的 App 图不会去抓
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
2. 点「导入行程」
3. 行程必须是公开分享：好友不登录也能打开

也可以在「手动粘贴地点」里按「第1天」分段，一行一个地点。

## 粘贴笔记链接

首页和每一站都可以贴一条或多条小红书 / 抖音 / Instagram 链接。贴进网页输入框即可，不要发到聊天。服务端只请求公开 HTML（小红书会优先试手机版页面里的 `__INITIAL_STATE__`）和 Instagram oEmbed，下载能拿到的公开配图，再用本机 tesseract OCR，抽出店 / 必买 / 价格 / 机位，并把图贴在要点旁边。原帖只保留来源。

如果页面跳登录或只有空壳，仍会保存原链接，并标明读不到的部分。

默认导入快照在 [`src/data/imported/pitravel-7662387918598377796.json`](src/data/imported/pitravel-7662387918598377796.json)，抽出的要点在 [`src/data/research/guizhou-facts.json`](src/data/research/guizhou-facts.json)，公开笔记在 [`src/data/research/guizhou-posts.json`](src/data/research/guizhou-posts.json)，配图 OCR 在 [`src/data/research/guizhou-ocr.json`](src/data/research/guizhou-ocr.json)。本机可再跑 `npm run ocr`（需要 tesseract `chi_sim+eng`）。

## 技术栈

Next.js（App Router）· TypeScript · Tailwind CSS · shadcn/ui
