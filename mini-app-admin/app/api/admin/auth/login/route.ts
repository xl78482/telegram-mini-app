import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticator } from 'otplib'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()
    const config = await prisma.adminConfig.findFirst()
    if (!config?.isSetup) return NextResponse.json({ error: '尚未绑定 2FA，请先前往 /setup' }, { status: 403 })

    const valid = authenticator.verify({ token: code, secret: config.totpSecret })
    if (!valid) return NextResponse.json({ error: '验证码错误' }, { status: 401 })

    const session = await getSession()
    session.isLoggedIn = true
    await session.save()
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
