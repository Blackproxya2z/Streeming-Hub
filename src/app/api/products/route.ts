import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/data'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const result = getProducts({
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      categorySlug: searchParams.get('categorySlug') || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      duration: searchParams.get('duration') || undefined,
      accountType: searchParams.get('accountType') || undefined,
      sort: searchParams.get('sort') || undefined,
      isFeatured: searchParams.get('isFeatured') || undefined,
      isAdult: searchParams.get('isAdult') === 'true' ? true : searchParams.get('isAdult') === 'false' ? false : undefined,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST - Create product (not supported with static data, return success mock)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // With static JSON data, we can't persist new products on Vercel
    // Return mock success for compatibility
    return NextResponse.json({ 
      ...body, 
      id: `new-${Date.now()}`,
      slug: body.slug || body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
