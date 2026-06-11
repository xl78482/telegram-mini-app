import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

export async function GET() {
  try {
    const config = await prisma.adminConfig.findFirst()
    if (config?.isSetup) return NextResponse.json({ alreadySetup: true })

    const secret = authenticator.generateSecret()
    const otpauth = authenticator.keyuri('admin', 'MiniShopAdmin', secret)
    const qrCode = await QRCode.toDataURL(otpauth)

    // 将密钥临时存储（未激活）
    if (config) {
      await prisma.adminConfig.update({ where: { id: config.id }, data: { totpSecret: secret, isSetup: false } })
    } else {
      await prisma.adminConfig.create({ data: { totpSecret: secret, isSetup: false } })
    }

    return NextResponse.json({ qrCode, secret })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()
    const config = await prisma.adminConfig.findFirst()
    if (!config) return NextResponse.json({ error: '请先请求 GET 获取二维码' }, { status: 400 })

    const valid = authenticator.verify({ token: code, secret: config.totpSecret })
    if (!valid) return NextResponse.json({ error: '验证码错误，请重试' }, { status: 401 })

    await prisma.adminConfig.update({ where: { id: config.id }, data: { isSetup: true } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
