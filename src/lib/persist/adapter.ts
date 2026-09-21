import type { Trip } from "@/data/types"

export const JOURNEY_ID = process.env.XENIA_JOURNEY_ID || "xenia"

export type StoredBlob = {
  id: string
  mime: string
  ext: string
  bytes: Buffer
}

export type JourneyAdapter = {
  loadTrip(): Promise<Trip | null>
  saveTrip(trip: Trip): Promise<void>
  putFile(file: StoredBlob): Promise<void>
  getFile(id: string): Promise<StoredBlob | null>
  listFileIds(prefix: string): Promise<string[]>
}

export function isPostgresConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim())
}

export function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1"
}

export function asBuffer(value: unknown): Buffer {
  if (Buffer.isBuffer(value)) return value
  if (value instanceof Uint8Array) return Buffer.from(value)
  if (typeof value === "string") return Buffer.from(value, "base64")
  throw new Error("无法读取图片字节")
}

export function parseTripJson(raw: unknown): Trip | null {
  if (!raw) return null
  try {
    const parsed = typeof raw === "string" ? (JSON.parse(raw) as Trip) : (raw as Trip)
    if (!parsed?.days?.length) return null
    return parsed
  } catch {
    return null
  }
}
