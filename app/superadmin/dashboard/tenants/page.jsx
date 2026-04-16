'use client'
import { useEffect, useState, useCallback } from 'react'
import { saTenants }         from '@/lib/sa-client'
import { token as tenantToken } from '@/lib/api-client'
import { SAShell, fmtDate }  from '../page'

export default function SATenantsPage() {
  const [tenants,  setTenants]  = useState([])
  const [total,    setTotal]    = useState(0)
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)  // tenant for plan modal
  const [impMsg,   setImpMsg]   = useState('')

  const load = useCallback(async (q = search) => {
    setLoading(true)
    try {
      const r = await saTenants.list({ q, limit: 50 })
      setTenants(r.tenants || [])
      setTotal(r.total || 0)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [])

  async function updatePlan(id, plan) {
    await saTenants.update({ id, plan })
    setTenants(p => p.map(t => t.id === id ? { ...t, plan, conversations_limit: {starter:100,growth:2000,business:999999}[plan] } : t))
    setModal(null)
    showToast(`Plan updated to ${plan}`)
  }

  async function resetUsage(id) {
    await saTenants.update({ id, resetUsage: true })
    setTenants(p => p.map(t => t.id === id ? { ...t, conversations_used: 0 } : t))
    showToast('Usage reset to 0')
  }

  async function deleteTenant(id, company) {
    if (!confirm(`Delete "${company}" and ALL their data? This cannot be undone.`)) return
    await saTenants.remove(id)
    setTenants(p => p.filter(t => t.id !== id))
    showToast('Tenant deleted')
  }

  async function impersonate(tenant) {
    setImpMsg('Getting access…')
    try {
      const r = await saTenants.impersonate(tenant.id)
      // Store the tenant token temporarily and redirect
      tenantToken.set(r.token)
      window.open(r.dashboardUrl, '_blank')
      setImpMsg('')
      showToast(`Now viewing as ${tenant.company}`)
    } catch(e) {
      setImpMsg(e.message)
    }
  }

  const PLAN_COLORS = { starter:'#6E7E9E', growth:'#7EB3FF', business:'#FBCF56' }
  const PLAN_BG     = { starter:'rgba(107,122,150,.15)', growth:'rgba(79,142,247,.12)', business:'rgba(251,191,36,.12)' }

  return (
    <SAShell title={`Tenants (${total})`} action={
      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
        {impMsg && <span style={{ fontSize:12, color:'#FBBF24' }}>{impMsg}</span>}
        <input value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load(search)}
          placeholder="Search company, email…"
          style={{ background:'#111A2E', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:8, padding:'7px 13px', fontSize:13, color:'#E5EBF8', outline:'none', width:220 }} />
        <button onClick={() => load(search)}
          style={{ background:'rgba(79,142,247,.12)', border:'0.5px solid rgba(79,142,247,.3)', color:'#E5EBF8', padding:'7px 14px', borderRadius:8, fontSize:12, cursor:'pointer' }}>
          Search
        </button>
      </div>
    }>
      <div style={{ background:'#0C1220', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#6E7E9E', fontSize:13 }}>Loading…</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>{['Company','Email','Plan','Bot Name','Usage','AI','Joined','Actions'].map(h => (
                <th key={h} style={{ padding:'9px 13px', textAlign:'left', fontSize:11, fontWeight:500, color:'#6E7E9E', letterSpacing:'.5px', textTransform:'uppercase', borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {tenants.map(t => {
                const pct = t.conversations_limit ? Math.min(Math.round(t.conversations_used/t.conversations_limit*100),100) : 0
                const barColor = pct>=100?'#F87171':pct>=80?'#FBBF24':'#4F8EF7'
                return (
                  <tr key={t.id} style={{ borderBottom:'0.5px solid rgba(255,255,255,.04)' }}>
                    <td style={{ padding:'10px 13px', fontSize:13, color:'#E5EBF8' }}><strong>{t.company}</strong><div style={{ fontSize:11, color:'#3A4A6A' }}>{t.name}</div></td>
                    <td style={{ padding:'10px 13px', fontSize:12, color:'#6E7E9E' }}>{t.email}</td>
                    <td style={{ padding:'10px 13px' }}>
                      <span style={{ fontSize:10.5, fontWeight:500, padding:'2px 9px', borderRadius:20, background:PLAN_BG[t.plan]||PLAN_BG.starter, color:PLAN_COLORS[t.plan]||PLAN_COLORS.starter, textTransform:'capitalize' }}>{t.plan}</span>
                    </td>
                    <td style={{ padding:'10px 13px', fontSize:12, color:'#6E7E9E' }}>{t.bot_name}</td>
                    <td style={{ padding:'10px 13px', minWidth:120 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ flex:1, background:'#172038', borderRadius:4, height:5 }}>
                          <div style={{ width:`${pct}%`, height:'100%', background:barColor, borderRadius:4 }} />
                        </div>
                        <span style={{ fontSize:10, color:barColor, width:28 }}>{pct}%</span>
                      </div>
                      <div style={{ fontSize:10, color:'#3A4A6A', marginTop:2 }}>{t.conversations_used}/{t.conversations_limit}</div>
                    </td>
                    <td style={{ padding:'10px 13px', fontSize:11, color:'#6E7E9E', textTransform:'uppercase' }}>{t.ai_provider}</td>
                    <td style={{ padding:'10px 13px', fontSize:11, color:'#3A4A6A' }}>{fmtDate(t.created_at)}</td>
                    <td style={{ padding:'10px 13px' }}>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <button onClick={() => setModal(t)}
                          style={{ fontSize:11, color:'#7EB3FF', background:'rgba(79,142,247,.1)', border:'0.5px solid rgba(79,142,247,.25)', padding:'3px 9px', borderRadius:6, cursor:'pointer' }}>
                          Plan
                        </button>
                        <button onClick={() => resetUsage(t.id)}
                          style={{ fontSize:11, color:'#5EDFAC', background:'rgba(34,209,122,.1)', border:'0.5px solid rgba(34,209,122,.25)', padding:'3px 9px', borderRadius:6, cursor:'pointer' }}>
                          Reset
                        </button>
                        <button onClick={() => impersonate(t)}
                          style={{ fontSize:11, color:'#FBCF56', background:'rgba(251,191,36,.1)', border:'0.5px solid rgba(251,191,36,.25)', padding:'3px 9px', borderRadius:6, cursor:'pointer' }}>
                          View
                        </button>
                        <button onClick={() => deleteTenant(t.id, t.company)}
                          style={{ fontSize:11, color:'#F87171', background:'rgba(248,113,113,.1)', border:'0.5px solid rgba(248,113,113,.25)', padding:'3px 9px', borderRadius:6, cursor:'pointer' }}>
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Plan change modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div style={{ background:'#0C1220', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:14, padding:24, width:380, maxWidth:'92vw' }}>
            <div style={{ fontFamily:'var(--font-brand)', fontSize:16, fontWeight:700, color:'#E5EBF8', marginBottom:5 }}>Change Plan</div>
            <div style={{ fontSize:13, color:'#6E7E9E', marginBottom:20 }}>{modal.company} — currently on <strong style={{ color:'#E5EBF8' }}>{modal.plan}</strong></div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { plan:'starter',  label:'Starter',  price:'Free',   limit:'100 messages' },
                { plan:'growth',   label:'Growth',   price:'$29/mo', limit:'2,000 messages' },
                { plan:'business', label:'Business', price:'$79/mo', limit:'Unlimited' },
              ].map(p => (
                <button key={p.plan} onClick={() => updatePlan(modal.id, p.plan)}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background: modal.plan===p.plan ? 'rgba(79,142,247,.15)' : '#111A2E', border:`0.5px solid ${modal.plan===p.plan?'rgba(79,142,247,.4)':'rgba(255,255,255,.07)'}`, borderRadius:9, cursor:'pointer', transition:'all .15s' }}>
                  <div style={{ textAlign:'left' }}>
                    <div style={{ fontSize:13, fontWeight:500, color:'#E5EBF8' }}>{p.label}</div>
                    <div style={{ fontSize:11, color:'#6E7E9E' }}>{p.limit}</div>
                  </div>
                  <div style={{ fontSize:13, color:'#4F8EF7', fontWeight:500 }}>{p.price}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setModal(null)} style={{ width:'100%', marginTop:14, padding:9, background:'none', border:'0.5px solid rgba(255,255,255,.1)', borderRadius:8, color:'#6E7E9E', fontSize:13, cursor:'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </SAShell>
  )
}

function showToast(msg) {
  const t=document.createElement('div')
  t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0C1220;border:0.5px solid rgba(255,255,255,.13);color:#22D17A;padding:8px 18px;border-radius:20px;font-size:12.5px;z-index:99999;white-space:nowrap;font-family:sans-serif'
  t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2400)
}
