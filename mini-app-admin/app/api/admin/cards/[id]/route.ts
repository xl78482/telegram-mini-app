import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { syncProductStock } from '@/lib/stock'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAuth()
  try {
    const cardId = Number(params.id)
    const body = await req.json()
    const newStatus = body.status as string

    const card = await prisma.cardSecret.findUnique({ where: { id: cardId } })
    if (!card) return NextResponse.json({ error: '卡密不存在' }, { status: 404 })

    // 规则校验
    if (card.status === 'SOLD') {
      return NextResponse.json({ error: 'SOLD 状态卡密不允许修改' }, { status: 400 })
    }
    if (card.status === 'LOCKED') {
      return NextResponse.json({ error: 'LOCKED 卡密不允许后台手动释放，由订单取消自动处理' }, { status: 400 })
    }
    const allowed: Record<string, string[]> = {
      AVAILABLE: ['DISABLED'],
      DISABLED: ['AVAILABLE'],
    }
    if (!allowed[card.status]?.includes(newStatus)) {
      return NextResponse.json(
        { error: `不允许从 ${card.status} 改为 ${newStatus}` },
        { status: 400 }
      )
    }

    await prisma.cardSecret.update({
      where: { id: cardId },
      data: { status: newStatus as 'AVAILABLE' | 'DISABLED' },
    })

    await syncProductStock(card.productId, card.specId)
    return NextResponse.json({ ok: true })
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
    const cardId = Number(params.id)
    const card = await prisma.cardSecret.findUnique({ where: { id: cardId } })
    if (!card) return NextResponse.json({ error: '卡密不存在' }, { status: 404 })

    if (card.status === 'SOLD') {
      return NextResponse.json({ error: 'SOLD 状态卡密不能删除' }, { status: 400 })
    }

    await prisma.cardSecret.update({
      where: { id: cardId },
      data: { status: 'DISABLED' },
    })
    await syncProductStock(card.productId, card.specId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
