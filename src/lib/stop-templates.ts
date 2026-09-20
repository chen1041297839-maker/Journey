import type { DraftStop, MustBuy, PhotoSpot, Shop, Stop } from "@/data/types"
import { platformForSeed, sampleEvidence } from "@/lib/evidence"

function slug(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\u4e00-\u9fff-]/g, "") || "stop"
}

function kindOf(category: string, name: string): "hotel" | "food" | "sight" | "street" | "shop" | "transit" | "place" {
  if (/机场|火车站|高铁/.test(name) || /交通/.test(category)) return "transit"
  if (/酒店|民宿|客栈/.test(name)) return "hotel"
  if (/火锅|面|烤肉|咖啡|餐厅|小吃|糯米|土菜|gelato|巧克力|烙锅|肠旺/.test(name) || /吃喝|餐饮|美食/.test(category)) {
    return "food"
  }
  if (/mall|市集|蜡染|SPA|工坊|大头贴/i.test(name) || /购物|商场/.test(category)) return "shop"
  if (/景区|梯田|侗寨|峡谷|鼓楼/.test(name) || /景点/.test(category)) return "sight"
  if (/街|巷|路|村/.test(name) || /其他/.test(category)) return "street"
  if (/住宿/.test(category)) return "hotel"
  return "place"
}

function evidenceFor(
  seed: string,
  name: string,
  quote: string,
  imageSrc?: string
) {
  const platform = platformForSeed(seed)
  const card = sampleEvidence(seed, platform, `${name}｜待贴笔记`, quote)
  if (imageSrc) {
    card.imageSrc = imageSrc
    card.imageAlt = `${name} · 来自导入的地点卡，笔记仍是示例`
  }
  return card
}

function photo(
  id: string,
  title: string,
  stand: string,
  look: string,
  imageSrc: string | undefined,
  palette: [string, string, string]
): PhotoSpot {
  return {
    id,
    title,
    standWhere: stand,
    angle: "平视或微仰，竖构图 4:5",
    shotLooksLike: look,
    bestTime: "人少的开场或蓝调",
    lens: "手机 1x，不要 0.5",
    avoid: "不要站在车道或挡店门口",
    composition: {
      sky: "上 20%",
      subject: "主体居中偏上",
      foreground: "地面或桌沿",
      palette,
    },
    evidence: [
      evidenceFor(
        `${id}-ev`,
        title,
        `${stand} ${look}`,
        imageSrc
      ),
    ],
  }
}

export function stopFromDraft(draft: DraftStop, order: number, arrive: string): Stop {
  const seed = `${slug(draft.name)}-${order}`
  const kind = kindOf(draft.category || "", draft.name)
  const area = draft.area || "待归类"
  const image = draft.imageSrc
  const shops: Shop[] = []
  const mustBuys: MustBuy[] = []
  const photoSpots: PhotoSpot[] = []
  let vibe = draft.category || "行程站点"
  let duration = "1 小时"
  let note = draft.note || "从圆周旅迹导入。店、必买和机位是按地点类型生成的，笔记证据标了示例，等你贴真实链接。"

  if (kind === "food") {
    duration = "50 分钟"
    vibe = "吃、蒸汽、排队"
    shops.push({
      id: `${seed}-shop`,
      name: draft.name,
      category: "吃喝",
      hours: "以现场为准",
      note: "这一站本身就是店。先点招牌，再看有没有座位靠窗。",
      whatToLookFor: "当地人在吃的那几桌，不要只点网红拼盘",
      evidence: [evidenceFor(`${seed}-shop-ev`, draft.name, "店内座位和招牌菜上桌的那一口。", image)],
    })
    mustBuys.push({
      id: `${seed}-buy`,
      name: "招牌一份 + 一份素的",
      reason: "贵州口味冲，配菜能把辣压住。",
      budget: "¥40–90",
      tip: "肠旺面、酸汤、烙锅这类，排队超过 20 分钟就先点外卖带回酒店。",
      evidence: [evidenceFor(`${seed}-buy-ev`, `${draft.name}必吃`, "热气、红油、一筷子提起的那张。", image)],
    })
    photoSpots.push(
      photo(
        `${seed}-spot`,
        `${draft.name}｜上桌第一口`,
        "坐在靠过道或靠窗的位置，镜头略俯桌面，自己的手入画即可。",
        "蒸汽、红油、店招在余光里，不要自拍脸占满。",
        image,
        ["#C45C26", "#F3E6D0", "#2B2118"]
      )
    )
  } else if (kind === "hotel") {
    duration = "入住 / 回房"
    vibe = "住、院子、夜灯"
    photoSpots.push(
      photo(
        `${seed}-spot`,
        `${draft.name}｜院子或大堂`,
        "站在大堂外侧或庭院中线，让招牌和一层屋檐完整。",
        "暖灯、木材、行李靠在脚边，像刚放下。",
        image,
        ["#6B4B3E", "#E4D5C0", "#1F1A16"]
      )
    )
    note = "住宿节点。不必再买东西，把机位留给院子和回房时的灯。"
  } else if (kind === "sight") {
    duration = "2.5 小时"
    vibe = "景、水、台阶"
    shops.push({
      id: `${seed}-shop`,
      name: `${draft.name}附近摊位 / 游客中心`,
      category: "伴手礼",
      hours: "随景区",
      note: "蜡染、银饰、茶叶只买能塞进背包的。",
      whatToLookFor: "有手作痕迹的小件，不要景区统一包装的钥匙扣",
      evidence: [evidenceFor(`${seed}-shop-ev`, `${draft.name}伴手礼`, "摊位桌面和你下手的那件。", image)],
    })
    mustBuys.push({
      id: `${seed}-buy`,
      name: "水 + 一件轻的手作",
      reason: "景区内吃的贵，手作比冰箱贴值得。",
      budget: "¥30–200",
      tip: "梯田和侗寨风大，别买易碎瓶装。",
      evidence: [evidenceFor(`${seed}-buy-ev`, `${draft.name}必买`, "手作平铺在木桌上的一张。", image)],
    })
    photoSpots.push(
      photo(
        `${seed}-spot`,
        `${draft.name}｜主景机位`,
        "站在观景台或寨门外侧第三条线，人放在画面下 1/3。",
        "水、树、鼓楼或梯田占满中景，你走过去而不是摆拍。",
        image,
        ["#2F4A3C", "#C9B48A", "#1A1A1A"]
      )
    )
  } else if (kind === "street" || kind === "shop") {
    duration = "40 分钟"
    vibe = "街、招牌、路过"
    shops.push({
      id: `${seed}-shop`,
      name: `${draft.name}沿街小店`,
      category: kind === "shop" ? "购物" : "街区",
      hours: "下午到晚上",
      note: "这条本身就是逛的理由。进两家就走，别扛大袋。",
      whatToLookFor: "手作、小吃、可以别在包上的小东西",
      evidence: [evidenceFor(`${seed}-shop-ev`, draft.name, "招牌重复成线条，人在巷子里。", image)],
    })
    photoSpots.push(
      photo(
        `${seed}-spot`,
        `${draft.name}｜巷口`,
        "站在巷口外侧，让招牌和地面砖缝形成透视。",
        "人很小，街很满，像本地下午。",
        image,
        ["#4A4A4A", "#C9B59A", "#2B3A4A"]
      )
    )
  } else if (kind === "transit") {
    duration = "出发"
    vibe = "行李、安检、结束"
    photoSpots.push(
      photo(
        `${seed}-spot`,
        `${draft.name}｜出发前`,
        "值机岛外侧，行李在脚边，不要拍安检口。",
        "最后一张城市，轻松就好。",
        image,
        ["#8AA0B5", "#E7E2D8", "#2E3238"]
      )
    )
    note = "返程节点。不要再安排购物。"
  } else {
    photoSpots.push(
      photo(
        `${seed}-spot`,
        `${draft.name}｜入口`,
        "站在主入口外侧，招牌完整入画。",
        "路过感，不是清场大片。",
        image,
        ["#C45C26", "#F3E6D0", "#2B2118"]
      )
    )
  }

  return {
    id: seed,
    order,
    name: draft.name,
    nameJa: "",
    area,
    arrive,
    duration,
    vibe,
    note,
    shops,
    mustBuys,
    photoSpots,
  }
}
