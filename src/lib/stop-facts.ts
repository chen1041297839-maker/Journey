import type { Stop } from "@/data/types"

function hasReal(list: { evidence: { isSample: boolean }[] }[]): boolean {
  return list.some((item) => item.evidence.some((card) => !card.isSample))
}

export function factCluster(name: string): string {
  const n = name.replace(/[（）()\s]/g, "")
  if (/鱼爱牛|松子酥|瓜子酥/.test(n)) return "yuainiu"
  if (/余美霞/.test(n)) return "yumeixia"
  if (/蒋家/.test(n) || (/肠旺面/.test(n) && !/余美霞/.test(n))) return "jiangjia"
  if (/巧八角/.test(n)) return "qiaobajiao"
  if (/玉珍/.test(n)) return "yuzhen"
  if (/毛阿姨/.test(n)) return "maayi"
  if (/毛辣果/.test(n)) return "malaiguo"
  if (/一杯黔茶/.test(n)) return "yiqiancha"
  if (/辣子鸡|黄杰/.test(n)) return "laziji"
  if (/好心情/.test(n)) return "haoxinqing"
  if (/滋滋铁板|滋铁板/.test(n)) return "zizi"
  if (/无骨鸡爪/.test(n)) return "zizi-claw"
  if (/板吉|大拇指牛肉|小七孔牛肉粉|小七孔东门牛肉/.test(n)) return "banji"
  if (/去茶山/.test(n)) return "quchashan"
  if (/高山3班|高山三班/.test(n)) return "gaoshan3"
  if (/原糯糯/.test(n)) return "yuannuonuo"
  if (/贵阳要吃要买/.test(n)) return "buy-list"
  if (/贵阳特色奶茶/.test(n)) return "tea-list"
  return `n:${n}`
}

function isGenericName(name: string): boolean {
  return /沿街小店|附近摊位|游客中心|招牌一份 \+ 一份素的|水 \+ 一件轻的手作|笔记里的必买/.test(name)
}

/** 时间线和地图图例上的要点名：去重，并跳过与站名重复的店招 */
export function visibleFactNames(stop: Stop): string[] {
  const seen = new Set<string>()
  const names: string[] = []
  const push = (name: string, skipIfSameAsStop: boolean) => {
    if (!name || isGenericName(name)) return
    if (skipIfSameAsStop && (name === stop.name || stop.name.includes(name) || name.includes(stop.name))) {
      return
    }
    const key = factCluster(name)
    if (seen.has(key)) return
    seen.add(key)
    names.push(name)
  }
  for (const shop of stop.shops) push(shop.name, true)
  for (const buy of stop.mustBuys) push(buy.name, false)
  for (const warning of stop.warnings ?? []) {
    if (warning.kind !== "雷") continue
    const label = warning.text.split("：")[0] || warning.text
    push(`雷 ${label}`, false)
  }
  return names.slice(0, 8)
}

export function stopFactLine(stop: Stop): string {
  const facts = visibleFactNames(stop)
  if (facts.length > 0) return facts.slice(0, 4).join(" · ")
  return stop.note
}

function compact(text: string) {
  return text.replace(/[\s，。；、：,.!！?？]/g, "")
}

/** 两段说明是否在讲同一件事，用来避免同一要点在页面上出现多次。 */
export function repeats(a: string, b: string) {
  const left = compact(a)
  const right = compact(b)
  if (left.length < 8 || right.length < 8) return false
  if (left.includes(right) || right.includes(left)) return true
  let hit = 0
  let total = 0
  for (let index = 0; index < left.length - 3; index += 4) {
    total += 1
    if (right.includes(left.slice(index, index + 4))) hit += 1
  }
  return total > 0 && hit / total >= 0.6
}

export function stopFactChips(stop: Stop): string[] {
  const chips: string[] = []
  const leiCount = (stop.warnings ?? []).filter((item) => item.kind === "雷").length
  if (leiCount > 0) chips.push(`${leiCount} 条雷`)
  const facts = visibleFactNames(stop)
  if (facts.length > 0) {
    chips.push(`${facts.length} 要点`)
  } else {
    if (hasReal(stop.shops) || stop.shops.some((shop) => !/沿街小店|附近摊位/.test(shop.name))) {
      chips.push(`${stop.shops.length} 店`)
    }
    if (stop.mustBuys.length > 0) chips.push(`${stop.mustBuys.length} 必买`)
  }
  if (stop.photoSpots.length > 0) chips.push(`${stop.photoSpots.length} 机位`)
  return chips
}
