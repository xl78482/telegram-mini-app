import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
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
  } catch (e) {
    console.error('[GET /api/admin/users]', e)
    return NextResponse.json({ error: '用户列表获取失败，请检查数据库连接' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth()
    const { userId, amount, note } = await req.json()
    if (!userId || isNaN(Number(amount))) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }
    const updated = await prisma.$transaction(async tx => {
      await tx.rechargeLog.create({ data: { userId, amount: Number(amount), note: note ?? '管理员手动充値' } })
      return tx.user.update({
        where: { id: userId },
        data: { balance: { increment: Number(amount) } },
      })
    })
    return NextResponse.json({ balance: updated.balance.toString() })
  } catch (e) {
    console.error('[PATCH /api/admin/users]', e)
    return NextResponse.json({ error: '充値失败' }, { status: 500 })
  }
}
