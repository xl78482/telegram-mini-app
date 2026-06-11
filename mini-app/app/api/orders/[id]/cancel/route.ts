import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseTelegramUser } from '@/lib/telegram'
import { getOrCreateTelegramUser, type TelegramUserPayload } from '@/lib/telegram-user'
import { releaseOrderLockedCards } from '@/lib/order-lock'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const orderId = Number(id)
    if (!Number.isInteger(orderId) || orderId < 1) {
      return NextResponse.json({ error: '订单 ID 不正确' }, { status: 400 })
    }

    const initData = req.headers.get('x-init-data') ?? ''
    const tgUser = parseTelegramUser(initData) as TelegramUserPayload | null
    if (!tgUser?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const user = await getOrCreateTelegramUser(tgUser)

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
    })
    if (!order) return NextResponse.json({ error: '订单不存在' }, { status: 404 })

    if (order.status !== 'PENDING') {
      const reason = order.status === 'CANCELLED'
        ? '订单已取消'
        : '订单已支付，不能取消'
      return NextResponse.json({ error: reason }, { status: 400 })
    }

    await releaseOrderLockedCards(order.id, 'USER_CANCELLED')
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[POST /api/orders/:id/cancel]', e)
    return NextResponse.json({ error: '取消订单失败' }, { status: 500 })
  }
}
