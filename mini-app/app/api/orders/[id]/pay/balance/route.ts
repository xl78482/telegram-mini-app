import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseTelegramUser } from '@/lib/telegram'
import { processBalancePayment } from '@/lib/payment'
import { expirePendingOrders } from '@/lib/order-lock'
import type { Prisma } from '@prisma/client'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * POST /api/orders/[id]/pay/balance
 * 余额支付接口
 *
 * 流程：
 * 1. 校验 Telegram 登录用户
 * 2. 只能支付自己的订单
 * 3. 订单必须是 PENDING / payStatus=PENDING
 * 4. paymentMethod 必须是 BALANCE
 * 5. 订单超时不能支付，自动释放锁定卡密
 * 6. 余额不足返回"余额不足，请充值余额"
 * 7. 余额充足时使用 Prisma transaction 原子执行
 * 8. 重复请求不能重复扣款（幂等）
 * 9. 重复请求不能重复发卡（幂等）
 * 10. 卡密数量不足或锁定异常时必须回滚
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const initData = req.headers.get('x-init-data') ?? ''
    const tgUser = parseTelegramUser(initData)
    if (!tgUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 先触发过期检查
    await expirePendingOrders()

    const user = await prisma.user.findUnique({
      where: { tgId: BigInt(tgUser.id) },
      select: { id: true, balance: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const orderId = Number(id)

    // 查询订单
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: { items: true },
    })

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    // 校验订单状态
    if (order.status !== 'PENDING') {
      if (order.status === 'COMPLETED' || order.payStatus === 'SUCCESS') {
        // 幂等：已支付成功，返回成功
        const deliveredCount = await prisma.deliveryLog.count({ where: { orderId } })
        return NextResponse.json({
          ok: true,
          message: '订单已支付成功',
          deliveredCount,
        })
      }
      if (order.status === 'CANCELLED') {
        return NextResponse.json({ error: '订单已取消' }, { status: 400 })
      }
      return NextResponse.json({ error: '订单状态异常' }, { status: 400 })
    }

    if (order.payStatus !== 'PENDING') {
      return NextResponse.json({ error: '订单支付状态异常' }, { status: 400 })
    }

    // 校验支付方式
    if (order.paymentMethod !== 'BALANCE') {
      return NextResponse.json({ error: '该订单不支持余额支付' }, { status: 400 })
    }

    // 校验超时
    if (order.expiresAt && new Date() > order.expiresAt) {
      return NextResponse.json({ error: '订单已超时，请重新下单' }, { status: 400 })
    }

    const amount = Number(order.totalAmount)

    // 余额不足检查（提前检查，给用户友好提示）
    const currentBalance = Number(user.balance)
    if (currentBalance < amount) {
      return NextResponse.json({
        error: '余额不足，请充值余额',
        currentBalance,
        requiredAmount: amount,
      }, { status: 400 })
    }

    // 执行余额支付事务
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      return processBalancePayment(tx, orderId, user.id, amount)
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      message: '支付成功',
      deliveredCount: result.deliveredCount,
    })
  } catch (e) {
    console.error('[balance payment error]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}