import { NextResponse }  from 'next/server'
import { requireAuth, signToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  const { siteId } = await request.json()

  // Verify the siteId belongs to same family
  const { data: self } = await supabaseAdmin
    .from('tenants').select('id, parent_tenant_id').eq('id', tenant.tenantId).single()

  const rootId = self.parent_tenant_id || self.id

  const { data: targetSite } = await supabaseAdmin
    .from('tenants').select('id, email, site_label, parent_tenant_id')
    .eq('id', siteId).single()

  if (!targetSite) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

  const targetRoot = targetSite.parent_tenant_id || targetSite.id
  if (targetRoot !== rootId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const token = signToken({ tenantId: targetSite.id, email: targetSite.email })
  return NextResponse.json({ token, siteLabel: targetSite.site_label })
}
