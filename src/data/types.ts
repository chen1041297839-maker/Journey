export type WalkingLevel = "light" | "moderate" | "heavy"

export type TimeBlock = "morning" | "noon" | "afternoon" | "evening" | "night" | "optional"

export const timeBlockLabel: Record<TimeBlock, string> = {
  morning: "上午",
  noon: "中午",
  afternoon: "下午",
  evening: "傍晚",
  night: "晚上",
  optional: "可选",
}

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
  /** 评论不在公开 HTML 里（登录墙 / 仅 App） */
  commentsGated?: boolean
  /** 有用清单只在后续配图，公开页封面读不到 */
  imageListPartial?: boolean
}

export type Warning = {
  id: string
  text: string
  kind: "雷" | "注意"
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
  timeBlock?: TimeBlock
  optional?: boolean
  shops: Shop[]
  mustBuys: MustBuy[]
  photoSpots: PhotoSpot[]
  warnings: Warning[]
  /** 这一站公开页读不到评论 */
  commentsGated?: boolean
  /** 配图清单网页读不全 */
  imageListPartial?: boolean
  readFlags?: string[]
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
  planNote?: string
  rawStopNames?: string[]
  outfit: Outfit
  stops: Stop[]
}

export type PlanChange = {
  dayTitle: string
  why: string
  keep: string[]
  apply: string[]
}

export type PlanProposal = {
  summary: string
  changes: PlanChange[]
  importedDays: Day[]
  suggestedDays: Day[]
}

export type PlanMode = "imported" | "suggested"

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
  planMode?: PlanMode
  proposal?: PlanProposal
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
  timeBlock?: TimeBlock
  optional?: boolean
}

export type DraftDay = {
  dayNumber: number
  label: string
  stops: DraftStop[]
  planNote?: string
  rawStopNames?: string[]
}

export type DraftRoute = {
  days: DraftDay[]
}
