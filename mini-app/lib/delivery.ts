import { syncProductStock } from './stock'
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

  // 必须严格等于订单购买数量，防止异常锁多卡导致多发卡。
  if (lockedCards.length !== requiredQuantity) {
    return { success: false, deliveredCount: 0, error: '卡密锁定数量异常' }
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

  if (updateResult.count !== requiredQuantity) {
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

  // 同步库存，统一走 stock.ts，确保商品总库存和规格库存计算一致。
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
