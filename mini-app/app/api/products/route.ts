/* BUILD: 2026-06-11-v4 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        specs: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: { id: true, productId: true, name: true, price: true, stock: true, sortOrder: true, isActive: true },
        },
      },
    })
    return NextResponse.json(
      products.map(p => ({
        ...p,
        price: p.price.toString(),
        specs: p.specs.map(s => ({ ...s, price: s.price.toString() })),
      }))
    )
  } catch (e) {
    console.error('[GET /api/products]', e)
    return NextResponse.json(
      { error: '商品列表获取失败', message: String(e) },
      { status: 500 }
    )
  }
}
