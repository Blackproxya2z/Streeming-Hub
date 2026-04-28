import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await db.product.findUnique({
      where: { id },
      include: { category: true },
    })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const product = await db.product.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
        ...(body.image !== undefined && { image: body.image }),
        ...(body.basePriceBDT !== undefined && { basePriceBDT: body.basePriceBDT }),
        ...(body.priceOptions !== undefined && { priceOptions: JSON.stringify(body.priceOptions) }),
        ...(body.duration !== undefined && { duration: body.duration }),
        ...(body.accountType !== undefined && { accountType: body.accountType }),
        ...(body.region !== undefined && { region: body.region }),
        ...(body.warranty !== undefined && { warranty: body.warranty }),
        ...(body.deliveryTime !== undefined && { deliveryTime: body.deliveryTime }),
        ...(body.stockStatus !== undefined && { stockStatus: body.stockStatus }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
        ...(body.isBestSeller !== undefined && { isBestSeller: body.isBestSeller }),
        ...(body.isNewArrival !== undefined && { isNewArrival: body.isNewArrival }),
        ...(body.features !== undefined && { features: JSON.stringify(body.features) }),
        ...(body.order !== undefined && { order: body.order }),
      },
      include: { category: true },
    })
    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
