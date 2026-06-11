import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseTelegramUser } from '@/lib/telegram'

type TelegramUser = {
  id: number | string
  username?: string
  first_name?: string
  last_name?: string
  photo_url?: string
}

export async function GET(req: NextRequest) {
  try {
    const initData = req.headers.get('x-init-data') ?? ''
    const tgUser = parseTelegramUser(initData) as TelegramUser | null
    if (!tgUser?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

const tgId = BigInt(tgUser.id)
    const user = await prisma.user.upsert({
      where: { tgId },
      update: {
        username: tgUser.username ?? null,
        firstName: tgUser.first_name ?? null,
        lastName: tgUser.last_name ?? null,
        avatarUrl: tgUser.photo_url ?? null,
      },
      create: {
        tgId,
        username: tgUser.username ?? null,
        firstName: tgUser.first_name ?? null,
        lastName: tgUser.last_name ?? null,
        avatarUrl: tgUser.photo_url ?? null,
        balance: 0,
      },
    })

    return NextResponse.json({
      id: user.id,
      tgId: user.tgId.toString(),
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      balance: user.balance.toString(),
      createdAt: user.createdAt,
    })
  } catch (e) {
    console.error('[GET /api/user]', e)
    return NextResponse.json({ error: '用户信息获取失败' }, { status: 500 })
  }
}
