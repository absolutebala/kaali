import { NextResponse }                    from 'next/server'
import { loginSuperAdmin, signSAToken }   from '@/lib/superadmin-auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required.' }, { status: 400 })
    }

    const admin = await loginSuperAdmin(email, password)
    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    const token = signSAToken({
      saId:        admin.id,
      email:       admin.email,
      name:        admin.name,
      saRole:      admin.saRole,
      permissions: admin.permissions,
    })

    return NextResponse.json({ token, admin })

  } catch (err) {
    console.error('[SA Login]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
