import { NextRequest, NextResponse } from 'next/server'
import { getActiveBanners } from '@/lib/data'

export async function GET() {
  try {
    const banners = getActiveBanners()
    return NextResponse.json(banners)
  } catch (error) {
    console.error('Error fetching banners:', error)
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Static data - return mock success
    return NextResponse.json({
      ...body,
      id: `new-${Date.now()}`,
      isActive: body.isActive ?? true,
      createdAt: new Date().toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating banner:', error)
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 })
  }
}
