'use client'
import { useEffect, useState, useRef } from 'react'
import { tenant as tenantApi }          from '@/lib/api-client'
import { useAuth }                      from '@/lib/auth-context'
import { PageShell }                    from '../page'

const COLORS = ['#4F8EF7','#F87171','#22D17A','#FBBF24','#C084FC','#F97316','#06B6D4','#EC4899','#0F172A','#1E293B']

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth()
  const avatarRef = useRef(null)

  const [form, setForm] = useState({
    botName:'', tone:'friendly', calendly:'', company:'',
    hubspotToken:'', zapierWebhookUrl:'',
    bubbleColor:'#4F8EF7', widgetMode:'bubble', b2bMode:false,
  })
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [hsVis,       setHsVis]       = useState(false)
  const [avatarUrl,   setAvatarUrl]   = useState('')
  const [uploading,   setUploading]   = useState(false)
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  useEffect(() => {
    if (!user) return
    setForm({
      botName:         user.botName          || 'Kaali',
      tone:            user.tone             || 'friendly',
      calendly:        user.calendly         || '',
      company:         user.company          || '',
      hubspotToken:    user.hubspotToken     || '',
      zapierWebhookUrl:user.zapierWebhookUrl || '',
      bubbleColor:     user.bubbleColor      || '#4F8EF7',
      widgetMode:      user.widgetMode       || 'bubble',
    })
    setAvatarUrl(user.avatarUrl || '')
  }, [user])

  async function save() {
    setSaving(true); setSaved(false)
    try {
      await tenantApi.update({
        botName:          form.botName,
        tone:             form.tone,
        calendly:         form.calendly,
        companyName:      form.company,
        hubspotToken:     form.hubspotToken,
        zapierWebhookUrl: form.zapierWebhookUrl,
        bubbleColor:      form.bubbleColor,
        widgetMode:       form.widgetMode,
        b2bMode:          form.b2bMode,
      })
      await refreshUser()
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch(e) { showToast(e.message, true) }
    finally { setSaving(false) }
  }

  async function uploadAvatar(e) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('avatar', file)
      const res = await fetch('/api/tenant/avatar', {
        method:'POST',
        headers:{ Authorization:`Bearer ${localStorage.getItem('kaali_token')}` },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAvatarUrl(data.avatarUrl)
      await refreshUser()
      showToast('Avatar updated!')
    } catch(e) { showToast(e.message, true) }
    finally { setUploading(false); e.target.value = '' }
  }

  return (
    <PageShell title="Settings">

      {/* Bot & Company */}
      <div className="kb-card">
        <div className="kb-header"><span className="kb-title">Bot & Company Settings</span></div>
        <div className="card-body">

          {/* Avatar + Bot Name row */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:20, marginBottom:18, paddingBottom:18, borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>
            {/* Avatar */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flexShrink:0 }}>
              <div style={{ width:72, height:72, borderRadius:'50%', overflow:'hidden', border:`3px solid ${form.bubbleColor}`,
                background:`linear-gradient(145deg, ${form.bubbleColor}88, ${form.bubbleColor})`,
                display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative' }}
                onClick={() => avatarRef.current?.click()}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Bot avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                ) : (
                  <span style={{ fontFamily:'var(--font-brand)', fontSize:26, fontWeight:700, color:'#fff' }}>
                    {(form.botName||'K').charAt(0).toUpperCase()}
                  </span>
                )}
                <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.4)', opacity:0, transition:'opacity .15s', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%', fontSize:11, color:'#fff' }}
                  onMouseOver={e=>e.currentTarget.style.opacity=1} onMouseOut={e=>e.currentTarget.style.opacity=0}>
                  {uploading ? '…' : '📷'}
                </div>
              </div>
              <input ref={avatarRef} type="file" accept="image/*" style={{ display:'none' }} onChange={uploadAvatar} />
              <button onClick={() => avatarRef.current?.click()} className="btn-ghost btn-sm" style={{ fontSize:11 }}>
                {uploading ? 'Uploading…' : 'Change Photo'}
              </button>
              {avatarUrl && (
                <button onClick={async()=>{ await tenantApi.update({avatarUrl:''}); setAvatarUrl(''); refreshUser() }}
                  style={{ fontSize:11, color:'var(--rd)', background:'none', border:'none', cursor:'pointer' }}>Remove</button>
              )}
            </div>

            {/* Bot name + company */}
            <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div className="form-row" style={{ marginBottom:0 }}>
                <label className="form-label">Bot Name</label>
                <input className="form-input" value={form.botName} onChange={f('botName')} placeholder="Kaali" />
              </div>
              <div className="form-row" style={{ marginBottom:0 }}>
                <label className="form-label">Company Name</label>
                <input className="form-input" value={form.company} onChange={f('company')} placeholder="Absolute App Labs" />
              </div>
              <div className="form-row" style={{ marginBottom:0 }}>
                <label className="form-label">Response Tone</label>
                <select className="form-input" value={form.tone} onChange={f('tone')} style={{ appearance:'none' }}>
                  <option value="friendly">Friendly & Conversational</option>
                  <option value="professional">Professional & Precise</option>
                  <option value="sharp">Sharp & Concise</option>
                </select>
              </div>
              <div className="form-row" style={{ marginBottom:0 }}>
                <label className="form-label">Calendly URL</label>
                <input className="form-input" value={form.calendly} onChange={f('calendly')} placeholder="https://calendly.com/yourlink" />
              </div>
            </div>
          </div>

          {/* Bubble Color */}
          <div style={{ marginBottom:18, paddingBottom:18, borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>
            <label className="form-label">Bubble Color</label>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginTop:6 }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setForm(p=>({...p,bubbleColor:c}))}
                  style={{ width:30, height:30, borderRadius:'50%', background:c, cursor:'pointer',
                    border: form.bubbleColor===c ? '3px solid #fff' : '3px solid transparent',
                    boxShadow: form.bubbleColor===c ? `0 0 0 2px ${c}` : 'none',
                    transition:'all .15s' }} />
              ))}
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input type="color" value={form.bubbleColor} onChange={e=>setForm(p=>({...p,bubbleColor:e.target.value}))}
                  style={{ width:30, height:30, border:'none', borderRadius:'50%', cursor:'pointer', padding:0, background:'none' }} />
                <span style={{ fontSize:12, color:'var(--tm)' }}>Custom</span>
              </div>
              <div style={{ width:30, height:30, borderRadius:'50%', background:`linear-gradient(145deg,${form.bubbleColor}88,${form.bubbleColor})`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-brand)', fontSize:12, color:'#fff', fontWeight:700 }}>
                {(form.botName||'K').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Widget Display Mode */}
          <div>
            <label className="form-label">Widget Display Mode</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:6 }}>
              {[
                { val:'bubble',      icon:'💬', label:'Floating Bubble',     desc:'Chat opens when visitor clicks the bubble' },
                { val:'always_open', icon:'📖', label:'Always Open',         desc:'Chat panel is always visible on the page' },
                { val:'popup',       icon:'🎯', label:'Centre Popup',        desc:'Chat appears as a centred overlay popup' },
              ].map(m => (
                <div key={m.val} onClick={() => setForm(p=>({...p,widgetMode:m.val}))}
                  style={{ padding:12, background: form.widgetMode===m.val ? 'rgba(79,142,247,.12)' : 'var(--s2)',
                    border: `1.5px solid ${form.widgetMode===m.val ? 'var(--ac)' : 'rgba(255,255,255,.1)'}`,
                    borderRadius:10, cursor:'pointer', transition:'all .15s' }}>
                  <div style={{ fontSize:20, marginBottom:6 }}>{m.icon}</div>
                  <div style={{ fontSize:12, fontWeight:500, color:'var(--tx)', marginBottom:3 }}>{m.label}</div>
                  <div style={{ fontSize:11, color:'var(--tm)', lineHeight:1.4 }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* B2B Mode */}
          <div style={{ marginTop:18, paddingTop:18, borderTop:'0.5px solid rgba(255,255,255,.07)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--tx)', marginBottom:3 }}>B2B Mode</div>
                <div style={{ fontSize:12, color:'var(--tm)' }}>Bot will ask visitors for their company name and job title during lead capture</div>
              </div>
              <div onClick={() => setForm(p => ({ ...p, b2bMode: !p.b2bMode }))}
                style={{ width:44, height:24, borderRadius:12, cursor:'pointer', transition:'background .2s', flexShrink:0,
                  background: form.b2bMode ? 'var(--ac)' : 'var(--s3)',
                  position:'relative' }}>
                <div style={{ position:'absolute', top:3, left: form.b2bMode ? 23 : 3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left .2s' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="kb-card">
        <div className="kb-header">
          <span className="kb-title">Integrations</span>
          <span style={{ fontSize:12, color:'var(--tm)' }}>Fires on every lead capture</span>
        </div>
        <div style={{ padding:'0 18px 18px' }}>

          {/* HubSpot */}
          <div style={{ padding:'18px 0', borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'#FF7A59', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M18.164 7.93V5.084a2.198 2.198 0 0 0 1.269-1.978V3.07A2.199 2.199 0 0 0 17.236.873h-.036a2.199 2.199 0 0 0-2.197 2.197v.036a2.198 2.198 0 0 0 1.269 1.978V7.93a6.232 6.232 0 0 0-2.962 1.305L6.225 4.129a2.44 2.44 0 1 0-1.197 1.476l6.893 5.001a6.232 6.232 0 0 0-.896 3.242 6.23 6.23 0 0 0 .97 3.361l-2.098 2.098a1.907 1.907 0 1 0 1.162 1.086l2.012-2.012a6.267 6.267 0 0 0 9.136-5.533A6.263 6.263 0 0 0 18.164 7.93zm-1 9.87a3.266 3.266 0 1 1 0-6.532 3.266 3.266 0 0 1 0 6.531z"/></svg>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:14, fontWeight:600, color:'var(--tx)' }}>HubSpot CRM</span>
                  {form.hubspotToken && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:'rgba(34,209,122,.12)', color:'#5EDFAC', fontWeight:500 }}>● Connected</span>}
                </div>
                <div style={{ fontSize:12, color:'var(--tm)', marginTop:2 }}>Auto-creates/updates contacts on lead capture</div>
              </div>
              <a href="https://app.hubspot.com/private-apps" target="_blank" rel="noopener" style={{ fontSize:11, color:'var(--ac)', textDecoration:'none', flexShrink:0 }}>Get token →</a>
            </div>
            <div style={{ position:'relative' }}>
              <input className="form-input" type={hsVis?'text':'password'} value={form.hubspotToken}
                onChange={f('hubspotToken')} placeholder="pat-na1-xxxx..." style={{ paddingRight:60 }} />
              <button onClick={() => setHsVis(v=>!v)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'var(--tm)', background:'none', border:'none', cursor:'pointer' }}>{hsVis?'Hide':'Show'}</button>
            </div>
          </div>

          {/* Zoho CRM */}
          <div style={{ padding:'18px 0', borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'#E42527', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.5h-9v-2l5.5-6H7.5V7h9v2l-5.5 6h5.5v1.5z"/></svg>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:14, fontWeight:600, color:'var(--tx)' }}>Zoho CRM</span>
                  {form.zohoToken && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:'rgba(34,209,122,.12)', color:'#5EDFAC', fontWeight:500 }}>● Connected</span>}
                </div>
                <div style={{ fontSize:12, color:'var(--tm)', marginTop:2 }}>Auto-creates lead records on lead capture</div>
              </div>
              <a href="https://api-console.zoho.com" target="_blank" rel="noopener" style={{ fontSize:11, color:'var(--ac)', textDecoration:'none', flexShrink:0 }}>Get token →</a>
            </div>
            <input className="form-input" type="password" value={form.zohoToken}
              onChange={e => setForm(p => ({ ...p, zohoToken: e.target.value }))}
              placeholder="Zoho OAuth access token" />
            <div style={{ fontSize:11, color:'var(--td)', marginTop:6 }}>
              Scope needed: <code style={{ background:'var(--s2)', padding:'1px 5px', borderRadius:4 }}>ZohoCRM.modules.leads.CREATE</code>
            </div>
          </div>

          {/* Zapier */}
          <div style={{ padding:'18px 0' }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'#FF4A00', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M14.5 2.5l-3 8H3l7 5-2.5 8 7-5 7 5-2.5-8 7-5h-8.5l-3-8z"/></svg>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:14, fontWeight:600, color:'var(--tx)' }}>Zapier</span>
                  {form.zapierWebhookUrl && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:'rgba(34,209,122,.12)', color:'#5EDFAC', fontWeight:500 }}>● Connected</span>}
                </div>
                <div style={{ fontSize:12, color:'var(--tm)', marginTop:2 }}>Sends lead data to 5,000+ apps via webhook</div>
              </div>
              <a href="https://zapier.com/apps/webhook/integrations" target="_blank" rel="noopener" style={{ fontSize:11, color:'var(--ac)', textDecoration:'none', flexShrink:0 }}>Set up →</a>
            </div>
            <input className="form-input" value={form.zapierWebhookUrl} onChange={f('zapierWebhookUrl')} placeholder="https://hooks.zapier.com/hooks/catch/..." />
          </div>

        </div>
      </div>

      {/* Save */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10, marginBottom:14 }}>
        {saved && <span style={{ fontSize:12, color:'var(--gr)' }}>✓ All settings saved</span>}
        <button className="btn-pri" onClick={save} disabled={saving} style={{ padding:'10px 28px' }}>
          {saving ? 'Saving…' : 'Save All Settings'}
        </button>
      </div>

      {/* Account */}
      <div className="kb-card">
        <div className="kb-header"><span className="kb-title">Account</span></div>
        <div className="card-body">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[{ label:'Email', value: user?.email },{ label:'Plan', value: (user?.plan||'starter').charAt(0).toUpperCase()+(user?.plan||'starter').slice(1) }].map(row => (
              <div key={row.label}>
                <div style={{ fontSize:12, color:'var(--tm)', marginBottom:4 }}>{row.label}</div>
                <div style={{ fontSize:13, color:'var(--tx)', background:'var(--s2)', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:9, padding:'9px 12px' }}>{row.value||'—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="kb-card" style={{ border:'0.5px solid rgba(248,113,113,.2)' }}>
        <div className="kb-header" style={{ borderColor:'rgba(248,113,113,.15)' }}><span className="kb-title" style={{ color:'var(--rd)' }}>Danger Zone</span></div>
        <div className="card-body">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
            <div><div style={{ fontSize:13, fontWeight:500, color:'var(--tx)', marginBottom:3 }}>Sign out</div><div style={{ fontSize:12.5, color:'var(--tm)' }}>You can log back in anytime.</div></div>
            <button className="btn-sec btn-danger" onClick={logout}>Sign Out</button>
          </div>
        </div>
      </div>

      <div style={{ textAlign:'center', fontSize:12, color:'var(--td)', marginTop:16 }}>
        Powered by <a href="https://absoluteapplabs.com" target="_blank" rel="noopener" style={{ color:'var(--ac)' }}>Absolute App Labs</a>
      </div>
    </PageShell>
  )
}

function showToast(msg, isErr=false) {
  const t=document.createElement('div'); t.className='toast'; t.textContent=msg;
  if(isErr) t.style.color='var(--rd)';
  document.body.appendChild(t); setTimeout(()=>t.remove(),2400);
}
