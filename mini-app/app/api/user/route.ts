import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseTelegramUser } from '@/lib/telegram'

export async function GET(req: NextRequest) {
  try {
    const initData = req.headers.get('x-init-data') ?? ''
    const tgUser = parseTelegramUser(initData)
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { tgId: BigInt(tgUser.id) } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({
      id: user.id,
      tgId: user.tgId.toString(),
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      balance: user.balance.toString(),
      createdAt: user.createdAt,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
