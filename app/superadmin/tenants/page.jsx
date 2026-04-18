'use client'
import { useEffect, useState } from 'react'
import { PageShell, fmtDate }  from '../dashboard/page'

function saFetch(path, opts={}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sa_token') : ''
  return fetch(path, { ...opts, headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}`, ...(opts.headers||{}) } }).then(r => r.json())
}

export default function SAtenants() {
  const [tenants,  setTenants]  = useState([])
  const [total,    setTotal]    = useState(0)
  const [search,   setSearch]   = useState('')
  const [planF,    setPlanF]    = useState('')
  const [loading,  setLoading]  = useState(true)
  const [editId,   setEditId]   = useState(null)
  const [editPlan, setEditPlan] = useState('')
  const [editLimit,setEditLimit]= useState('')
  const [impMsg,   setImpMsg]   = useState('')

  async function load() {
    setLoading(true)
    const params = new URLSearchParams({ limit:'30' })
    if (search) params.set('search', search)
    if (planF)  params.set('plan', planF)
    const d = await saFetch('/api/superadmin/tenants?' + params)
    setTenants(d.tenants || []); setTotal(d.total || 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function savePlan(id) {
    const body = {}
    if (editPlan)  body.plan = editPlan
    if (editLimit) body.conversationsLimit = parseInt(editLimit)
    await saFetch('/api/superadmin/tenants', { method:'PATCH', body: JSON.stringify({ id, ...body }) })
    setEditId(null); load()
    showToast('Plan updated!')
  }

  async function resetUsage(id) {
    await saFetch('/api/superadmin/tenants', { method:'PATCH', body: JSON.stringify({ id, conversationsUsed: 0 }) })
    showToast('Usage limit reset!')
    load()
  }

  async function impersonate(id) {
    const d = await saFetch('/api/superadmin/impersonate', { method:'POST', body: JSON.stringify({ tenantId: id }) })
    if (d.token) {
      localStorage.setItem('kaali_token', d.token); localStorage.setItem('sa_impersonating', '1')
      setImpMsg(`Logged in as ${d.tenant.company}. Go to /dashboard to view their account.`)
      showToast(`Impersonating ${d.tenant.company}!`)
    }
  }

  async function deleteTenant(id, company) {
    if (!confirm(`DELETE "${company}" and ALL their data? This cannot be undone.`)) return
    await saFetch('/api/superadmin/tenants?id=' + id, { method:'DELETE' })
    load(); showToast('Tenant deleted.')
  }

  return (
    <PageShell title={`Tenants (${total})`} action={
      <div style={{ display:'flex', gap:10 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()}
          placeholder="Search company, email…"
          style={{ background:'#111A2E', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:8, padding:'7px 12px', fontSize:12.5, color:'#E5EBF8', outline:'none', width:200 }} />
        <select value={planF} onChange={e=>{setPlanF(e.target.value);setTimeout(load,100)}}
          style={{ background:'#111A2E', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:8, padding:'7px 12px', fontSize:12.5, color:'#E5EBF8', outline:'none' }}>
          <option value="">All Plans</option>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="business">Business</option>
        </select>
        <button onClick={load} style={{ background:'rgba(248,113,113,.12)', border:'0.5px solid rgba(248,113,113,.3)', color:'#F87171', padding:'7px 14px', borderRadius:8, fontSize:12.5, cursor:'pointer' }}>Search</button>
      </div>
    }>

      {impMsg && <div style={{ background:'rgba(34,209,122,.1)', border:'0.5px solid rgba(34,209,122,.25)', color:'#22D17A', padding:'10px 14px', borderRadius:9, fontSize:13, marginBottom:14 }}>{impMsg}</div>}

      <div style={{ background:'#0C1220', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#6E7E9E', fontSize:13 }}>Loading…</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Company','Email','Plan','AI','Usage','Joined','Actions'].map(h => (
                  <th key={h} style={{ padding:'9px 13px', textAlign:'left', fontSize:11, fontWeight:500, color:'#6E7E9E', letterSpacing:'.5px', textTransform:'uppercase', borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => {
                const pct = t.conversations_limit ? Math.round(t.conversations_used/t.conversations_limit*100) : 0
                return (
                  <tr key={t.id}>
                    <td style={{ padding:'10px 13px', fontSize:13, color:'#E5EBF8', borderBottom:'0.5px solid rgba(255,255,255,.05)' }}>
                      <strong>{t.company}</strong>
                      <div style={{ fontSize:11, color:'#3A4A6A' }}>{t.name}</div>
                    </td>
                    <td style={{ padding:'10px 13px', fontSize:12, color:'#6E7E9E', borderBottom:'0.5px solid rgba(255,255,255,.05)' }}>{t.email}</td>
                    <td style={{ padding:'10px 13px', borderBottom:'0.5px solid rgba(255,255,255,.05)' }}>
                      {editId === t.id ? (
                        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                          <select value={editPlan} onChange={e=>setEditPlan(e.target.value)}
                            style={{ background:'#111A2E', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:6, padding:'4px 8px', fontSize:12, color:'#E5EBF8', outline:'none' }}>
                            <option value="">Keep current</option>
                            <option value="starter">Starter</option>
                            <option value="growth">Growth</option>
                            <option value="business">Business</option>
                          </select>
                          <button onClick={()=>savePlan(t.id)} style={{ fontSize:11, background:'rgba(34,209,122,.12)', border:'0.5px solid rgba(34,209,122,.25)', color:'#22D17A', padding:'4px 8px', borderRadius:6, cursor:'pointer' }}>Save</button>
                          <button onClick={()=>setEditId(null)} style={{ fontSize:11, background:'none', border:'none', color:'#6E7E9E', cursor:'pointer' }}>✕</button>
                        </div>
                      ) : (
                        <span style={{ fontSize:10.5, fontWeight:500, padding:'2px 9px', borderRadius:20, cursor:'pointer',
                          background: t.plan==='business'?'rgba(251,191,36,.12)':t.plan==='growth'?'rgba(79,142,247,.12)':'rgba(110,126,158,.15)',
                          color: t.plan==='business'?'#FBBF24':t.plan==='growth'?'#7EB3FF':'#6E7E9E'
                        }} onClick={()=>{setEditId(t.id);setEditPlan(t.plan);setEditLimit('')}}>
                          {t.plan}
                        </span>
                      )}
                    </td>
                    <td style={{ padding:'10px 13px', fontSize:12, color:'#6E7E9E', borderBottom:'0.5px solid rgba(255,255,255,.05)' }}>{t.ai_provider||'—'}</td>
                    <td style={{ padding:'10px 13px', borderBottom:'0.5px solid rgba(255,255,255,.05)', minWidth:120 }}>
                      <div style={{ fontSize:11, color: pct>=100?'#F87171':pct>=80?'#FBBF24':'#6E7E9E', marginBottom:4 }}>{t.conversations_used}/{t.conversations_limit} ({pct}%)</div>
                      <div style={{ background:'#111A2E', borderRadius:4, height:5, overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:4, background: pct>=100?'#F87171':pct>=80?'#FBBF24':'#4F8EF7', width:`${Math.min(pct,100)}%` }} />
                      </div>
                    </td>
                    <td style={{ padding:'10px 13px', fontSize:11, color:'#3A4A6A', borderBottom:'0.5px solid rgba(255,255,255,.05)', whiteSpace:'nowrap' }}>{fmtDate(t.created_at)}</td>
                    <td style={{ padding:'10px 13px', borderBottom:'0.5px solid rgba(255,255,255,.05)' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={()=>impersonate(t.id)} title="Log in as this tenant"
                          style={{ fontSize:11, background:'rgba(79,142,247,.1)', border:'0.5px solid rgba(79,142,247,.25)', color:'#7EB3FF', padding:'3px 8px', borderRadius:6, cursor:'pointer' }}>
                          Login As
                        </button>
                        <button onClick={()=>resetUsage(t.id)} title="Reset usage counter"
                          style={{ fontSize:11, background:'rgba(34,209,122,.08)', border:'0.5px solid rgba(34,209,122,.2)', color:'#22D17A', padding:'3px 8px', borderRadius:6, cursor:'pointer' }}>
                          Reset
                        </button>
                        <button onClick={()=>deleteTenant(t.id, t.company)}
                          style={{ fontSize:11, background:'rgba(248,113,113,.08)', border:'0.5px solid rgba(248,113,113,.2)', color:'#F87171', padding:'3px 8px', borderRadius:6, cursor:'pointer' }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!tenants.length && (
                <tr><td colSpan={7}><div style={{ padding:'36px', textAlign:'center', color:'#6E7E9E', fontSize:13 }}>No tenants found</div></td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  )
}

function showToast(msg) { const t=document.createElement('div'); t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0C1220;border:0.5px solid rgba(34,209,122,.3);color:#22D17A;padding:8px 18px;border-radius:20px;font-size:12.5px;z-index:99999;font-family:system-ui'; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2400) }
