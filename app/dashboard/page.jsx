'use client'
import { useEffect, useState } from 'react'
import { stats as statsApi, leads as leadsApi, stripe as stripeApi } from '@/lib/api-client'
import { useAuth }  from '@/lib/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function OverviewPage() {
  const { user, refreshUser } = useAuth()
  const router   = useRouter()
  const params   = useSearchParams()
  const [data,    setData]    = useState(null)
  const [leads,   setLeads]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.get('upgrade') === 'success') { refreshUser(); toast('🎉 Plan upgraded!') }
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
    } catch { toast('Stripe not configured — set STRIPE_SECRET_KEY in Vercel env vars') }
  }

  if (loading) return (
    <PageShell title="Overview">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'var(--tm)', fontSize:13 }}>Loading…</div>
    </PageShell>
  )

  const pct    = data?.usagePct || 0
  const used   = data?.used || 0
  const limit  = data?.limit || 50
  const barColor = pct >= 100 ? '#F87171' : pct >= 80 ? '#FBBF24' : 'var(--ac)'

  return (
    <PageShell title="Overview">

      {/* ── STAT CARDS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        {[
          { label:'Total Chats',       value: data?.totalConversations || 0, sub:'All time',    icon:'💬', color:'var(--ac)' },
          { label:'Leads Captured',    value: data?.totalLeads || 0,         sub:'With contact',icon:'👥', color:'#22D17A' },
          { label:'Potential Clients', value: data?.clientLeads || 0,        sub:'In pipeline', icon:'🎯', color:'#A78BFA' },
          { label:'Chats This Week',   value: data?.weekConversations || 0,  sub:'Last 7 days', icon:'📈', color:'#60A5FA' },
        ].map(c => (
          <div key={c.label} style={{ background:'var(--s1)', border:'0.5px solid var(--b1)', borderRadius:14, padding:'20px 22px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--tm)', letterSpacing:'1px', textTransform:'uppercase' }}>{c.label}</div>
              <div style={{ fontSize:20 }}>{c.icon}</div>
            </div>
            <div style={{ fontSize:38, fontWeight:800, color: c.color, lineHeight:1, marginBottom:6 }}>{c.value}</div>
            <div style={{ fontSize:12, color:'var(--ts)' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── USAGE BAR ── */}
      <div style={{ background:'var(--s1)', border:'0.5px solid var(--b1)', borderRadius:14, padding:'20px 24px', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--tx)', marginBottom:2 }}>
              Monthly Usage
              <span style={{ marginLeft:10, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:99,
                background:'rgba(255,92,0,.15)', color:'var(--ac)' }}>
                {(user?.plan||'starter').charAt(0).toUpperCase()+(user?.plan||'starter').slice(1)}
              </span>
            </div>
            <div style={{ fontSize:12, color:'var(--tm)' }}>Resets monthly</div>
          </div>
          <Link href="/dashboard/api-usage" style={{ fontSize:12, color:'var(--ac)', fontWeight:600 }}>Manage →</Link>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8 }}>
          <span style={{ color:'var(--tx)', fontWeight:600 }}>{used} messages used</span>
          <span style={{ color:'var(--tm)' }}>{limit} limit</span>
        </div>
        <div style={{ height:8, background:'var(--s3)', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${Math.min(pct,100)}%`, background: barColor, borderRadius:99, transition:'width .4s' }} />
        </div>
        {pct >= 100 && <div style={{ fontSize:12, color:'#F87171', marginTop:8, fontWeight:500 }}>🔴 Limit reached — upgrade to continue chatting</div>}
        {pct >= 80 && pct < 100 && <div style={{ fontSize:12, color:'#FBBF24', marginTop:8, fontWeight:500 }}>⚠ Approaching monthly limit ({pct}% used)</div>}
      </div>

      {/* ── UPGRADE CTA ── */}
      {user?.plan === 'starter' && (
        <div style={{ background:'linear-gradient(135deg, rgba(255,92,0,.12), rgba(255,92,0,.04))', border:'0.5px solid rgba(255,92,0,.25)', borderRadius:14, padding:'18px 24px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--tx)', marginBottom:4 }}>You're on the Starter plan</div>
            <div style={{ fontSize:13, color:'var(--tm)' }}>Upgrade to Growth for unlimited chats, 10 seats, and no personal API key needed.</div>
          </div>
          <button className="btn-pri" onClick={() => handleUpgrade('growth')} style={{ whiteSpace:'nowrap' }}>
            Upgrade to Growth →
          </button>
        </div>
      )}

      {/* ── RECENT LEADS ── */}
      <div style={{ background:'var(--s1)', border:'0.5px solid var(--b1)', borderRadius:14, overflow:'hidden' }}>
        <div style={{ padding:'16px 22px', borderBottom:'0.5px solid var(--b1)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--tx)' }}>Recent Leads</div>
          <Link href="/dashboard/leads" style={{ fontSize:12, color:'var(--ac)', fontWeight:600 }}>View All →</Link>
        </div>
        {leads.length ? (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'0.5px solid var(--b1)' }}>
                {['Name','Email','Type','Date','Status'].map(h => (
                  <th key={h} style={{ padding:'11px 20px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--ts)', textTransform:'uppercase', letterSpacing:'1px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id} style={{ borderBottom:'0.5px solid var(--b1)' }}
                  onMouseOver={e => e.currentTarget.style.background='var(--s2)'}
                  onMouseOut={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'13px 20px', fontSize:14, fontWeight:700, color:'var(--tx)' }}>{l.name}</td>
                  <td style={{ padding:'13px 20px', fontSize:13, color:'var(--ts)' }}>{l.email}</td>
                  <td style={{ padding:'13px 20px' }}>
                    <span className={`badge badge-${(l.visitor_type||'general').toLowerCase()}`}>{l.visitor_type}</span>
                  </td>
                  <td style={{ padding:'13px 20px', fontSize:12, color:'var(--tm)' }}>{fmtDate(l.created_at)}</td>
                  <td style={{ padding:'13px 20px' }}>
                    <span className={`badge badge-${l.status}`}>{l.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding:'48px 24px', textAlign:'center', color:'var(--tm)', fontSize:13 }}>
            <div style={{ fontSize:32, marginBottom:12 }}>👥</div>
            No leads yet — start a chat on your website!
          </div>
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
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'16px 28px', borderBottom:'0.5px solid var(--b1)',
        background:'var(--s1)', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontSize:20, fontWeight:700, color:'var(--tx)', letterSpacing:'-.3px' }}>{title}</div>
        {action && <div>{action}</div>}
      </div>
      <div style={{ padding:'24px 28px' }}>{children}</div>
    </>
  )
}

export function fmtDate(d) {
  try { return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) }
  catch { return d || '' }
}

function toast(msg) {
  if (typeof document === 'undefined') return
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg
  document.body.appendChild(t); setTimeout(() => t.remove(), 2400)
}
