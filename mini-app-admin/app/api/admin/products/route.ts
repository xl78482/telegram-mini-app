import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  await requireAuth()
  const products = await prisma.product.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      specs: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, productId: true, name: true, price: true, stock: true, sortOrder: true, isActive: true },
      },
      cardSecrets: { select: { status: true } },
    },
  })

  const result = products.map(p => {
    const cards = p.cardSecrets
    const cardStats = {
      total: cards.length,
      available: cards.filter(c => c.status === 'AVAILABLE').length,
      locked: cards.filter(c => c.status === 'LOCKED').length,
      sold: cards.filter(c => c.status === 'SOLD').length,
      disabled: cards.filter(c => c.status === 'DISABLED').length,
    }
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price.toString(),
      stock: p.stock,
      category: p.category,
      sales: p.sales,
      images: p.images,
      sortOrder: p.sortOrder,
      isActive: p.isActive,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      specs: p.specs.map(s => ({ ...s, price: s.price.toString() })),
      cardStats,
    }
  })

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  await requireAuth()
  try {
    const body = await req.json()
    if (!body.name) return NextResponse.json({ error: '商品名必填' }, { status: 400 })
    const product = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description ?? null,
        price: Number(body.price ?? 0),
        stock: Number(body.stock ?? 0),
        images: body.images ?? null,
        category: body.category ?? null,
        sortOrder: Number(body.sortOrder ?? 0),
        isActive: body.isActive ?? true,
      },
    })
    return NextResponse.json(
      { ...product, price: product.price.toString() },
      { status: 201 }
    )
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
