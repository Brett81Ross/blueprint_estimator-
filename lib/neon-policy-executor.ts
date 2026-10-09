import { Pool } from '@neondatabase/serverless'
import type { SqlExecutor, SqlQuery } from './postgres-policy-store'

function connectionString() {
  const value = process.env.RAPID_DATABASE_URL
  if (!value) throw new Error('RAPID_DATABASE_URL is not configured')
  return value
}

type QueryResult = { rows: unknown[] }
type TransactionClient = {
  query(text: string, params?: unknown[]): Promise<QueryResult>
  release(): void
}
type PoolLike = {
  connect(): Promise<TransactionClient>
  end(): Promise<void>
}
type PoolFactory = () => PoolLike

function defaultPoolFactory(): PoolLike {
  return new Pool({ connectionString: connectionString() }) as unknown as PoolLike
}

/**
 * Rapid Takeoff's isolated Neon executor.
 *
 * Each transaction creates and closes its own Pool. A policy store can execute
 * multiple sequential transactions during one request (admission, provider
 * reservation, result recording) without attempting to reuse a Pool that a
 * previous transaction already ended.
 */
export function neonPolicyExecutor(createPool: PoolFactory = defaultPoolFactory): SqlExecutor {
  return {
    async transaction<T>(work: (sql: SqlQuery) => Promise<T>): Promise<T> {
      const pool = createPool()
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        const sql: SqlQuery = async <R = Record<string, unknown>>(text: string, params?: unknown[]) => {
          const result = await client.query(text, params)
          return { rows: result.rows as R[] }
        }
        const value = await work(sql)
        await client.query('COMMIT')
        return value
      } catch (error) {
        try {
          await client.query('ROLLBACK')
        } catch {
          // Preserve the original transaction failure.
        }
        throw error
      } finally {
        client.release()
        await pool.end()
      }
    },
  }
}
