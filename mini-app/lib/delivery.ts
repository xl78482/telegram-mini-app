import type { PrismaClient } from '@prisma/client'
import type { Prisma } from '@prisma/client'

type DbClient = PrismaClient | Prisma.TransactionClient

/**
 * 发卡：将订单锁定的卡密标记为已售出
 * 在事务内执行
 */
export async function deliverCards(
  tx: Prisma.TransactionClient,
  orderId: number,
  userId: number
): Promise<{ success: boolean; deliveredCount: number; error?: string }> {
  // 查询订单锁定的卡密
  const lockedCards = await tx.cardSecret.findMany({
    where: { lockedOrderId: orderId, status: 'LOCKED' },
    select: { id: true, productId: true, specId: true },
  })

  if (lockedCards.length === 0) {
    return { success: false, deliveredCount: 0, error: '没有锁定的卡密' }
  }

  // 将卡密转为 SOLD
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
    return { success: false, deliveredCount: 0, error: '卡密状态更新异常' }
  }

  // 写入发卡日志
  for (const card of lockedCards) {
    await tx.deliveryLog.create({
      data: {
        orderId,
        userId,
        cardSecretId: card.id,
      },
    })
  }

  // 同步库存
  const affectedProducts = new Map<string, { productId: number; specId: number | null }>()
  for (const card of lockedCards) {
    const key = `${card.productId}-${card.specId ?? ''}`
    affectedProducts.set(key, { productId: card.productId, specId: card.specId })
  }

  for (const [, { productId, specId }] of affectedProducts) {
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