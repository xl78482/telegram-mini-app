import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const productId = Number(params.id)
    if (!Number.isInteger(productId) || productId < 1) {
      return NextResponse.json({ error: '商品 ID 不正确' }, { status: 400 })
    }

    const specs = await prisma.productSpec.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(
      specs.map(s => ({ ...s, price: s.price.toString() }))
    )
  } catch (e) {
    console.error('[GET /api/admin/products/:id/specs]', e)
    return NextResponse.json({ error: '规格列表获取失败' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const productId = Number(params.id)
    if (!Number.isInteger(productId) || productId < 1) {
      return NextResponse.json({ error: '商品 ID 不正确' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) return NextResponse.json({ error: '商品不存在' }, { status: 404 })

    const body = await req.json()
    const name = body.name?.trim()
    if (!name) return NextResponse.json({ error: '规格名称必填' }, { status: 400 })

    let price: Prisma.Decimal
    try {
      price = new Prisma.Decimal(String(body.price ?? ''))
    } catch {
      return NextResponse.json({ error: '规格价格必须为有效数字' }, { status: 400 })
    }
    if (price.lt(0)) return NextResponse.json({ error: '规格价格不能小于 0' }, { status: 400 })

    const sortOrder = Number(body.sortOrder ?? 0)
    if (!Number.isFinite(sortOrder)) {
      return NextResponse.json({ error: '排序值必须为有效数字' }, { status: 400 })
    }

    const spec = await prisma.productSpec.create({
      data: {
        productId,
        name,
        price,
        stock: 0,
        sortOrder,
        isActive: body.isActive ?? true,
      },
    })
    return NextResponse.json({ ...spec, price: spec.price.toString() }, { status: 201 })
  } catch (e) {
    console.error('[POST /api/admin/products/:id/specs]', e)
    const msg = e instanceof Error ? e.message : '规格创建失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
