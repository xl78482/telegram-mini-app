import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth()
  try {
    const { status } = await req.json()
    const order = await prisma.order.update({
      where: { id: Number(params.id) },
      data: { status },
    })
    return NextResponse.json({ ...order, totalAmount: order.totalAmount.toString() })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
