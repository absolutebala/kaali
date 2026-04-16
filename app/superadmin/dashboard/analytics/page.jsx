'use client'
import { useEffect, useState } from 'react'
import { saAnalytics, saTenants } from '@/lib/sa-client'
import { SAShell, fmtDate }    from '../page'

export default function SAAnalyticsPage() {
  const [data,    setData]    = useState(null)
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([saAnalytics.get(), saTenants.list({ limit:100 })])
      .then(([a, t]) => { setData(a); setTenants(t.tenants||[]); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <SAShell title="Analytics"><div style={{ padding:40, textAlign:'center', color:'#6E7E9E', fontSize:13 }}>Loading…</div></SAShell>

  const plans = data?.planBreakdown || {}
  const total = data?.totalTenants  || 1

  return (
    <SAShell title="Analytics">

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total Tenants',    value:data?.totalTenants||0,  sub:`+${data?.newTenants7d||0} last 7 days`,  color:'#7EB3FF' },
          { label:'Total Leads',      value:data?.totalLeads||0,    sub:`+${data?.newLeads7d||0} last 7 days`,    color:'#5EDFAC' },
          { label:'Conversations',    value:data?.totalConvos||0,   sub:`+${data?.convos7d||0} last 7 days`,      color:'#FBCF56' },
        ].map(s => (
          <div key={s.label} style={{ background:'#0C1220', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, padding:16 }}>
            <div style={{ fontSize:11.5, color:'#6E7E9E', marginBottom:7 }}>{s.label}</div>
            <div style={{ fontFamily:'var(--font-brand)', fontSize:30, fontWeight:700, color:s.color }}>{s.value.toLocaleString()}</div>
            <div style={{ fontSize:11, color:'#3A4A6A', marginTop:3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Plan revenue estimate */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
        <div style={{ background:'#0C1220', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, padding:16 }}>
          <div style={{ fontSize:13, fontWeight:500, color:'#E5EBF8', marginBottom:4 }}>Estimated MRR</div>
          <div style={{ fontFamily:'var(--font-brand)', fontSize:32, fontWeight:700, color:'#5EDFAC', marginBottom:14 }}>
            ${((plans.growth||0)*29 + (plans.business||0)*79).toLocaleString()}
          </div>
          {[
            { plan:'business', label:'Business', price:79,  count:plans.business||0, color:'#FBCF56' },
            { plan:'growth',   label:'Growth',   price:29,  count:plans.growth||0,   color:'#7EB3FF' },
            { plan:'starter',  label:'Starter',  price:0,   count:plans.starter||0,  color:'#6E7E9E' },
          ].map(p => (
            <div key={p.plan} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'0.5px solid rgba(255,255,255,.04)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:p.color }} />
                <span style={{ fontSize:12, color:'#6E7E9E' }}>{p.label}</span>
              </div>
              <div style={{ display:'flex', gap:16 }}>
                <span style={{ fontSize:12, color:'#E5EBF8' }}>{p.count} tenants</span>
                <span style={{ fontSize:12, color:p.color }}>${(p.count*p.price).toLocaleString()}/mo</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background:'#0C1220', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, padding:16 }}>
          <div style={{ fontSize:13, fontWeight:500, color:'#E5EBF8', marginBottom:14 }}>Plan Distribution</div>
          {[
            { plan:'business', label:'Business', color:'#FBCF56', count:plans.business||0 },
            { plan:'growth',   label:'Growth',   color:'#7EB3FF', count:plans.growth||0   },
            { plan:'starter',  label:'Starter',  color:'#3A4A6A', count:plans.starter||0  },
          ].map(p => {
            const pct = Math.round((p.count/total)*100)
            return (
              <div key={p.plan} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
                  <span style={{ color:p.color }}>{p.label}</span>
                  <span style={{ color:'#6E7E9E' }}>{p.count} ({pct}%)</span>
                </div>
                <div style={{ background:'#172038', borderRadius:4, height:8, overflow:'hidden' }}>
                  <div style={{ width:`${pct}%`, height:'100%', background:p.color, borderRadius:4, transition:'width .5s' }} />
                </div>
              </div>
            )
          })}
          <div style={{ marginTop:14, padding:10, background:'#172038', borderRadius:8 }}>
            <div style={{ fontSize:11, color:'#6E7E9E', marginBottom:4 }}>Conversion Rate</div>
            <div style={{ fontSize:18, fontWeight:700, color:'#E5EBF8', fontFamily:'var(--font-brand)' }}>
              {total > 0 ? Math.round(((plans.growth||0)+(plans.business||0))/total*100) : 0}%
            </div>
            <div style={{ fontSize:11, color:'#3A4A6A' }}>Free → Paid</div>
          </div>
        </div>
      </div>

      {/* All tenants usage table */}
      <div style={{ background:'#0C1220', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ padding:'12px 16px', borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>
          <div style={{ fontSize:13, fontWeight:500, color:'#E5EBF8' }}>All Tenants — Usage Overview</div>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>{['Company','Plan','Messages Used','Limit','Usage %','AI','Joined'].map(h => (
              <th key={h} style={{ padding:'9px 13px', textAlign:'left', fontSize:11, fontWeight:500, color:'#6E7E9E', letterSpacing:'.5px', textTransform:'uppercase', borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {tenants.sort((a,b) => b.conversations_used - a.conversations_used).map(t => {
              const pct = t.conversations_limit ? Math.min(Math.round(t.conversations_used/t.conversations_limit*100),100) : 0
              const barColor = pct>=100?'#F87171':pct>=80?'#FBBF24':'#4F8EF7'
              return (
                <tr key={t.id} style={{ borderBottom:'0.5px solid rgba(255,255,255,.03)' }}>
                  <td style={{ padding:'9px 13px', fontSize:13, color:'#E5EBF8' }}>{t.company}</td>
                  <td style={{ padding:'9px 13px', fontSize:11, color:'#6E7E9E', textTransform:'capitalize' }}>{t.plan}</td>
                  <td style={{ padding:'9px 13px', fontSize:13, color:'#E5EBF8' }}>{t.conversations_used}</td>
                  <td style={{ padding:'9px 13px', fontSize:13, color:'#6E7E9E' }}>{t.conversations_limit}</td>
                  <td style={{ padding:'9px 13px', minWidth:100 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ flex:1, background:'#172038', borderRadius:3, height:5 }}>
                        <div style={{ width:`${pct}%`, height:'100%', background:barColor, borderRadius:3 }} />
                      </div>
                      <span style={{ fontSize:10, color:barColor, width:28 }}>{pct}%</span>
                    </div>
                  </td>
                  <td style={{ padding:'9px 13px', fontSize:11, color:'#6E7E9E', textTransform:'uppercase' }}>{t.ai_provider}</td>
                  <td style={{ padding:'9px 13px', fontSize:11, color:'#3A4A6A' }}>{fmtDate(t.created_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </SAShell>
  )
}
