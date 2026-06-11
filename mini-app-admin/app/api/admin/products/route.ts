import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  await requireAuth()
  const products = await prisma.product.findMany({ orderBy: { sortOrder: 'asc' } })
  return NextResponse.json(products.map(p => ({ ...p, price: p.price.toString() })))
}

export async function POST(req: NextRequest) {
  await requireAuth()
  try {
    const body = await req.json()
    const product = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description ?? null,
        price: Number(body.price),
        stock: Number(body.stock ?? 0),
        images: body.images ?? null,
        sortOrder: Number(body.sortOrder ?? 0),
        isActive: body.isActive ?? true,
      },
    })
    return NextResponse.json({ ...product, price: product.price.toString() }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
