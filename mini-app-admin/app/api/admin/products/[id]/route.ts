import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth()
  try {
    const body = await req.json()
    const product = await prisma.product.update({
      where: { id: Number(params.id) },
      data: {
        name: body.name,
        description: body.description ?? null,
        price: Number(body.price),
        stock: Number(body.stock),
        images: body.images ?? null,
        sortOrder: Number(body.sortOrder ?? 0),
        isActive: body.isActive,
      },
    })
    return NextResponse.json({ ...product, price: product.price.toString() })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth()
  await prisma.product.update({ where: { id: Number(params.id) }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
