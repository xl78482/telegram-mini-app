import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseTelegramUser } from '@/lib/telegram'

function genOrderNo() {
  return Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase()
}

export async function GET(req: NextRequest) {
  try {
    const initData = req.headers.get('x-init-data') ?? ''
    const tgUser = parseTelegramUser(initData)
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { tgId: BigInt(tgUser.id) } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(orders.map(o => ({
      ...o,
      totalAmount: o.totalAmount.toString(),
      items: o.items.map(i => ({
        ...i,
        price: i.price.toString(),
        product: i.product ? { ...i.product, price: i.product.price.toString() } : null,
      })),
    })))
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const initData = req.headers.get('x-init-data') ?? ''
    const tgUser = parseTelegramUser(initData)
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { items } = await req.json() as { items: { productId: number; quantity: number }[] }
    if (!items?.length) return NextResponse.json({ error: 'Items required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { tgId: BigInt(tgUser.id) } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const products = await prisma.product.findMany({
      where: { id: { in: items.map(i => i.productId) }, isActive: true },
    })

    const orderItems = items.map(item => {
      const p = products.find(p => p.id === item.productId)
      if (!p) throw new Error(`Product ${item.productId} not found`)
      if (p.stock < item.quantity) throw new Error(`Insufficient stock for ${p.name}`)
      return { productId: p.id, quantity: item.quantity, price: p.price, name: p.name }
    })

    const totalAmount = orderItems.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0)
    if (Number(user.balance) < totalAmount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    const order = await prisma.$transaction(async tx => {
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      }
      await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: totalAmount } },
      })
      return tx.order.create({
        data: {
          orderNo: genOrderNo(),
          userId: user.id,
          status: 'PAID',
          totalAmount,
          items: { create: orderItems },
        },
        include: { items: true },
      })
    })

    return NextResponse.json({ ...order, totalAmount: order.totalAmount.toString() }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
