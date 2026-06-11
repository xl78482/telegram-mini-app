import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseTelegramUser } from '@/lib/telegram'
import { expirePendingOrders } from '@/lib/order-lock'
import { getOrderCardKeys } from '@/lib/payment'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const initData = req.headers.get('x-init-data') ?? ''
    const tgUser = parseTelegramUser(initData)
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { tgId: BigInt(tgUser.id) } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // 先触发过期检查
    await expirePendingOrders()

    const order = await prisma.order.findFirst({
      where: { id: Number(id), userId: user.id },
      include: { items: true },
    })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // 获取卡密信息（只有已支付/已完成的订单才返回）
    const cardKeys = await getOrderCardKeys(prisma, order.id, user.id)

    return NextResponse.json({
      id: order.id,
      orderNo: order.orderNo,
      status: order.status,
      payStatus: order.payStatus,
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalAmount.toString(),
      expiresAt: order.expiresAt,
      cancelReason: order.cancelReason,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      paidAt: order.paidAt,
      items: order.items.map((i: { id: number; productId: number; specId: number | null; name: string; specName: string | null; quantity: number; price: { toString: () => string } }) => ({
        id: i.id,
        productId: i.productId,
        specId: i.specId,
        name: i.name,
        productName: i.name,
        specName: i.specName,
        quantity: i.quantity,
        price: i.price.toString(),
      })),
      cardKeys,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
