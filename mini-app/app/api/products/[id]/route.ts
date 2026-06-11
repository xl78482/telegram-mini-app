import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        specs: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: { id: true, productId: true, name: true, price: true, stock: true, sortOrder: true, isActive: true },
        },
      },
    })
    if (!product || !product.isActive) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({
      ...product,
      price: product.price.toString(),
      specs: product.specs.map(s => ({ ...s, price: s.price.toString() })),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
