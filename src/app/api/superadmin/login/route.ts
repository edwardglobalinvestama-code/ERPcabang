import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'PIN diperlukan' }, { status: 400 })
    }

    // Verify against env
    const validPin = process.env.SUPERADMIN_PIN
    if (!validPin) {
      return NextResponse.json({ error: 'Super Admin belum dikonfigurasi' }, { status: 500 })
    }

    if (pin !== validPin) {
      return NextResponse.json({ error: 'PIN salah' }, { status: 401 })
    }

    // Generate session token (simple: encrypt PIN + timestamp)
    const sessionData = {
      role: 'superadmin',
      loginAt: Date.now(),
      pin: validPin.slice(-4), // just last 4 for verification
    }

    return NextResponse.json({
      success: true,
      session: Buffer.from(JSON.stringify(sessionData)).toString('base64'),
      role: 'superadmin',
    })
  } catch (error) {
    console.error('Superadmin login error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
