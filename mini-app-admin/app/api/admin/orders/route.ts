import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  await requireAuth()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const orders = await prisma.order.findMany({
    where: status ? { status: status as never } : undefined,
    include: { user: true, items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(orders.map(o => ({
    ...o,
    totalAmount: o.totalAmount.toString(),
    items: o.items.map(i => ({ ...i, price: i.price.toString() })),
  })))
}
