export type CatalogWalkingLevel = "light" | "moderate" | "heavy"

export type CatalogShop = {
  id: string
  name: string
  category: string
  hours: string
  note: string
  whatToLookFor: string
}

export type CatalogMustBuy = {
  id: string
  name: string
  reason: string
  budget: string
  tip: string
}

export type CatalogPhotoSpot = {
  id: string
  title: string
  standWhere: string
  angle: string
  shotLooksLike: string
  bestTime: string
  lens: string
  avoid: string
  composition: {
    sky: string
    subject: string
    foreground: string
    palette: [string, string, string]
  }
}

export type CatalogXhsRef = {
  id: string
  caption: string
  poseTips: string
  outfitNotes: string
  vibe: string
  url?: string
}

export type CatalogOutfit = {
  summary: string
  pieces: string[]
  why: string
  shoes: string
  bag: string
  colors: string[]
  avoid: string
}

export type CatalogStop = {
  id: string
  order: number
  name: string
  nameJa: string
  area: string
  arrive: string
  duration: string
  vibe: string
  note: string
  shops: CatalogShop[]
  mustBuys: CatalogMustBuy[]
  photoSpots: CatalogPhotoSpot[]
  xhsRefs: CatalogXhsRef[]
}

export type CatalogDay = {
  id: string
  dayNumber: number
  date: string
  weekday: string
  title: string
  theme: string
  weatherVibe: string
  walkingLevel: CatalogWalkingLevel
  walkingNote: string
  neighborhoodStyle: string
  routeSummary: string[]
  outfit: CatalogOutfit
  stops: CatalogStop[]
}
