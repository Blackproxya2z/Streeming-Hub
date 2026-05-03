import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const categorySlug = searchParams.get('categorySlug') || ''
    const minPrice = searchParams.get('minPrice') || ''
    const maxPrice = searchParams.get('maxPrice') || ''
    const duration = searchParams.get('duration') || ''
    const accountType = searchParams.get('accountType') || ''
    const sort = searchParams.get('sort') || 'order'
    const isAdult = searchParams.get('isAdult') === 'true' ? true : searchParams.get('isAdult') === 'false' ? false : undefined

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (categorySlug) {
      where.category = { slug: categorySlug }
    }

    if (isAdult !== undefined) {
      where.category = { ...where.category, isAdult }
    } else if (!categorySlug) {
      where.category = { isAdult: false }
    }

    if (duration) {
      where.duration = { contains: duration }
    }

    if (accountType) {
      where.accountType = { contains: accountType }
    }

    const orderBy: any = {}
    if (sort === 'popular') {
      orderBy.order = 'asc'
    } else if (sort === 'newest') {
      orderBy.createdAt = 'desc'
    } else if (sort === 'name') {
      orderBy.name = 'asc'
    } else {
      orderBy.order = 'asc'
    }

    // Single query — no separate count
    const products = await db.product.findMany({
      where,
      include: { category: true },
      orderBy,
      take: 100,
    })

    // Price filtering in JS since basePriceBDT can be text
    let filtered = products
    if (minPrice || maxPrice) {
      filtered = products.filter(p => {
        const price = parseFloat(p.basePriceBDT)
        if (isNaN(price)) return true
        if (minPrice && price < parseFloat(minPrice)) return false
        if (maxPrice && price > parseFloat(maxPrice)) return false
        return true
      })
    }

    return NextResponse.json({
      products: filtered,
      total: filtered.length,
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const product = await db.product.create({
      data: {
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        description: body.description || '',
        categoryId: body.categoryId,
        image: body.image || null,
        basePriceBDT: body.basePriceBDT || 'Inbox Price',
        priceOptions: JSON.stringify(body.priceOptions || []),
        duration: body.duration || null,
        accountType: body.accountType || null,
        region: body.region || null,
        warranty: body.warranty || null,
        deliveryTime: body.deliveryTime || '5-20 minutes',
        stockStatus: body.stockStatus || 'Available',
        isFeatured: body.isFeatured || false,
        isBestSeller: body.isBestSeller || false,
        isNewArrival: body.isNewArrival || false,
        features: JSON.stringify(body.features || []),
        order: body.order || 0,
      },
      include: { category: true },
    })
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
