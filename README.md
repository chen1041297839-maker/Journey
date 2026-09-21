# Xenia 的行程站

把圆周旅迹（pitravel.cn）的公开分享链接贴进来，生成可执行的个人行程。每一站先看**抽出来的要点**：店铺、必买、机位（站位 / 角度 / 时段）、穿搭、价格、避坑。小红书 / 抖音 / Instagram 原帖只留一行「来源」链接，不当主界面。

站点数据存在**一份共享行程记录**里：谁在网页上导入、贴链接、上传截图、确认规划，都会写进同一条记录。不是浏览器 localStorage。

默认行程是 Xenia 的贵州路线（从分享链接导入）。

- 圆周旅迹公开分享的站点顺序是准绳。导入后默认按原顺序显示；规划建议只在确认框里，点「采用建议」才会改，选择会存到服务器
- 读取你粘贴的小红书 / 抖音 / Instagram **公开页**（或 Instagram oEmbed）；抽出的要点、配图和 OCR 写入共享记录
- 不会登录，也不会走 App 接口。评论不在公开 HTML 里就标「评论网页读不到」。公开配图和上传截图进数据库（本地还会在 `public/uploads` 留一份）；被拦的标「配图读不到」。清单截图请打开对应那一站，在网页上传区拖入或选择（不要发到聊天），OCR 后写进要点
- 已保存的封面/包装/清单图会用本机 tesseract（`chi_sim+eng`）再加一次画面识字；吃不准的行标「识别不确定」。没下载过的 App 图不会去抓
- 东京四日只作为「填入示例」的演示，生成后会标示例

## 本地运行

需要 Node.js 22+（自带 `node:sqlite`）。**不用填任何密钥。**

```bash
npm install
npm run dev
```

浏览器打开 [http://127.0.0.1:4317](http://127.0.0.1:4317)。开发服务器绑定 `0.0.0.0:4317`。

本地存储：

- 行程 JSON：`data/xenia.sqlite` 表 `journey`
- 上传 / 抓到的配图字节：同一库的 `files` 表，并复制到 `public/uploads/`
- 读取接口：`GET /api/journey`、图片 `GET /api/files/{id}`

```bash
npm run build
npm start
```

可选：复制 `.env.example` 为 `.env.local`。留空即用 sqlite。若本机要试 Postgres，再填 `DATABASE_URL`。

## Vercel 环境变量

Serverless 磁盘不能当图床。部署时请配置：

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | 是 | Postgres / Neon 连接串，例如 `postgresql://USER:PASSWORD@HOST/DB?sslmode=require`。行程 JSON 和图片字节都存在库里（`journey` + `files` BYTEA） |
| `XENIA_JOURNEY_ID` | 否 | 共享记录 id，默认 `xenia` |
| `BLOB_READ_WRITE_TOKEN` | 否 | 这一版图片走数据库字节，不依赖 Vercel Blob。若以后要改 Blob，再加 token |

Neon：创建项目 → 复制连接串 → 贴到 Vercel 项目 Environment Variables。不需要登录墙；上传接口无鉴权，适合这一份共用行程。

没有 `DATABASE_URL` 时应用仍能启动，但在 Vercel 上会落到 `/tmp` sqlite，实例一换数据就丢。

## 导入真实行程

1. 打开首页，粘贴圆周旅迹分享链接（形如 `https://www.pitravel.cn/web/journey/detail/{id}`）
2. 点「导入行程」
3. 行程必须是公开分享：好友不登录也能打开

也可以在「手动粘贴地点」里按「第1天」分段，一行一个地点。

## 粘贴笔记链接 / 上传截图

首页和每一站都可以贴一条或多条小红书 / 抖音 / Instagram 链接。贴进网页输入框即可，不要发到聊天。清单截图请打开那一站，用上传区拖入或选择。服务端读公开页、存图、OCR，并写入共享行程。

如果页面跳登录或只有空壳，仍会保存原链接，并标明读不到的部分。

默认导入快照在 [`src/data/imported/pitravel-7662387918598377796.json`](src/data/imported/pitravel-7662387918598377796.json)，抽出的要点在 [`src/data/research/guizhou-facts.json`](src/data/research/guizhou-facts.json)，公开笔记在 [`src/data/research/guizhou-posts.json`](src/data/research/guizhou-posts.json)，配图 OCR 在 [`src/data/research/guizhou-ocr.json`](src/data/research/guizhou-ocr.json)。本机可再跑 `npm run ocr`（需要 tesseract `chi_sim+eng`）。

## 技术栈

Next.js（App Router · Route Handlers）· TypeScript · Tailwind CSS · shadcn/ui · 本地 sqlite · Vercel 上 Postgres
