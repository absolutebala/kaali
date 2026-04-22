'use client'
import { useEffect, useState } from 'react'
import { PageShell, fmtDate }   from '../page'

const ALL_PAGES = [
  { key:'overview',   label:'Overview'       },
  { key:'leads',      label:'Leads'          },
  { key:'chats',      label:'Chats'          },
  { key:'knowledge',  label:'Knowledge Base' },
  { key:'training',   label:'Training'       },
  { key:'api-usage',  label:'API & Usage'    },
  { key:'embed',      label:'Embed Code'     },
  { key:'settings',   label:'Settings'       },
  { key:'team',       label:'Team'           },
]

const ROLES = {
  admin:  { label:'Admin',  desc:'Full access to all pages', color:'#F87171', bg:'rgba(248,113,113,.12)' },
  sales:  { label:'Sales',  desc:'Overview, Leads, Chats',   color:'#7EB3FF', bg:'rgba(79,142,247,.12)'  },
  custom: { label:'Custom', desc:'Choose pages below',       color:'#FBCF56', bg:'rgba(251,191,36,.12)'  },
}

function api(path, opts={}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('kaali_token') : ''
  return fetch(path, { ...opts, headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}`, ...(opts.headers||{}) } }).then(r => r.json())
}

export default function TeamPage() {
  const [members,  setMembers]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState({ name:'', email:'', password:'', role:'sales', allowedPages:['overview','leads','chats'] })
  const [saving,   setSaving]   = useState(false)
  const [err,      setErr]      = useState('')

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const d = await api('/api/team')
    setMembers(d.members || []); setLoading(false)
  }

  function togglePage(key) {
    setForm(p => ({
      ...p,
      allowedPages: p.allowedPages.includes(key)
        ? p.allowedPages.filter(x => x !== key)
        : [...p.allowedPages, key]
    }))
  }

  async function invite() {
    setErr(''); setSaving(true)
    try {
      const pages = form.role === 'admin' ? ALL_PAGES.map(p=>p.key)
                  : form.role === 'sales' ? ['overview','leads','chats']
                  : form.allowedPages
      const d = await api('/api/team', { method:'POST', body: JSON.stringify({ ...form, allowedPages: pages }) })
      if (d.error) throw new Error(d.error)
      setShowForm(false); setForm({ name:'', email:'', password:'', role:'sales', allowedPages:['overview','leads','chats'] }); load()
      showToast('Team member added!')
    } catch(e) { setErr(e.message) }
    finally { setSaving(false) }
  }

  async function toggleActive(id, current) {
    await api('/api/team', { method:'PATCH', body: JSON.stringify({ id, isActive: !current }) })
    load()
  }

  async function remove(id, name) {
    if (!confirm(`Remove ${name} from the team?`)) return
    await api('/api/team?id=' + id, { method:'DELETE' })
    load(); showToast('Member removed.')
  }

  const inp = { width:'100%', background:'var(--s2)', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:9, padding:'10px 13px', fontSize:13, color:'var(--tx)', outline:'none', marginBottom:10 }

  return (
    <PageShell title="Team" action={
      <button className="btn-pri" onClick={() => setShowForm(v => !v)}>
        {showForm ? 'Cancel' : '+ Invite Member'}
      </button>
    }>

      {/* Invite form */}
      {showForm && (
        <div className="kb-card" style={{ marginBottom:16 }}>
          <div className="kb-header"><span className="kb-title">Invite Team Member</span></div>
          <div className="card-body">
            {err && <div style={{ background:'rgba(248,113,113,.1)', border:'0.5px solid rgba(248,113,113,.3)', color:'var(--rd)', padding:'8px 12px', borderRadius:8, fontSize:13, marginBottom:12 }}>{err}</div>}
            <div className="form-2col" style={{ marginBottom:4 }}>
              <div className="form-row" style={{ marginBottom:0 }}>
                <label className="form-label">Name</label>
                <input style={inp} placeholder="Full name" value={form.name} onChange={f('name')} />
              </div>
              <div className="form-row" style={{ marginBottom:0 }}>
                <label className="form-label">Email</label>
                <input style={inp} type="email" placeholder="email@company.com" value={form.email} onChange={f('email')} />
              </div>
            </div>
            <div className="form-row">
              <label className="form-label">Password</label>
              <input style={inp} type="password" placeholder="Min 8 characters" value={form.password} onChange={f('password')} />
            </div>

            {/* Role selector */}
            <label className="form-label" style={{ marginBottom:8 }}>Role</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
              {Object.entries(ROLES).map(([key, r]) => (
                <div key={key} onClick={() => setForm(p => ({ ...p, role: key }))}
                  style={{ padding:12, borderRadius:10, cursor:'pointer', transition:'all .15s',
                    background: form.role===key ? r.bg : 'var(--s2)',
                    border: `1.5px solid ${form.role===key ? r.color + '88' : 'rgba(255,255,255,.1)'}` }}>
                  <div style={{ fontSize:13, fontWeight:500, color: form.role===key ? r.color : 'var(--tx)', marginBottom:3 }}>{r.label}</div>
                  <div style={{ fontSize:11, color:'var(--tm)' }}>{r.desc}</div>
                </div>
              ))}
            </div>

            {/* Custom page selector */}
            {form.role === 'custom' && (
              <div style={{ marginBottom:14 }}>
                <label className="form-label" style={{ marginBottom:8 }}>Allowed Pages</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {ALL_PAGES.map(p => (
                    <div key={p.key} onClick={() => togglePage(p.key)}
                      style={{ fontSize:12, padding:'4px 12px', borderRadius:20, cursor:'pointer', transition:'all .15s',
                        background: form.allowedPages.includes(p.key) ? 'rgba(79,142,247,.15)' : 'var(--s2)',
                        border: `0.5px solid ${form.allowedPages.includes(p.key) ? 'rgba(79,142,247,.4)' : 'rgba(255,255,255,.1)'}`,
                        color: form.allowedPages.includes(p.key) ? '#7EB3FF' : 'var(--tm)' }}>
                      {form.allowedPages.includes(p.key) ? '✓ ' : ''}{p.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button className="btn-pri" onClick={invite} disabled={saving || !form.name || !form.email || !form.password}>
                {saving ? 'Inviting…' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="card">
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--tm)', fontSize:13 }}>Loading…</div>
        ) : members.length ? (
          <table className="tbl">
            <thead>
              <tr><th>Member</th><th>Role</th><th>Pages</th><th>Status</th><th>Last Login</th><th></th></tr>
            </thead>
            <tbody>
              {members.map(m => {
                const r = ROLES[m.role] || ROLES.custom
                return (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:30, height:30, borderRadius:'50%', background:'rgba(79,142,247,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:500, color:'#7EB3FF', flexShrink:0 }}>
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:500, color:'var(--tx)' }}>{m.name}</div>
                          <div style={{ fontSize:11, color:'var(--tm)' }}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize:11, fontWeight:500, padding:'2px 9px', borderRadius:20, background:r.bg, color:r.color }}>{r.label}</span>
                    </td>
                    <td>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:4, maxWidth:200 }}>
                        {(m.allowed_pages||[]).slice(0,4).map(p => (
                          <span key={p} style={{ fontSize:10, padding:'1px 6px', borderRadius:4, background:'rgba(255,255,255,.06)', color:'var(--tm)' }}>{p}</span>
                        ))}
                        {(m.allowed_pages||[]).length > 4 && <span style={{ fontSize:10, color:'var(--td)' }}>+{m.allowed_pages.length-4}</span>}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize:11, padding:'2px 9px', borderRadius:20, background: m.is_active?'rgba(34,209,122,.12)':'rgba(248,113,113,.1)', color: m.is_active?'#5EDFAC':'var(--rd)' }}>
                        {m.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize:12, color:'var(--td)' }}>{m.last_login ? fmtDate(m.last_login) : 'Never'}</td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn-ghost btn-sm" onClick={() => toggleActive(m.id, m.is_active)}>
                          {m.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="btn-sec btn-sm btn-danger" onClick={() => remove(m.id, m.name)}>Remove</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-ico">👤</div>
            No team members yet — invite someone above
          </div>
        )}
      </div>
    </PageShell>
  )
}

function showToast(msg, isErr=false) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg
  if (isErr) t.style.color = 'var(--rd)'
  document.body.appendChild(t); setTimeout(() => t.remove(), 2400)
}
