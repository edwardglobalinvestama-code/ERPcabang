import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper
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

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    const roleId = searchParams.get('roleId')
    const period = searchParams.get('period') ?? 'monthly'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // ── Base filters ──
    const staffFilter: Record<string, unknown> = {}
    if (branchId) staffFilter.branchId = Number(branchId)
    if (roleId) staffFilter.roleId = Number(roleId)

    const summaryWhere: Record<string, unknown> = { period }
    if (branchId) summaryWhere.branchId = Number(branchId)
    if (roleId) summaryWhere.roleId = Number(roleId)
    if (startDate) summaryWhere.periodStart = { gte: new Date(startDate) }
    if (endDate) summaryWhere.periodEnd = { lte: new Date(endDate) }

    // ── Total counts ──
    const [totalStaff, totalActiveStaff, totalBranches] = await Promise.all([
      prisma.staff.count({ where: staffFilter }),
      prisma.staff.count({ where: { ...staffFilter, isActive: true } }),
      prisma.branch.count({ where: { isActive: true } }),
    ])

    // ── KPI summaries (no relations on KpiSummary, fetch IDs only) ──
    const summaries = await prisma.kpiSummary.findMany({
      where: summaryWhere,
    })

    // Convert Decimals to numbers
    const parsedSummaries = summaries.map((s) => ({
      ...s,
      targetValue: Number(s.targetValue),
      actualValue: Number(s.actualValue),
      score: Number(s.score),
    }))

    // ── Average KPI score across all staff ──
    const avgScoreResult = parsedSummaries.reduce(
      (acc, s) => ({ sum: acc.sum + s.score, count: acc.count + 1 }),
      { sum: 0, count: 0 },
    )
    const averageKpiScore =
      avgScoreResult.count > 0
        ? Math.round((avgScoreResult.sum / avgScoreResult.count) * 100) / 100
        : 0

    // ── Fetch role/branch names for KPI summaries ──
    const roleIds = [...new Set(parsedSummaries.map((s) => s.roleId))]
    const branchIds = [...new Set(parsedSummaries.map((s) => s.branchId))]
    const staffIds = [...new Set(parsedSummaries.map((s) => s.staffId))]

    const [roles, branches, staffMembers] = await Promise.all([
      prisma.role.findMany({
        where: { id: { in: roleIds } },
        select: { id: true, name: true, slug: true },
      }),
      prisma.branch.findMany({
        where: { id: { in: branchIds } },
        select: { id: true, name: true, code: true },
      }),
      prisma.staff.findMany({
        where: { id: { in: staffIds } },
        select: { id: true, nip: true, name: true },
      }),
    ])

    const roleMap = new Map(roles.map((r) => [r.id, r]))
    const branchMap = new Map(branches.map((b) => [b.id, b]))
    const staffMap = new Map(staffMembers.map((s) => [s.id, s]))

    // ── KPI by Role ──
    const roleGroupMap = new Map<
      number,
      { role: { id: number; name: string; slug: string }; scores: number[]; staffSet: Set<number> }
    >()
    for (const s of parsedSummaries) {
      const role = roleMap.get(s.roleId)
      if (!role) continue
      if (!roleGroupMap.has(s.roleId)) {
        roleGroupMap.set(s.roleId, { role, scores: [], staffSet: new Set() })
      }
      const entry = roleGroupMap.get(s.roleId)!
      entry.scores.push(s.score)
      entry.staffSet.add(s.staffId)
    }
    const kpiByRole = Array.from(roleGroupMap.values()).map((entry) => {
      const avg =
        entry.scores.length > 0
          ? Math.round(
              (entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length) *
                100,
            ) / 100
          : 0
      return { role: entry.role, score: avg, staffCount: entry.staffSet.size }
    })

    // ── KPI by Branch ──
    const branchGroupMap = new Map<
      number,
      { branch: { id: number; name: string; code: string }; scores: number[]; staffSet: Set<number> }
    >()
    for (const s of parsedSummaries) {
      const branch = branchMap.get(s.branchId)
      if (!branch) continue
      if (!branchGroupMap.has(s.branchId)) {
        branchGroupMap.set(s.branchId, { branch, scores: [], staffSet: new Set() })
      }
      const entry = branchGroupMap.get(s.branchId)!
      entry.scores.push(s.score)
      entry.staffSet.add(s.staffId)
    }
    const kpiByBranch = Array.from(branchGroupMap.values()).map((entry) => {
      const avg =
        entry.scores.length > 0
          ? Math.round(
              (entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length) *
                100,
            ) / 100
          : 0
      return { branch: entry.branch, score: avg, staffCount: entry.staffSet.size }
    })

    // ── Top Performers (top 5 by average score per staff) ──
    const staffScoreMap = new Map<
      number,
      {
        staffId: number
        roleId: number
        branchId: number
        scores: number[]
      }
    >()
    for (const s of parsedSummaries) {
      if (!staffScoreMap.has(s.staffId)) {
        staffScoreMap.set(s.staffId, {
          staffId: s.staffId,
          roleId: s.roleId,
          branchId: s.branchId,
          scores: [],
        })
      }
      staffScoreMap.get(s.staffId)!.scores.push(s.score)
    }
    const topPerformers = Array.from(staffScoreMap.values())
      .map((entry) => {
        const avg =
          entry.scores.length > 0
            ? Math.round(
                (entry.scores.reduce((a, b) => a + b, 0) /
                  entry.scores.length) *
                  100,
              ) / 100
            : 0
        return {
          staff: staffMap.get(entry.staffId) ?? { id: entry.staffId, nip: '', name: 'Unknown' },
          role: roleMap.get(entry.roleId) ?? { id: entry.roleId, name: 'Unknown', slug: '' },
          branch: branchMap.get(entry.branchId) ?? { id: entry.branchId, name: 'Unknown', code: '' },
          score: avg,
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    // ── Recent Logs (last 20) ──
    const recentLogs = await prisma.kpiLog.findMany({
      take: 20,
      orderBy: { date: 'desc' },
      include: {
        staff: { select: { id: true, nip: true, name: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    })

    // For each recent log, try to find the matching target to calculate score
    const recentLogsWithScore = await Promise.all(
      recentLogs.map(async (log) => {
        const target = await prisma.kpiTarget.findFirst({
          where: {
            roleId: log.roleId,
            categoryId: log.categoryId,
            branchId: log.branchId,
            period: log.period,
          },
        })

        const value = Number(log.value)
        const targetVal = target ? Number(target.targetValue) : 0
        const score =
          targetVal > 0
            ? Math.round(Math.min((value / targetVal) * 100, 100) * 100) / 100
            : 0

        return {
          staff: log.staff,
          category: log.category,
          value,
          target: targetVal,
          score,
          date: log.date,
        }
      }),
    )

    return NextResponse.json({
      totalStaff,
      totalActiveStaff,
      totalBranches,
      averageKpiScore,
      kpiByRole,
      kpiByBranch,
      topPerformers,
      recentLogs: recentLogsWithScore,
    })
  } catch (error) {
    console.error('GET /api/dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 },
    )
  }
}
