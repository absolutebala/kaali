import { NextResponse }       from 'next/server'
import { supabaseAdmin }     from '@/lib/supabase'
import { requireSuperAdmin } from '@/lib/superadmin-auth'
import { signToken }         from '@/lib/auth'

export async function OPTIONS() { return new NextResponse(null, { status: 204 }) }

export async function POST(request) {
  const { admin, error } = await requireSuperAdmin(request, ['superadmin', 'support'])
  if (error) return error

  const { tenantId } = await request.json()
  if (!tenantId) return NextResponse.json({ error: 'tenantId required.' }, { status: 400 })

  const { data: tenant } = await supabaseAdmin.from('tenants').select('id, email, company').eq('id', tenantId).single()
  if (!tenant) return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 })

  const token = signToken({ tenantId: tenant.id, email: tenant.email, company: tenant.company })
  console.log(`[SuperAdmin] ${admin.email} impersonated ${tenant.company}`)
  return NextResponse.json({ token, tenant: { id: tenant.id, email: tenant.email, company: tenant.company } })
}
