import type { Day } from "../types"
import { day1 } from "./day-1"
import { day2 } from "./day-2"
import { day3 } from "./day-3"
import { day4 } from "./day-4"
import type { Trip } from "../types"

/**
 * 示例行程：Hologrow 的东京四日手帐。
 * 之后若换成圆周轨迹 / 高德里的真实路线，保持 `Trip` 类型，替换本文件的组装与各日模块即可。
 */
export const tokyoTrip: Trip = {
  id: "hologrow-tokyo-2026-10",
  traveler: "Hologrow",
  title: "Hologrow 的东京手帐",
  destination: "东京",
  datesLabel: "10.16 – 10.19",
  startDate: "2026-10-16",
  endDate: "2026-10-19",
  intro:
    "路线骨架来自小红书收藏、高德和圆周轨迹。那些工具只记得地点和怎么走。这本手帐补上每一站的店、必买、机位，以及那天该怎么穿。",
  sourceNote:
    "店铺与机位为出行前整理的精选内容；穿搭参考是按当日路线、天气感和街区气质写的模拟笔记，不是从小红书抓取。以后可把笔记链接贴进对应卡片。",
  days: [day1, day2, day3, day4],
}

export const tokyoDays: Day[] = tokyoTrip.days
