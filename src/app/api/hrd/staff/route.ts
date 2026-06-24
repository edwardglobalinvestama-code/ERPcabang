import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getAuthStaff(request: NextRequest): { staffId: number; roleSlug: string } | null {
  try {
    const auth = request.headers.get('x-auth-staff')
    if (!auth) return null
    return JSON.parse(Buffer.from(auth, 'base64').toString())
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthStaff(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Only branch-manager or super-admin can access
    if (auth.roleSlug !== 'branch-manager' && auth.roleSlug !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    const roleId = searchParams.get('roleId')
    const search = searchParams.get('search')
    const status = searchParams.get('status') // active | inactive | all

    const where: Record<string, unknown> = {}
    if (branchId) where.branchId = Number(branchId)
    if (roleId) where.roleId = Number(roleId)
    if (search) {
      where.OR = [
        { nip: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status === 'active') where.isActive = true
    else if (status === 'inactive') where.isActive = false
    // 'all' or no status => no filter

    const staff = await prisma.staff.findMany({
      where,
      select: {
        id: true,
        nip: true,
        name: true,
        phone: true,
        email: true,
        isActive: true,
        branchId: true,
        roleId: true,
        joinDate: true,
        createdAt: true,
        updatedAt: true,
        // ⛔ pin is intentionally excluded
        branch: { select: { id: true, name: true, code: true } },
        role: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { name: 'asc' },
    })

    // Attach current KPI score for each staff member
    const staffWithKpi = await Promise.all(
      staff.map(async (s) => {
        const summaries = await prisma.kpiSummary.findMany({
          where: { staffId: s.id, period: 'monthly' },
          select: { score: true },
        })
        const scores = summaries.map((sm) => Number(sm.score))
        const kpiScore =
          scores.length > 0
            ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
            : null

        return { ...s, kpiScore }
      }),
    )

    return NextResponse.json(staffWithKpi)
  } catch (error) {
    console.error('GET /api/hrd/staff error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch HRD staff' },
      { status: 500 },
    )
  }
}
