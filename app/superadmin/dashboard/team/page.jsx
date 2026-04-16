'use client'
import { useEffect, useState } from 'react'
import { saTeam }    from '@/lib/sa-client'
import { SAShell, fmtDate } from '../page'

const PERMS = [
  { key:'tenants',       label:'Tenants'       },
  { key:'leads',         label:'Leads'         },
  { key:'conversations', label:'Conversations' },
  { key:'analytics',     label:'Analytics'     },
  { key:'team',          label:'Team'          },
  { key:'settings',      label:'Settings'      },
]

export default function SATeamPage() {
  const [team,    setTeam]    = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)  // null | 'add' | member

  useEffect(() => {
    saTeam.list().then(r => { setTeam(r.team || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  async function addMember(form) {
    const r = await saTeam.add(form)
    setTeam(p => [...p, r.member])
    setModal(null)
    showToast('Team member added!')
  }

  async function toggleActive(member) {
    const r = await saTeam.update({ id: member.id, isActive: !member.is_active })
    setTeam(p => p.map(m => m.id === member.id ? r.member : m))
  }

  async function removeMember(id) {
    if (!confirm('Remove this team member?')) return
    await saTeam.remove(id)
    setTeam(p => p.filter(m => m.id !== id))
    showToast('Member removed')
  }

  return (
    <SAShell title="Team Members" action={
      <button onClick={() => setModal('add')}
        style={{ background:'rgba(79,142,247,.12)', border:'0.5px solid rgba(79,142,247,.3)', color:'#E5EBF8', padding:'7px 16px', borderRadius:8, fontSize:12.5, cursor:'pointer' }}>
        + Add Member
      </button>
    }>

      {/* Owner row */}
      <div style={{ background:'rgba(79,142,247,.06)', border:'0.5px solid rgba(79,142,247,.2)', borderRadius:12, padding:'14px 16px', marginBottom:14, display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(145deg,#1D4FD8,#4F8EF7)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-brand)', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>S</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:500, color:'#E5EBF8' }}>Super Admin (Owner)</div>
          <div style={{ fontSize:12, color:'#4F8EF7' }}>{process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL || 'Configured via environment variables'}</div>
        </div>
        <span style={{ fontSize:10, fontWeight:500, padding:'2px 9px', borderRadius:20, background:'rgba(79,142,247,.15)', color:'#7EB3FF' }}>Owner</span>
        <span style={{ fontSize:10, fontWeight:500, padding:'2px 9px', borderRadius:20, background:'rgba(34,209,122,.12)', color:'#5EDFAC' }}>All Access</span>
      </div>

      {/* Team members */}
      <div style={{ background:'#0C1220', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:32, textAlign:'center', color:'#6E7E9E', fontSize:13 }}>Loading…</div>
        ) : team.length === 0 ? (
          <div style={{ padding:40, textAlign:'center' }}>
            <div style={{ fontSize:26, marginBottom:10 }}>👥</div>
            <div style={{ fontSize:13, color:'#6E7E9E' }}>No team members yet. Add someone to help manage the platform.</div>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>{['Name','Email','Role','Permissions','Last Login','Status','Actions'].map(h => (
                <th key={h} style={{ padding:'9px 13px', textAlign:'left', fontSize:11, fontWeight:500, color:'#6E7E9E', letterSpacing:'.5px', textTransform:'uppercase', borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {team.map(m => (
                <tr key={m.id} style={{ borderBottom:'0.5px solid rgba(255,255,255,.04)' }}>
                  <td style={{ padding:'10px 13px', fontSize:13, color:'#E5EBF8' }}><strong>{m.name}</strong></td>
                  <td style={{ padding:'10px 13px', fontSize:12, color:'#6E7E9E' }}>{m.email}</td>
                  <td style={{ padding:'10px 13px', fontSize:12, color:'#6E7E9E', textTransform:'capitalize' }}>{m.role}</td>
                  <td style={{ padding:'10px 13px' }}>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {PERMS.filter(p => m.permissions?.[p.key]).map(p => (
                        <span key={p.key} style={{ fontSize:10, padding:'1px 6px', borderRadius:4, background:'rgba(79,142,247,.1)', color:'#7EB3FF' }}>{p.label}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding:'10px 13px', fontSize:11, color:'#3A4A6A' }}>{m.last_login_at ? fmtDate(m.last_login_at) : 'Never'}</td>
                  <td style={{ padding:'10px 13px' }}>
                    <span style={{ fontSize:10, fontWeight:500, padding:'2px 9px', borderRadius:20, background: m.is_active ? 'rgba(34,209,122,.12)' : 'rgba(248,113,113,.1)', color: m.is_active ? '#5EDFAC' : '#F87171' }}>
                      {m.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding:'10px 13px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => setModal(m)} style={{ fontSize:11, color:'#7EB3FF', background:'rgba(79,142,247,.1)', border:'0.5px solid rgba(79,142,247,.25)', padding:'3px 9px', borderRadius:6, cursor:'pointer' }}>Edit</button>
                      <button onClick={() => toggleActive(m)} style={{ fontSize:11, color: m.is_active ? '#F87171' : '#5EDFAC', background: m.is_active ? 'rgba(248,113,113,.1)' : 'rgba(34,209,122,.1)', border:`0.5px solid ${m.is_active?'rgba(248,113,113,.25)':'rgba(34,209,122,.25)'}`, padding:'3px 9px', borderRadius:6, cursor:'pointer' }}>
                        {m.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => removeMember(m.id)} style={{ fontSize:11, color:'#F87171', background:'rgba(248,113,113,.1)', border:'0.5px solid rgba(248,113,113,.25)', padding:'3px 9px', borderRadius:6, cursor:'pointer' }}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <MemberModal
          initial={modal === 'add' ? null : modal}
          onSave={modal === 'add' ? addMember : async (form) => {
            const r = await saTeam.update({ id: modal.id, ...form })
            setTeam(p => p.map(m => m.id === modal.id ? r.member : m))
            setModal(null); showToast('Member updated!')
          }}
          onClose={() => setModal(null)}
        />
      )}
    </SAShell>
  )
}

function MemberModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    name:     initial?.name  || '',
    email:    initial?.email || '',
    password: '',
    role:     initial?.role  || 'member',
    permissions: initial?.permissions || { tenants:true, leads:true, conversations:true, analytics:true, team:false, settings:false },
  })
  const [saving, setSaving] = useState(false)
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const togglePerm = k => setForm(p => ({ ...p, permissions: { ...p.permissions, [k]: !p.permissions[k] } }))

  async function submit() {
    setSaving(true)
    try { await onSave(form) } catch(e) { showToast(e.message, true) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'#0C1220', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:14, padding:24, width:460, maxWidth:'92vw', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ fontFamily:'var(--font-brand)', fontSize:16, fontWeight:700, color:'#E5EBF8', marginBottom:20 }}>
          {initial ? 'Edit Member' : 'Add Team Member'}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div><label style={{ fontSize:12, color:'#6E7E9E', display:'block', marginBottom:5 }}>Name</label>
            <input value={form.name} onChange={f('name')} placeholder="Full name"
              style={{ width:'100%', background:'#111A2E', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:9, padding:'9px 12px', fontSize:13, color:'#E5EBF8', outline:'none' }} /></div>
          <div><label style={{ fontSize:12, color:'#6E7E9E', display:'block', marginBottom:5 }}>Email</label>
            <input value={form.email} onChange={f('email')} type="email" placeholder="email@company.com"
              style={{ width:'100%', background:'#111A2E', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:9, padding:'9px 12px', fontSize:13, color:'#E5EBF8', outline:'none' }} /></div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div><label style={{ fontSize:12, color:'#6E7E9E', display:'block', marginBottom:5 }}>{initial ? 'New Password (leave blank to keep)' : 'Password'}</label>
            <input value={form.password} onChange={f('password')} type="password" placeholder="••••••••"
              style={{ width:'100%', background:'#111A2E', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:9, padding:'9px 12px', fontSize:13, color:'#E5EBF8', outline:'none' }} /></div>
          <div><label style={{ fontSize:12, color:'#6E7E9E', display:'block', marginBottom:5 }}>Role</label>
            <select value={form.role} onChange={f('role')} style={{ width:'100%', background:'#111A2E', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:9, padding:'9px 12px', fontSize:13, color:'#E5EBF8', outline:'none', appearance:'none' }}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:12, color:'#6E7E9E', display:'block', marginBottom:10 }}>Permissions</label>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {PERMS.map(p => (
              <label key={p.key} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'8px 10px', background: form.permissions[p.key] ? 'rgba(79,142,247,.1)' : '#111A2E', border:`0.5px solid ${form.permissions[p.key]?'rgba(79,142,247,.35)':'rgba(255,255,255,.07)'}`, borderRadius:8, transition:'all .15s' }}>
                <input type="checkbox" checked={!!form.permissions[p.key]} onChange={() => togglePerm(p.key)} style={{ accentColor:'#4F8EF7' }} />
                <span style={{ fontSize:12, color: form.permissions[p.key] ? '#E5EBF8' : '#6E7E9E' }}>{p.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 18px', background:'none', border:'0.5px solid rgba(255,255,255,.1)', borderRadius:8, color:'#6E7E9E', fontSize:13, cursor:'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding:'9px 18px', background:'#4F8EF7', border:'none', borderRadius:8, color:'#fff', fontSize:13, cursor:'pointer' }}>
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  )
}

function showToast(msg, isErr=false) {
  const t=document.createElement('div')
  t.style.cssText=`position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0C1220;border:0.5px solid rgba(255,255,255,.13);color:${isErr?'#F87171':'#22D17A'};padding:8px 18px;border-radius:20px;font-size:12.5px;z-index:99999;white-space:nowrap;font-family:sans-serif`
  t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2400)
}
