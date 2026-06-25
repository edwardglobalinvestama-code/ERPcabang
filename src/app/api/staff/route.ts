import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Helper: require authentication via session header
function getAuthStaff(request: NextRequest): { staffId: number; roleSlug: string } | null {
  try {
    const auth = request.headers.get('x-auth-staff')
    if (!auth) return null
    const decoded = JSON.parse(Buffer.from(auth, 'base64').toString())
    // Handle superadmin session format: { role: 'superadmin', ... }
    if (decoded.role === 'superadmin') {
      return { staffId: 0, roleSlug: 'superadmin' }
    }
    return decoded
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
    // Only BM and SuperAdmin can see all staff; others see their own branch only
    const isBM = auth.roleSlug === 'branch-manager'
    const isSuperAdmin = auth.roleSlug === 'superadmin'

    const where: Record<string, unknown> = {}
    if (branchId) where.branchId = Number(branchId)
    else if (!isBM && !isSuperAdmin) {
      // Non-BM and non-SA can only see their own branch
      const staff = await prisma.staff.findUnique({ where: { id: auth.staffId }, select: { branchId: true } })
      if (staff) where.branchId = staff.branchId
    }
    if (roleId) where.roleId = Number(roleId)

    const staff = await prisma.staff.findMany({
      where,
      select: {
        id: true, nip: true, name: true, phone: true, email: true,
        isActive: true, branchId: true, roleId: true, joinDate: true,
        createdAt: true, updatedAt: true,
        // ⛔ pin is intentionally excluded
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
    const auth = getAuthStaff(request)
    if (!auth || (auth.roleSlug !== 'branch-manager' && auth.roleSlug !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden — only Branch Manager or Super Admin can create staff' }, { status: 403 })
    }

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

    // 🔐 Hash PIN sebelum disimpan
    const hashedPin = await bcrypt.hash(pin, 10)

    const staff = await prisma.staff.create({
      data: {
        nip,
        name,
        phone: phone ?? null,
        email: email ?? null,
        pin: hashedPin,
        branchId: Number(branchId),
        roleId: Number(roleId),
        joinDate: joinDate ? new Date(joinDate) : null,
      },
      select: {
        id: true, nip: true, name: true, phone: true, email: true,
        isActive: true, branchId: true, roleId: true, joinDate: true,
        createdAt: true, updatedAt: true,
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
