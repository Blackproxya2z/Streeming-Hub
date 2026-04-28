import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const orders = await db.order.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const order = await db.order.create({
      data: {
        productName: body.productName,
        customerName: body.customerName,
        whatsappNumber: body.whatsappNumber,
        email: body.email || null,
        planDuration: body.planDuration || null,
        accountType: body.accountType || null,
        quantity: body.quantity || 1,
        notes: body.notes || null,
        paymentMethod: body.paymentMethod || null,
        transactionLast3: body.transactionLast3 || null,
        status: 'Pending',
      },
    })
    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
