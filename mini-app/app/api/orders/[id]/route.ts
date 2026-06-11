import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseTelegramUser } from '@/lib/telegram'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const initData = req.headers.get('x-init-data') ?? ''
    const tgUser = parseTelegramUser(initData)
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { tgId: BigInt(tgUser.id) } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const order = await prisma.order.findFirst({
      where: { id: Number(params.id), userId: user.id },
      include: { items: { include: { product: true } } },
    })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      ...order,
      totalAmount: order.totalAmount.toString(),
      items: order.items.map(i => ({
        ...i,
        price: i.price.toString(),
        product: i.product ? { ...i.product, price: i.product.price.toString() } : null,
      })),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
