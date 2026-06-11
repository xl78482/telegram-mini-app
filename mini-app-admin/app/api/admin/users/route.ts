import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Prisma } from '@prisma/client'

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
    const id = Number(userId)
    const amountDecimal = new Prisma.Decimal(String(amount ?? ''))

    if (!Number.isInteger(id) || id < 1 || amountDecimal.lte(0)) {
      return NextResponse.json({ error: '参数错误，充值金额必须大于 0' }, { status: 400 })
    }

    const updated = await prisma.$transaction(async tx => {
      const userBefore = await tx.user.findUnique({
        where: { id },
        select: { balance: true },
      })
      if (!userBefore) throw new Error('用户不存在')

      const userAfter = await tx.user.update({
        where: { id },
        data: { balance: { increment: amountDecimal } },
        select: { balance: true },
      })

      await tx.rechargeLog.create({
        data: {
          userId: id,
          amount: amountDecimal,
          note: note?.trim() || '管理员手动充值',
        },
      })

      await tx.balanceLog.create({
        data: {
          userId: id,
          type: 'ADMIN_ADD',
          amount: amountDecimal,
          balanceBefore: userBefore.balance,
          balanceAfter: userAfter.balance,
          note: note?.trim() || '管理员手动充值',
        },
      })

      return userAfter
    })

    return NextResponse.json({ balance: updated.balance.toString() })
  } catch (e) {
    console.error('[PATCH /api/admin/users]', e)
    const msg = e instanceof Error ? e.message : '充值失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
