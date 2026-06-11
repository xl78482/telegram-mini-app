/**
 * GET /api/recharge/rate
 * 占位接口 - 暂时返回 null
 * TODO: 新增 SystemSetting 表后，从后台配置读取真实 USDT 汇率
 */
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ rate: null })
}
