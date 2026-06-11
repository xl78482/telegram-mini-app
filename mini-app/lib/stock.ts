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
  if (specId) {
    const specAvailable = await db.cardSecret.count({
      where: { specId, status: 'AVAILABLE' },
    })
    await db.productSpec.update({
      where: { id: specId },
      data: { stock: specAvailable },
    })
  }
}
