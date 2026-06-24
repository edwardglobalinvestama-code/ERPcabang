import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')
    const branchId = searchParams.get('branchId')
    const roleId = searchParams.get('roleId')
    const period = searchParams.get('period')
    const date = searchParams.get('date')
    const isApproved = searchParams.get('isApproved')

    const where: Record<string, unknown> = {}
    if (staffId) where.staffId = Number(staffId)
    if (branchId) where.branchId = Number(branchId)
    if (roleId) where.roleId = Number(roleId)
    if (period) where.period = period
    if (date) {
      const d = new Date(date)
      where.date = {
        gte: new Date(new Date(d).setHours(0, 0, 0, 0)),
        lte: new Date(new Date(d).setHours(23, 59, 59, 999)),
      }
    }
    if (isApproved === 'true') where.isApproved = true
    else if (isApproved === 'false') where.isApproved = false

    const logs = await prisma.kpiLog.findMany({
      where,
      include: {
        staff: { select: { id: true, nip: true, name: true } },
        category: { select: { id: true, name: true, slug: true } },
        branch: { select: { id: true, name: true, code: true } },
        role: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { date: 'desc' },
    })

    const result = logs.map(
      (l: {
        id: number
        staffId: number
        categoryId: number
        branchId: number
        roleId: number
        value: { toString: () => string }
        notes: string | null
        date: Date
        period: string
        approvedBy: number | null
        isApproved: boolean
        createdAt: Date
        staff: { id: number; nip: string; name: string }
        category: { id: number; name: string; slug: string }
        branch: { id: number; name: string; code: string }
        role: { id: number; name: string; slug: string }
      }) => ({
        ...l,
        value: Number(l.value),
      }),
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/kpi/logs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KPI logs' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { staffId, categoryId, branchId, roleId, value, notes, date, period } =
      body

    if (!staffId || !categoryId || !branchId || !roleId || value === undefined || !period) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: staffId, categoryId, branchId, roleId, value, period',
        },
        { status: 400 },
      )
    }

    const log = await prisma.kpiLog.create({
      data: {
        staffId: Number(staffId),
        categoryId: Number(categoryId),
        branchId: Number(branchId),
        roleId: Number(roleId),
        value: Number(value),
        notes: notes ?? null,
        date: date ? new Date(date) : new Date(),
        period,
      },
      include: {
        staff: { select: { id: true, nip: true, name: true } },
        category: { select: { id: true, name: true, slug: true } },
        branch: { select: { id: true, name: true, code: true } },
        role: { select: { id: true, name: true, slug: true } },
      },
    })

    const result = {
      ...log,
      value: Number(log.value),
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('POST /api/kpi/logs error:', error)
    return NextResponse.json(
      { error: 'Failed to create KPI log entry' },
      { status: 500 },
    )
  }
}
