import { mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { DatabaseSync } from "node:sqlite"
import type { Trip } from "@/data/types"
import {
  asBuffer,
  JOURNEY_ID,
  parseTripJson,
  type JourneyAdapter,
  type StoredBlob,
} from "@/lib/persist/adapter"

function sqlitePath(): string {
  if (process.env.XENIA_SQLITE_PATH) return process.env.XENIA_SQLITE_PATH
  if (process.env.VERCEL === "1") return join("/tmp", "xenia.sqlite")
  return join(process.cwd(), "data", "xenia.sqlite")
}

let db: DatabaseSync | null = null

function getDb(): DatabaseSync {
  if (db) return db
  const path = sqlitePath()
  mkdirSync(dirname(path), { recursive: true })
  db = new DatabaseSync(path)
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS journey (
      id TEXT PRIMARY KEY,
      trip_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      mime TEXT NOT NULL,
      ext TEXT NOT NULL,
      bytes BLOB NOT NULL,
      created_at TEXT NOT NULL
    );
  `)
  return db
}

export function sqliteAdapter(): JourneyAdapter {
  return {
    async loadTrip() {
      const row = getDb()
        .prepare("SELECT trip_json FROM journey WHERE id = ?")
        .get(JOURNEY_ID) as { trip_json?: string } | undefined
      return parseTripJson(row?.trip_json)
    },
    async saveTrip(trip: Trip) {
      const now = new Date().toISOString()
      getDb()
        .prepare(
          `INSERT INTO journey (id, trip_json, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET trip_json = excluded.trip_json, updated_at = excluded.updated_at`
        )
        .run(JOURNEY_ID, JSON.stringify(trip), now)
    },
    async putFile(file: StoredBlob) {
      const now = new Date().toISOString()
      getDb()
        .prepare(
          `INSERT INTO files (id, mime, ext, bytes, created_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET mime = excluded.mime, ext = excluded.ext, bytes = excluded.bytes`
        )
        .run(file.id, file.mime, file.ext, file.bytes, now)
    },
    async getFile(id: string) {
      const row = getDb()
        .prepare("SELECT id, mime, ext, bytes FROM files WHERE id = ?")
        .get(id) as { id: string; mime: string; ext: string; bytes: unknown } | undefined
      if (!row) return null
      return { id: row.id, mime: row.mime, ext: row.ext, bytes: asBuffer(row.bytes) }
    },
    async listFileIds(prefix: string) {
      const rows = getDb()
        .prepare("SELECT id FROM files WHERE id LIKE ? ORDER BY created_at")
        .all(`${prefix}%`) as { id: string }[]
      return rows.map((row) => row.id)
    },
  }
}
