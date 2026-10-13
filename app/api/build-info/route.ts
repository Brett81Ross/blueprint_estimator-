import { NextResponse } from 'next/server'
import { RAPID_TAKEOFF_VERSION } from '../../../lib/app-version'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      app: 'Rapid Takeoff',
      version: RAPID_TAKEOFF_VERSION,
      sha: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
