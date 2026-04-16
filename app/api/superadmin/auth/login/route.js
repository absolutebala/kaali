import { NextResponse }                          from 'next/server'
import { supabaseAdmin }                         from '@/lib/supabase'
import { hashPassword, verifyPassword, signSuperAdminToken } from '@/lib/superadmin-auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    // ── First-time setup: if no superadmin users exist, create one ──
    const { count } = await supabaseAdmin
      .from('superadmin_users')
      .select('*', { count: 'exact', head: true })

    if (count === 0) {
      // Check against env vars for initial setup
      const envEmail    = process.env.SUPERADMIN_EMAIL
      const envPassword = process.env.SUPERADMIN_PASSWORD

      if (!envEmail || !envPassword) {
        return NextResponse.json({
          error: 'No super admin configured. Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD in environment variables.'
        }, { status: 503 })
      }

      if (email.toLowerCase() !== envEmail.toLowerCase() || password !== envPassword) {
        return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
      }

      // Create first superadmin user
      const pwHash = await hashPassword(password)
      const { data: newAdmin } = await supabaseAdmin
        .from('superadmin_users')
        .insert({ name: 'Super Admin', email: email.toLowerCase(), password_hash: pwHash, role: 'superadmin' })
        .select('id, name, email, role')
        .single()

      const token = signSuperAdminToken({ adminId: newAdmin.id, email: newAdmin.email, adminRole: newAdmin.role, name: newAdmin.name })
      return NextResponse.json({ token, admin: newAdmin })
    }

    // ── Normal login ──────────────────────────────────────
    const { data: admin } = await supabaseAdmin
      .from('superadmin_users')
      .select('id, name, email, role, password_hash, is_active')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (!admin || !admin.is_active) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    const valid = await verifyPassword(password, admin.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    // Update last login
    await supabaseAdmin
      .from('superadmin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id)

    const token = signSuperAdminToken({
      adminId:   admin.id,
      email:     admin.email,
      adminRole: admin.role,
      name:      admin.name,
    })

    return NextResponse.json({
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    })

  } catch (err) {
    console.error('[SA Login]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
