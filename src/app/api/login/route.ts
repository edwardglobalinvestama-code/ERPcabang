import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { branchId, roleId, pin } = await request.json()

    if (!branchId || !roleId || !pin) {
      return NextResponse.json(
        { error: 'branchId, roleId, dan PIN diperlukan' },
        { status: 400 },
      )
    }

    // Find staff by branch + role
    const staffList = await prisma.staff.findMany({
      where: {
        branchId: Number(branchId),
        roleId: Number(roleId),
        isActive: true,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        role: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { name: 'asc' },
    })

    if (staffList.length === 0) {
      return NextResponse.json(
        { error: 'Staff tidak ditemukan di cabang & role ini' },
        { status: 404 },
      )
    }

    // Try to verify PIN against each staff in this role+branch
    let matchedStaff = null
    for (const staff of staffList) {
      const isMatch = await bcrypt.compare(pin, staff.pin)
      if (isMatch) {
        matchedStaff = staff
        break
      }
    }

    if (!matchedStaff) {
      return NextResponse.json(
        { error: 'PIN salah' },
        { status: 401 },
      )
    }

    // Return staff data (without pin field)
    const { pin: _, ...staffData } = matchedStaff
    return NextResponse.json({
      success: true,
      staff: staffData,
      role: staffData.role,
    })
  } catch (error) {
    console.error('POST /api/login error:', error)
    return NextResponse.json(
      { error: 'Gagal login, coba lagi' },
      { status: 500 },
    )
  }
}
