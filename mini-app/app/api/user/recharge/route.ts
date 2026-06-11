import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseTelegramUser } from '@/lib/telegram'

// 前端提交充值申请（实际扣款由管理员后台操作）
export async function POST(req: NextRequest) {
  try {
    const initData = req.headers.get('x-init-data') ?? ''
    const tgUser = parseTelegramUser(initData)
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { amount } = await req.json()
    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { tgId: BigInt(tgUser.id) } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // 记录充值申请（管理员后台审核后实际到账）
    const log = await prisma.rechargeLog.create({
      data: { userId: user.id, amount: Number(amount), note: 'pending' },
    })

    return NextResponse.json({ id: log.id, amount: log.amount.toString() }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
