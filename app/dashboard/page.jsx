'use client'
import { useEffect, useState } from 'react'
import { stats as statsApi, leads as leadsApi, stripe as stripeApi } from '@/lib/api-client'
import { useAuth }  from '@/lib/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function OverviewPage() {
  const { user, refreshUser } = useAuth()
  const router       = useRouter()
  const params       = useSearchParams()
  const [data, setData]     = useState(null)
  const [leads, setLeads]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.get('upgrade') === 'success') {
      refreshUser()
      toast('🎉 Plan upgraded successfully!')
    }
    async function load() {
      try {
        const [s, l] = await Promise.all([statsApi.get(), leadsApi.list({ limit: 5 })])
        setData(s); setLeads(l.leads || [])
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  async function handleUpgrade(plan) {
    try {
      const { url } = await stripeApi.createCheckout(plan)
      window.location.href = url
    } catch(e) { toast('Stripe not configured yet — set STRIPE_SECRET_KEY in Vercel env vars') }
  }

  if (loading) return <PageShell title="Overview"><div style={{ color:'var(--tm)', padding:40, textAlign:'center', fontSize:13 }}>Loading…</div></PageShell>

  const pct    = data?.usagePct || 0
  const barCls = pct>=100 ? 'crit' : pct>=80 ? 'warn' : ''

  return (
    <PageShell title="Overview">
      {/* Stats */}
      <div className="stats-grid">
        <StatCard label="Total Chats"      value={data?.totalConversations || 0} sub="All time" />
        <StatCard label="Leads Captured"   value={data?.totalLeads || 0}         sub="With contact info" />
        <StatCard label="Potential Clients" value={data?.clientLeads || 0}       sub="In pipeline" />
        <StatCard label="Chats This Week"  value={data?.weekConversations || 0}  sub="Last 7 days" />
      </div>

      {/* Usage */}
      <div className="card" style={{ marginBottom:14 }}>
        <div className="card-header">
          <span className="card-title">Monthly Usage — {(user?.plan||'Starter').charAt(0).toUpperCase()+(user?.plan||'starter').slice(1)}</span>
          <Link href="/dashboard/api-usage" style={{ fontSize:12, color:'var(--ac)' }}>Manage →</Link>
        </div>
        <div className="card-body">
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--tm)', marginBottom:6 }}>
            <span>{data?.used||0} Messages</span>
            <span>{data?.limit||100} Messages Limit</span>
          </div>
          <div className="usage-bar-bg" style={{ height:9 }}>
            <div className={`usage-bar-fill ${barCls}`} style={{ width:`${pct}%` }} />
          </div>
          {pct >= 80 && <div style={{ fontSize:12, color:'var(--am)', marginTop:6 }}>⚠ Approaching monthly limit</div>}
        </div>
      </div>

      {/* Upgrade CTA */}
      {user?.plan === 'starter' && (
        <div style={{ background:'linear-gradient(135deg,rgba(79,142,247,.15),rgba(79,142,247,.06))', border:'0.5px solid rgba(79,142,247,.3)', borderRadius:12, padding:'16px 20px', marginBottom:14, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:500, color:'var(--tx)', marginBottom:3 }}>You're on the free plan</div>
            <div style={{ fontSize:13, color:'var(--tm)' }}>Upgrade to Growth for 2,000 messages/mo and 10 PDFs.</div>
          </div>
          <button className="btn-pri" onClick={() => handleUpgrade('growth')}>Upgrade to Growth — $29/mo →</button>
        </div>
      )}

      {/* Recent leads */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Leads</span>
          <Link href="/dashboard/leads" style={{ fontSize:12, color:'var(--ac)' }}>View All →</Link>
        </div>
        {leads.length ? (
          <table className="tbl">
            <thead><tr><th>Name</th><th>Email</th><th>Type</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id}>
                  <td><strong>{l.name}</strong></td>
                  <td style={{ color:'var(--tm)' }}>{l.email}</td>
                  <td><span className={`badge badge-${(l.visitor_type||'general').toLowerCase()}`}>{l.visitor_type}</span></td>
                  <td style={{ color:'var(--td)', fontSize:12 }}>{fmtDate(l.created_at)}</td>
                  <td><span className={`badge badge-${l.status}`}>{l.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state"><div className="empty-ico">👥</div>No leads yet — start a chat on your website!</div>
        )}
      </div>
    </PageShell>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

export function PageShell({ title, action, children }) {
  return (
    <>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', borderBottom:'0.5px solid rgba(255,255,255,.07)', background:'var(--s1)', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontFamily:'var(--font-brand)', fontSize:17, fontWeight:700, color:'var(--tx)' }}>{title}</div>
        {action && <div>{action}</div>}
      </div>
      <div style={{ padding:'22px 24px' }}>{children}</div>
    </>
  )
}

export function fmtDate(d) {
  try { return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) }
  catch { return d || '' }
}

function toast(msg) {
  const t = document.createElement('div'); t.className='toast'; t.textContent=msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2400);
}
