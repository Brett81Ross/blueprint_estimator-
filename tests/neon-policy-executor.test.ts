import assert from 'node:assert/strict'
import test from 'node:test'
import { neonPolicyExecutor } from '../lib/neon-policy-executor'

test('Neon executor supports multiple sequential policy transactions', async () => {
  let poolsCreated = 0
  let poolsEnded = 0
  let clientsReleased = 0
  const executed: string[] = []

  const executor = neonPolicyExecutor(() => {
    poolsCreated += 1
    let ended = false
    return {
      async connect() {
        return {
          async query(text: string) {
            if (ended) throw new Error('pool already ended')
            executed.push(text)
            return { rows: [] }
          },
          release() {
            clientsReleased += 1
          },
        }
      },
      async end() {
        ended = true
        poolsEnded += 1
      },
    }
  })

  await executor.transaction(async sql => {
    await sql('select 1')
  })

  await executor.transaction(async sql => {
    await sql('select 2')
  })

  assert.equal(poolsCreated, 2)
  assert.equal(poolsEnded, 2)
  assert.equal(clientsReleased, 2)
  assert.deepEqual(executed, ['BEGIN', 'select 1', 'COMMIT', 'BEGIN', 'select 2', 'COMMIT'])
})

test('Neon executor rolls back and closes its transaction pool on failure', async () => {
  const executed: string[] = []
  let ended = false
  let released = false

  const executor = neonPolicyExecutor(() => ({
    async connect() {
      return {
        async query(text: string) {
          executed.push(text)
          return { rows: [] }
        },
        release() {
          released = true
        },
      }
    },
    async end() {
      ended = true
    },
  }))

  await assert.rejects(
    () => executor.transaction(async () => {
      throw new Error('fixture failure')
    }),
    /fixture failure/
  )

  assert.deepEqual(executed, ['BEGIN', 'ROLLBACK'])
  assert.equal(released, true)
  assert.equal(ended, true)
})
