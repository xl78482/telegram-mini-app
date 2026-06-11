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
    // 不允许直接修改 stock，由卡密库存同步
    const { stock: _stock, ...rest } = body
    void _stock
    const spec = await prisma.productSpec.update({
      where: { id: Number(params.id) },
      data: {
        name: rest.name,
        price: Number(rest.price),
        sortOrder: Number(rest.sortOrder ?? 0),
        isActive: rest.isActive,
      },
    })
    return NextResponse.json({ ...spec, price: spec.price.toString() })
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
  try {
    const specId = Number(params.id)
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
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
