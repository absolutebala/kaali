'use client'
import { useEffect, useState } from 'react'
import { tenant as tenantApi } from '@/lib/api-client'
import { useAuth }   from '@/lib/auth-context'
import { PageShell } from '../page'

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth()
  const [form, setForm] = useState({ botName:'', tone:'friendly', calendly:'', company:'', hubspotToken:'', zapierWebhookUrl:'' })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [hsVis,  setHsVis]  = useState(false)
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  useEffect(() => {
    if (!user) return
    setForm({ botName: user.botName||'Kaali', tone: user.tone||'friendly', calendly: user.calendly||'', company: user.company||'', hubspotToken: user.hubspotToken||'', zapierWebhookUrl: user.zapierWebhookUrl||'' })
  }, [user])

  async function save() {
    setSaving(true); setSaved(false)
    try {
      await tenantApi.update({ botName: form.botName, tone: form.tone, calendly: form.calendly, companyName: form.company, hubspotToken: form.hubspotToken, zapierWebhookUrl: form.zapierWebhookUrl })
      await refreshUser()
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch(e) { showToast(e.message, true) }
    finally { setSaving(false) }
  }

  return (
    <PageShell title="Settings">
      <div className="kb-card">
        <div className="kb-header"><span className="kb-title">Bot & Company Settings</span></div>
        <div className="card-body">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div className="form-row" style={{ marginBottom:0 }}><label className="form-label">Bot Name</label><input className="form-input" value={form.botName} onChange={f('botName')} placeholder="Kaali" /></div>
            <div className="form-row" style={{ marginBottom:0 }}><label className="form-label">Company Name</label><input className="form-input" value={form.company} onChange={f('company')} placeholder="Absolute App Labs" /></div>
            <div className="form-row" style={{ marginBottom:0 }}><label className="form-label">Response Tone</label>
              <select className="form-input" value={form.tone} onChange={f('tone')} style={{ appearance:'none' }}>
                <option value="friendly">Friendly & Conversational</option>
                <option value="professional">Professional & Precise</option>
                <option value="sharp">Sharp & Concise</option>
              </select>
            </div>
            <div className="form-row" style={{ marginBottom:0 }}><label className="form-label">Calendly URL</label><input className="form-input" value={form.calendly} onChange={f('calendly')} placeholder="https://calendly.com/yourlink" /></div>
          </div>
        </div>
      </div>

      <div className="kb-card">
        <div className="kb-header"><span className="kb-title">HubSpot Integration</span><a href="https://app.hubspot.com/private-apps" target="_blank" rel="noopener" style={{ fontSize:11, color:'var(--ac)' }}>Get token →</a></div>
        <div className="card-body">
          <p style={{ fontSize:12.5, color:'var(--tm)', marginBottom:14, lineHeight:1.6 }}>When a lead is captured, Kaali automatically creates or updates a contact in your HubSpot CRM. Go to HubSpot → Settings → Integrations → Private Apps → Create → copy the access token.</p>
          <div className="form-row" style={{ marginBottom:0 }}><label className="form-label">HubSpot Private App Token</label>
            <div style={{ position:'relative' }}>
              <input className="form-input" type={hsVis?'text':'password'} value={form.hubspotToken} onChange={f('hubspotToken')} placeholder="pat-na1-..." style={{ paddingRight:60 }} />
              <button onClick={() => setHsVis(v=>!v)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'var(--tm)', background:'none', border:'none', cursor:'pointer' }}>{hsVis?'Hide':'Show'}</button>
            </div>
            <p style={{ fontSize:11, color:'var(--td)', marginTop:4 }}>Required scopes: crm.objects.contacts.write, crm.objects.contacts.read</p>
          </div>
        </div>
      </div>

      <div className="kb-card">
        <div className="kb-header"><span className="kb-title">Zapier Webhook</span><a href="https://zapier.com/apps/webhook/integrations" target="_blank" rel="noopener" style={{ fontSize:11, color:'var(--ac)' }}>Set up Zapier →</a></div>
        <div className="card-body">
          <p style={{ fontSize:12.5, color:'var(--tm)', marginBottom:14, lineHeight:1.6 }}>When a lead is captured, Kaali sends the details to your Zapier webhook. Connect to Google Sheets, Slack, Gmail, Notion, Salesforce, or any 5,000+ apps.</p>
          <div style={{ padding:12, background:'var(--s2)', borderRadius:9, marginBottom:14 }}>
            <p style={{ fontSize:12, color:'var(--td)', marginBottom:8, fontWeight:500 }}>How to get your Zapier webhook URL:</p>
            {['Go to zapier.com → Create Zap','Trigger: Webhooks by Zapier → Catch Hook','Copy the webhook URL shown','Paste it below and save','In Zapier, add your action (Sheets, Slack, etc.)'].map((s,i) => (
              <div key={i} style={{ fontSize:12, color:'var(--tm)', padding:'2px 0', display:'flex', gap:8 }}><span style={{ color:'var(--ac)', fontWeight:500 }}>{i+1}.</span> {s}</div>
            ))}
          </div>
          <div className="form-row" style={{ marginBottom:0 }}><label className="form-label">Zapier Webhook URL</label><input className="form-input" value={form.zapierWebhookUrl} onChange={f('zapierWebhookUrl')} placeholder="https://hooks.zapier.com/hooks/catch/..." /></div>
          <div style={{ marginTop:12, padding:10, background:'rgba(34,209,122,.07)', border:'0.5px solid rgba(34,209,122,.2)', borderRadius:8, fontSize:12, color:'var(--tm)' }}>
            <strong style={{ color:'var(--tx)' }}>Payload sent on each lead:</strong>
            <pre style={{ marginTop:6, fontSize:11, color:'var(--gr)', lineHeight:1.6 }}>{`{ "name": "Visitor Name", "email": "visitor@email.com", "type": "CLIENT",\n  "summary": "...", "company": "${user?.company||'Your Company'}",\n  "timestamp": "2025-04-15T10:30:00Z", "source": "Kaali AI Chat" }`}</pre>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10, marginBottom:14 }}>
        {saved && <span style={{ fontSize:12, color:'var(--gr)' }}>✓ All settings saved</span>}
        <button className="btn-pri" onClick={save} disabled={saving} style={{ padding:'10px 28px' }}>{saving?'Saving…':'Save All Settings'}</button>
      </div>

      <div className="kb-card">
        <div className="kb-header"><span className="kb-title">Account</span></div>
        <div className="card-body">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[{ label:'Email', value: user?.email },{ label:'Plan', value: (user?.plan||'starter').charAt(0).toUpperCase()+(user?.plan||'starter').slice(1) }].map(row => (
              <div key={row.label}><div style={{ fontSize:12, color:'var(--tm)', marginBottom:4 }}>{row.label}</div><div style={{ fontSize:13, color:'var(--tx)', background:'var(--s2)', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:9, padding:'9px 12px' }}>{row.value||'—'}</div></div>
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
      <div style={{ textAlign:'center', fontSize:12, color:'var(--td)', marginTop:16 }}>Powered by <a href="https://absoluteapplabs.com" target="_blank" rel="noopener" style={{ color:'var(--ac)' }}>Absolute App Labs</a></div>
    </PageShell>
  )
}
function showToast(msg, isErr=false) { const t=document.createElement('div'); t.className='toast'; t.textContent=msg; if(isErr) t.style.color='var(--rd)'; document.body.appendChild(t); setTimeout(()=>t.remove(),2400); }
