import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAuth()
  const productId = Number(params.id)
  const specs = await prisma.productSpec.findMany({
    where: { productId },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json(
    specs.map(s => ({ ...s, price: s.price.toString() }))
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAuth()
  try {
    const productId = Number(params.id)
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) return NextResponse.json({ error: '商品不存在' }, { status: 404 })

    const body = await req.json()
    if (!body.name) return NextResponse.json({ error: 'name 必填' }, { status: 400 })
    const price = Number(body.price ?? 0)
    if (price < 0) return NextResponse.json({ error: 'price 不能小于 0' }, { status: 400 })

    const spec = await prisma.productSpec.create({
      data: {
        productId,
        name: body.name,
        price,
        stock: 0,
        sortOrder: Number(body.sortOrder ?? 0),
        isActive: body.isActive ?? true,
      },
    })
    return NextResponse.json({ ...spec, price: spec.price.toString() }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
