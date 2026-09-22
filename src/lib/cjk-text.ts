const CJK = String.raw`\u3400-\u9fff\uF900-\uFAFF\u3000-\u303f\uff00-\uffef`
const CJK_CHAR = new RegExp(`[${CJK}]`)
const BETWEEN_CJK = new RegExp(`([${CJK}])(?:[\\s\\u00a0\\u200b\\u200c\\u200d\\ufeff]|[\\n\\r])+(?=[${CJK}])`, "g")
const CJK_THEN_PUNCT = new RegExp(`([${CJK}])[ \\t\\u00a0]+([，。：；、！？,.])`, "g")
const PUNCT_THEN_CJK = new RegExp(`([，。：；、！？,.])[ \\t\\u00a0]+([${CJK}])`, "g")

const TEXT_KEYS = new Set([
  "name",
  "nameJa",
  "note",
  "reason",
  "tip",
  "why",
  "text",
  "whatToLookFor",
  "quote",
  "caption",
  "summary",
  "address",
  "theme",
  "walkingNote",
  "neighborhoodStyle",
  "planNote",
  "intro",
  "sourceNote",
  "standWhere",
  "angle",
  "shotLooksLike",
  "avoid",
  "lens",
  "bestTime",
  "hours",
  "budget",
  "category",
  "title",
  "vibe",
  "area",
  "branchName",
  "nearStopName",
  "weatherVibe",
  "datesLabel",
])

/** 去掉汉字之间被 OCR 塞进去的空格 / 换行，避免界面一字一行。 */
export function cleanCjkText(value: string): string {
  if (!value) return value
  let next = value.replace(BETWEEN_CJK, "$1")
  next = next.replace(CJK_THEN_PUNCT, "$1$2")
  next = next.replace(PUNCT_THEN_CJK, "$1$2")
  next = next.replace(/[ \t\u00a0]{2,}/g, " ")
  next = next.replace(/\n{3,}/g, "\n\n")
  return next.trim()
}

export function looksLikeCjk(value: string): boolean {
  return CJK_CHAR.test(value)
}

export function cleanTripCopy<T>(value: T): T {
  if (typeof value === "string") return cleanCjkText(value) as T
  if (Array.isArray(value)) return value.map((item) => cleanTripCopy(item)) as T
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, item]) => {
      if (key === "url" || key === "imageSrc" || key === "src" || key === "id") return [key, item]
      if (typeof item === "string" && (TEXT_KEYS.has(key) || looksLikeCjk(item))) {
        return [key, cleanCjkText(item)]
      }
      return [key, cleanTripCopy(item)]
    })
    return Object.fromEntries(entries) as T
  }
  return value
}
