'use client'
import React, { useEffect, useState }       from 'react'
import { useSearchParams }            from 'next/navigation'
import { conversations as convApi }   from '@/lib/api-client'
import { PageShell, fmtDate }         from '../page'

const TYPE_LABELS = {
  CLIENT:   { label:'Looking to Build', color:'#7EB3FF', bg:'rgba(79,142,247,.12)'  },
  EXISTING: { label:'Existing Client',  color:'#FBCF56', bg:'rgba(251,191,36,.12)'  },
  INVESTOR: { label:'Investor',         color:'#5EDFAC', bg:'rgba(34,209,122,.12)'  },
  GENERAL:  { label:'Just Exploring',   color:'#C084FC', bg:'rgba(168,85,247,.12)'  },
}

function groupByTime(convos) {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today); yesterday.setDate(today.getDate()-1)
  const weekAgo   = new Date(today); weekAgo.setDate(today.getDate()-7)
  const lastWeekStart = new Date(today); lastWeekStart.setDate(today.getDate()-14)

  const groups = { Today:[], Yesterday:[], 'This Week':[], 'Last Week':[], Older:[] }
  convos.forEach(c => {
    const d = new Date(c.started_at)
    if (d >= today)          groups['Today'].push(c)
    else if (d >= yesterday) groups['Yesterday'].push(c)
    else if (d >= weekAgo)   groups['This Week'].push(c)
    else if (d >= lastWeekStart) groups['Last Week'].push(c)
    else                     groups['Older'].push(c)
  })
  return groups
}

function groupByType(convos) {
  return convos.reduce((acc, c) => {
    const t = c.visitor_type || 'GENERAL'
    if (!acc[t]) acc[t] = []
    acc[t].push(c)
    return acc
  }, {})
}

export default function ConversationsPage() {
  const params          = useSearchParams()
  const [list,  setList]  = useState([])
  const [msgs,  setMsgs]  = useState([])
  const [selId, setSelId] = useState(params.get('id') || null)
  const [meta,  setMeta]  = useState(null)
  const [loading, setL]   = useState(true)
  const [view,  setView]  = useState('timeline') // timeline | category

  useEffect(() => {
    convApi.list({ limit: 100 }).then(r => { setList(r.conversations || []); setL(false) }).catch(() => setL(false))
  }, [])

  useEffect(() => {
    if (!selId) return
    convApi.messages(selId).then(r => { setMsgs(r.messages || []); setMeta(r.conversation) })
  }, [selId])

  const timeGroups = groupByTime(list)
  const typeGroups = groupByType(list)

  return (
    <PageShell title="Chats">
      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:14 }}>

        {/* Left panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

          {/* View toggle */}
          <div style={{ display:'flex', background:'var(--s2)', borderRadius:9, padding:3, gap:2 }}>
            {[['timeline','🕐 Timeline'],['category','🏷 Category']].map(([v,l]) => (
              <button key={v} onClick={()=>setView(v)} style={{ flex:1, padding:'6px 0', fontSize:12, borderRadius:7, border:'none', cursor:'pointer', fontWeight:500, transition:'all .15s',
                background: view===v ? 'var(--ac)' : 'none',
                color:      view===v ? '#fff' : 'var(--tm)',
              }}>{l}</button>
            ))}
          </div>

          {/* Category summary cards */}
          {view === 'category' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {Object.entries(TYPE_LABELS).map(([key, cfg]) => {
                const count = (typeGroups[key]||[]).length
                const leads = (typeGroups[key]||[]).filter(c=>c.lead_captured).length
                return (
                  <div key={key} style={{ padding:12, background:'var(--s1)', border:`0.5px solid ${cfg.bg.replace('rgba','rgba')}`, borderRadius:10, cursor:'pointer' }}
                    onClick={()=>{ const first=(typeGroups[key]||[])[0]; if(first) setSelId(first.id) }}>
                    <div style={{ fontSize:18, marginBottom:5 }}>
                      {key==='CLIENT'?'🚀':key==='EXISTING'?'🤝':key==='INVESTOR'?'💼':'🔍'}
                    </div>
                    <div style={{ fontSize:12, fontWeight:500, color:'var(--tx)', marginBottom:3 }}>{cfg.label}</div>
                    <div style={{ fontSize:22, fontWeight:700, color:cfg.color, fontFamily:'var(--font-brand)' }}>{count}</div>
                    <div style={{ fontSize:11, color:'var(--tm)', marginTop:2 }}>{leads} lead{leads!==1?'s':''} captured</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Timeline list */}
          <div style={{ background:'var(--s1)', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, overflow:'hidden', maxHeight:520, overflowY:'auto' }}>
            {loading ? (
              <div style={{ padding:24, color:'var(--tm)', fontSize:13, textAlign:'center' }}>Loading…</div>
            ) : view === 'timeline' ? (
              Object.entries(timeGroups).map(([group, items]) => {
                if (!items.length) return null
                return (
                  <div key={group}>
                    <div style={{ padding:'8px 13px', fontSize:10.5, fontWeight:500, letterSpacing:'1px', textTransform:'uppercase', color:'var(--td)', background:'var(--s2)', borderBottom:'0.5px solid rgba(255,255,255,.05)' }}>
                      {group} ({items.length})
                    </div>
                    {items.map(c => <ConvoItem key={c.id} c={c} active={selId===c.id} onClick={()=>{
                        setSelId(c.id)
                        // Mark as read locally immediately
                        setList(prev => prev.map(x => x.id === c.id ? {...x, is_read: true} : x))
                      }} />)}
                  </div>
                )
              })
            ) : (
              Object.entries(TYPE_LABELS).map(([key, cfg]) => {
                const items = typeGroups[key] || []
                if (!items.length) return null
                return (
                  <div key={key}>
                    <div style={{ padding:'8px 13px', fontSize:10.5, fontWeight:500, letterSpacing:'1px', textTransform:'uppercase', color:cfg.color, background:cfg.bg, borderBottom:'0.5px solid rgba(255,255,255,.05)' }}>
                      {cfg.label} ({items.length})
                    </div>
                    {items.map(c => <ConvoItem key={c.id} c={c} active={selId===c.id} onClick={()=>{
                        setSelId(c.id)
                        // Mark as read locally immediately
                        setList(prev => prev.map(x => x.id === c.id ? {...x, is_read: true} : x))
                      }} />)}
                  </div>
                )
              })
            )}
            {!loading && !list.length && (
              <div className="empty-state"><div className="empty-ico">💬</div>No chats yet</div>
            )}
          </div>
        </div>

        {/* Transcript */}
        <div style={{ background:'var(--s1)', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, padding:14, maxHeight:600, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
          {!selId ? (
            <div style={{ color:'var(--tm)', fontSize:13, textAlign:'center', paddingTop:40 }}>Select a chat to view its transcript</div>
          ) : msgs.length ? (
            <>
              {meta && (
                <div style={{ paddingBottom:10, borderBottom:'0.5px solid rgba(255,255,255,.07)', marginBottom:8 }}>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:6 }}>
                    <span className={`badge badge-${(meta.visitor_type||'general').toLowerCase()}`}>{meta.visitor_type}</span>
                    {meta.lead_captured && <span className="badge" style={{ background:'rgba(34,209,122,.12)', color:'#5EDFAC' }}>✓ Lead captured</span>}
                    <span style={{ fontSize:11, color:'var(--td)', marginLeft:'auto' }}>{fmtDate(meta.started_at)}</span>
                  </div>
                  <VisitorIntelPanel meta={meta} tenantToken={typeof window !== 'undefined' ? localStorage.getItem('kaali_token') : ''} />
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
            <div style={{ color:'var(--tm)', fontSize:13, textAlign:'center', paddingTop:40 }}>No messages in this chat</div>
          )}
        </div>
      </div>
    </PageShell>
  )
}

function ConvoItem({ c, active, onClick }) {
  const cfg    = TYPE_LABELS[c.visitor_type] || TYPE_LABELS.GENERAL
  const unread = !c.is_read && !active
  return (
    <div onClick={onClick} style={{ padding:'10px 13px', borderBottom:'0.5px solid rgba(255,255,255,.05)', cursor:'pointer',
      background: active ? 'rgba(79,142,247,.1)' : unread ? 'rgba(79,142,247,.04)' : 'none',
      transition:'background .15s', position:'relative' }}
      onMouseOver={e=>{ if(!active) e.currentTarget.style.background='var(--s2)' }}
      onMouseOut={e=>{ if(!active) e.currentTarget.style.background= unread ? 'rgba(79,142,247,.04)' : 'none' }}>
      {unread && <div style={{ position:'absolute', top:'50%', right:12, transform:'translateY(-50%)', width:7, height:7, borderRadius:'50%', background:'var(--ac)', boxShadow:`0 0 6px var(--ac)` }} />}
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
        <span style={{ fontSize:11, fontWeight:500, color:cfg.color, background:cfg.bg, padding:'1px 7px', borderRadius:10 }}>{cfg.label}</span>
        <span style={{ fontSize:10, color: unread ? 'var(--ac)' : 'var(--td)' }}>{new Date(c.started_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
      </div>
      <div style={{ fontSize:11.5, color: unread ? 'var(--ts)' : 'var(--tm)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontWeight: unread ? 500 : 400 }}>
        {c.lead_captured ? '✓ Lead · ' : ''}{c.page_url || 'Direct'}
      </div>
    </div>
  )
}

function VisitorIntelPanel({ meta, tenantToken }) {
  const [enriched, setEnriched] = React.useState(null)
  const [enriching, setEnriching] = React.useState(false)
  const lead     = meta?.lead
  const country  = meta?.country || lead?.country || ''
  const city     = meta?.city    || lead?.city    || ''
  const device   = meta?.device  || lead?.device  || ''
  const org      = meta?.org     || lead?.org     || ''
  const browser  = meta?.browser || lead?.browser || ''
  const os       = meta?.os      || lead?.os      || ''
  const referrer = meta?.referrer|| lead?.referrer|| ''
  const timezone = meta?.timezone|| lead?.timezone|| ''
  const language = lead?.language || ''
  const sessions = lead?.session_count || 0
  const pages    = lead?.pages_visited || meta?.pages_visited || []
  const utmSrc   = lead?.utm_source || ''
  const utmCamp  = lead?.utm_campaign || ''
  const screenW  = lead?.screen_width || 0
  const ip       = lead?.ip_address || ''
  const displayOrg = enriched?.company_name || org

  async function enrich() {
    if (!ip || enriching) return
    setEnriching(true)
    try {
      const r = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:'Bearer ' + tenantToken },
        body: JSON.stringify({ ip, leadId: lead?.id }),
      })
      const d = await r.json()
      if (d.enriched) setEnriched(d.enriched)
    } catch(e) {}
    finally { setEnriching(false) }
  }

  const chips = [
    city || country ? '📍 ' + [city,country].filter(Boolean).join(', ') : null,
    device   ? '💻 ' + device   : null,
    browser  ? '🌐 ' + browser  : null,
    os       ? '🖥 '  + os       : null,
    timezone ? '🕐 ' + timezone : null,
    language ? '🗣 ' + language : null,
    screenW  ? '📐 ' + screenW + 'px' : null,
    sessions > 1 ? '🔄 ' + sessions + ' visits' : null,
    referrer && referrer !== 'direct' ? '↩ ' + referrer : null,
    utmSrc   ? '📣 ' + utmSrc  : null,
    utmCamp  ? '🎯 ' + utmCamp : null,
  ].filter(Boolean)

  if (!chips.length && !displayOrg) return null

  return (
    <div style={{ marginTop:8, padding:'10px 12px', background:'rgba(255,255,255,.03)', border:'0.5px solid rgba(255,255,255,.08)', borderRadius:8 }}>
      {displayOrg && (
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
          {enriched?.company_logo && <img src={enriched.company_logo} alt="" style={{ width:18, height:18, borderRadius:4, objectFit:'contain' }} />}
          <span style={{ fontSize:12, fontWeight:500, color:'var(--tx)' }}>🏢 {displayOrg}</span>
          {enriched?.linkedin_url && <a href={enriched.linkedin_url} target="_blank" rel="noopener" style={{ fontSize:10, color:'#0A66C2', textDecoration:'none' }}>LinkedIn →</a>}
          {enriched?.twitter_url  && <a href={enriched.twitter_url}  target="_blank" rel="noopener" style={{ fontSize:10, color:'#1DA1F2', textDecoration:'none' }}>Twitter →</a>}
          {enriched?.company_size && <span style={{ fontSize:10, color:'var(--td)' }}>{enriched.company_size} employees</span>}
        </div>
      )}
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {chips.map((chip, i) => (
          <span key={i} style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:'rgba(255,255,255,.06)', color:'var(--tm)', whiteSpace:'nowrap' }}>{chip}</span>
        ))}
      </div>
      {pages.length > 0 && (
        <div style={{ marginTop:8, fontSize:10, color:'var(--td)' }}>
          <span style={{ color:'var(--tm)', marginRight:4 }}>Pages:</span>
          {pages.slice(0,5).join(' → ')}{pages.length > 5 ? ' +' + (pages.length-5) + ' more' : ''}
        </div>
      )}
      {ip && !enriched && (
        <button onClick={enrich} disabled={enriching}
          style={{ marginTop:8, fontSize:10, color:'var(--ac)', background:'none', border:'0.5px solid rgba(79,142,247,.3)', borderRadius:6, padding:'2px 10px', cursor:'pointer' }}>
          {enriching ? 'Enriching…' : '✨ Enrich with Clearbit'}
        </button>
      )}
    </div>
  )
}

function showToast(msg, isErr=false) {
  const t=document.createElement('div'); t.className='toast'; t.textContent=msg;
  if(isErr) t.style.color='var(--rd)';
  document.body.appendChild(t); setTimeout(()=>t.remove(),2400);
}
