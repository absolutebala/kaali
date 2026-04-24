import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth }   from '@/lib/auth'

export async function OPTIONS() { return new NextResponse(null, { status: 204 }) }

// POST /api/enrich — enrich a lead or conversation with company data
export async function POST(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  const { ip, leadId, conversationId } = await request.json()
  if (!ip) return NextResponse.json({ error: 'IP required' }, { status: 400 })

  try {
    // Clearbit Reveal — company from IP (free tier)
    const clearbitKey = process.env.CLEARBIT_API_KEY
    let enriched = {}

    if (clearbitKey) {
      const res = await fetch(`https://reveal.clearbit.com/v1/companies/find?ip=${ip}`, {
        headers: { Authorization: `Bearer ${clearbitKey}` }
      })
      if (res.ok) {
        const data = await res.json()
        enriched = {
          company_name:    data.company?.name        || '',
          company_domain:  data.company?.domain      || '',
          company_type:    data.company?.type        || '',
          company_size:    data.company?.metrics?.employees?.toString() || '',
          linkedin_url:    data.company?.linkedin?.handle ? `https://linkedin.com/company/${data.company.linkedin.handle}` : '',
          twitter_url:     data.company?.twitter?.handle  ? `https://twitter.com/${data.company.twitter.handle}` : '',
          company_logo:    data.company?.logo        || '',
          company_country: data.company?.geo?.country || '',
          company_city:    data.company?.geo?.city    || '',
        }
      }
    } else {
      // Fallback: use free IPInfo for basic company
      const res = await fetch(`https://ipinfo.io/${ip}/json`)
      if (res.ok) {
        const data = await res.json()
        const orgClean = (data.org || '').replace(/^AS\d+\s+/, '')
        enriched = {
          company_name:   orgClean,
          company_domain: '',
          company_city:   data.city    || '',
          company_country:data.country || '',
          timezone:       data.timezone || '',
        }
      }
    }

    // Update lead if provided
    if (leadId && enriched.company_name) {
      await supabaseAdmin.from('leads')
        .update({ company: enriched.company_name })
        .eq('id', leadId)
        .eq('tenant_id', tenant.tenantId)
    }

    return NextResponse.json({ enriched })
  } catch (err) {
    console.error('[Enrich]', err)
    return NextResponse.json({ error: 'Enrichment failed' }, { status: 500 })
  }
}
