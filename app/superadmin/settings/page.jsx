'use client'
import { useEffect, useState, useRef } from 'react'
import { PageShell } from '../dashboard/page'

function saFetch(path, opts={}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sa_token') : ''
  return fetch(path, { ...opts, headers: { Authorization: `Bearer ${token}`, ...(opts.headers||{}) } }).then(r => r.json())
}

export default function SASettingsPage() {
  const [logoUrl,   setLogoUrl]   = useState('')
  const [uploading, setUploading] = useState(false)
  const logoRef = useRef(null)

  useEffect(() => {
    saFetch('/api/superadmin/settings').then(d => setLogoUrl(d.settings?.logo_url || ''))
  }, [])

  async function uploadLogo(e) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('logo', file)
      const token = localStorage.getItem('sa_token')
      const res = await fetch('/api/superadmin/settings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setLogoUrl(data.logoUrl + '?t=' + Date.now())
      showToast('Logo updated! Refresh the page to see it in the sidebar.')
    } catch(e) { showToast(e.message, true) }
    finally { setUploading(false); e.target.value = '' }
  }

  async function removeLogo() {
    await fetch('/api/platform-settings', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('sa_token')}` }, body: JSON.stringify({ logoUrl: '' }) })
    setLogoUrl('')
    showToast('Logo removed.')
  }

  return (
    <PageShell title="Platform Settings">

      {/* Logo */}
      <div style={{ background:'#0F1626', border:'0.5px solid rgba(255,255,255,.08)', borderRadius:12, overflow:'hidden', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'0.5px solid rgba(255,255,255,.06)' }}>
          <span style={{ fontSize:14, fontWeight:500, color:'#C8D4F0' }}>Platform Logo</span>
        </div>
        <div style={{ padding:20 }}>
          <p style={{ fontSize:13, color:'#6B7A99', marginBottom:16, lineHeight:1.6 }}>
            Upload your company logo. It will appear in the dashboard sidebar instead of the "Absolute AIChat" text.
            Recommended: PNG or SVG, transparent background, max 2MB.
          </p>

          <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:16 }}>
            <div style={{ width:160, height:60, background:'#141D2E', border:'0.5px solid rgba(255,255,255,.1)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Platform logo" style={{ maxWidth:'140px', maxHeight:'50px', objectFit:'contain' }} />
              ) : (
                <span style={{ fontSize:13, color:'#3A4A6A' }}>No logo uploaded</span>
              )}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:'#C8D4F0', marginBottom:6 }}>
                {logoUrl ? 'Logo uploaded ✓' : 'Upload your logo'}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <label style={{ cursor:'pointer' }}>
                  <span style={{ fontSize:12, background:'rgba(79,142,247,.12)', border:'0.5px solid rgba(79,142,247,.3)', color:'#7EB3FF', padding:'7px 14px', borderRadius:8, cursor:'pointer' }}>
                    {uploading ? 'Uploading…' : logoUrl ? 'Change Logo' : 'Upload Logo'}
                  </span>
                  <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display:'none' }} onChange={uploadLogo} disabled={uploading} />
                </label>
                {logoUrl && (
                  <button onClick={removeLogo} style={{ fontSize:12, background:'rgba(248,113,113,.08)', border:'0.5px solid rgba(248,113,113,.2)', color:'#F87171', padding:'7px 14px', borderRadius:8, cursor:'pointer' }}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div style={{ padding:12, background:'rgba(79,142,247,.06)', border:'0.5px solid rgba(79,142,247,.15)', borderRadius:9, fontSize:12, color:'#6B7A99' }}>
            💡 After uploading, refresh the page to see the logo in the sidebar.
          </div>
        </div>
      </div>

      {/* Env reference */}
      <div style={{ background:'#0F1626', border:'0.5px solid rgba(255,255,255,.08)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'0.5px solid rgba(255,255,255,.06)' }}>
          <span style={{ fontSize:14, fontWeight:500, color:'#C8D4F0' }}>Environment Variables Reference</span>
        </div>
        <div style={{ padding:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              ['SUPERADMIN_EMAIL',         'First-time login email'],
              ['SUPERADMIN_PASSWORD',       'First-time login password'],
              ['NEXT_PUBLIC_SUPABASE_URL',  'Supabase project URL'],
              ['SUPABASE_SERVICE_ROLE_KEY', 'Supabase service role key'],
              ['JWT_SECRET',               'JWT signing secret'],
              ['STRIPE_SECRET_KEY',        'Stripe secret key'],
              ['NEXT_PUBLIC_APP_URL',      'Your Vercel deployment URL'],
              ['EMAIL_HOST',              'SMTP host for emails'],
            ].map(([k,v]) => (
              <div key={k} style={{ padding:'8px 12px', background:'#141D2E', borderRadius:8, display:'flex', justifyContent:'space-between', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:12, color:'#4F8EF7', fontFamily:'monospace' }}>{k}</span>
                <span style={{ fontSize:11, color:'#6B7A99' }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:12, padding:12, background:'rgba(251,191,36,.07)', border:'0.5px solid rgba(251,191,36,.2)', borderRadius:9, fontSize:12, color:'#6B7A99' }}>
            ⚠ To update env vars go to <strong style={{ color:'#FBBF24' }}>Vercel → Project → Settings → Environment Variables</strong> then redeploy.
          </div>
        </div>
      </div>
    </PageShell>
  )
}

function showToast(msg, isErr=false) {
  const t=document.createElement('div')
  t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0F1626;border:0.5px solid rgba(34,209,122,.3);color:#22D17A;padding:9px 20px;border-radius:20px;font-size:13px;z-index:99999;font-family:system-ui'
  if(isErr) t.style.color='#F87171'
  t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),3000)
}
