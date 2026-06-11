import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAuth()
  try {
    const body = await req.json()
    // 不允许直接修改 sales
    const { sales: _sales, stock: _stock, ...rest } = body
    void _sales
    void _stock
    const product = await prisma.product.update({
      where: { id: Number(params.id) },
      data: {
        name: rest.name,
        description: rest.description ?? null,
        price: Number(rest.price),
        images: rest.images ?? null,
        category: rest.category ?? null,
        sortOrder: Number(rest.sortOrder ?? 0),
        isActive: rest.isActive,
      },
    })
    return NextResponse.json({ ...product, price: product.price.toString() })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAuth()
  await prisma.product.update({
    where: { id: Number(params.id) },
    data: { isActive: false },
  })
  return NextResponse.json({ ok: true })
}
