'use client'
import { useEffect, useState, useRef } from 'react'
import { PageShell, fmtDate }           from '../page'
import { useAuth }                       from '@/lib/auth-context'

const PING_INTERVAL = 30000 // 30s heartbeat
const HANDOFF_TIMEOUT = 60  // seconds before timeout

function api(path, opts={}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('kaali_token') : ''
  return fetch(path, { ...opts, headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}`, ...(opts.headers||{}) } }).then(r => r.json())
}

export default function LivePage() {
  const { user }                          = useAuth()
  const [waiting,  setWaiting]            = useState([])
  const [live,     setLive]               = useState([])
  const [selected, setSelected]           = useState(null)
  const [msgs,     setMsgs]               = useState([])
  const [draft,    setDraft]              = useState('')
  const [sending,  setSending]            = useState(false)
  const [isOnline, setIsOnline]           = useState(false)
  const [onlineCount, setOnlineCount]     = useState(0)
  const [timers,   setTimers]             = useState({})
  const pingRef   = useRef(null)
  const audioRef  = useRef(null)
  const prevWaiting = useRef([])

  // Load chats
  async function refresh() {
    try {
      const d = await api('/api/agent')
      setWaiting(d.waiting || [])
      setLive(d.live || [])
      setOnlineCount(d.onlineCount || 0)

      // Ring if new waiting chat appeared
      const newChats = (d.waiting || []).filter(c => !prevWaiting.current.find(p => p.id === c.id))
      if (newChats.length > 0 && isOnline) {
        playRing()
        if (typeof window !== 'undefined' && Notification.permission === 'granted') {
          new Notification('New chat request!', { body: `Visitor wants to speak with ${user?.company || 'your team'}`, icon: '/favicon.ico' })
        }
      }
      prevWaiting.current = d.waiting || []
    } catch(e) { console.error('[Live] refresh error:', e) }
  }

  // Heartbeat — tells server this agent is online
  async function heartbeat() {
    if (!isOnline) return
    await api('/api/agent', { method:'POST', body: JSON.stringify({ action:'heartbeat' }) })
  }

  useEffect(() => {
    // Clear stale online status on mount
    api('/api/agent', { method:'POST', body: JSON.stringify({ action:'offline' }) }).catch(()=>{})
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [isOnline])

  useEffect(() => {
    if (isOnline) {
      heartbeat()
      pingRef.current = setInterval(heartbeat, PING_INTERVAL)
      // Request notification permission
      if (typeof window !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    } else {
      clearInterval(pingRef.current)
      api('/api/agent', { method:'POST', body: JSON.stringify({ action:'offline' }) }).catch(()=>{})
    }
    return () => clearInterval(pingRef.current)
  }, [isOnline])

  // Load messages when chat selected
  useEffect(() => {
    if (!selected) return
    const load = () => {
      const token = localStorage.getItem('kaali_token')
      fetch(`/api/conversations?id=${selected}`, { headers:{ Authorization:`Bearer ${token}` } })
        .then(r=>r.json()).then(d => setMsgs(d.messages || []))
    }
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [selected])

  // Countdown timers for waiting chats
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const updated = {}
      waiting.forEach(c => {
        const elapsed = Math.floor((now - new Date(c.handoff_at).getTime()) / 1000)
        updated[c.id] = Math.max(0, HANDOFF_TIMEOUT - elapsed)
      })
      setTimers(updated)
    }, 1000)
    return () => clearInterval(interval)
  }, [waiting])

  function playRing() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15)
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
      osc.start(); osc.stop(ctx.currentTime + 0.6)
    } catch(e) {}
  }

  async function acceptChat(id) {
    await api('/api/agent', { method:'POST', body: JSON.stringify({ action:'accept', conversationId: id }) })
    setSelected(id)
    refresh()
  }

  async function sendMsg() {
    if (!draft.trim() || !selected || sending) return
    const text = draft.trim()
    setSending(true)
    setDraft('')
    // Add message locally immediately
    const tempMsg = { id: 'temp-' + Date.now(), role:'assistant', content: text, is_agent: true, created_at: new Date().toISOString() }
    setMsgs(prev => [...prev, tempMsg])
    try {
      const d = await api('/api/agent', { method:'POST', body: JSON.stringify({ action:'send', conversationId: selected, message: text }) })
      if (d.ok && d.message) {
        // Replace temp message with real one
        setMsgs(prev => prev.map(m => m.id === tempMsg.id ? { ...d.message, is_agent: true, role:'assistant' } : m))
      }
    } catch(e) {
      // Remove temp message on error
      setMsgs(prev => prev.filter(m => m.id !== tempMsg.id))
      setDraft(text)
    } finally { setSending(false) }
  }

  async function closeChat(id) {
    await api('/api/agent', { method:'POST', body: JSON.stringify({ action:'close', conversationId: id }) })
    if (selected === id) setSelected(null)
    refresh()
  }

  const allActive = [...waiting, ...live]
  const selectedChat = allActive.find(c => c.id === selected)

  return (
    <PageShell title="Live Chat" action={
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ fontSize:12, color:'var(--tm)' }}>{onlineCount} agent{onlineCount!==1?'s':''} online</span>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div onClick={() => setIsOnline(v => !v)}
            style={{ width:44, height:24, borderRadius:12, cursor:'pointer', transition:'background .2s', flexShrink:0,
              background: isOnline ? 'var(--gr)' : 'rgba(255,255,255,.1)', position:'relative' }}>
            <div style={{ position:'absolute', top:3, left: isOnline ? 23 : 3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left .2s' }} />
          </div>
          <span style={{ fontSize:12, color: isOnline ? 'var(--gr)' : 'var(--td)', fontWeight:500 }}>
            {isOnline ? '● Online' : '○ Offline'}
          </span>
        </div>
      </div>
    }>

      {!isOnline && (
        <div style={{ padding:'14px 18px', background:'rgba(255,255,255,.04)', border:'0.5px solid rgba(255,255,255,.1)', borderRadius:10, marginBottom:16, fontSize:13, color:'var(--tm)', textAlign:'center' }}>
          Toggle <strong style={{ color:'var(--tx)' }}>Online</strong> to start receiving live chat requests and ring notifications
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:14 }}>

        {/* Left — chat queue */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

          {/* Waiting */}
          {waiting.length > 0 && (
            <div style={{ background:'var(--s1)', border:'0.5px solid rgba(34,209,122,.2)', borderRadius:12, overflow:'hidden' }}>
              <div style={{ padding:'10px 14px', background:'rgba(34,209,122,.08)', borderBottom:'0.5px solid rgba(34,209,122,.15)', fontSize:11, fontWeight:600, color:'#5EDFAC', letterSpacing:'1px', textTransform:'uppercase' }}>
                🔔 Waiting ({waiting.length})
              </div>
              {waiting.map(c => (
                <div key={c.id} style={{ padding:'12px 14px', borderBottom:'0.5px solid rgba(255,255,255,.05)', cursor:'pointer',
                  background: selected===c.id ? 'rgba(79,142,247,.1)' : 'none' }}
                  onClick={() => setSelected(c.id)}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:12, fontWeight:500, color:'var(--tx)' }}>{c.visitor_type || 'GENERAL'}</span>
                    <span style={{ fontSize:11, padding:'1px 8px', borderRadius:10, background: (timers[c.id]||60) < 15 ? 'rgba(248,113,113,.2)' : 'rgba(34,209,122,.12)', color: (timers[c.id]||60) < 15 ? 'var(--rd)' : '#5EDFAC' }}>
                      {timers[c.id] || 60}s
                    </span>
                  </div>
                  {c.org && <div style={{ fontSize:11, color:'var(--tm)', marginBottom:6 }}>🏢 {c.org}</div>}
                  {(c.city || c.country) && <div style={{ fontSize:11, color:'var(--td)', marginBottom:8 }}>📍 {[c.city,c.country].filter(Boolean).join(', ')}</div>}
                  <button onClick={e=>{ e.stopPropagation(); acceptChat(c.id) }}
                    style={{ width:'100%', padding:'7px 0', background:'var(--gr)', border:'none', borderRadius:8, fontSize:12, fontWeight:600, color:'#fff', cursor:'pointer' }}>
                    Accept Chat
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Live */}
          {live.length > 0 && (
            <div style={{ background:'var(--s1)', border:'0.5px solid rgba(79,142,247,.2)', borderRadius:12, overflow:'hidden' }}>
              <div style={{ padding:'10px 14px', background:'rgba(79,142,247,.08)', borderBottom:'0.5px solid rgba(79,142,247,.15)', fontSize:11, fontWeight:600, color:'var(--ac)', letterSpacing:'1px', textTransform:'uppercase' }}>
                💬 Live ({live.length})
              </div>
              {live.map(c => (
                <div key={c.id} style={{ padding:'12px 14px', borderBottom:'0.5px solid rgba(255,255,255,.05)', cursor:'pointer',
                  background: selected===c.id ? 'rgba(79,142,247,.1)' : 'none' }}
                  onClick={() => setSelected(c.id)}>
                  <div style={{ fontSize:12, fontWeight:500, color:'var(--tx)', marginBottom:4 }}>{c.visitor_type || 'GENERAL'}</div>
                  {c.org && <div style={{ fontSize:11, color:'var(--tm)', marginBottom:2 }}>🏢 {c.org}</div>}
                  <div style={{ fontSize:11, color:'var(--td)' }}>{fmtDate(c.handoff_at)}</div>
                </div>
              ))}
            </div>
          )}

          {waiting.length === 0 && live.length === 0 && (
            <div style={{ background:'var(--s1)', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, padding:32, textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>💬</div>
              <div style={{ fontSize:13, color:'var(--tm)' }}>No active chats</div>
              <div style={{ fontSize:12, color:'var(--td)', marginTop:4 }}>Waiting for visitors to request live support</div>
            </div>
          )}
        </div>

        {/* Right — chat transcript + reply */}
        <div style={{ background:'var(--s1)', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, display:'flex', flexDirection:'column', minHeight:500 }}>
          {!selected ? (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--tm)', fontSize:13 }}>
              Select a chat to view and respond
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding:'12px 16px', borderBottom:'0.5px solid rgba(255,255,255,.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <span style={{ fontSize:13, fontWeight:500, color:'var(--tx)' }}>{selectedChat?.visitor_type || 'Visitor'}</span>
                  {selectedChat?.org && <span style={{ fontSize:11, color:'var(--tm)', marginLeft:8 }}>🏢 {selectedChat.org}</span>}
                </div>
                <button onClick={() => closeChat(selected)}
                  style={{ fontSize:12, color:'var(--rd)', background:'rgba(248,113,113,.1)', border:'0.5px solid rgba(248,113,113,.2)', borderRadius:7, padding:'4px 12px', cursor:'pointer' }}>
                  End Chat
                </button>
              </div>

              {/* Messages */}
              <div style={{ flex:1, overflowY:'auto', padding:14, display:'flex', flexDirection:'column', gap:8 }}>
                {msgs
                  .filter(m => !(m.is_agent && m.content?.includes('A team member has joined')))
                  .map(m => (
                  <div key={m.id} style={{ display:'flex', flexDirection:'column', maxWidth:'80%', alignSelf: m.role==='user'?'flex-end':'flex-start' }}>
                    {m.is_agent && <div style={{ fontSize:10, color:'var(--gr)', marginBottom:2, paddingLeft:4 }}>You</div>}
                    {m.role==='assistant' && !m.is_agent && <div style={{ fontSize:10, color:'var(--td)', marginBottom:2, paddingLeft:4 }}>Bot</div>}
                    {m.role==='user' && <div style={{ fontSize:10, color:'var(--td)', marginBottom:2, paddingRight:4, textAlign:'right' }}>Visitor</div>}
                    <div style={{ padding:'8px 12px', borderRadius:12, fontSize:13, lineHeight:1.5, wordBreak:'break-word',
                      background: m.is_agent ? 'rgba(34,209,122,.15)' : m.role==='user' ? '#1B3FA0' : 'var(--s2)',
                      color:      m.role==='user' ? '#DDE9FF' : 'var(--tx)',
                      border:     m.is_agent ? '0.5px solid rgba(34,209,122,.3)' : m.role==='assistant' ? '0.5px solid rgba(255,255,255,.07)' : 'none',
                    }}>
                      {m.content}
                    </div>
                    <div style={{ fontSize:10, color:'var(--td)', marginTop:2, padding:'0 3px', alignSelf: m.role==='user'?'flex-end':'flex-start' }}>
                      {new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply input */}
              {live.find(c => c.id === selected) && (
                <div style={{ padding:'12px 14px', borderTop:'0.5px solid rgba(255,255,255,.07)', display:'flex', gap:10 }}>
                  <input value={draft} onChange={e=>setDraft(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMsg()}
                    placeholder="Type your reply…"
                    style={{ flex:1, background:'var(--s2)', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:9, padding:'9px 13px', fontSize:13, color:'var(--tx)', outline:'none' }} />
                  <button onClick={sendMsg} disabled={sending||!draft.trim()}
                    style={{ padding:'9px 20px', background:'var(--ac)', border:'none', borderRadius:9, fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer', opacity: sending||!draft.trim()?0.5:1 }}>
                    {sending ? '…' : 'Send'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageShell>
  )
}
