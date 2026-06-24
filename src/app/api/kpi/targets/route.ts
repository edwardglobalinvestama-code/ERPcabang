import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('roleId')
    const branchId = searchParams.get('branchId')
    const period = searchParams.get('period')

    const where: Record<string, unknown> = {}
    if (roleId) where.roleId = Number(roleId)
    if (branchId) where.branchId = Number(branchId)
    if (period) where.period = period

    const targets = await prisma.kpiTarget.findMany({
      where,
      include: {
        role: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ roleId: 'asc' }, { categoryId: 'asc' }],
    })

    const result = targets.map(
      (t: {
        id: number
        roleId: number
        categoryId: number
        branchId: number | null
        targetValue: { toString: () => string }
        targetDesc: string | null
        period: string
        createdAt: Date
        updatedAt: Date
        role: { id: number; name: string; slug: string }
        category: { id: number; name: string; slug: string }
        branch: { id: number; name: string; code: string } | null
      }) => ({
        ...t,
        targetValue: Number(t.targetValue),
      }),
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/kpi/targets error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KPI targets' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roleId, categoryId, branchId, targetValue, targetDesc, period } =
      body

    if (!roleId || !categoryId || !targetValue || !period) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: roleId, categoryId, targetValue, period',
        },
        { status: 400 },
      )
    }

    const target = await prisma.kpiTarget.upsert({
      where: {
        roleId_categoryId_branchId_period: {
          roleId: Number(roleId),
          categoryId: Number(categoryId),
          branchId: branchId ? Number(branchId) : -1,
          period,
        },
      },
      update: {
        targetValue: Number(targetValue),
        targetDesc: targetDesc ?? null,
      },
      create: {
        roleId: Number(roleId),
        categoryId: Number(categoryId),
        branchId: branchId ? Number(branchId) : null,
        targetValue: Number(targetValue),
        targetDesc: targetDesc ?? null,
        period,
      },
      include: {
        role: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    })

    // Convert Decimal to number
    const result = {
      ...target,
      targetValue: Number(target.targetValue),
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('POST /api/kpi/targets error:', error)
    return NextResponse.json(
      { error: 'Failed to create/update KPI target' },
      { status: 500 },
    )
  }
}
