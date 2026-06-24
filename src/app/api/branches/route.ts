import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(branches)
  } catch (error) {
    console.error('GET /api/branches error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
      { status: 500 },
    )
  }
}
