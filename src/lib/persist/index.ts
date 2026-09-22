import { createHash } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import type { Trip } from "@/data/types"
import { getTrip } from "@/data"
import { hydrateMappedTrip, mappedSignature } from "@/lib/map-insert"
import { applyXeniaResearch, researchSignature } from "@/lib/research"
import {
  isPostgresConfigured,
  isVercelRuntime,
  type JourneyAdapter,
  type StoredBlob,
} from "@/lib/persist/adapter"
import { postgresAdapter } from "@/lib/persist/postgres"
import { sqliteAdapter } from "@/lib/persist/sqlite"

const PUBLIC_UPLOADS = join(process.cwd(), "public", "uploads")

let adapter: JourneyAdapter | null = null
let tripChain = Promise.resolve()
let fileChain = Promise.resolve()

function getAdapter(): JourneyAdapter {
  if (adapter) return adapter
  adapter = isPostgresConfigured() ? postgresAdapter() : sqliteAdapter()
  if (!isPostgresConfigured() && isVercelRuntime()) {
    console.warn(
      "Xenia: Vercel 上没有 DATABASE_URL，行程会写到 /tmp sqlite，实例一换就丢。请配置 Neon/Postgres。"
    )
  }
  return adapter
}

function serialize<T>(queue: "trip" | "file", fn: () => Promise<T>): Promise<T> {
  const run = (queue === "trip" ? tripChain : fileChain).then(fn, fn)
  const clear = run.then(
    () => undefined,
    () => undefined
  )
  if (queue === "trip") tripChain = clear
  else fileChain = clear
  return run
}

export function filePublicSrc(id: string): string {
  return `/api/files/${encodeURIComponent(id)}`
}

function writePublicCopy(id: string, bytes: Buffer) {
  if (isVercelRuntime()) return
  try {
    mkdirSync(PUBLIC_UPLOADS, { recursive: true })
    writeFileSync(join(PUBLIC_UPLOADS, id), bytes)
  } catch (error) {
    console.warn("Xenia: 写 public/uploads 失败，仍已写入数据库。", error)
  }
}

export async function loadSharedTrip(): Promise<Trip> {
  return serialize("trip", async () => {
    const stored = await getAdapter().loadTrip()
    const seeded = stored || getTrip()
    const next = applyXeniaResearch(hydrateMappedTrip(seeded))
    if (
      !stored ||
      mappedSignature(seeded) !== mappedSignature(next) ||
      researchSignature(seeded) !== researchSignature(next)
    ) {
      await getAdapter().saveTrip(next)
    }
    return next
  })
}

export async function saveSharedTrip(trip: Trip): Promise<Trip> {
  return serialize("trip", async () => {
    await getAdapter().saveTrip(trip)
    return trip
  })
}

export async function mutateSharedTrip(
  mutator: (trip: Trip) => Trip | Promise<Trip>
): Promise<Trip> {
  return serialize("trip", async () => {
    const current = applyXeniaResearch(
      hydrateMappedTrip((await getAdapter().loadTrip()) || getTrip())
    )
    const next = applyXeniaResearch(hydrateMappedTrip(await mutator(current)))
    await getAdapter().saveTrip(next)
    return next
  })
}

export async function putStoredImage(
  bytes: Buffer,
  mime: string,
  ext: string,
  hint = "img"
): Promise<string> {
  const hash = createHash("sha1").update(bytes).digest("hex").slice(0, 16)
  const safeHint = hint.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 40) || "img"
  const id = `${safeHint}-${hash}.${ext}`
  const file: StoredBlob = { id, mime, ext, bytes }
  await serialize("file", async () => {
    await getAdapter().putFile(file)
  })
  writePublicCopy(id, bytes)
  return filePublicSrc(id)
}

export async function getStoredImage(id: string): Promise<StoredBlob | null> {
  return getAdapter().getFile(id)
}

export async function listStoredImageUrls(prefix: string): Promise<string[]> {
  const ids = await getAdapter().listFileIds(prefix)
  return ids.map(filePublicSrc)
}

export function persistBackendLabel(): "postgres" | "sqlite" {
  return isPostgresConfigured() ? "postgres" : "sqlite"
}
