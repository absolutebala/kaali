'use client'
import { useEffect, useState } from 'react'
import { PageShell, fmtDate }  from '../dashboard/page'

function saFetch(path) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sa_token') : ''
  return fetch(path, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
}

export default function SAConversations() {
  const [list,    setList]    = useState([])
  const [msgs,    setMsgs]    = useState([])
  const [selId,   setSelId]   = useState(null)
  const [meta,    setMeta]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    saFetch('/api/superadmin/conversations').then(d => { setList(d.conversations||[]); setLoading(false) })
  }, [])

  async function selectConvo(id) {
    setSelId(id)
    const d = await saFetch('/api/superadmin/conversations?id=' + id)
    setMsgs(d.messages||[]); setMeta(d.conversation)
  }

  return (
    <PageShell title="All Conversations">
      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:14 }}>
        {/* List */}
        <div style={{ background:'#0C1220', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, overflow:'hidden', maxHeight:560, overflowY:'auto' }}>
          {loading ? <div style={{ padding:24, color:'#6E7E9E', fontSize:13, textAlign:'center' }}>Loading…</div> :
            list.map(c => (
              <div key={c.id} onClick={()=>selectConvo(c.id)}
                style={{ padding:'11px 13px', borderBottom:'0.5px solid rgba(255,255,255,.05)', cursor:'pointer', background: selId===c.id ? 'rgba(248,113,113,.08)' : 'none', transition:'background .15s' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:12, fontWeight:500, color:'#E5EBF8' }}>{c.visitor_type||'Unknown'}</span>
                  <span style={{ fontSize:11, color:'#3A4A6A' }}>{fmtDate(c.started_at)}</span>
                </div>
                <div style={{ fontSize:11.5, color:'#6E7E9E', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {c.tenants?.company||'Unknown'} · {c.lead_captured ? '✓ Lead' : 'No lead'}
                </div>
              </div>
            ))
          }
          {!loading && !list.length && <div style={{ padding:24, color:'#6E7E9E', fontSize:13, textAlign:'center' }}>No conversations</div>}
        </div>

        {/* Transcript */}
        <div style={{ background:'#0C1220', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, padding:14, maxHeight:560, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
          {!selId ? (
            <div style={{ color:'#6E7E9E', fontSize:13, textAlign:'center', paddingTop:40 }}>Select a conversation to view transcript</div>
          ) : (
            <>
              {meta && (
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:4, paddingBottom:10, borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>
                  <span style={{ fontSize:12, color:'#E5EBF8' }}>{meta.tenants?.company}</span>
                  <span style={{ fontSize:11, color:'#3A4A6A' }}>·</span>
                  <span style={{ fontSize:11, color:'#6E7E9E' }}>{meta.visitor_type}</span>
                  {meta.lead_captured && <span style={{ fontSize:10.5, color:'#22D17A', background:'rgba(34,209,122,.1)', padding:'1px 8px', borderRadius:20 }}>✓ Lead</span>}
                </div>
              )}
              {msgs.map(m => (
                <div key={m.id} style={{ display:'flex', flexDirection:'column', maxWidth:'84%', alignSelf: m.role==='assistant'?'flex-start':'flex-end' }}>
                  <div style={{ padding:'8px 12px', borderRadius:12, fontSize:12.5, lineHeight:1.55, wordBreak:'break-word',
                    background: m.role==='assistant' ? '#111A2E' : '#1B3FA0',
                    color: m.role==='assistant' ? '#E5EBF8' : '#DDE9FF',
                    border: m.role==='assistant' ? '0.5px solid rgba(255,255,255,.07)' : 'none',
                    borderBottomLeftRadius: m.role==='assistant' ? 4 : 12,
                    borderBottomRightRadius: m.role==='assistant' ? 12 : 4,
                  }} dangerouslySetInnerHTML={{ __html: m.role==='assistant' ? m.content.replace(/\n/g,'<br/>') : m.content }} />
                  <div style={{ fontSize:10, color:'#3A4A6A', marginTop:3, padding:'0 3px', alignSelf: m.role==='assistant'?'flex-start':'flex-end' }}>
                    {new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </PageShell>
  )
}
