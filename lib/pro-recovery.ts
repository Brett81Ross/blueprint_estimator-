import { createHmac } from 'node:crypto'

const CACTUSBYTE_ORIGIN = 'https://cactusbyte-studios.vercel.app'

function bridgeSecret() {
  const value = (process.env.RAPID_RECOVERY_BRIDGE_SECRET || '').trim()
  if (!value) throw new Error('RAPID_RECOVERY_BRIDGE_SECRET is not configured')
  return value
}

export function validRecoveryToken(token: string) {
  return /^[A-Za-z0-9_-]{40,128}$/.test(token)
}

export function createLegacyClaimAttestation(token: string) {
  if (!validRecoveryToken(token)) throw new Error('Invalid recovery token')
  return createHmac('sha256', bridgeSecret()).update(`rapid-takeoff:claim:${token}`).digest('base64url')
}

async function postCactusByte(path: string, body: Record<string, string>) {
  const response = await fetch(`${CACTUSBYTE_ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(String(data?.error || 'CactusByte recovery verification failed.'))
  return data
}

export async function confirmLegacyProClaim(token: string) {
  return postCactusByte('/api/rapid-takeoff/recovery/confirm-claim', {
    token,
    attestation: createLegacyClaimAttestation(token),
  })
}

export async function consumeProRestoreToken(token: string) {
  if (!validRecoveryToken(token)) throw new Error('Invalid recovery token')
  return postCactusByte('/api/rapid-takeoff/recovery/consume-restore', { token })
}
