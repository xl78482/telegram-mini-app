import { prisma } from './prisma'
import { syncProductStock } from './stock'

/**
 * 释放订单锁定的卡密，并将订单改为取消状态
 * 只处理 status = PENDING 的订单（幂等）
 */
export async function releaseOrderLockedCards(
  orderId: number,
  cancelReason: string = 'USER_CANCELLED'
): Promise<void> {
  await prisma.$transaction(async tx => {
    // 原子锁：只处理 PENDING 状态的订单
    const lockResult = await tx.order.updateMany({
      where: { id: orderId, status: 'PENDING' },
      data: {
        status: 'CANCELLED',
        payStatus: cancelReason === 'TIMEOUT' ? 'EXPIRED' : 'FAILED',
        cancelReason,
      },
    })

    // 如果没 lock 到，说明订单已不是 PENDING，幂等跳过
    if (lockResult.count !== 1) return

    // 释放该订单锁定的卡密
    const locked = await tx.cardSecret.findMany({
      where: { lockedOrderId: orderId, status: 'LOCKED' },
      select: { id: true, productId: true, specId: true },
    })

    if (locked.length > 0) {
      await tx.cardSecret.updateMany({
        where: { lockedOrderId: orderId, status: 'LOCKED' },
        data: { status: 'AVAILABLE', lockedOrderId: null, lockedAt: null },
      })
    }

    // 在事务内用 tx 同步库存，保证一致性
    const affectedPairs = [
      ...new Map(
        locked.map(c => [`${c.productId}-${c.specId ?? ''}`, c])
      ).values(),
    ]
    for (const c of affectedPairs) {
      await syncProductStock(c.productId, c.specId, tx)
    }
  })
}

/**
 * 批量过期未支付订单释放卡密（幂等）
 */
export async function expirePendingOrders(): Promise<void> {
  const now = new Date()
  const expired = await prisma.order.findMany({
    where: { status: 'PENDING', expiresAt: { lt: now } },
    select: { id: true },
  })
  for (const o of expired) {
    await releaseOrderLockedCards(o.id, 'TIMEOUT')
  }
}