import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { syncProductStock } from '@/lib/stock'

export async function GET(req: NextRequest) {
  await requireAuth()
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId') ? Number(searchParams.get('productId')) : undefined
  const specId = searchParams.get('specId') ? Number(searchParams.get('specId')) : undefined
  const status = searchParams.get('status') as 'AVAILABLE' | 'LOCKED' | 'SOLD' | 'DISABLED' | null
  const keyword = searchParams.get('keyword') ?? ''
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? 20)))

  const where: Record<string, unknown> = {}
  if (productId) where.productId = productId
  if (specId) where.specId = specId
  if (status) where.status = status
  if (keyword) where.content = { contains: keyword }

  const [total, list] = await Promise.all([
    prisma.cardSecret.count({ where }),
    prisma.cardSecret.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        product: { select: { name: true } },
        spec: { select: { name: true } },
      },
    }),
  ])

  return NextResponse.json({
    list: list.map(c => ({
      id: c.id,
      productId: c.productId,
      productName: c.product.name,
      specId: c.specId,
      specName: c.spec?.name ?? null,
      content: c.content,
      status: c.status,
      lockedOrderId: c.lockedOrderId,
      soldOrderId: c.soldOrderId,
      soldToUserId: c.soldToUserId,
      lockedAt: c.lockedAt,
      soldAt: c.soldAt,
      createdAt: c.createdAt,
    })),
    total,
    page,
    pageSize,
  })
}

export async function POST(req: NextRequest) {
  await requireAuth()
  try {
    const body = await req.json()
    const productId = Number(body.productId)
    if (!Number.isInteger(productId) || productId < 1) {
      return NextResponse.json({ error: 'productId 必填且必须为有效数字' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { specs: { where: { isActive: true }, select: { id: true, productId: true } } },
    })
    if (!product) return NextResponse.json({ error: '商品不存在' }, { status: 404 })

    const specId = body.specId == null || body.specId === '' ? null : Number(body.specId)
    if (specId !== null && (!Number.isInteger(specId) || specId < 1)) {
      return NextResponse.json({ error: 'specId 必须为有效数字' }, { status: 400 })
    }

    if (product.specs.length > 0) {
      if (specId === null) {
        return NextResponse.json({ error: '该商品有规格，导入卡密时必须选择规格' }, { status: 400 })
      }
      const specBelongsToProduct = product.specs.some(spec => spec.id === specId && spec.productId === productId)
      if (!specBelongsToProduct) {
        return NextResponse.json({ error: '规格不存在、已停用或不属于该商品' }, { status: 400 })
      }
    } else if (specId !== null) {
      return NextResponse.json({ error: '该商品没有规格，不能选择规格导入卡密' }, { status: 400 })
    }

    const rawContent: string = body.content ?? ''

    // 拆分、trim、去空行、批次内去重
    const lines = rawContent
      .split('\n')
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0)
    const unique = [...new Set(lines)]

    if (unique.length === 0) {
      return NextResponse.json({ error: '没有有效卡密内容' }, { status: 400 })
    }

    // 查出已存在的
    const existing = await prisma.cardSecret.findMany({
      where: { content: { in: unique } },
      select: { content: true },
    })
    const existingSet = new Set(existing.map(e => e.content))

    const toInsert = unique.filter(c => !existingSet.has(c))
    const skipped = unique.length - toInsert.length

    if (toInsert.length > 0) {
      await prisma.cardSecret.createMany({
        data: toInsert.map(content => ({
          productId,
          specId,
          content,
          status: 'AVAILABLE' as const,
        })),
        skipDuplicates: true,
      })
    }

    // 同步库存
    await syncProductStock(productId, specId)

    return NextResponse.json({
      imported: toInsert.length,
      skipped,
      total: unique.length,
    }, { status: 201 })
  } catch (e) {
    console.error('[POST /api/admin/cards]', e)
    return NextResponse.json({ error: '卡密导入失败' }, { status: 500 })
  }
}
