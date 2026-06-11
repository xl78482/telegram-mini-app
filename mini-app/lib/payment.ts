import { syncProductStock } from './stock'
import type { Prisma } from '@prisma/client'

type DbClient = import('@prisma/client').PrismaClient | Prisma.TransactionClient

/**
 * 余额支付核心逻辑（事务内）
 *
 * 并发安全保证：
 * 1. 原子状态更新 PENDING → PROCESSING 作为状态锁
 * 2. 余额使用 updateMany + gte 原子扣减
 * 3. PaymentRecord 使用 upsert 幂等
 * 4. DeliveryLog 使用 createMany skipDuplicates
 * 5. 卡密更新带 where lockedOrderId + LOCKED 条件
 * 6. 任何关键步骤不满足条件时抛错，整笔事务回滚
 */
export async function processBalancePayment(
  tx: Prisma.TransactionClient,
  orderId: number,
  userId: number,
): Promise<{ success: boolean; error?: string; deliveredCount?: number }> {
  const lockResult = await tx.order.updateMany({
    where: {
      id: orderId,
      userId,
      status: 'PENDING',
      payStatus: 'PENDING',
      paymentMethod: 'BALANCE',
    },
    data: { status: 'PROCESSING' },
  })

  if (lockResult.count !== 1) {
    const currentOrder = await tx.order.findFirst({
      where: { id: orderId, userId },
      select: { status: true, payStatus: true },
    })

    if (!currentOrder) return { success: false, error: '订单不存在' }
    if (currentOrder.status === 'COMPLETED' && currentOrder.payStatus === 'SUCCESS') {
      const delivered = await tx.deliveryLog.count({ where: { orderId, userId } })
      return { success: true, deliveredCount: delivered }
    }
    if (currentOrder.status === 'CANCELLED') return { success: false, error: '订单已取消' }
    if (currentOrder.status === 'PROCESSING') return { success: false, error: '订单正在处理中，请勿重复支付' }
    return { success: false, error: '订单状态异常' }
  }

  const order = await tx.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true },
  })

  if (!order) throw new Error('订单不存在')

  if (order.paymentMethod !== 'BALANCE') {
    await tx.order.update({ where: { id: orderId }, data: { status: 'PENDING' } })
    return { success: false, error: '该订单不支持余额支付' }
  }

  if (order.expiresAt && new Date() > order.expiresAt) {
    await expireProcessingOrderInsideTransaction(tx, orderId)
    return { success: false, error: '订单已超时，请重新下单' }
  }

  const amountDecimal = order.totalAmount

  // 必须等于订单购买数量，不能只判断大于等于，否则异常数据会导致多发卡。
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const lockedCards = await tx.cardSecret.findMany({
    where: { lockedOrderId: orderId, status: 'LOCKED' },
    select: { id: true, productId: true, specId: true },
  })

  if (lockedCards.length !== totalQuantity) {
    throw new Error('卡密锁定数量异常，请联系客服')
  }

  const userBefore = await tx.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  })
  if (!userBefore) throw new Error('用户不存在')

  const debit = await tx.user.updateMany({
    where: { id: userId, balance: { gte: amountDecimal } },
    data: { balance: { decrement: amountDecimal } },
  })

  if (debit.count !== 1) {
    await tx.order.update({ where: { id: orderId }, data: { status: 'PENDING' } })
    return { success: false, error: '余额不足，请充值余额' }
  }

  const userAfter = await tx.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  })
  if (!userAfter) throw new Error('用户余额查询异常')

  await tx.balanceLog.create({
    data: {
      userId,
      type: 'PAY_ORDER',
      amount: amountDecimal.mul(-1),
      balanceBefore: userBefore.balance,
      balanceAfter: userAfter.balance,
      orderId,
      note: `订单 ${order.orderNo} 余额支付`,
    },
  })

  await tx.paymentRecord.upsert({
    where: {
      orderId_channel: { orderId, channel: 'BALANCE' },
    },
    update: {},
    create: {
      orderId,
      userId,
      channel: 'BALANCE',
      status: 'SUCCESS',
      amountCny: amountDecimal,
      paidAt: new Date(),
    },
  })

  const updateResult = await tx.cardSecret.updateMany({
    where: { lockedOrderId: orderId, status: 'LOCKED' },
    data: {
      status: 'SOLD',
      soldOrderId: orderId,
      soldToUserId: userId,
      soldAt: new Date(),
    },
  })

  if (updateResult.count !== totalQuantity) {
    throw new Error('卡密状态更新异常')
  }

  await tx.deliveryLog.createMany({
    data: lockedCards.map(card => ({
      orderId,
      userId,
      cardSecretId: card.id,
    })),
    skipDuplicates: true,
  })

  await tx.order.update({
    where: { id: orderId },
    data: {
      status: 'COMPLETED',
      payStatus: 'SUCCESS',
      paidAt: new Date(),
    },
  })

  const affected = new Map<string, { productId: number; specId: number | null }>()
  for (const card of lockedCards) {
    const key = `${card.productId}-${card.specId ?? ''}`
    affected.set(key, { productId: card.productId, specId: card.specId })
  }
  for (const [, { productId, specId }] of affected) {
    await syncProductStock(productId, specId, tx)
  }

  return { success: true, deliveredCount: lockedCards.length }
}

async function expireProcessingOrderInsideTransaction(
  tx: Prisma.TransactionClient,
  orderId: number,
): Promise<void> {
  const lockedCards = await tx.cardSecret.findMany({
    where: { lockedOrderId: orderId, status: 'LOCKED' },
    select: { productId: true, specId: true },
  })

  await tx.cardSecret.updateMany({
    where: { lockedOrderId: orderId, status: 'LOCKED' },
    data: { status: 'AVAILABLE', lockedOrderId: null, lockedAt: null },
  })

  await tx.order.update({
    where: { id: orderId },
    data: { status: 'CANCELLED', payStatus: 'EXPIRED', cancelReason: 'TIMEOUT' },
  })

  const affected = new Map<string, { productId: number; specId: number | null }>()
  for (const card of lockedCards) {
    const key = `${card.productId}-${card.specId ?? ''}`
    affected.set(key, { productId: card.productId, specId: card.specId })
  }
  for (const [, { productId, specId }] of affected) {
    await syncProductStock(productId, specId, tx)
  }
}

/**
 * 获取订单卡密（仅已支付/已完成订单，只返回当前用户的）
 */
export async function getOrderCardKeys(
  db: DbClient,
  orderId: number,
  userId: number,
): Promise<{ id: number; content: string }[]> {
  const order = await (db as any).order.findFirst({
    where: { id: orderId, userId },
    select: { status: true, payStatus: true },
  })
  if (!order || order.payStatus !== 'SUCCESS') return []
  if (order.status !== 'COMPLETED' && order.status !== 'PAID') return []

  const cards = await (db as any).cardSecret.findMany({
    where: { soldOrderId: orderId, soldToUserId: userId },
    select: { id: true, content: true },
  })
  return cards.map((c: { id: number; content: string }) => ({ id: c.id, content: c.content }))
}
