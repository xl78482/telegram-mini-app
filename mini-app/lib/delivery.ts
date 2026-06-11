import type { Prisma } from '@prisma/client'

/**
 * 发卡：将订单锁定的卡密标记为已售出
 * 需在事务内执行
 *
 * 使用 createMany + skipDuplicates 保证幂等
 */
export async function deliverCards(
  tx: Prisma.TransactionClient,
  orderId: number,
  userId: number,
  requiredQuantity: number,
): Promise<{ success: boolean; deliveredCount: number; error?: string }> {
  const lockedCards = await tx.cardSecret.findMany({
    where: { lockedOrderId: orderId, status: 'LOCKED' },
    select: { id: true, productId: true, specId: true },
  })

  if (lockedCards.length === 0 || lockedCards.length < requiredQuantity) {
    return { success: false, deliveredCount: 0, error: '卡密锁定数量不足' }
  }

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

  // skipDuplicates 配合 @@unique([cardSecretId]) 确保幂等
  await tx.deliveryLog.createMany({
    data: lockedCards.map(card => ({
      orderId,
      userId,
      cardSecretId: card.id,
    })),
    skipDuplicates: true,
  })

  // 同步库存
  const affected = new Map<string, { productId: number; specId: number | null }>()
  for (const card of lockedCards) {
    const key = `${card.productId}-${card.specId ?? ''}`
    affected.set(key, { productId: card.productId, specId: card.specId })
  }
  for (const [, { productId, specId }] of affected) {
    const available = await tx.cardSecret.count({
      where: { productId, specId: specId ?? undefined, status: 'AVAILABLE' },
    })
    await tx.product.update({ where: { id: productId }, data: { stock: available } })
    if (specId) {
      const specAvailable = await tx.cardSecret.count({ where: { specId, status: 'AVAILABLE' } })
      await tx.productSpec.update({ where: { id: specId }, data: { stock: specAvailable } })
    }
  }

  return { success: true, deliveredCount: lockedCards.length }
}