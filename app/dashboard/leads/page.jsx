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

  useEffect(() => {
    // Block impersonating super admin
    if (typeof window !== 'undefined' && localStorage.getItem('sa_token')) {
      router.replace('/dashboard/knowledge')
      return
    }
    load()
  }, [])

  const load = useCallback(async (f = filter) => {
    setLoading(true)
    try {
      const params = f !== 'all' ? { type: f.toUpperCase(), limit: 100 } : { limit: 100 }
      const res    = await leadsApi.list(params)
      setData(res.leads || [])
      const all = await leadsApi.list({ limit: 200 })
      const c   = { all: all.total || 0 }
      TYPES.slice(1).forEach(t => { c[t] = (all.leads||[]).filter(l => (l.visitor_type||'GENERAL').toLowerCase() === t).length })
      setCounts(c)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [filter])

  async function changeStatus(id, status) {
    await leadsApi.updateStatus(id, status)
    setData(p => p.map(l => l.id === id ? { ...l, status } : l))
  }

  function handleFilter(f) { setFilter(f); load(f) }

  return (
    <PageShell title="Leads" action={
      <button className="btn-sec btn-sm" onClick={() => exportLeadsCSV(data)}>↓ Export CSV</button>
    }>
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
          <div style={{ padding:40, textAlign:'center', color:'var(--tm)', fontSize:13 }}>Loading…</div>
        ) : data.length ? (
          <table className="tbl">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Type</th><th>Summary</th><th>Date</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {data.map(l => (
                <tr key={l.id}>
                  <td><strong>{l.name}</strong></td>
                  <td style={{ color:'var(--tm)' }}>{l.email}</td>
                  <td><span className={`badge badge-${(l.visitor_type||'general').toLowerCase()}`}>{l.visitor_type}</span></td>
                  <td style={{ color:'var(--tm)', maxWidth:180, fontSize:12 }}>{l.summary || '—'}</td>
                  <td style={{ color:'var(--td)', fontSize:12, whiteSpace:'nowrap' }}>{fmtDate(l.created_at)}</td>
                  <td>
                    <select value={l.status} onChange={e => changeStatus(l.id, e.target.value)}
                      style={{ background:'var(--s2)', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:7, padding:'4px 8px', fontSize:12, color:'var(--tx)', outline:'none', cursor:'pointer' }}>
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="converted">Converted</option>
                    </select>
                  </td>
                  <td>
                    <a href={`/dashboard/conversations?id=${l.conversation_id}`} style={{ fontSize:11.5, color:'var(--ac)' }}>View Chat →</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state"><div className="empty-ico">👥</div>No leads{filter!=='all'?` for type: ${filter}`:''}</div>
        )}
      </div>
    </PageShell>
  )
}
