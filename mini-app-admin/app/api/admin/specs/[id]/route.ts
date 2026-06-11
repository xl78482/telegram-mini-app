import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const specId = Number(params.id)
    if (!Number.isInteger(specId) || specId < 1) {
      return NextResponse.json({ error: '规格 ID 不正确' }, { status: 400 })
    }

    const body = await req.json()
    // 不允许直接修改 stock，由卡密库存同步
    const { stock: _stock, ...rest } = body
    void _stock

    const name = rest.name?.trim()
    if (!name) return NextResponse.json({ error: '规格名称必填' }, { status: 400 })

    let price: Prisma.Decimal
    try {
      price = new Prisma.Decimal(String(rest.price ?? ''))
    } catch {
      return NextResponse.json({ error: '规格价格必须为有效数字' }, { status: 400 })
    }
    if (price.lt(0)) return NextResponse.json({ error: '规格价格不能小于 0' }, { status: 400 })

    const sortOrder = Number(rest.sortOrder ?? 0)
    if (!Number.isFinite(sortOrder)) {
      return NextResponse.json({ error: '排序值必须为有效数字' }, { status: 400 })
    }

    const spec = await prisma.productSpec.update({
      where: { id: specId },
      data: {
        name,
        price,
        sortOrder,
        isActive: rest.isActive ?? true,
      },
    })
    return NextResponse.json({ ...spec, price: spec.price.toString() })
  } catch (e) {
    console.error('[PUT /api/admin/specs/:id]', e)
    const msg = e instanceof Error ? e.message : '规格更新失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const specId = Number(params.id)
    if (!Number.isInteger(specId) || specId < 1) {
      return NextResponse.json({ error: '规格 ID 不正确' }, { status: 400 })
    }

    // 检查是否还有 AVAILABLE 或 LOCKED 卡密
    const activeCards = await prisma.cardSecret.count({
      where: { specId, status: { in: ['AVAILABLE', 'LOCKED'] } },
    })
    if (activeCards > 0) {
      return NextResponse.json(
        { error: '该规格下仍有可用或锁定卡密，不能删除' },
        { status: 400 }
      )
    }

    await prisma.productSpec.update({
      where: { id: specId },
      data: { isActive: false },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[DELETE /api/admin/specs/:id]', e)
    const msg = e instanceof Error ? e.message : '规格删除失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
