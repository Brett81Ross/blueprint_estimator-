import { NextRequest, NextResponse } from 'next/server'
import { PRO_COOKIE, verifyProAccessToken } from '../../../../lib/pro-access'
import { confirmLegacyProClaim, validRecoveryToken } from '../../../../lib/pro-recovery'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function redirect(request: NextRequest, status: string) {
  const url = request.nextUrl.clone()
  url.pathname = '/'
  url.search = ''
  url.searchParams.set('recovery', status)
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')?.trim() || ''
  if (!validRecoveryToken(token)) return redirect(request, 'invalid-link')
  if (!verifyProAccessToken(request.cookies.get(PRO_COOKIE)?.value)) return redirect(request, 'claim-required')
  try {
    await confirmLegacyProClaim(token)
    return redirect(request, 'linked')
  } catch (error) {
    console.error('Rapid Takeoff legacy Pro claim failed', error)
    return redirect(request, 'claim-failed')
  }
}
