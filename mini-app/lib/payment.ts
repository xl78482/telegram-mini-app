import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

type DbClient = import('@prisma/client').PrismaClient | Prisma.TransactionClient

/**
 * 余额支付核心逻辑（事务内）
 *
 * 并发安全保证：
 * 1. 原子状态更新 PENDING → PROCESSING 作为行级锁
 * 2. 余额使用 updateMany + gte 原子扣减
 * 3. PaymentRecord 使用 upsert 幂等
 * 4. DeliveryLog 使用 createMany skipDuplicates
 * 5. 卡密更新带 where lockedOrderId + LOCKED 条件
 * 6. 任何步骤不满足条件时自然回滚事务
 */
export async function processBalancePayment(
  tx: Prisma.TransactionClient,
  orderId: number,
  userId: number,
): Promise<{ success: boolean; error?: string; deliveredCount?: number }> {
  // === 第一步：原子状态锁（PENDING → PROCESSING），防并发 ===
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
    // 抢锁失败 → 查订单当前状态，返回幂等结果
    const currentOrder = await tx.order.findUnique({
      where: { id: orderId },
      select: { status: true, payStatus: true },
    })
    if (!currentOrder) return { success: false, error: '订单不存在' }
    if (currentOrder.status === 'COMPLETED' && currentOrder.payStatus === 'SUCCESS') {
      const delivered = await tx.deliveryLog.count({ where: { orderId } })
      return { success: true, deliveredCount: delivered }
    }
    if (currentOrder.status === 'CANCELLED') return { success: false, error: '订单已取消' }
    if (currentOrder.status === 'PROCESSING') return { success: false, error: '订单正在处理中，请勿重复支付' }
    return { success: false, error: '订单状态异常' }
  }

  // 锁成功，继续执行（任何后续失败通过事务自然回滚，PROCESSING 会被回滚）

  // === 第二步：查询订单及明细 ===
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) return { success: false, error: '订单不存在' }

  if (order.paymentMethod !== 'BALANCE') {
    // 恢复订单状态
    await tx.order.update({ where: { id: orderId }, data: { status: 'PENDING' } })
    return { success: false, error: '该订单不支持余额支付' }
  }

  if (order.expiresAt && new Date() > order.expiresAt) {
    // 已超时，恢复状态让调用方处理
    await tx.order.update({ where: { id: orderId }, data: { status: 'PENDING' } })
    return { success: false, error: '订单已超时，请重新下单' }
  }

  const amountDecimal = order.totalAmount

  // === 第三步：原子扣减余额 ===
  // 先查询用户
  const userBefore = await tx.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  })
  if (!userBefore) return { success: false, error: '用户不存在' }

  const debit = await tx.user.updateMany({
    where: { id: userId, balance: { gte: amountDecimal } },
    data: { balance: { decrement: amountDecimal } },
  })

  if (debit.count !== 1) {
    // 余额不足或用户不存在 → 恢复订单为 PENDING
    await tx.order.update({ where: { id: orderId }, data: { status: 'PENDING' } })
    return { success: false, error: '余额不足，请充值余额' }
  }

  // 扣减后重新查询余额
  const userAfter = await tx.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  })
  if (!userAfter) {
    throw new Error('用户余额查询异常')
  }

  const balanceBefore = userBefore.balance
  const balanceAfter = userAfter.balance

  // === 第四步：写入余额流水（负数金额，使用 Decimal.mul(-1) 避免 JS Number） ===
  await tx.balanceLog.create({
    data: {
      userId,
      type: 'PAY_ORDER',
      amount: amountDecimal.mul(-1),
      balanceBefore,
      balanceAfter,
      orderId,
      note: `订单 ${order.orderNo} 余额支付`,
    },
  })

  // === 第五步：写入支付流水（upsert 幂等） ===
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

  // === 第六步：更新订单为 COMPLETED ===
  await tx.order.update({
    where: { id: orderId },
    data: {
      status: 'COMPLETED',
      payStatus: 'SUCCESS',
      paidAt: new Date(),
    },
  })

  // === 第七步：发卡 — 只处理 LOCKED 卡密 ===
  const lockedCards = await tx.cardSecret.findMany({
    where: { lockedOrderId: orderId, status: 'LOCKED' },
    select: { id: true, productId: true, specId: true },
  })

  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0)
  if (lockedCards.length === 0 || lockedCards.length < totalQuantity) {
    // 卡密数量不足或锁定异常 → 回滚（事务异常自然回滚）
    throw new Error('卡密锁定异常，请联系客服')
  }

  // 更新卡密状态为 SOLD（带条件）
  const updateResult = await tx.cardSecret.updateMany({
    where: { lockedOrderId: orderId, status: 'LOCKED' },
    data: {
      status: 'SOLD',
      soldOrderId: orderId,
      soldToUserId: userId,
      soldAt: new Date(),
    },
  })

  if (updateResult.count !== lockedCards.length) {
    throw new Error('卡密状态更新异常')
  }

  // === 第八步：写入发卡日志（skipDuplicates 防止重复） ===
  await tx.deliveryLog.createMany({
    data: lockedCards.map(card => ({
      orderId,
      userId,
      cardSecretId: card.id,
    })),
    skipDuplicates: true,
  })

  // === 第九步：同步库存 ===
  const affected = new Map<string, { productId: number; specId: number | null }>()
  for (const card of lockedCards) {
    const key = `${card.productId}-${card.specId ?? ''}`
    affected.set(key, { productId: card.productId, specId: card.specId })
  }
  for (const [, { productId, specId }] of affected) {
    const available = await tx.cardSecret.count({
      where: { productId, specId: specId ?? undefined, status: 'AVAILABLE' },
    })
    await tx.product.update({
      where: { id: productId },
      data: { stock: available },
    })
    if (specId) {
      const specAvailable = await tx.cardSecret.count({
        where: { specId, status: 'AVAILABLE' },
      })
      await tx.productSpec.update({
        where: { id: specId },
        data: { stock: specAvailable },
      })
    }
  }

  return { success: true, deliveredCount: lockedCards.length }
}

/**
 * 获取订单卡密（仅已支付/已完成订单，只返回当前用户的）
 */
export async function getOrderCardKeys(
  db: DbClient,
  orderId: number,
  userId: number,
): Promise<{ id: number; content: string }[]> {
  const order = await (db as any).order.findUnique({
    where: { id: orderId },
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