import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthStaff(request)
    if (!auth || auth.roleSlug !== 'branch-manager') {
      return NextResponse.json({ error: 'Forbidden — only BM can edit staff' }, { status: 403 })
    }

    const { id } = await params
    const staffId = Number(id)
    if (isNaN(staffId)) {
      return NextResponse.json({ error: 'Invalid staff ID' }, { status: 400 })
    }

    const body = await request.json()
    const { nip, name, phone, email, pin, branchId, roleId, joinDate, isActive } = body

    // Build update data (only provided fields)
    const updateData: Record<string, unknown> = {}
    if (nip !== undefined) updateData.nip = nip
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (email !== undefined) updateData.email = email
    if (branchId !== undefined) updateData.branchId = Number(branchId)
    if (roleId !== undefined) updateData.roleId = Number(roleId)
    if (joinDate !== undefined) updateData.joinDate = joinDate || null
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    // If changing PIN, hash it
    if (pin !== undefined) {
      if (typeof pin !== 'string' || pin.length < 6 || !/^\d{6}$/.test(pin)) {
        return NextResponse.json({ error: 'PIN must be 6 digits' }, { status: 400 })
      }
      updateData.pin = await bcrypt.hash(pin, 10)
    }

    // Check NIP uniqueness if changing NIP
    if (nip) {
      const existing = await prisma.staff.findUnique({ where: { nip } })
      if (existing && existing.id !== staffId) {
        return NextResponse.json({ error: 'NIP already exists' }, { status: 409 })
      }
    }

    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: updateData,
      select: {
        id: true, nip: true, name: true, phone: true, email: true,
        isActive: true, joinDate: true,
        branch: { select: { id: true, name: true, code: true } },
        role: { select: { id: true, name: true, slug: true } },
      },
    })

    return NextResponse.json({ message: 'Staff updated', staff: updated })
  } catch (error) {
    console.error('PATCH /api/staff/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthStaff(request)
    if (!auth || auth.roleSlug !== 'branch-manager') {
      return NextResponse.json({ error: 'Forbidden — only BM can delete staff' }, { status: 403 })
    }

    const { id } = await params
    const staffId = Number(id)
    if (isNaN(staffId)) {
      return NextResponse.json({ error: 'Invalid staff ID' }, { status: 400 })
    }

    // Check staff exists
    const staff = await prisma.staff.findUnique({ where: { id: staffId } })
    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Delete related records first (KPI logs, summaries)
    await prisma.kpiLog.deleteMany({ where: { staffId } })
    await prisma.kpiSummary.deleteMany({ where: { staffId } })

    // Delete the staff
    await prisma.staff.delete({ where: { id: staffId } })

    return NextResponse.json({ message: 'Staff deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/staff/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 })
  }
}
