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

    const staffFilter: Record<string, unknown> = {}
    if (branchId) staffFilter.branchId = Number(branchId)

    // ── Counts ──
    const [totalStaff, totalActiveStaff, totalBranches, branches] = await Promise.all([
      prisma.staff.count({ where: staffFilter }),
      prisma.staff.count({ where: { ...staffFilter, isActive: true } }),
      prisma.branch.count({ where: { isActive: true } }),
      prisma.branch.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      }),
    ])

    // ── Per-branch summaries ──
    const branchSummaries = await Promise.all(
      branches.map(async (branch) => {
        const staffCount = await prisma.staff.count({ where: { branchId: branch.id } })
        const activeCount = await prisma.staff.count({ where: { branchId: branch.id, isActive: true } })

        // Get KPI summary scores for this branch
        const summaries = await prisma.kpiSummary.findMany({
          where: { branchId: branch.id, period: 'monthly' },
          select: { score: true },
        })

        const scores = summaries.map((s) => Number(s.score))
        const avgKpiScore =
          scores.length > 0
            ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
            : 0

        return {
          branchId: branch.id,
          branchName: branch.name,
          branchCode: branch.code,
          staffCount,
          activeCount,
          avgKpiScore,
        }
      }),
    )

    // ── Overall average KPI ──
    const allSummaries = await prisma.kpiSummary.findMany({
      where: { period: 'monthly' },
      select: { score: true },
    })
    const allScores = allSummaries.map((s) => Number(s.score))
    const averageKpiScore =
      allScores.length > 0
        ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 100) / 100
        : 0

    return NextResponse.json({
      totalStaff,
      totalActiveStaff,
      totalBranches,
      averageKpiScore,
      branchSummaries,
    })
  } catch (error) {
    console.error('GET /api/hrd/summary error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch HRD summary' },
      { status: 500 },
    )
  }
}
