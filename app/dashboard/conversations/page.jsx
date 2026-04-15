'use client'
import { useEffect, useState }   from 'react'
import { useSearchParams }        from 'next/navigation'
import { conversations as convApi } from '@/lib/api-client'
import { PageShell, fmtDate }    from '../page'

export default function ConversationsPage() {
  const params          = useSearchParams()
  const [list,  setList]  = useState([])
  const [msgs,  setMsgs]  = useState([])
  const [selId, setSelId] = useState(params.get('id') || null)
  const [meta,  setMeta]  = useState(null)
  const [loading, setL]   = useState(true)

  useEffect(() => {
    convApi.list({ limit: 50 }).then(r => { setList(r.conversations || []); setL(false) }).catch(() => setL(false))
  }, [])

  useEffect(() => {
    if (!selId) return
    convApi.messages(selId).then(r => { setMsgs(r.messages || []); setMeta(r.conversation) })
  }, [selId])

  return (
    <PageShell title="Conversations">
      <div style={{ display:'grid', gridTemplateColumns:'250px 1fr', gap:12 }}>
        {/* List */}
        <div style={{ background:'var(--s1)', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, overflow:'hidden', maxHeight:580, overflowY:'auto' }}>
          {loading ? (
            <div style={{ padding:24, color:'var(--tm)', fontSize:13, textAlign:'center' }}>Loading…</div>
          ) : list.length ? list.map(c => (
            <div key={c.id} onClick={() => setSelId(c.id)}
              style={{ padding:'11px 13px', borderBottom:'0.5px solid rgba(255,255,255,.07)', cursor:'pointer',
                background: selId===c.id ? 'rgba(79,142,247,.12)' : 'none',
                transition:'background .15s' }}
              onMouseOver={e => { if(selId!==c.id) e.currentTarget.style.background='var(--s2)' }}
              onMouseOut={e  => { if(selId!==c.id) e.currentTarget.style.background='none' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontSize:12, fontWeight:500, color:'var(--tx)' }}>{c.visitor_type||'Unknown'}</span>
                <span style={{ fontSize:11, color:'var(--td)' }}>{fmtDate(c.started_at)}</span>
              </div>
              <div style={{ fontSize:11.5, color:'var(--tm)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {c.lead_captured ? '✓ Lead captured · ' : ''}{c.page_url || 'Direct'}
              </div>
            </div>
          )) : (
            <div className="empty-state"><div className="empty-ico">💬</div>No conversations yet</div>
          )}
        </div>

        {/* Transcript */}
        <div style={{ background:'var(--s1)', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, padding:14, maxHeight:580, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
          {!selId ? (
            <div style={{ color:'var(--tm)', fontSize:13, textAlign:'center', paddingTop:40 }}>Select a conversation to view its transcript</div>
          ) : msgs.length ? (
            <>
              {meta && (
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:4, paddingBottom:10, borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>
                  <span className={`badge badge-${(meta.visitor_type||'general').toLowerCase()}`}>{meta.visitor_type}</span>
                  {meta.lead_captured && <span className="badge" style={{ background:'rgba(34,209,122,.12)', color:'#5EDFAC' }}>✓ Lead captured</span>}
                  <span style={{ fontSize:11, color:'var(--td)', marginLeft:'auto' }}>{fmtDate(meta.started_at)}</span>
                </div>
              )}
              {msgs.map(m => (
                <div key={m.id} style={{ display:'flex', flexDirection:'column', maxWidth:'84%', alignSelf: m.role==='assistant' ? 'flex-start' : 'flex-end' }}>
                  <div style={{ padding:'8px 12px', borderRadius:12, fontSize:12.5, lineHeight:1.55, wordBreak:'break-word',
                    background:   m.role==='assistant' ? 'var(--s2)' : '#1B3FA0',
                    color:        m.role==='assistant' ? 'var(--tx)' : '#DDE9FF',
                    border:       m.role==='assistant' ? '0.5px solid rgba(255,255,255,.07)' : 'none',
                    borderBottomLeftRadius:  m.role==='assistant' ? 4 : 12,
                    borderBottomRightRadius: m.role==='assistant' ? 12 : 4,
                  }} dangerouslySetInnerHTML={{ __html: m.role==='assistant' ? m.content.replace(/\n/g,'<br/>') : m.content }} />
                  <div style={{ fontSize:10, color:'var(--td)', marginTop:3, padding:'0 3px', alignSelf: m.role==='assistant' ? 'flex-start' : 'flex-end' }}>
                    {new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ color:'var(--tm)', fontSize:13, textAlign:'center', paddingTop:40 }}>No messages in this conversation</div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
