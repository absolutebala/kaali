'use client'
import { useEffect, useState } from 'react'
import { PageShell, fmtDate }  from '../dashboard/page'

function saFetch(path) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sa_token') : ''
  return fetch(path, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
}

export default function SALeads() {
  const [leads,   setLeads]   = useState([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    saFetch('/api/superadmin/leads?limit=50').then(d => { setLeads(d.leads||[]); setTotal(d.total||0); setLoading(false) })
  }, [])

  return (
    <PageShell title={`All Leads (${total})`}>
      <div style={{ background:'#0C1220', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, overflow:'hidden' }}>
        {loading ? <div style={{ padding:40, textAlign:'center', color:'#6E7E9E', fontSize:13 }}>Loading…</div> : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>{['Name','Email','Type','Company','Summary','Status','Date'].map(h => (
                <th key={h} style={{ padding:'9px 13px', textAlign:'left', fontSize:11, fontWeight:500, color:'#6E7E9E', letterSpacing:'.5px', textTransform:'uppercase', borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id}>
                  <td style={{ padding:'10px 13px', fontSize:13, color:'#E5EBF8', borderBottom:'0.5px solid rgba(255,255,255,.05)' }}><strong>{l.name}</strong></td>
                  <td style={{ padding:'10px 13px', fontSize:12, color:'#6E7E9E', borderBottom:'0.5px solid rgba(255,255,255,.05)' }}>{l.email}</td>
                  <td style={{ padding:'10px 13px', borderBottom:'0.5px solid rgba(255,255,255,.05)' }}>
                    <span style={{ fontSize:10.5, fontWeight:500, padding:'2px 9px', borderRadius:20,
                      background: l.visitor_type==='CLIENT'?'rgba(79,142,247,.15)':l.visitor_type==='INVESTOR'?'rgba(34,209,122,.12)':'rgba(168,85,247,.12)',
                      color: l.visitor_type==='CLIENT'?'#7EB3FF':l.visitor_type==='INVESTOR'?'#5EDFAC':'#C084FC'
                    }}>{l.visitor_type}</span>
                  </td>
                  <td style={{ padding:'10px 13px', fontSize:12, color:'#6E7E9E', borderBottom:'0.5px solid rgba(255,255,255,.05)' }}>{l.tenants?.company||'—'}</td>
                  <td style={{ padding:'10px 13px', fontSize:12, color:'#6E7E9E', maxWidth:180, borderBottom:'0.5px solid rgba(255,255,255,.05)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.summary||'—'}</td>
                  <td style={{ padding:'10px 13px', borderBottom:'0.5px solid rgba(255,255,255,.05)' }}>
                    <span style={{ fontSize:10.5, fontWeight:500, padding:'2px 9px', borderRadius:20,
                      background: l.status==='converted'?'rgba(251,191,36,.12)':l.status==='contacted'?'rgba(34,209,122,.12)':'rgba(79,142,247,.12)',
                      color: l.status==='converted'?'#FBBF24':l.status==='contacted'?'#5EDFAC':'#7EB3FF'
                    }}>{l.status}</span>
                  </td>
                  <td style={{ padding:'10px 13px', fontSize:11, color:'#3A4A6A', borderBottom:'0.5px solid rgba(255,255,255,.05)', whiteSpace:'nowrap' }}>{fmtDate(l.created_at)}</td>
                </tr>
              ))}
              {!leads.length && <tr><td colSpan={7}><div style={{ padding:36, textAlign:'center', color:'#6E7E9E', fontSize:13 }}>No leads yet</div></td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  )
}
