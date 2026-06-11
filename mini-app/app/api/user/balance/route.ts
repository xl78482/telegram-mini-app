import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseTelegramUser } from '@/lib/telegram'

export async function GET(req: NextRequest) {
  try {
    const initData = req.headers.get('x-init-data') ?? ''
    const tgUser = parseTelegramUser(initData)
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // upsert：确保用户存在
    const user = await prisma.user.upsert({
      where: { tgId: BigInt(tgUser.id) },
      update: {
        username: tgUser.username ?? null,
        firstName: tgUser.first_name ?? null,
        lastName: tgUser.last_name ?? null,
      },
      create: {
        tgId: BigInt(tgUser.id),
        username: tgUser.username ?? null,
        firstName: tgUser.first_name ?? null,
        lastName: tgUser.last_name ?? null,
        balance: 0,
      },
    })

    return NextResponse.json({ balance: user.balance.toString() })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
