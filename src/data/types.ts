export type WalkingLevel = "light" | "moderate" | "heavy"

export type Platform = "xiaohongshu" | "douyin" | "instagram"

export type Evidence = {
  id: string
  platform: Platform
  url: string
  caption: string
  quote: string
  imageSrc: string
  imageAlt: string
  isSample: boolean
  /** 公开页打不开或只有标题，链接仍保留 */
  partialRead?: boolean
  collectedBy?: "paste" | "search"
}

export type Shop = {
  id: string
  name: string
  category: string
  hours: string
  note: string
  whatToLookFor: string
  evidence: Evidence[]
}

export type MustBuy = {
  id: string
  name: string
  reason: string
  budget: string
  tip: string
  evidence: Evidence[]
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
  evidence: Evidence[]
}

export type Outfit = {
  summary: string
  pieces: string[]
  why: string
  shoes: string
  bag: string
  colors: string[]
  avoid: string
  evidence: Evidence[]
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
  sourceText: string
  isSampleRoute: boolean
  days: Day[]
}

export const walkingLevelLabel: Record<WalkingLevel, string> = {
  light: "少走",
  moderate: "适中",
  heavy: "暴走",
}

export const platformLabel: Record<Platform, string> = {
  xiaohongshu: "小红书",
  douyin: "抖音",
  instagram: "Instagram",
}

export type DraftStop = {
  raw: string
  name: string
  time?: string
  area?: string
  category?: string
  note?: string
  imageSrc?: string
}

export type DraftDay = {
  dayNumber: number
  label: string
  stops: DraftStop[]
}

export type DraftRoute = {
  days: DraftDay[]
}
