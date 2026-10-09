import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      app: 'Rapid Takeoff',
      version: '0.3.0',
      sha: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
