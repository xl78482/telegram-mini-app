import { prisma } from './prisma'
import type { PrismaClient } from '@prisma/client'
import type { Prisma } from '@prisma/client'

type DbClient = PrismaClient | Prisma.TransactionClient

export async function syncProductStock(
  productId: number,
  specId?: number | null,
  db: DbClient = prisma
): Promise<void> {
  const productAvailable = await db.cardSecret.count({
    where: { productId, status: 'AVAILABLE' },
  })
  await db.product.update({
    where: { id: productId },
    data: { stock: productAvailable },
  })

  // specId 可能为 null/undefined；无规格商品只同步 product.stock。
  // 规格 id 是自增正整数，不能用 if (specId) 判断，避免边界值被误跳过。
  if (specId != null) {
    const specAvailable = await db.cardSecret.count({
      where: { specId, status: 'AVAILABLE' },
    })
    await db.productSpec.update({
      where: { id: specId },
      data: { stock: specAvailable },
    })
  }
}
