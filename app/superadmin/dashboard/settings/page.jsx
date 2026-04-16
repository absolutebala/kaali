'use client'
import { useState }  from 'react'
import { SAShell }   from '../page'
import { saToken }   from '@/lib/sa-client'

export default function SASettingsPage() {
  const [pwForm,    setPwForm]    = useState({ current:'', newPass:'', confirm:'' })
  const [pwSaving,  setPwSaving]  = useState(false)
  const [pwMsg,     setPwMsg]     = useState('')

  async function changePassword() {
    if (!pwForm.current || !pwForm.newPass) { setPwMsg('Fill in all fields.'); return }
    if (pwForm.newPass !== pwForm.confirm)  { setPwMsg('New passwords do not match.'); return }
    if (pwForm.newPass.length < 8)          { setPwMsg('Password must be at least 8 characters.'); return }

    setPwSaving(true); setPwMsg('')
    try {
      const token = saToken.get()
      const res = await fetch('/api/superadmin/change-password', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPass }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPwMsg('✓ Password updated successfully!')
      setPwForm({ current:'', newPass:'', confirm:'' })
    } catch(e) {
      setPwMsg(`✕ ${e.message}`)
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <SAShell title="Settings">

      {/* Change password */}
      <div style={{ background:'#0C1220', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, overflow:'hidden', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>
          <div style={{ fontSize:13, fontWeight:500, color:'#E5EBF8' }}>Change Password</div>
        </div>
        <div style={{ padding:16 }}>
          <p style={{ fontSize:12.5, color:'#6E7E9E', marginBottom:16, lineHeight:1.6 }}>
            For the owner account (configured via SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD env vars),
            update the password in your Vercel environment variables and redeploy.
            For team member accounts, use the Team page.
          </p>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:14 }}>
            {[
              { key:'current', label:'Current Password', ph:'••••••••' },
              { key:'newPass', label:'New Password',     ph:'Min 8 chars' },
              { key:'confirm', label:'Confirm Password', ph:'Repeat new password' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize:12, color:'#6E7E9E', display:'block', marginBottom:5 }}>{f.label}</label>
                <input type="password" value={pwForm[f.key]} onChange={e => setPwForm(p=>({...p,[f.key]:e.target.value}))}
                  placeholder={f.ph}
                  style={{ width:'100%', background:'#111A2E', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:9, padding:'9px 12px', fontSize:13, color:'#E5EBF8', outline:'none' }} />
              </div>
            ))}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={changePassword} disabled={pwSaving}
              style={{ background:'#4F8EF7', border:'none', borderRadius:8, padding:'9px 20px', fontSize:13, color:'#fff', cursor:'pointer' }}>
              {pwSaving ? 'Updating…' : 'Update Password'}
            </button>
            {pwMsg && <span style={{ fontSize:12, color: pwMsg.startsWith('✓') ? '#22D17A' : '#F87171' }}>{pwMsg}</span>}
          </div>
        </div>
      </div>

      {/* Platform info */}
      <div style={{ background:'#0C1220', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ padding:'12px 16px', borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>
          <div style={{ fontSize:13, fontWeight:500, color:'#E5EBF8' }}>Platform Info</div>
        </div>
        <div style={{ padding:16 }}>
          {[
            { label:'Platform',      value:'Kaali — AI Chat Platform' },
            { label:'Built by',      value:'Absolute App Labs' },
            { label:'Website',       value:'absoluteapplabs.com' },
            { label:'Super Admin URL', value:'/superadmin/login' },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', gap:16, padding:'8px 0', borderBottom:'0.5px solid rgba(255,255,255,.04)' }}>
              <div style={{ fontSize:12, color:'#6E7E9E', width:140, flexShrink:0 }}>{r.label}</div>
              <div style={{ fontSize:13, color:'#E5EBF8' }}>{r.value}</div>
            </div>
          ))}
        </div>
      </div>
    </SAShell>
  )
}
