'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

function saFetch(path) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sa_token') : ''
  return fetch(path, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
}

export function fmtDate(d) { try { return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) } catch { return d||'' } }

export default function SADashboard() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    saFetch('/api/superadmin/stats').then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <PageShell title="Overview"><div style={{ padding:40, textAlign:'center', color:'#6E7E9E', fontSize:13 }}>Loading…</div></PageShell>

  const plans = data?.planBreakdown || {}

  return (
    <PageShell title="Overview">
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total Tenants',   value: data?.totalTenants  || 0, sub:'All workspaces'     },
          { label:'New This Week',   value: data?.weekTenants   || 0, sub:'Registered'         },
          { label:'Total Leads',     value: data?.totalLeads    || 0, sub:'Across all tenants' },
          { label:'Total Messages',  value: data?.totalConvos   || 0, sub:'All time'           },
        ].map(s => (
          <div key={s.label} style={{ background:'#0C1220', border:'0.5px solid rgba(248,113,113,.12)', borderRadius:12, padding:15 }}>
            <div style={{ fontSize:11.5, color:'#6E7E9E', marginBottom:7 }}>{s.label}</div>
            <div style={{ fontFamily:'system-ui', fontSize:24, fontWeight:700, color:'#E5EBF8' }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#3A4A6A', marginTop:3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <div style={{ background:'#0C1220', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'0.5px solid rgba(255,255,255,.07)', fontSize:13, fontWeight:500, color:'#E5EBF8' }}>Plan Breakdown</div>
          <div style={{ padding:16 }}>
            {[
              { plan:'starter',  label:'Starter',  color:'#6E7E9E' },
              { plan:'growth',   label:'Growth',   color:'#4F8EF7' },
              { plan:'business', label:'Business', color:'#FBBF24' },
            ].map(p => {
              const count = plans[p.plan] || 0
              const total = data?.totalTenants || 1
              const pct   = Math.round(count / total * 100)
              return (
                <div key={p.plan} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#6E7E9E', marginBottom:5 }}>
                    <span>{p.label}</span><span>{count} tenants ({pct}%)</span>
                  </div>
                  <div style={{ background:'#111A2E', borderRadius:6, height:7, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:6, background:p.color, width:`${pct}%`, transition:'width .5s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent signups */}
        <div style={{ background:'#0C1220', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>
            <span style={{ fontSize:13, fontWeight:500, color:'#E5EBF8' }}>Recent Signups</span>
            <Link href="/superadmin/tenants" style={{ fontSize:11, color:'#F87171' }}>View All →</Link>
          </div>
          <div style={{ padding:'8px 0' }}>
            {(data?.recentTenants||[]).map(t => (
              <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 16px' }}>
                <div style={{ width:28, height:28, borderRadius:50, background:'rgba(248,113,113,.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#F87171', flexShrink:0 }}>
                  {(t.company||'?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12.5, color:'#E5EBF8', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.company}</div>
                  <div style={{ fontSize:11, color:'#3A4A6A' }}>{t.email}</div>
                </div>
                <span style={{ fontSize:10, fontWeight:500, padding:'2px 8px', borderRadius:20, background: t.plan==='business'?'rgba(251,191,36,.12)':t.plan==='growth'?'rgba(79,142,247,.12)':'rgba(110,126,158,.15)', color: t.plan==='business'?'#FBBF24':t.plan==='growth'?'#7EB3FF':'#6E7E9E' }}>
                  {t.plan}
                </span>
              </div>
            ))}
            {!(data?.recentTenants||[]).length && <div style={{ padding:'20px 16px', color:'#3A4A6A', fontSize:13, textAlign:'center' }}>No tenants yet</div>}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { href:'/superadmin/tenants',       icon:'🏢', label:'Manage Tenants',      desc:'View, edit plans, reset usage' },
          { href:'/superadmin/leads',         icon:'👥', label:'All Leads',           desc:'Cross-tenant lead view' },
          { href:'/superadmin/conversations', icon:'💬', label:'All Conversations',   desc:'Browse any tenant chat' },
          { href:'/superadmin/team',          icon:'👤', label:'Team Members',        desc:'Add/remove admin users' },
          { href:'/superadmin/settings',      icon:'⚙️', label:'Platform Settings',  desc:'Email, defaults, branding' },
          { href:'/dashboard',                icon:'↗',  label:'View Client Dashboard', desc:'Switch to tenant view' },
        ].map(c => (
          <Link key={c.href} href={c.href} style={{ padding:16, background:'#0C1220', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, textDecoration:'none', transition:'border-color .15s', display:'block' }}>
            <div style={{ fontSize:20, marginBottom:8 }}>{c.icon}</div>
            <div style={{ fontSize:13, fontWeight:500, color:'#E5EBF8', marginBottom:4 }}>{c.label}</div>
            <div style={{ fontSize:12, color:'#6E7E9E' }}>{c.desc}</div>
          </Link>
        ))}
      </div>
    </PageShell>
  )
}

export function PageShell({ title, action, children }) {
  return (
    <>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', borderBottom:'0.5px solid rgba(248,113,113,.12)', background:'#060A14', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontFamily:'system-ui', fontSize:17, fontWeight:700, color:'#E5EBF8' }}>{title}</div>
        {action && <div>{action}</div>}
      </div>
      <div style={{ padding:'22px 24px' }}>{children}</div>
    </>
  )
}

