import { prisma } from './prisma'

export async function syncProductStock(
  productId: number,
  specId?: number | null
): Promise<void> {
  const productAvailable = await prisma.cardSecret.count({
    where: { productId, status: 'AVAILABLE' },
  })
  await prisma.product.update({
    where: { id: productId },
    data: { stock: productAvailable },
  })
  if (specId) {
    const specAvailable = await prisma.cardSecret.count({
      where: { specId, status: 'AVAILABLE' },
    })
    await prisma.productSpec.update({
      where: { id: specId },
      data: { stock: specAvailable },
    })
  }
}
