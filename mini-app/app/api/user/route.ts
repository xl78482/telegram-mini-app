import { NextRequest, NextResponse } from 'next/server'
import { parseTelegramUser } from '@/lib/telegram'
import { getOrCreateTelegramUser, type TelegramUserPayload } from '@/lib/telegram-user'

export async function GET(req: NextRequest) {
  try {
    const initData = req.headers.get('x-init-data') ?? ''
    const tgUser = parseTelegramUser(initData) as TelegramUserPayload | null
    if (!tgUser?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const user = await getOrCreateTelegramUser(tgUser)

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
