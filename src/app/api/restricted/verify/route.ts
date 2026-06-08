import { NextRequest, NextResponse } from 'next/server'
import { verifyPin, createRestrictedToken } from '@/lib/restricted'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()
    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'PIN required' }, { status: 400 })
    }

    if (!verifyPin(pin)) {
      return NextResponse.json({ error: 'Invalid PIN', success: false }, { status: 401 })
    }

    const token = createRestrictedToken()
    const response = NextResponse.json({ success: true })

    response.cookies.set({
      name: 'restricted_access',
      value: token.value,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: token.maxAge,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
