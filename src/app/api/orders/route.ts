import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Static data - return empty array (orders are not stored in JSON)
    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Static data - return mock order (not persisted)
    return NextResponse.json({
      ...body,
      id: `order-${Date.now()}`,
      status: 'Pending',
      quantity: body.quantity || 1,
      createdAt: new Date().toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
