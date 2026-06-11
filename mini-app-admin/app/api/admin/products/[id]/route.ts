import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Prisma } from '@prisma/client'

function parseImages(rawImages: unknown): string | null {
  if (!rawImages || typeof rawImages !== 'string' || !rawImages.trim()) return null

  const trimmed = rawImages.trim()
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      return Array.isArray(parsed) ? JSON.stringify(parsed.filter(Boolean)) : null
    } catch {
      return null
    }
  }

  const urls = trimmed.split('\n').map((u: string) => u.trim()).filter(Boolean)
  return urls.length > 0 ? JSON.stringify(urls) : null
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const productId = Number(params.id)
    if (!Number.isInteger(productId) || productId < 1) {
      return NextResponse.json({ error: '商品 ID 不正确' }, { status: 400 })
    }

    const body = await req.json()
    // 不允许直接修改 sales/stock，库存由卡密自动同步
    const { sales: _sales, stock: _stock, ...rest } = body
    void _sales
    void _stock

    const name = rest.name?.trim()
    if (!name) {
      return NextResponse.json({ error: '商品名必填' }, { status: 400 })
    }

    let price: Prisma.Decimal
    try {
      price = new Prisma.Decimal(String(rest.price ?? ''))
    } catch {
      return NextResponse.json({ error: '价格必须为有效数字' }, { status: 400 })
    }
    if (price.lt(0)) {
      return NextResponse.json({ error: '价格不能小于 0' }, { status: 400 })
    }

    const sortOrder = Number(rest.sortOrder ?? 0)
    if (!Number.isFinite(sortOrder)) {
      return NextResponse.json({ error: '排序值必须为有效数字' }, { status: 400 })
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description: rest.description?.trim() || null,
        price,
        images: parseImages(rest.images),
        category: rest.category?.trim() || null,
        sortOrder,
        isActive: rest.isActive ?? true,
      },
    })
    return NextResponse.json({ ...product, price: product.price.toString() })
  } catch (e) {
    console.error('[PUT /api/admin/products/:id]', e)
    const msg = e instanceof Error ? e.message : '商品更新失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const productId = Number(params.id)
    if (!Number.isInteger(productId) || productId < 1) {
      return NextResponse.json({ error: '商品 ID 不正确' }, { status: 400 })
    }

    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[DELETE /api/admin/products/:id]', e)
    const msg = e instanceof Error ? e.message : '商品删除失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
