import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseTelegramUser } from '@/lib/telegram'
import { syncProductStock } from '@/lib/stock'
import { expirePendingOrders } from '@/lib/order-lock'
import type { Prisma } from '@prisma/client'

const VALID_PAYMENT_METHODS = ['BALANCE', 'EPUSDT', 'OKPAY'] as const
type PaymentMethod = typeof VALID_PAYMENT_METHODS[number]

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>

function genOrderNo() {
  return Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase()
}

export async function GET(req: NextRequest) {
  try {
    const initData = req.headers.get('x-init-data') ?? ''
    const tgUser = parseTelegramUser(initData)
    if (!tgUser) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { tgId: BigInt(tgUser.id) } })
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

    // 先过期检查
    await expirePendingOrders()

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(orders.map((o: OrderWithItems) => ({
      id: o.id,
      orderNo: o.orderNo,
      status: o.status,
      payStatus: o.payStatus,
      paymentMethod: o.paymentMethod,
      totalAmount: o.totalAmount.toString(),
      expiresAt: o.expiresAt,
      cancelReason: o.cancelReason,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      paidAt: o.paidAt,
      items: o.items.map(i => ({
        id: i.id,
        productId: i.productId,
        specId: i.specId,
        name: i.name,
        productName: i.name,
        specName: i.specName,
        quantity: i.quantity,
        price: i.price.toString(),
      })),
    })))
  } catch (e) {
    console.error('[GET /api/orders]', e)
    return NextResponse.json({ error: '订单列表获取失败' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const initData = req.headers.get('x-init-data') ?? ''
    const tgUser = parseTelegramUser(initData)
    if (!tgUser) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const body = await req.json() as {
      items: { productId: number; specId?: number | null; quantity: number }[]
      paymentMethod: string
    }

    if (!body.items?.length) return NextResponse.json({ error: 'items 必填' }, { status: 400 })
    if (!body.paymentMethod || !VALID_PAYMENT_METHODS.includes(body.paymentMethod as PaymentMethod)) {
      return NextResponse.json({ error: 'paymentMethod 必填，必须为 BALANCE / EPUSDT / OKPAY' }, { status: 400 })
    }
    // 每次只允许一个商品规格组合
    if (body.items.length > 1) {
      return NextResponse.json({ error: '每次只允许购买一个商品' }, { status: 400 })
    }

    const item = body.items[0]
    const productId = Number(item.productId)
    const quantity = Number(item.quantity)
    const requestedSpecId = item.specId == null ? null : Number(item.specId)

    if (!Number.isInteger(productId) || productId < 1) {
      return NextResponse.json({ error: '商品 ID 不正确' }, { status: 400 })
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json({ error: '数量必须为大于 0 的整数' }, { status: 400 })
    }
    if (requestedSpecId !== null && (!Number.isInteger(requestedSpecId) || requestedSpecId < 1)) {
      return NextResponse.json({ error: '规格 ID 不正确' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { tgId: BigInt(tgUser.id) } })
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

    // 查商品
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { specs: { where: { isActive: true } } },
    })
    if (!product || !product.isActive) {
      return NextResponse.json({ error: '商品不存在或已下架' }, { status: 404 })
    }

    const hasSpecs = product.specs.length > 0
    let specId: number | null = null
    let specName: string | null = null
    let unitPrice: Prisma.Decimal

    if (hasSpecs) {
      if (requestedSpecId === null) {
        return NextResponse.json({ error: '该商品有规格，必须选择规格' }, { status: 400 })
      }
      const spec = product.specs.find(s => s.id === requestedSpecId)
      if (!spec) {
        return NextResponse.json({ error: '规格不存在或已停用' }, { status: 400 })
      }
      specId = spec.id
      specName = spec.name
      unitPrice = spec.price
    } else {
      specId = null
      unitPrice = product.price
    }

    const totalAmount = unitPrice.mul(quantity)

    // 读取过期时间配置
    let expireMinutes = 15
    try {
      const setting = await prisma.systemSetting.findUnique({ where: { key: 'order_expire_minutes' } })
      if (setting) expireMinutes = Math.max(1, Number(setting.value))
    } catch { /* 表不存在时跳过 */ }

    const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000)

    // 事务：创建订单 + 锁定卡密
    const order = await prisma.$transaction(async tx => {
      // 1. 查可用卡密：specId 必须精确匹配。无规格商品只允许锁定 specId = null 的卡密。
      const availableCards = await tx.cardSecret.findMany({
        where: {
          productId,
          specId,
          status: 'AVAILABLE',
        },
        select: { id: true },
        orderBy: { id: 'asc' },
        take: quantity,
      })
      if (availableCards.length < quantity) {
        throw new Error('库存不足，请稍后重试')
      }
      const cardIds = availableCards.map(c => c.id)

      // 2. 创建订单
      const newOrder = await tx.order.create({
        data: {
          orderNo: genOrderNo(),
          userId: user.id,
          status: 'PENDING',
          payStatus: 'PENDING',
          paymentMethod: body.paymentMethod as PaymentMethod,
          totalAmount,
          expiresAt,
          items: {
            create: [{
              productId,
              specId,
              specName,
              name: product.name,
              price: unitPrice,
              quantity,
            }],
          },
        },
      })

      // 3. 锁定卡密（防超卖：必须包含 status = AVAILABLE 条件）
      const lockResult = await tx.cardSecret.updateMany({
        where: { id: { in: cardIds }, status: 'AVAILABLE' },
        data: { status: 'LOCKED', lockedOrderId: newOrder.id, lockedAt: new Date() },
      })

      // 4. 如果锁定数量不对，回滚（并发超卖防护）
      if (lockResult.count !== quantity) {
        throw new Error('库存不足，请稍后重试')
      }

      return newOrder
    })

    // 同步库存（事务外）
    await syncProductStock(productId, specId)

    return NextResponse.json({
      id: order.id,
      orderNo: order.orderNo,
      status: order.status,
      payStatus: order.payStatus,
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalAmount.toString(),
      expiresAt: order.expiresAt,
    }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '下单失败'
    console.error('[POST /api/orders]', e)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
