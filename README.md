# Xenia 的行程站

把圆周旅迹（pitravel.cn）的公开分享链接贴进来，生成可执行的个人行程：每一站的店、必买、拍照机位、当天穿搭，以及带平台 / 配图 / 摘录 / 链接的笔记证据卡。

默认行程是 Xenia 的贵州路线（从分享链接导入），不是东京示例。

- 只读取你贴入的 `pitravel.cn` 公开页，不会登录或抓取小红书、抖音、Instagram
- 笔记证据默认标「示例」；可自行替换链接、上传配图，Instagram 真实帖走官方 embed
- 东京四日只作为「填入示例」的演示，生成后也会标示例

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

默认导入快照在 [`src/data/imported/pitravel-7662387918598377796.json`](src/data/imported/pitravel-7662387918598377796.json)，规划逻辑在 [`src/lib/plan-itinerary.ts`](src/lib/plan-itinerary.ts)。

## 技术栈

Next.js（App Router）· TypeScript · Tailwind CSS · shadcn/ui
