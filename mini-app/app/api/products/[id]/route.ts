import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findFirst({
      where: { id: Number(params.id), isActive: true },
    })
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ...product, price: product.price.toString() })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
