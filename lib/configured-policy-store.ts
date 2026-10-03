import { unavailablePolicyStore, type AnalysisPolicyStore } from './analysis-policy'
import { neonPolicyExecutor } from './neon-policy-executor'
import { postgresPolicyStore } from './postgres-policy-store'

/**
 * Central Batch 0 policy-store selection.
 * Missing durable configuration never falls back to memory or permissive mode.
 */
export function configuredPolicyStore(): AnalysisPolicyStore {
  if (!process.env.RAPID_DATABASE_URL) return unavailablePolicyStore()
  return postgresPolicyStore(neonPolicyExecutor())
}
