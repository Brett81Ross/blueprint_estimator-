import { Pool } from '@neondatabase/serverless'
import type { SqlExecutor, SqlQuery } from './postgres-policy-store'

function connectionString() {
  const value = process.env.RAPID_DATABASE_URL
  if (!value) throw new Error('RAPID_DATABASE_URL is not configured')
  return value
}

/**
 * Rapid Takeoff's isolated Neon executor.
 * A fresh Pool is scoped to the serverless invocation; each policy operation
 * checks out one client so BEGIN/COMMIT and SELECT ... FOR UPDATE stay on the
 * same database session.
 */
export function neonPolicyExecutor(): SqlExecutor {
  const pool = new Pool({ connectionString: connectionString() })

  return {
    async transaction<T>(work: (sql: SqlQuery) => Promise<T>): Promise<T> {
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
