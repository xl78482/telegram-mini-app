import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function GET() {
  try {
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
        id: p.id, name: p.name, description: p.description,
        price: p.price.toString(), stock: p.stock, category: p.category,
        sales: p.sales, images: p.images, sortOrder: p.sortOrder,
        isActive: p.isActive, createdAt: p.createdAt, updatedAt: p.updatedAt,
        specs: p.specs.map(s => ({ ...s, price: s.price.toString() })),
        cardStats,
      }
    })
    return NextResponse.json(result)
  } catch (e) {
    console.error('[GET /api/admin/products]', e)
    return NextResponse.json({ error: '商品列表获取失败，请检查数据库连接' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth()
    const body = await req.json()

    const name = body.name?.trim()
    if (!name) {
      return NextResponse.json({ error: '商品名必填' }, { status: 400 })
    }

    let price: Prisma.Decimal
    try {
      price = new Prisma.Decimal(String(body.price ?? ''))
    } catch {
      return NextResponse.json({ error: '价格必须为有效数字' }, { status: 400 })
    }
    if (price.lt(0)) {
      return NextResponse.json({ error: '价格不能小于 0' }, { status: 400 })
    }

    const sortOrder = Number(body.sortOrder ?? 0)
    if (!Number.isFinite(sortOrder)) {
      return NextResponse.json({ error: '排序值必须为有效数字' }, { status: 400 })
    }

    // images: 空字符串保存为 null
    let images: string | null = null
    const rawImages = body.images
    if (rawImages && typeof rawImages === 'string' && rawImages.trim()) {
      // 支持两种格式：JSON 数组 或 多行文本（每行一个 URL）
      const trimmed = rawImages.trim()
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed)
          images = Array.isArray(parsed) ? JSON.stringify(parsed.filter(Boolean)) : null
        } catch {
          images = null
        }
      } else {
        const urls = trimmed.split('\n').map((u: string) => u.trim()).filter(Boolean)
        images = JSON.stringify(urls)
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: body.description?.trim() || null,
        price,
        stock: 0,
        images,
        category: body.category?.trim() || null,
        sortOrder,
        isActive: body.isActive ?? true,
      },
    })
    return NextResponse.json(
      { ...product, price: product.price.toString() },
      { status: 201 }
    )
  } catch (e) {
    console.error('[POST /api/admin/products]', e)
    const msg = e instanceof Error ? e.message : '未知错误'
    return NextResponse.json({ error: `商品创建失败: ${msg}` }, { status: 500 })
  }
}
