'use client'
import { useEffect, useState, useCallback } from 'react'
import { leads as leadsApi, exportLeadsCSV } from '@/lib/api-client'
import { PageShell, fmtDate } from '../page'
import { useRouter } from 'next/navigation'

const TYPES = ['all','client','investor','existing','general']

export default function LeadsPage() {
  const router = useRouter()
  const [data,    setData]    = useState([])
  const [counts,  setCounts]  = useState({})
  const [filter,  setFilter]  = useState('all')
  const [loading, setLoading] = useState(true)
  const [selLead, setSelLead] = useState(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('sa_impersonating')) {
      router.replace('/dashboard/knowledge'); return
    }
    load()
  }, [])

  const load = useCallback(async (f = filter) => {
    setLoading(true)
    try {
      const params = f !== 'all' ? { type: f.toUpperCase(), limit: 100 } : { limit: 100 }
      const res = await leadsApi.list(params)
      setData(res.leads || [])
      const all = await leadsApi.list({ limit: 200 })
      const c = { all: all.total || 0 }
      TYPES.slice(1).forEach(t => { c[t] = (all.leads||[]).filter(l => (l.visitor_type||'GENERAL').toLowerCase() === t).length })
      setCounts(c)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [filter])

  async function changeStatus(id, status) {
    await leadsApi.updateStatus(id, status)
    setData(p => p.map(l => l.id === id ? { ...l, status } : l))
    if (selLead?.id === id) setSelLead(p => ({ ...p, status }))
  }

  function handleFilter(f) { setFilter(f); load(f) }

  const flagEmoji = (country) => {
    if (!country) return ''
    try {
      const code = country.toUpperCase().slice(0,2)
      return code.split('').map(c => String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))).join('')
    } catch { return '' }
  }

  return (
    <PageShell title="Leads" action={
      <button className="btn-sec btn-sm" onClick={() => exportLeadsCSV(data)}>↓ Export CSV</button>
    }>
      <div style={{ display:'grid', gridTemplateColumns: selLead ? '1fr 340px' : '1fr', gap:16, transition:'all .3s' }}>

        {/* Leads table */}
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, flexWrap:'wrap' }}>
            <div className="tabs">
              {TYPES.map(t => (
                <button key={t} className={`tab${filter===t?' active':''}`} onClick={() => handleFilter(t)}>
                  {t==='all'?'All':t.charAt(0).toUpperCase()+t.slice(1)}{counts[t] !== undefined ? ` (${counts[t]})` : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            {loading ? (
              <div style={{ padding:40, textAlign:'center', color:'var(--tm)', fontSize:14 }}>Loading…</div>
            ) : data.length ? (
              <table className="tbl">
                <thead>
                  <tr><th>Contact</th><th>Company</th><th>Role</th><th>Location</th><th>Type</th><th>Date</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {data.map(l => (
                    <tr key={l.id} onClick={() => setSelLead(l)} style={{ cursor:'pointer', background: selLead?.id===l.id ? 'rgba(79,142,247,.06)' : 'none' }}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(79,142,247,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:500, color:'#7EB3FF', flexShrink:0 }}>
                            {(l.name||'?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight:500, color:'var(--tx)', fontSize:13 }}>{l.name}</div>
                            <div style={{ fontSize:11, color:'var(--tm)' }}>{l.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize:13, color:'var(--ts)' }}>{l.company || <span style={{ color:'var(--td)' }}>—</span>}</td>
                      <td style={{ fontSize:13, color:'var(--ts)' }}>{l.designation || <span style={{ color:'var(--td)' }}>—</span>}</td>
                      <td>
                        {l.city || l.country ? (
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ fontSize:16 }}>{flagEmoji(l.country)}</span>
                            <div>
                              <div style={{ fontSize:12, color:'var(--ts)' }}>{l.city || l.country}</div>
                              {l.city && l.country && <div style={{ fontSize:11, color:'var(--tm)' }}>{l.country}</div>}
                            </div>
                          </div>
                        ) : <span style={{ color:'var(--td)', fontSize:12 }}>—</span>}
                      </td>
                      <td><span className={`badge badge-${(l.visitor_type||'general').toLowerCase()}`}>{l.visitor_type}</span></td>
                      <td style={{ color:'var(--td)', fontSize:12, whiteSpace:'nowrap' }}>{fmtDate(l.created_at)}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <select value={l.status} onChange={e => changeStatus(l.id, e.target.value)}
                          style={{ background:'var(--s2)', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:7, padding:'4px 8px', fontSize:12, color:'var(--tx)', outline:'none', cursor:'pointer' }}>
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                        </select>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <a href={`/dashboard/conversations?id=${l.conversation_id}`} style={{ fontSize:12, color:'var(--ac)', whiteSpace:'nowrap' }}>View Chat →</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state"><div className="empty-ico">👥</div>No leads{filter!=='all'?` for type: ${filter}`:''}</div>
            )}
          </div>
        </div>

        {/* Profile panel */}
        {selLead && (
          <div style={{ background:'var(--s1)', border:'0.5px solid rgba(79,142,247,.2)', borderRadius:12, overflow:'hidden', position:'sticky', top:16, maxHeight:'calc(100vh - 100px)', overflowY:'auto' }}>
            {/* Header */}
            <div style={{ padding:'20px 18px 16px', borderBottom:'0.5px solid rgba(255,255,255,.06)', textAlign:'center', position:'relative' }}>
              <button onClick={() => setSelLead(null)} style={{ position:'absolute', top:12, right:12, background:'none', border:'none', color:'var(--tm)', cursor:'pointer', fontSize:16 }}>✕</button>
              <div style={{ width:56, height:56, borderRadius:'50%', background:'linear-gradient(145deg,#1D4FD8,#4F8EF7)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-brand)', fontSize:20, fontWeight:700, color:'#fff', margin:'0 auto 12px' }}>
                {(selLead.name||'?').charAt(0).toUpperCase()}
              </div>
              <div style={{ fontSize:16, fontWeight:500, color:'var(--tx)', marginBottom:3 }}>{selLead.name}</div>
              {selLead.designation && <div style={{ fontSize:12, color:'var(--tm)', marginBottom:8 }}>{selLead.designation}{selLead.company ? ` at ${selLead.company}` : ''}</div>}
              <div style={{ display:'flex', justifyContent:'center', gap:6, flexWrap:'wrap' }}>
                <span className={`badge badge-${(selLead.visitor_type||'general').toLowerCase()}`}>{selLead.visitor_type}</span>
                {selLead.session_count > 1 && <span className="badge" style={{ background:'rgba(34,209,122,.12)', color:'#5EDFAC' }}>{selLead.session_count} visits</span>}
              </div>
            </div>

            {/* Contact */}
            <Section title="Contact">
              <Row icon="✉" label="Email" val={selLead.email} />
              {selLead.company && <Row icon="🏢" label="Company" val={selLead.company} />}
              {selLead.designation && <Row icon="👤" label="Role" val={selLead.designation} />}
            </Section>

            {/* Location & Device */}
            {(selLead.city || selLead.country || selLead.device) && (
              <Section title="Location & Device">
                {(selLead.city || selLead.country) && <Row icon="📍" label="Location" val={[selLead.city, selLead.country].filter(Boolean).join(', ')} flag={flagEmoji(selLead.country)} />}
                {selLead.device && <Row icon="💻" label="Device" val={selLead.device} />}
              </Section>
            )}

            {/* Session */}
            <Section title="Session Intelligence">
              {selLead.session_count && <Row icon="🔄" label="Sessions" val={`${selLead.session_count} visit${selLead.session_count!==1?'s':''}`} />}
              {selLead.pages_visited?.length > 0 && (
                <div style={{ marginBottom:8 }}>
                  <div style={{ fontSize:11, color:'var(--tm)', marginBottom:5 }}>Pages visited</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                    {selLead.pages_visited.map((p,i) => (
                      <span key={i} style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background:'rgba(255,255,255,.06)', color:'var(--tm)' }}>{p}</span>
                    ))}
                  </div>
                </div>
              )}
              {selLead.summary && (
                <div>
                  <div style={{ fontSize:11, color:'var(--tm)', marginBottom:4 }}>Asked about</div>
                  <div style={{ fontSize:12, color:'var(--ts)', lineHeight:1.5, fontStyle:'italic' }}>"{selLead.summary}"</div>
                </div>
              )}
            </Section>

            {/* Status */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, padding:'14px 16px' }}>
              {['new','contacted','converted'].map(s => (
                <button key={s} onClick={() => changeStatus(selLead.id, s)}
                  style={{ padding:'8px 4px', borderRadius:8, border:'0.5px solid rgba(255,255,255,.1)', fontSize:12, cursor:'pointer', fontWeight:500, transition:'all .15s',
                    background: selLead.status===s ? (s==='converted'?'rgba(251,191,36,.15)':s==='contacted'?'rgba(34,209,122,.12)':'rgba(79,142,247,.12)') : 'none',
                    color: selLead.status===s ? (s==='converted'?'#FBCF56':s==='contacted'?'#5EDFAC':'#7EB3FF') : 'var(--tm)',
                    borderColor: selLead.status===s ? (s==='converted'?'rgba(251,191,36,.3)':s==='contacted'?'rgba(34,209,122,.25)':'rgba(79,142,247,.3)') : 'rgba(255,255,255,.1)',
                  }}>
                  {s.charAt(0).toUpperCase()+s.slice(1)}
                </button>
              ))}
            </div>

            {/* View chat */}
            <div style={{ padding:'0 16px 16px' }}>
              <a href={`/dashboard/conversations?id=${selLead.conversation_id}`}
                style={{ display:'block', textAlign:'center', padding:'9px', background:'rgba(79,142,247,.1)', border:'0.5px solid rgba(79,142,247,.25)', borderRadius:8, fontSize:13, color:'var(--ac)', textDecoration:'none' }}>
                View Chat Transcript →
              </a>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ padding:'12px 16px', borderBottom:'0.5px solid rgba(255,255,255,.05)' }}>
      <div style={{ fontSize:10, fontWeight:500, letterSpacing:'1.2px', textTransform:'uppercase', color:'var(--td)', marginBottom:10 }}>{title}</div>
      {children}
    </div>
  )
}

function Row({ icon, label, val, flag }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:8 }}>
      <span style={{ fontSize:13, width:18, textAlign:'center', flexShrink:0, marginTop:1 }}>{icon}</span>
      <div>
        <div style={{ fontSize:11, color:'var(--tm)', marginBottom:1 }}>{label}</div>
        <div style={{ fontSize:13, color:'var(--ts)' }}>{flag && <span style={{ marginRight:5 }}>{flag}</span>}{val}</div>
      </div>
    </div>
  )
}
