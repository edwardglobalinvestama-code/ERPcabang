import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('roleId')

    const where: Record<string, unknown> = {}
    if (roleId) {
      where.targets = { some: { roleId: Number(roleId) } }
    }

    const categories = await prisma.kpiCategory.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    const result = categories.map(
      (c: {
        id: number
        name: string
        slug: string
        description: string | null
        weight: { toString: () => string }
        createdAt: Date
      }) => ({
        ...c,
        weight: Number(c.weight),
      }),
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/kpi/categories error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KPI categories' },
      { status: 500 },
    )
  }
}
