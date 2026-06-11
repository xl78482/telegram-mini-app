import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * GET /api/admin/orders/[id]/cards
 * 获取订单关联的卡密（管理员查看）
 */
export async function GET(req: NextRequest, context: RouteContext) {
  await requireAuth()
  const { id } = await context.params

  const cards = await prisma.cardSecret.findMany({
    where: { soldOrderId: Number(id) },
    select: {
      id: true,
      content: true,
      status: true,
      soldAt: true,
    },
    orderBy: { soldAt: 'asc' },
  })

  return NextResponse.json(cards)
}