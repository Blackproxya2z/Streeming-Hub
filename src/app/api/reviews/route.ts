import { NextRequest, NextResponse } from 'next/server'
import { getApprovedReviews } from '@/lib/data'

export async function GET() {
  try {
    const reviews = getApprovedReviews()
    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Static data - return mock success
    return NextResponse.json({
      ...body,
      id: `new-${Date.now()}`,
      isApproved: body.isApproved ?? true,
      createdAt: new Date().toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
