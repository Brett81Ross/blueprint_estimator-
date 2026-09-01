import { NextRequest, NextResponse } from 'next/server'
import { createProAccessToken, PRO_COOKIE } from '../../../../lib/pro-access'
import { consumeProRestoreToken, validRecoveryToken } from '../../../../lib/pro-recovery'

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
  try {
    await consumeProRestoreToken(token)
    const response = redirect(request, 'restored')
    response.cookies.set(PRO_COOKIE, createProAccessToken(), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365 * 10,
    })
    return response
  } catch (error) {
    console.error('Rapid Takeoff Pro restore failed', error)
    return redirect(request, 'restore-failed')
  }
}
