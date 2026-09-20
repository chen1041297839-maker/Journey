export type WalkingLevel = "light" | "moderate" | "heavy"

export type Shop = {
  id: string
  name: string
  category: string
  hours: string
  note: string
  whatToLookFor: string
}

export type MustBuy = {
  id: string
  name: string
  reason: string
  budget: string
  tip: string
}

export type ShotComposition = {
  sky: string
  subject: string
  foreground: string
  palette: [string, string, string]
}

export type PhotoSpot = {
  id: string
  title: string
  standWhere: string
  angle: string
  shotLooksLike: string
  bestTime: string
  lens: string
  avoid: string
  composition: ShotComposition
}

export type XhsRef = {
  id: string
  caption: string
  poseTips: string
  outfitNotes: string
  vibe: string
  /** 以后可粘贴小红书笔记链接，当前为精选模拟内容，不会抓取小红书 */
  url?: string
}

export type Outfit = {
  summary: string
  pieces: string[]
  why: string
  shoes: string
  bag: string
  colors: string[]
  avoid: string
}

export type Stop = {
  id: string
  order: number
  name: string
  nameJa: string
  area: string
  arrive: string
  duration: string
  vibe: string
  note: string
  shops: Shop[]
  mustBuys: MustBuy[]
  photoSpots: PhotoSpot[]
  xhsRefs: XhsRef[]
}

export type Day = {
  id: string
  dayNumber: number
  date: string
  weekday: string
  title: string
  theme: string
  weatherVibe: string
  walkingLevel: WalkingLevel
  walkingNote: string
  neighborhoodStyle: string
  routeSummary: string[]
  outfit: Outfit
  stops: Stop[]
}

export type Trip = {
  id: string
  traveler: string
  title: string
  destination: string
  datesLabel: string
  startDate: string
  endDate: string
  intro: string
  sourceNote: string
  days: Day[]
}

export const walkingLevelLabel: Record<WalkingLevel, string> = {
  light: "少走",
  moderate: "适中",
  heavy: "暴走",
}
