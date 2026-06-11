/**
 * GET /api/recharge/rate
 * 返回 USDT 充値汇率配置
 * 占位接口：当前从 AdminConfig 读取 usdtRate，未配置时返回 null
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const config = await prisma.adminConfig.findFirst();
    const rate = config?.usdtRate ? Number(config.usdtRate) : null;
    return NextResponse.json({ rate });
  } catch {
    // 数据库未初始化或字段不存在时，安全返回 null
    return NextResponse.json({ rate: null });
  }
}
