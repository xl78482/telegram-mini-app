import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseTelegramUser } from '@/lib/telegram'
import { getOrCreateTelegramUser, type TelegramUserPayload } from '@/lib/telegram-user'
import { processBalancePayment } from '@/lib/payment'
import { expirePendingOrders } from '@/lib/order-lock'
import type { Prisma } from '@prisma/client'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * POST /api/orders/[id]/pay/balance
 * 余额支付接口
 *
 * 并发安全：
 * 1. expirePendingOrders 先扫一次过期订单
 * 2. processBalancePayment 内部用 PENDING → PROCESSING 做原子锁
 * 3. 所有写操作在 Prisma transaction 内，异常自动回滚
 * 4. PaymentRecord upsert + DeliveryLog skipDuplicates 双幂等
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const orderId = Number(id)
    if (!Number.isInteger(orderId) || orderId < 1) {
      return NextResponse.json({ error: '订单 ID 不正确' }, { status: 400 })
    }

    const initData = req.headers.get('x-init-data') ?? ''
    const tgUser = parseTelegramUser(initData) as TelegramUserPayload | null
    if (!tgUser?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 先扫描过期订单释放卡密
    await expirePendingOrders()

    const user = await getOrCreateTelegramUser(tgUser)

    // 执行余额支付事务（所有并发安全在 transaction 内部处理）
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      return processBalancePayment(tx, orderId, user.id)
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
    return NextResponse.json({
      error: '余额支付失败',
      message: process.env.NODE_ENV === 'development' ? String(e) : undefined,
    }, { status: 500 })
  }
}
