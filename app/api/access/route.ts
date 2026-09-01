import { NextRequest, NextResponse } from 'next/server'
import { PRO_COOKIE, verifyProAccessToken } from '../../../lib/pro-access'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const pro = verifyProAccessToken(request.cookies.get(PRO_COOKIE)?.value)
  return NextResponse.json({ pro, status: pro ? 'lifetime' : 'free' }, { headers: { 'Cache-Control': 'no-store' } })
}
