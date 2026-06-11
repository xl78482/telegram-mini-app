import { prisma } from './prisma'
import { syncProductStock } from './stock'

/**
 * 释放订单锁定的卡密，并将订单改为取消状态
 * 只处理 status = PENDING 的订单
 */
export async function releaseOrderLockedCards(
  orderId: number,
  cancelReason: string = 'USER_CANCELLED'
): Promise<void> {
  await prisma.$transaction(async tx => {
    const order = await tx.order.findUnique({ where: { id: orderId } })
    if (!order || order.status !== 'PENDING') return

    // 查找该订单锁定的所有卡密
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

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        payStatus: cancelReason === 'TIMEOUT' ? 'EXPIRED' : 'FAILED',
        cancelReason,
      },
    })

    // 同步库存（事务外执行，事务内已更新完毕）
    const affectedPairs = [...new Map(locked.map(c => [`${c.productId}-${c.specId ?? ''}`, c])).values()]
    for (const c of affectedPairs) {
      await syncProductStock(c.productId, c.specId)
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
