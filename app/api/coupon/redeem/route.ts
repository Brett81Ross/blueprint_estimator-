import { NextRequest, NextResponse } from 'next/server'
import { createProAccessToken, PRO_COOKIE } from '../../../../lib/pro-access'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CACTUSBYTE_ORIGIN = 'https://cactusbyte-studios.vercel.app'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const code = typeof body?.code === 'string' ? body.code.trim() : ''
    if (!/^RT-PRO-[A-Z0-9]{4}(?:-[A-Z0-9]{4}){3}$/i.test(code)) {
      return NextResponse.json({ ok: false, error: 'Enter a valid Rapid Takeoff coupon code.' }, { status: 400 })
    }

    const issueResponse = await fetch(`${CACTUSBYTE_ORIGIN}/api/coupons/rapid-takeoff/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      cache: 'no-store',
    })
    const issue = await issueResponse.json().catch(() => ({}))
    if (!issueResponse.ok || typeof issue?.token !== 'string') {
      return NextResponse.json({ ok: false, error: String(issue?.error || 'Coupon verification failed.') }, { status: issueResponse.status || 502 })
    }

    const verifyResponse = await fetch(`${CACTUSBYTE_ORIGIN}/api/tester/consume-app-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId: 'rapid-takeoff', token: issue.token }),
      cache: 'no-store',
    })
    if (!verifyResponse.ok) {
      return NextResponse.json({ ok: false, error: 'Coupon activation could not be completed.' }, { status: 502 })
    }

    const response = NextResponse.json({ ok: true, pro: true, status: 'lifetime' }, { headers: { 'Cache-Control': 'no-store' } })
    response.cookies.set(PRO_COOKIE, createProAccessToken(), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365 * 10,
    })
    return response
  } catch (error) {
    console.error('Rapid Takeoff coupon redemption failed', error)
    return NextResponse.json({ ok: false, error: 'Coupon redemption is temporarily unavailable.' }, { status: 500 })
  }
}
