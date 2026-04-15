'use client'
import { useEffect, useState } from 'react'
import { tenant as tenantApi } from '@/lib/api-client'
import { useAuth }   from '@/lib/auth-context'
import { PageShell } from '../page'

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth()
  const [form, setForm] = useState({
    botName:'', tone:'friendly', calendly:'', name:'', email:'',
  })
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  useEffect(() => {
    if (!user) return
    setForm({
      botName:  user.botName  || 'Kaali',
      tone:     user.tone     || 'friendly',
      calendly: user.calendly || '',
      name:     user.name     || '',
      email:    user.email    || '',
    })
  }, [user])

  async function save() {
    setSaving(true); setSaved(false)
    try {
      await tenantApi.update({ botName: form.botName, tone: form.tone, calendly: form.calendly })
      await refreshUser()
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch(e) { showToast(e.message, true) }
    finally { setSaving(false) }
  }

  return (
    <PageShell title="Settings">

      {/* Bot settings */}
      <div className="kb-card">
        <div className="kb-header"><span className="kb-title">Bot Settings</span></div>
        <div className="card-body">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:4 }}>
            <div className="form-row" style={{ marginBottom:0 }}>
              <label className="form-label">Bot Name <span style={{ color:'var(--td)' }}>(visible to visitors)</span></label>
              <input className="form-input" value={form.botName} onChange={f('botName')} placeholder="Kaali" />
            </div>
            <div className="form-row" style={{ marginBottom:0 }}>
              <label className="form-label">Response Tone</label>
              <select className="form-input" value={form.tone} onChange={f('tone')} style={{ appearance:'none' }}>
                <option value="friendly">Friendly &amp; Conversational</option>
                <option value="professional">Professional &amp; Precise</option>
                <option value="sharp">Sharp &amp; Concise</option>
              </select>
            </div>
            <div className="form-row" style={{ marginBottom:0, gridColumn:'1/-1' }}>
              <label className="form-label">Calendly / Booking URL</label>
              <input className="form-input" value={form.calendly} onChange={f('calendly')} placeholder="https://calendly.com/yourlink" />
              <p style={{ fontSize:11, color:'var(--td)', marginTop:4 }}>When Kaali captures a qualified lead, it will offer this link for booking a call.</p>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10, paddingTop:16, marginTop:16, borderTop:'0.5px solid rgba(255,255,255,.07)' }}>
            {saved && <span style={{ fontSize:12, color:'var(--gr)' }}>✓ Saved</span>}
            <button className="btn-pri" onClick={save} disabled={saving}>{saving?'Saving…':'Save Settings'}</button>
          </div>
        </div>
      </div>

      {/* Account info (read-only) */}
      <div className="kb-card">
        <div className="kb-header"><span className="kb-title">Account</span></div>
        <div className="card-body">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[
              { label:'Name',    value: user?.name    },
              { label:'Company', value: user?.company },
              { label:'Email',   value: user?.email   },
              { label:'Plan',    value: (user?.plan||'starter').charAt(0).toUpperCase()+(user?.plan||'starter').slice(1) },
            ].map(row => (
              <div key={row.label}>
                <div style={{ fontSize:12, color:'var(--tm)', marginBottom:4 }}>{row.label}</div>
                <div style={{ fontSize:13, color:'var(--tx)', background:'var(--s2)', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:9, padding:'9px 12px' }}>{row.value || '—'}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize:12, color:'var(--td)', marginTop:12 }}>To update your email or name, contact support@absoluteapplabs.com</p>
        </div>
      </div>

      {/* Danger zone */}
      <div className="kb-card" style={{ border:'0.5px solid rgba(248,113,113,.2)' }}>
        <div className="kb-header" style={{ borderColor:'rgba(248,113,113,.15)' }}><span className="kb-title" style={{ color:'var(--rd)' }}>Danger Zone</span></div>
        <div className="card-body">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--tx)', marginBottom:3 }}>Sign out of your workspace</div>
              <div style={{ fontSize:12.5, color:'var(--tm)' }}>You can log back in anytime with your email and password.</div>
            </div>
            <button className="btn-sec btn-danger" onClick={logout}>Sign Out</button>
          </div>
        </div>
      </div>

      {/* Powered by attribution — immutable */}
      <div style={{ textAlign:'center', fontSize:12, color:'var(--td)', marginTop:16 }}>
        Powered by <a href="https://absoluteapplabs.com" target="_blank" rel="noopener" style={{ color:'var(--ac)' }}>Absolute App Labs</a>
      </div>
    </PageShell>
  )
}

function showToast(msg, isErr=false) {
  const t=document.createElement('div'); t.className='toast';
  t.textContent=msg; if(isErr) t.style.color='var(--rd)';
  document.body.appendChild(t); setTimeout(()=>t.remove(),2400);
}
