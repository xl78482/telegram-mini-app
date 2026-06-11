import { prisma } from './prisma'

/**
 * 同步商品库存：Product.stock = AVAILABLE 卡密数量
 * 如果传入 specId，同时同步 ProductSpec.stock
 */
export async function syncProductStock(
  productId: number,
  specId?: number | null
): Promise<void> {
  // 同步商品总库存
  const productAvailable = await prisma.cardSecret.count({
    where: { productId, status: 'AVAILABLE' },
  })
  await prisma.product.update({
    where: { id: productId },
    data: { stock: productAvailable },
  })

  // 同步规格库存；specId 可能为 null/undefined，无规格商品只同步 Product.stock。
  if (specId != null) {
    const specAvailable = await prisma.cardSecret.count({
      where: { specId, status: 'AVAILABLE' },
    })
    await prisma.productSpec.update({
      where: { id: specId },
      data: { stock: specAvailable },
    })
  }
}
