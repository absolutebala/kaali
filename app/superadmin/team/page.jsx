'use client'
import { useEffect, useState } from 'react'
import { PageShell, fmtDate }  from '../dashboard/page'

function saFetch(path, opts={}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sa_token') : ''
  return fetch(path, { ...opts, headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}`, ...(opts.headers||{}) } }).then(r => r.json())
}

const ROLES = {
  superadmin: { label:'Super Admin', color:'#F87171', bg:'rgba(248,113,113,.12)' },
  support:    { label:'Support',     color:'#7EB3FF', bg:'rgba(79,142,247,.12)'  },
  billing:    { label:'Billing',     color:'#FBBF24', bg:'rgba(251,191,36,.12)'  },
  readonly:   { label:'Read Only',   color:'#6E7E9E', bg:'rgba(110,126,158,.15)' },
}

const ROLE_PERMISSIONS = {
  superadmin: 'Full access — manage tenants, team, billing, impersonate, settings',
  support:    'View tenants, conversations, leads, impersonate tenants',
  billing:    'View tenants, manage plans, view usage and analytics',
  readonly:   'View only — no impersonate, no edits',
}

export default function SATeam() {
  const [team,    setTeam]    = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [pwModal, setPwModal] = useState(false)
  const [form,    setForm]    = useState({ name:'', email:'', password:'', role:'support' })
  const [pwForm,  setPwForm]  = useState({ current:'', newPw:'', confirm:'' })
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState('')

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const d = await saFetch('/api/superadmin/team')
    setTeam(d.team||[]); setLoading(false)
  }

  async function addMember() {
    setErr(''); setSaving(true)
    try {
      const d = await saFetch('/api/superadmin/team', { method:'POST', body: JSON.stringify(form) })
      if (d.error) throw new Error(d.error)
      setModal(false); setForm({ name:'', email:'', password:'', role:'support' }); load()
      showToast('Team member added!')
    } catch(e) { setErr(e.message) }
    finally { setSaving(false) }
  }

  async function toggleActive(id, current) {
    await saFetch('/api/superadmin/team', { method:'PATCH', body: JSON.stringify({ id, isActive: !current }) })
    load()
  }

  async function changeRole(id, role) {
    await saFetch('/api/superadmin/team', { method:'PATCH', body: JSON.stringify({ id, role }) })
    load(); showToast('Role updated!')
  }

  async function removeMember(id, name) {
    if (!confirm(`Remove ${name} from the team?`)) return
    await saFetch('/api/superadmin/team?id=' + id, { method:'DELETE' })
    load(); showToast('Member removed.')
  }

  async function changePassword() {
    if (pwForm.newPw !== pwForm.confirm) { setErr('Passwords do not match'); return }
    setSaving(true); setErr('')
    try {
      const d = await saFetch('/api/superadmin/auth/change-password', { method:'POST', body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }) })
      if (d.error) throw new Error(d.error)
      setPwModal(false); setPwForm({ current:'', newPw:'', confirm:'' })
      showToast('Password changed successfully!')
    } catch(e) { setErr(e.message) }
    finally { setSaving(false) }
  }

  const inp = { width:'100%', background:'#111A2E', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:9, padding:'10px 13px', fontSize:13, color:'#E5EBF8', outline:'none', marginBottom:12 }

  return (
    <PageShell title="Team Management" action={
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={()=>setPwModal(true)} style={{ fontSize:12, background:'rgba(255,255,255,.06)', border:'0.5px solid rgba(255,255,255,.13)', color:'#6E7E9E', padding:'7px 14px', borderRadius:8, cursor:'pointer' }}>
          Change My Password
        </button>
        <button onClick={()=>setModal(true)} style={{ fontSize:12, background:'rgba(248,113,113,.12)', border:'0.5px solid rgba(248,113,113,.3)', color:'#F87171', padding:'7px 14px', borderRadius:8, cursor:'pointer' }}>
          + Add Team Member
        </button>
      </div>
    }>

      {/* Roles reference */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {Object.entries(ROLES).map(([key, r]) => (
          <div key={key} style={{ padding:12, background:'#0C1220', border:`0.5px solid ${r.bg.replace('rgba','rgba').replace(/,([\d.]+)\)/, ',.3)')}`, borderRadius:10 }}>
            <div style={{ fontSize:12, fontWeight:500, color:r.color, marginBottom:4 }}>{r.label}</div>
            <div style={{ fontSize:11, color:'#6E7E9E', lineHeight:1.5 }}>{ROLE_PERMISSIONS[key]}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'#0C1220', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, overflow:'hidden' }}>
        {loading ? <div style={{ padding:40, textAlign:'center', color:'#6E7E9E', fontSize:13 }}>Loading…</div> : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>{['Name','Email','Role','Status','Last Login','Actions'].map(h => (
                <th key={h} style={{ padding:'9px 13px', textAlign:'left', fontSize:11, fontWeight:500, color:'#6E7E9E', letterSpacing:'.5px', textTransform:'uppercase', borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {team.map(m => {
                const r = ROLES[m.role] || ROLES.readonly
                return (
                  <tr key={m.id}>
                    <td style={{ padding:'10px 13px', fontSize:13, color:'#E5EBF8', borderBottom:'0.5px solid rgba(255,255,255,.05)' }}><strong>{m.name}</strong></td>
                    <td style={{ padding:'10px 13px', fontSize:12, color:'#6E7E9E', borderBottom:'0.5px solid rgba(255,255,255,.05)' }}>{m.email}</td>
                    <td style={{ padding:'10px 13px', borderBottom:'0.5px solid rgba(255,255,255,.05)' }}>
                      <select value={m.role} onChange={e=>changeRole(m.id, e.target.value)}
                        style={{ background:r.bg, border:`0.5px solid ${r.color}44`, borderRadius:6, padding:'3px 8px', fontSize:11.5, color:r.color, outline:'none', cursor:'pointer' }}>
                        {Object.entries(ROLES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding:'10px 13px', borderBottom:'0.5px solid rgba(255,255,255,.05)' }}>
                      <span style={{ fontSize:10.5, fontWeight:500, padding:'2px 9px', borderRadius:20, background: m.is_active?'rgba(34,209,122,.12)':'rgba(248,113,113,.12)', color: m.is_active?'#22D17A':'#F87171' }}>
                        {m.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding:'10px 13px', fontSize:11, color:'#3A4A6A', borderBottom:'0.5px solid rgba(255,255,255,.05)' }}>{m.last_login ? fmtDate(m.last_login) : 'Never'}</td>
                    <td style={{ padding:'10px 13px', borderBottom:'0.5px solid rgba(255,255,255,.05)' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={()=>toggleActive(m.id, m.is_active)}
                          style={{ fontSize:11, background:'rgba(255,255,255,.06)', border:'0.5px solid rgba(255,255,255,.13)', color:'#6E7E9E', padding:'3px 8px', borderRadius:6, cursor:'pointer' }}>
                          {m.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={()=>removeMember(m.id, m.name)}
                          style={{ fontSize:11, background:'rgba(248,113,113,.08)', border:'0.5px solid rgba(248,113,113,.2)', color:'#F87171', padding:'3px 8px', borderRadius:6, cursor:'pointer' }}>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!team.length && <tr><td colSpan={6}><div style={{ padding:36, textAlign:'center', color:'#6E7E9E', fontSize:13 }}>No team members yet</div></td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Add member modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:'#0C1220', border:'0.5px solid rgba(248,113,113,.2)', borderRadius:14, padding:24, width:420, maxWidth:'92vw' }}>
            <div style={{ fontSize:16, fontWeight:700, color:'#E5EBF8', marginBottom:16, fontFamily:'system-ui' }}>Add Team Member</div>
            {err && <div style={{ background:'rgba(248,113,113,.1)', border:'0.5px solid rgba(248,113,113,.3)', color:'#F87171', padding:'8px 12px', borderRadius:8, fontSize:12.5, marginBottom:12 }}>{err}</div>}
            <input style={inp} placeholder="Full name" value={form.name} onChange={f('name')} />
            <input style={inp} placeholder="Email address" type="email" value={form.email} onChange={f('email')} />
            <input style={inp} placeholder="Password (min 8 chars)" type="password" value={form.password} onChange={f('password')} />
            <select style={{ ...inp, marginBottom:16, appearance:'none' }} value={form.role} onChange={f('role')}>
              {Object.entries(ROLES).map(([k,v]) => <option key={k} value={k}>{v.label} — {ROLE_PERMISSIONS[k]}</option>)}
            </select>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={()=>setModal(false)} style={{ fontSize:13, background:'none', border:'0.5px solid rgba(255,255,255,.13)', color:'#6E7E9E', padding:'9px 18px', borderRadius:8, cursor:'pointer' }}>Cancel</button>
              <button onClick={addMember} disabled={saving} style={{ fontSize:13, background:'rgba(248,113,113,.15)', border:'0.5px solid rgba(248,113,113,.3)', color:'#F87171', padding:'9px 18px', borderRadius:8, cursor:'pointer' }}>
                {saving ? 'Adding…' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change password modal */}
      {pwModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e=>e.target===e.currentTarget&&setPwModal(false)}>
          <div style={{ background:'#0C1220', border:'0.5px solid rgba(79,142,247,.2)', borderRadius:14, padding:24, width:380, maxWidth:'92vw' }}>
            <div style={{ fontSize:16, fontWeight:700, color:'#E5EBF8', marginBottom:16, fontFamily:'system-ui' }}>Change Password</div>
            {err && <div style={{ background:'rgba(248,113,113,.1)', border:'0.5px solid rgba(248,113,113,.3)', color:'#F87171', padding:'8px 12px', borderRadius:8, fontSize:12.5, marginBottom:12 }}>{err}</div>}
            <input style={inp} placeholder="Current password" type="password" value={pwForm.current} onChange={e=>setPwForm(p=>({...p,current:e.target.value}))} />
            <input style={inp} placeholder="New password (min 8 chars)" type="password" value={pwForm.newPw} onChange={e=>setPwForm(p=>({...p,newPw:e.target.value}))} />
            <input style={{ ...inp, marginBottom:16 }} placeholder="Confirm new password" type="password" value={pwForm.confirm} onChange={e=>setPwForm(p=>({...p,confirm:e.target.value}))} />
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={()=>setPwModal(false)} style={{ fontSize:13, background:'none', border:'0.5px solid rgba(255,255,255,.13)', color:'#6E7E9E', padding:'9px 18px', borderRadius:8, cursor:'pointer' }}>Cancel</button>
              <button onClick={changePassword} disabled={saving} style={{ fontSize:13, background:'rgba(79,142,247,.15)', border:'0.5px solid rgba(79,142,247,.3)', color:'#7EB3FF', padding:'9px 18px', borderRadius:8, cursor:'pointer' }}>
                {saving ? 'Saving…' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}

function showToast(msg) { const t=document.createElement('div'); t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0C1220;border:0.5px solid rgba(34,209,122,.3);color:#22D17A;padding:8px 18px;border-radius:20px;font-size:12.5px;z-index:99999;font-family:system-ui'; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2400) }
