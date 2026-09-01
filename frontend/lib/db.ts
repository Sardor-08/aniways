import { Pool } from "pg"

const globalForDb = globalThis as unknown as { aniloPool?: Pool }

export const pool =
  globalForDb.aniloPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  })

if (process.env.NODE_ENV !== "production") globalForDb.aniloPool = pool

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  values: unknown[] = [],
) {
  return pool.query<T>(text, values)
}
