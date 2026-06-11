import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  await requireAuth()
  const users = await prisma.user.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  return NextResponse.json(users.map(u => ({
    ...u,
    tgId: u.tgId.toString(),
    balance: u.balance.toString(),
  })))
}

export async function PATCH(req: NextRequest) {
  await requireAuth()
  try {
    const { userId, amount, note } = await req.json()
    const updated = await prisma.$transaction(async tx => {
      await tx.rechargeLog.create({ data: { userId, amount: Number(amount), note: note ?? '管理员手动充值' } })
      return tx.user.update({
        where: { id: userId },
        data: { balance: { increment: Number(amount) } },
      })
    })
    return NextResponse.json({ balance: updated.balance.toString() })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
