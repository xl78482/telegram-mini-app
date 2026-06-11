/**
 * POST /api/orders/[id]/cancel
 * 取消订单占位接口
 * - 校验 x-init-data
 * - 只允许取消自己的订单
 * - 只允许取消 PENDING 状态的订单
 * - 发卡系统上线后在此添加卡密释放逻辑
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseTelegramUser } from '@/lib/telegram'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const initData = req.headers.get('x-init-data') ?? ''
    const tgUser = parseTelegramUser(initData)
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { tgId: BigInt(tgUser.id) } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const order = await prisma.order.findFirst({
      where: { id: Number(id), userId: user.id },
    })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.status !== 'PENDING') {
      return NextResponse.json({ error: '只能取消待支付的订单' }, { status: 400 })
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
    })

    // TODO: 发卡系统上线后，在此添加卡密释放逻辑

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
