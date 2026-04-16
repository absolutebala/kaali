'use client'
import { useEffect, useState } from 'react'
import { saAnnouncements } from '@/lib/sa-client'
import { SAShell, fmtDate } from '../page'

export default function SAAnnouncementsPage() {
  const [list,    setList]    = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [form,    setForm]    = useState({ title:'', message:'', type:'info' })
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    saAnnouncements.list().then(r => { setList(r.announcements||[]); setLoading(false) })
  }, [])

  async function add() {
    if (!form.title || !form.message) return
    setSaving(true)
    try {
      const r = await saAnnouncements.add(form)
      setList(p => [r.announcement, ...p])
      setModal(false); setForm({ title:'', message:'', type:'info' })
      showToast('Announcement published!')
    } catch(e) { showToast(e.message, true) }
    finally { setSaving(false) }
  }

  async function toggle(item) {
    const r = await saAnnouncements.toggle({ id: item.id, isActive: !item.is_active })
    setList(p => p.map(a => a.id === item.id ? r.announcement : a))
  }

  async function remove(id) {
    if (!confirm('Delete this announcement?')) return
    await saAnnouncements.remove(id)
    setList(p => p.filter(a => a.id !== id))
  }

  const TYPE_COLORS = { info:'#7EB3FF', warning:'#FBCF56', success:'#5EDFAC' }
  const TYPE_BG     = { info:'rgba(79,142,247,.12)', warning:'rgba(251,191,36,.12)', success:'rgba(34,209,122,.12)' }

  return (
    <SAShell title="Announcements" action={
      <button onClick={() => setModal(true)}
        style={{ background:'rgba(79,142,247,.12)', border:'0.5px solid rgba(79,142,247,.3)', color:'#E5EBF8', padding:'7px 16px', borderRadius:8, fontSize:12.5, cursor:'pointer' }}>
        + New Announcement
      </button>
    }>

      <div style={{ background:'rgba(251,191,36,.06)', border:'0.5px solid rgba(251,191,36,.2)', borderRadius:10, padding:'12px 16px', marginBottom:16, fontSize:12.5, color:'#FBCF56', lineHeight:1.6 }}>
        💡 Announcements appear as a banner in ALL tenant dashboards. Use them for maintenance notices, new features, or important updates.
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6E7E9E', fontSize:13 }}>Loading…</div>
      ) : list.length === 0 ? (
        <div style={{ padding:40, textAlign:'center', background:'#0C1220', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12 }}>
          <div style={{ fontSize:28, marginBottom:10 }}>📣</div>
          <div style={{ fontSize:13, color:'#6E7E9E' }}>No announcements yet. Create one to notify all tenants.</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {list.map(a => (
            <div key={a.id} style={{ background:'#0C1220', border:`0.5px solid ${a.is_active ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.04)'}`, borderRadius:12, padding:16, opacity: a.is_active ? 1 : 0.5 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                <span style={{ fontSize:10, fontWeight:500, padding:'2px 9px', borderRadius:20, background:TYPE_BG[a.type]||TYPE_BG.info, color:TYPE_COLORS[a.type]||TYPE_COLORS.info, flexShrink:0, marginTop:2 }}>{a.type}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:500, color:'#E5EBF8', marginBottom:4 }}>{a.title}</div>
                  <div style={{ fontSize:13, color:'#6E7E9E', lineHeight:1.6 }}>{a.message}</div>
                  <div style={{ fontSize:11, color:'#3A4A6A', marginTop:6 }}>Created {fmtDate(a.created_at)}</div>
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <button onClick={() => toggle(a)} style={{ fontSize:11, color: a.is_active?'#F87171':'#5EDFAC', background: a.is_active?'rgba(248,113,113,.1)':'rgba(34,209,122,.1)', border:`0.5px solid ${a.is_active?'rgba(248,113,113,.25)':'rgba(34,209,122,.25)'}`, padding:'3px 9px', borderRadius:6, cursor:'pointer' }}>
                    {a.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => remove(a.id)} style={{ fontSize:11, color:'#F87171', background:'rgba(248,113,113,.1)', border:'0.5px solid rgba(248,113,113,.25)', padding:'3px 9px', borderRadius:6, cursor:'pointer' }}>Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e => e.target===e.currentTarget && setModal(false)}>
          <div style={{ background:'#0C1220', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:14, padding:24, width:460, maxWidth:'92vw' }}>
            <div style={{ fontFamily:'var(--font-brand)', fontSize:16, fontWeight:700, color:'#E5EBF8', marginBottom:20 }}>New Announcement</div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, color:'#6E7E9E', display:'block', marginBottom:5 }}>Type</label>
              <select value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))}
                style={{ width:'100%', background:'#111A2E', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:9, padding:'9px 12px', fontSize:13, color:'#E5EBF8', outline:'none', appearance:'none' }}>
                <option value="info">Info (blue)</option>
                <option value="warning">Warning (yellow)</option>
                <option value="success">Success (green)</option>
              </select>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, color:'#6E7E9E', display:'block', marginBottom:5 }}>Title</label>
              <input value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} placeholder="e.g. Scheduled maintenance"
                style={{ width:'100%', background:'#111A2E', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:9, padding:'9px 12px', fontSize:13, color:'#E5EBF8', outline:'none' }} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, color:'#6E7E9E', display:'block', marginBottom:5 }}>Message</label>
              <textarea value={form.message} onChange={e => setForm(p=>({...p,message:e.target.value}))} rows={3} placeholder="What do tenants need to know?"
                style={{ width:'100%', background:'#111A2E', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:9, padding:'9px 12px', fontSize:13, color:'#E5EBF8', outline:'none', resize:'vertical', fontFamily:'inherit', lineHeight:1.6 }} />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(false)} style={{ padding:'9px 18px', background:'none', border:'0.5px solid rgba(255,255,255,.1)', borderRadius:8, color:'#6E7E9E', fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button onClick={add} disabled={saving} style={{ padding:'9px 18px', background:'#4F8EF7', border:'none', borderRadius:8, color:'#fff', fontSize:13, cursor:'pointer' }}>
                {saving ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SAShell>
  )
}

function showToast(msg, isErr=false) {
  const t=document.createElement('div')
  t.style.cssText=`position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0C1220;border:0.5px solid rgba(255,255,255,.13);color:${isErr?'#F87171':'#22D17A'};padding:8px 18px;border-radius:20px;font-size:12.5px;z-index:99999;white-space:nowrap;font-family:sans-serif`
  t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2400)
}
