import type { OcrLine } from "@/data/types"
import { cleanCjkText } from "@/lib/cjk-text"

export type ExtractedShop = {
  name: string
  category: string
  hours: string
  note: string
  whatToLookFor: string
  uncertain?: boolean
}

export type ExtractedBuy = {
  name: string
  reason: string
  budget: string
  tip: string
  uncertain?: boolean
}

export type ExtractedSpot = {
  title: string
  standWhere: string
  angle: string
  shotLooksLike: string
  bestTime: string
  lens: string
  avoid: string
  palette: [string, string, string]
  uncertain?: boolean
}

export type ExtractedFacts = {
  shops: ExtractedShop[]
  mustBuys: ExtractedBuy[]
  photoSpots: ExtractedSpot[]
  warnings: { text: string; kind: "雷" | "注意" }[]
}

const SHOP_HINT =
  /店|馆|摊|面$|奶茶店?$|火锅|脆哨|糕|鸭|卤|洋芋|茶饮|旅拍|民宿|住宿|蜡染|土特产|肠旺|烤肉|酥$|碗饵|干丝|集$/

function hasCjk(value: string): boolean {
  return /[\u4e00-\u9fff]/.test(value)
}

function cleanName(raw: string): string {
  return cleanCjkText(
    raw
      .replace(/^[0-9０-９①②③④⑤⑥⑦⑧⑨⑩]+[.、．\s]*/u, "")
      .replace(/[（(].*$/, "")
      .replace(/[：:].*$/, "")
      .replace(/封面|OCR|网页|配图|小红书|抖音/g, "")
      .trim()
  )
}

function isShopName(name: string): boolean {
  if (name.length < 2 || name.length > 18) return false
  if (!hasCjk(name)) return false
  if (/^(的|没有|超级|按个|味道|封面)/.test(name)) return false
  if (/^小红书|打开App|仅支持|登录|配图读不到|不踩雷的店/.test(name)) return false
  if (/味道|可以|很好|打开窗帘/.test(name) && !/(店|馆|民宿|住宿)$/.test(name)) return false
  return SHOP_HINT.test(name)
}

function categoryOf(name: string): string {
  if (/民宿|住宿/.test(name)) return "住宿"
  if (/奶茶|茶饮|茶/.test(name)) return "喝茶"
  if (/旅拍|蜡染/.test(name)) return "手作"
  if (/酥|脆哨|伴手|土产/.test(name)) return "伴手礼"
  return "吃喝"
}

function priceIn(text: string): string {
  const match = text.match(/¥\s*\d+(?:\.\d+)?|\d+\s*元/)
  return match ? match[0].replace(/\s+/g, "") : ""
}

function uniqueByName<T extends { name?: string; title?: string; text?: string }>(
  list: T[],
  key: (item: T) => string
): T[] {
  const seen = new Set<string>()
  const next: T[] = []
  for (const item of list) {
    const id = key(item)
    if (!id || seen.has(id)) continue
    seen.add(id)
    next.push(item)
  }
  return next
}

export function extractFactsFromText(pageText: string, ocrLines: OcrLine[] = []): ExtractedFacts {
  const ocrBlob = ocrLines.map((line) => line.text).join("\n")
  const blob = `${pageText}\n${ocrBlob}`
  const uncertainNames = new Set(
    ocrLines.filter((line) => line.uncertain).flatMap((line) => {
      const name = cleanName(line.text)
      return isShopName(name) ? [name] : []
    })
  )

  const shops: ExtractedShop[] = []
  const chunks = blob.split(/[、，,；;\n\/|]/)
  for (const chunk of chunks) {
    const name = cleanName(chunk)
    if (!isShopName(name)) continue
    const around = chunk.slice(0, 80)
    shops.push({
      name,
      category: categoryOf(name),
      hours: priceIn(around) || "以现场为准",
      note: around.replace(/\s+/g, " ").slice(0, 120) || name,
      whatToLookFor: name,
      uncertain: uncertainNames.has(name) && !pageText.includes(name),
    })
  }

  const numbered = blob.matchAll(
    /[1-9１-９①②③④⑤⑥⑦⑧⑨⑩][.、．]?\s*([^\n]{2,40}?(?:店|馆|奶茶|民宿|住宿|茶饮|旅拍|土特产|蜡染|集))/g
  )
  for (const match of numbered) {
    const name = cleanName(match[1] || "")
    if (!isShopName(name)) continue
    shops.push({
      name,
      category: categoryOf(name),
      hours: "以现场为准",
      note: match[0].slice(0, 120),
      whatToLookFor: name,
      uncertain: uncertainNames.has(name) && !pageText.includes(name),
    })
  }

  const mustBuys: ExtractedBuy[] = []
  for (const match of blob.matchAll(/(?:必买|多买|打包|伴手礼)[：:]?\s*([^\n。]{2,30})/g)) {
    const name = cleanName(match[1] || "")
    if (name.length < 2) continue
    mustBuys.push({
      name,
      reason: match[0].slice(0, 80),
      budget: priceIn(match[0]) || "以现场为准",
      tip: "从公开页或配图 OCR 抽出。",
      uncertain: ocrLines.some((line) => line.uncertain && line.text.includes(name)),
    })
  }
  for (const line of ocrLines) {
    const price = priceIn(line.text)
    if (!price) continue
    const name = cleanName(line.text.replace(price, ""))
    if (name.length < 2 || !hasCjk(name)) continue
    mustBuys.push({
      name,
      reason: line.text,
      budget: price,
      tip: line.uncertain ? "价格来自 OCR，识别不确定。" : "价格来自配图 OCR。",
      uncertain: line.uncertain,
    })
  }

  const photoSpots: ExtractedSpot[] = []
  for (const line of [...ocrLines.map((item) => item.text), ...pageText.split(/[。；\n]/)]) {
    const text = line.trim()
    if (text.length < 6) continue
    if (!/机位|站在|观景台|窗框|桥面|巷口/.test(text)) continue
    photoSpots.push({
      title: cleanName(text).slice(0, 16) || "笔记机位",
      standWhere: text.slice(0, 120),
      angle: "以笔记画面为准",
      shotLooksLike: text.slice(0, 80),
      bestTime: /蓝调|傍晚|日落/.test(text) ? "傍晚到蓝调" : "以笔记为准",
      lens: "手机 1x",
      avoid: "不要挡路或堵店门口",
      palette: ["#C9B48A", "#2F4A3C", "#1A1A1A"],
      uncertain: ocrLines.some((item) => item.uncertain && item.text === text),
    })
  }

  const warnings: ExtractedFacts["warnings"] = []
  for (const chunk of blob.split(/[。；\n]/)) {
    const line = chunk.trim()
    if (line.length < 4) continue
    if (!/踩雷|不推荐|别买|凉了就硬|不要打车|别穿高跟|别在民生路/.test(line)) continue
    warnings.push({
      text: line.slice(0, 80),
      kind: /踩雷|不推荐/.test(line) ? "雷" : "注意",
    })
  }

  const shopsUnique = uniqueByName(shops, (item) => item.name).filter(
    (shop) => !shops.some((other) => other.name !== shop.name && other.name.includes(shop.name))
  )

  return {
    shops: shopsUnique.slice(0, 8).map((shop) => ({
      ...shop,
      name: cleanCjkText(shop.name),
      note: cleanCjkText(shop.note),
      whatToLookFor: cleanCjkText(shop.whatToLookFor),
    })),
    mustBuys: uniqueByName(mustBuys, (item) => item.name)
      .slice(0, 6)
      .map((item) => ({
        ...item,
        name: cleanCjkText(item.name),
        reason: cleanCjkText(item.reason),
        tip: cleanCjkText(item.tip),
      })),
    photoSpots: uniqueByName(photoSpots, (item) => item.title)
      .slice(0, 4)
      .map((spot) => ({
        ...spot,
        title: cleanCjkText(spot.title),
        standWhere: cleanCjkText(spot.standWhere),
        angle: cleanCjkText(spot.angle),
        shotLooksLike: cleanCjkText(spot.shotLooksLike),
        avoid: cleanCjkText(spot.avoid),
      })),
    warnings: uniqueByName(warnings, (item) => item.text)
      .slice(0, 6)
      .map((item) => ({ ...item, text: cleanCjkText(item.text) })),
  }
}
