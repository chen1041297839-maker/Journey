import type { CatalogStop } from "@/data/catalog"
import { day1 } from "@/data/tokyo/day-1"
import { day2 } from "@/data/tokyo/day-2"
import { day3 } from "@/data/tokyo/day-3"
import { day4 } from "@/data/tokyo/day-4"

export type LibraryPlace = {
  id: string
  aliases: string[]
  area: string
  clusterOrder: number
  stop: CatalogStop
  outfitFromDay: number
}

const AREA_ORDER: Record<string, number> = {
  浅草: 10,
  押上: 20,
  银座: 30,
  银座四丁目: 30,
  原宿: 40,
  "表参道 / 青山": 50,
  表参道: 50,
  涩谷: 60,
  新宿: 70,
  西新宿: 72,
  中目黑: 80,
  目黑川: 80,
  惠比寿: 90,
  惠比寿花园广场: 90,
  下北泽: 100,
  代官山: 110,
  六本木: 120,
}

const EXTRA_ALIASES: Record<string, string[]> = {
  kaminarimon: ["雷门", "雷門", "浅草雷门", "浅草寺雷门", "浅草寺"],
  nakamise: ["仲见世", "仲见世通", "仲見世通り"],
  skytree: ["晴空塔", "东京晴空塔", "東京スカイツリー", "skytree", "押上"],
  ginza: ["银座", "銀座", "银座四丁目", "银座十字"],
  "meiji-jingu": ["明治神宫", "明治神宮", "神宫"],
  takeshita: ["竹下通", "竹下通り", "竹下"],
  omotesando: ["表参道", "表参道hills", "青山"],
  "shibuya-sky": ["涩谷天空", "shibuya sky", "涩谷sky", "涩谷"],
  "shinjuku-gyoen": ["新宿御苑", "御苑"],
  tocho: ["都厅", "东京都厅", "東京都庁", "都厅展望"],
  nakameguro: ["中目黑", "中目黒", "目黑川"],
  ebisu: ["惠比寿", "恵比寿", "惠比寿花园"],
  "shimokita-south": ["下北泽南口", "下北沢南口", "下北泽", "下北沢"],
  "shimokita-vintage": ["下北古着", "古着巷", "下北古着巷", "古着ストリート"],
  daikanyama: ["代官山", "t-site", "代官山 t-site", "茑屋"],
  roppongi: ["六本木", "六本木之丘", "六本木ヒルズ", "东京塔"],
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[（）()【】\[\]\-—_,，.。]/g, " ")
    .replace(/駅|站|寺|通り|通り/g, "")
    .replace(/\s+/g, "")
    .trim()
}

const catalogDays = [day1, day2, day3, day4]

export const libraryPlaces: LibraryPlace[] = catalogDays.flatMap((day) =>
  day.stops.map((stop) => ({
    id: stop.id,
    aliases: Array.from(
      new Set(
        [stop.name, stop.nameJa, stop.id, ...(EXTRA_ALIASES[stop.id] ?? [])].filter(
          Boolean
        )
      )
    ),
    area: stop.area,
    clusterOrder: AREA_ORDER[stop.area] ?? 500,
    stop,
    outfitFromDay: day.dayNumber,
  }))
)

export function matchPlace(name: string): LibraryPlace | undefined {
  const needle = normalize(name)
  if (!needle) return undefined
  const exact = libraryPlaces.find((place) =>
    place.aliases.some((alias) => normalize(alias) === needle)
  )
  if (exact) return exact
  return libraryPlaces.find(
    (place) =>
      place.aliases.some((alias) => {
        const token = normalize(alias)
        return token.length >= 2 && (needle.includes(token) || token.includes(needle))
      })
  )
}

export function areaClusterOrder(area: string): number {
  return AREA_ORDER[area] ?? 500
}

export function outfitCatalogForDay(dayNumber: number) {
  return catalogDays.find((day) => day.dayNumber === dayNumber)?.outfit
}

export function catalogDayByNumber(dayNumber: number) {
  return catalogDays.find((day) => day.dayNumber === dayNumber)
}
