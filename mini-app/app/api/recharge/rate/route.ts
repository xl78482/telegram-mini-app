/**
 * GET /api/recharge/rate
 * 从 SystemSetting 表读取 USDT 汇率配置
 * 管理员在后台设置 key = 'usdt_rate'，value 为人民币兑 USDT 的汇率（如 7.25）
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'usdt_rate' },
    })

    if (!setting || !setting.value) {
      return NextResponse.json({ rate: null })
    }

    const rate = parseFloat(setting.value)
    if (isNaN(rate) || rate <= 0) {
      return NextResponse.json({ rate: null })
    }

    return NextResponse.json({ rate })
  } catch {
    // systemSetting 表不存在或查询失败，降级返回 null
    return NextResponse.json({ rate: null })
  }
}
