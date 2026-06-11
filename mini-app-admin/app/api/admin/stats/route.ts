import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  await requireAuth()
  try {
    const [totalUsers, totalOrders, products, orders, recentOrders] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.product.findMany({ where: { isActive: true } }),
      prisma.order.findMany({ select: { totalAmount: true, status: true, createdAt: true } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: true, items: true },
      }),
    ])

    const totalRevenue = orders
      .filter(o => ['PAID', 'PROCESSING', 'COMPLETED'].includes(o.status))
      .reduce((s, o) => s + Number(o.totalAmount), 0)

    const totalStock = products.reduce((s, p) => s + p.stock, 0)

    // 最迗 7 天每日订单量统计
    const dailyMap: Record<string, number> = {}
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      dailyMap[d.toISOString().slice(0, 10)] = 0
    }
    orders.forEach(o => {
      const day = o.createdAt.toISOString().slice(0, 10)
      if (day in dailyMap) dailyMap[day]++
    })
    const dailyOrders = Object.entries(dailyMap).map(([date, count]) => ({ date, count }))

    return NextResponse.json({
      totalUsers,
      totalOrders,
      totalRevenue: totalRevenue.toFixed(2),
      totalStock,
      dailyOrders,
      recentOrders: recentOrders.map(o => ({
        ...o,
        totalAmount: o.totalAmount.toString(),
        user: { firstName: o.user.firstName, username: o.user.username },
      })),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
