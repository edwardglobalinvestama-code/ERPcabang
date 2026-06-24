import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing KPI log id' }, { status: 400 })
    }

    const log = await prisma.kpiLog.update({
      where: { id: Number(id) },
      data: { isApproved: true },
    })

    return NextResponse.json({ success: true, log })
  } catch (error) {
    console.error('PATCH /api/kpi/approve error:', error)
    return NextResponse.json({ error: 'Failed to approve KPI' }, { status: 500 })
  }
}
