import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    const roleId = searchParams.get('roleId')

    const where: Record<string, unknown> = {}
    if (branchId) where.branchId = Number(branchId)
    if (roleId) where.roleId = Number(roleId)

    const staff = await prisma.staff.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        role: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(staff)
  } catch (error) {
    console.error('GET /api/staff error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nip, name, phone, email, pin, branchId, roleId, joinDate } = body

    if (!nip || !name || !pin || !branchId || !roleId) {
      return NextResponse.json(
        { error: 'Missing required fields: nip, name, pin, branchId, roleId' },
        { status: 400 },
      )
    }

    // Check if NIP already exists
    const existing = await prisma.staff.findUnique({ where: { nip } })
    if (existing) {
      return NextResponse.json(
        { error: 'Staff with this NIP already exists' },
        { status: 409 },
      )
    }

    const staff = await prisma.staff.create({
      data: {
        nip,
        name,
        phone: phone ?? null,
        email: email ?? null,
        pin,
        branchId: Number(branchId),
        roleId: Number(roleId),
        joinDate: joinDate ? new Date(joinDate) : null,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        role: { select: { id: true, name: true, slug: true } },
      },
    })

    return NextResponse.json(staff, { status: 201 })
  } catch (error) {
    console.error('POST /api/staff error:', error)
    return NextResponse.json(
      { error: 'Failed to create staff' },
      { status: 500 },
    )
  }
}
