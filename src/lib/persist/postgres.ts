import { Pool, type PoolClient } from "pg"
import type { Trip } from "@/data/types"
import {
  asBuffer,
  JOURNEY_ID,
  parseTripJson,
  type JourneyAdapter,
  type StoredBlob,
} from "@/lib/persist/adapter"

let pool: Pool | null = null
let schemaReady: Promise<void> | null = null

function getPool(): Pool {
  if (pool) return pool
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error("缺少 DATABASE_URL")
  const local = /localhost|127\.0\.0\.1/.test(connectionString)
  pool = new Pool({
    connectionString,
    max: 4,
    ssl: local ? undefined : { rejectUnauthorized: false },
  })
  return pool
}

async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
}

async function ensureSchema(): Promise<void> {
  if (schemaReady) return schemaReady
  schemaReady = withClient(async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS journey (
        id TEXT PRIMARY KEY,
        trip_json JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        mime TEXT NOT NULL,
        ext TEXT NOT NULL,
        bytes BYTEA NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `)
  }).catch((error) => {
    schemaReady = null
    throw error
  })
  return schemaReady
}

export function postgresAdapter(): JourneyAdapter {
  return {
    async loadTrip() {
      await ensureSchema()
      return withClient(async (client) => {
        const result = await client.query<{ trip_json: unknown }>(
          "SELECT trip_json FROM journey WHERE id = $1",
          [JOURNEY_ID]
        )
        return parseTripJson(result.rows[0]?.trip_json)
      })
    },
    async saveTrip(trip: Trip) {
      await ensureSchema()
      await withClient(async (client) => {
        await client.query(
          `INSERT INTO journey (id, trip_json, updated_at)
           VALUES ($1, $2::jsonb, now())
           ON CONFLICT (id) DO UPDATE SET trip_json = EXCLUDED.trip_json, updated_at = now()`,
          [JOURNEY_ID, JSON.stringify(trip)]
        )
      })
    },
    async putFile(file: StoredBlob) {
      await ensureSchema()
      await withClient(async (client) => {
        await client.query(
          `INSERT INTO files (id, mime, ext, bytes, created_at)
           VALUES ($1, $2, $3, $4, now())
           ON CONFLICT (id) DO UPDATE SET mime = EXCLUDED.mime, ext = EXCLUDED.ext, bytes = EXCLUDED.bytes`,
          [file.id, file.mime, file.ext, file.bytes]
        )
      })
    },
    async getFile(id: string) {
      await ensureSchema()
      return withClient(async (client) => {
        const result = await client.query<{ id: string; mime: string; ext: string; bytes: unknown }>(
          "SELECT id, mime, ext, bytes FROM files WHERE id = $1",
          [id]
        )
        const row = result.rows[0]
        if (!row) return null
        return { id: row.id, mime: row.mime, ext: row.ext, bytes: asBuffer(row.bytes) }
      })
    },
    async listFileIds(prefix: string) {
      await ensureSchema()
      return withClient(async (client) => {
        const result = await client.query<{ id: string }>(
          "SELECT id FROM files WHERE id LIKE $1 ORDER BY created_at",
          [`${prefix}%`]
        )
        return result.rows.map((row) => row.id)
      })
    },
  }
}
