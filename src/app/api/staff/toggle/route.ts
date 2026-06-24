import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing staff id' }, { status: 400 })
    }

    const body = await request.json()
    const staff = await prisma.staff.update({
      where: { id: Number(id) },
      data: { isActive: body.isActive },
      select: {
        id: true, nip: true, name: true, isActive: true,
        branchId: true, roleId: true,
        branch: { select: { id: true, name: true } },
        role: { select: { id: true, name: true, slug: true } },
      },
    })

    return NextResponse.json({ success: true, staff })
  } catch (error) {
    console.error('PATCH /api/staff/toggle error:', error)
    return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 })
  }
}
