import { NextRequest, NextResponse } from 'next/server'
import { hasRestrictedAccessFromRequest } from '@/lib/restricted'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const hasAccess = hasRestrictedAccessFromRequest(request)
  return NextResponse.json({ hasAccess })
}
