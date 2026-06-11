import type { PrismaClient } from '@prisma/client'
import type { Prisma } from '@prisma/client'

type DbClient = PrismaClient | Prisma.TransactionClient

/**
 * 执行余额支付核心逻辑（事务内）
 * - 扣减用户余额
 * - 写入余额流水
 * - 写入支付流水
 * - 更新订单状态
 * - 发卡（卡密转 SOLD）
 * - 写入发卡日志
 * - 同步库存
 *
 * @returns { success: boolean, error?: string, deliveredCount?: number }
 */
export async function processBalancePayment(
  tx: Prisma.TransactionClient,
  orderId: number,
  userId: number,
  amount: number
): Promise<{ success: boolean; error?: string; deliveredCount?: number }> {
  // 1. 查询订单（再次校验状态，防止并发重复支付）
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })

  if (!order) {
    return { success: false, error: '订单不存在' }
  }

  // 幂等检查：如果订单已支付/已完成，直接返回成功（不重复扣款）
  if (order.status === 'COMPLETED' || order.payStatus === 'SUCCESS') {
    // 查询已发卡数量，返回给前端
    const deliveredCount = await tx.deliveryLog.count({ where: { orderId } })
    return { success: true, deliveredCount }
  }

  // 状态校验
  if (order.status !== 'PENDING' || order.payStatus !== 'PENDING') {
    return { success: false, error: '订单状态异常，无法支付' }
  }

  if (order.paymentMethod !== 'BALANCE') {
    return { success: false, error: '该订单不支持余额支付' }
  }

  // 超时检查
  if (order.expiresAt && new Date() > order.expiresAt) {
    return { success: false, error: '订单已超时，请重新下单' }
  }

  // 2. 查询用户余额
  const user = await tx.user.findUnique({ where: { id: userId } })
  if (!user) {
    return { success: false, error: '用户不存在' }
  }

  const currentBalance = Number(user.balance)
  if (currentBalance < amount) {
    return { success: false, error: '余额不足，请充值余额' }
  }

  // 3. 扣减余额
  const balanceBefore = currentBalance
  const balanceAfter = balanceBefore - amount

  await tx.user.update({
    where: { id: userId },
    data: { balance: balanceAfter },
  })

  // 4. 写入余额流水
  await tx.balanceLog.create({
    data: {
      userId,
      type: 'PAY_ORDER',
      amount,
      balanceBefore,
      balanceAfter,
      orderId,
      note: `订单 ${order.orderNo} 余额支付`,
    },
  })

  // 5. 写入支付流水
  await tx.paymentRecord.create({
    data: {
      orderId,
      userId,
      channel: 'BALANCE',
      status: 'SUCCESS',
      amountCny: amount,
      paidAt: new Date(),
    },
  })

  // 6. 更新订单状态
  await tx.order.update({
    where: { id: orderId },
    data: {
      status: 'COMPLETED',
      payStatus: 'SUCCESS',
      paidAt: new Date(),
    },
  })

  // 7. 发卡：将 LOCKED 卡密转为 SOLD
  const lockedCards = await tx.cardSecret.findMany({
    where: { lockedOrderId: orderId, status: 'LOCKED' },
    select: { id: true },
  })

  if (lockedCards.length === 0) {
    // 没有锁定的卡密，可能是并发问题或数据异常
    return { success: false, error: '卡密锁定异常，请联系客服' }
  }

  // 检查卡密数量是否匹配订单商品数量
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0)
  if (lockedCards.length < totalQuantity) {
    return { success: false, error: '卡密数量不足，请联系客服' }
  }

  // 将卡密转为 SOLD
  await tx.cardSecret.updateMany({
    where: { lockedOrderId: orderId, status: 'LOCKED' },
    data: {
      status: 'SOLD',
      soldOrderId: orderId,
      soldToUserId: userId,
      soldAt: new Date(),
    },
  })

  // 8. 写入发卡日志
  for (const card of lockedCards) {
    await tx.deliveryLog.create({
      data: {
        orderId,
        userId,
        cardSecretId: card.id,
      },
    })
  }

  // 9. 同步库存（在事务内）
  // 获取受影响的商品和规格
  const affectedProducts = new Map<string, { productId: number; specId: number | null }>()
  for (const item of order.items) {
    const key = `${item.productId}-${item.specId ?? ''}`
    affectedProducts.set(key, { productId: item.productId, specId: item.specId })
  }

  for (const [, { productId, specId }] of affectedProducts) {
    // 计算可用库存（AVAILABLE 状态的卡密数量）
    const availableCount = await tx.cardSecret.count({
      where: { productId, specId: specId ?? undefined, status: 'AVAILABLE' },
    })
    await tx.product.update({
      where: { id: productId },
      data: { stock: availableCount },
    })
    if (specId) {
      const specAvailableCount = await tx.cardSecret.count({
        where: { specId, status: 'AVAILABLE' },
      })
      await tx.productSpec.update({
        where: { id: specId },
        data: { stock: specAvailableCount },
      })
    }
  }

  return { success: true, deliveredCount: lockedCards.length }
}

/**
 * 获取订单的卡密信息（仅已支付/已完成的订单）
 */
export async function getOrderCardKeys(
  db: DbClient,
  orderId: number,
  userId: number
): Promise<{ id: number; content: string }[]> {
  // 只有已支付/已完成的订单才返回卡密
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { status: true, payStatus: true },
  })

  if (!order || (order.status !== 'COMPLETED' && order.status !== 'PAID')) {
    return []
  }

  if (order.payStatus !== 'SUCCESS') {
    return []
  }

  // 只返回 soldOrderId=当前订单 且 soldToUserId=当前用户 的卡密
  const cards = await db.cardSecret.findMany({
    where: { soldOrderId: orderId, soldToUserId: userId },
    select: { id: true, content: true },
  })

  return cards.map(c => ({ id: c.id, content: c.content }))
}