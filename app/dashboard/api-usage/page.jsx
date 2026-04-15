'use client'
import { useEffect, useState } from 'react'
import { tenant as tenantApi, stats as statsApi, stripe as stripeApi } from '@/lib/api-client'
import { useAuth }   from '@/lib/auth-context'
import { PageShell } from '../page'

const MODELS = {
  claude:  [['claude-sonnet-4-20250514','Claude Sonnet 4 (Recommended)'],['claude-opus-4-20250514','Claude Opus 4'],['claude-haiku-4-5-20251001','Claude Haiku 4.5 (Fastest)']],
  chatgpt: [['gpt-4o-mini','GPT-4o Mini (Recommended)'],['gpt-4o','GPT-4o']],
}

export default function ApiUsagePage() {
  const { user, refreshUser }   = useAuth()
  const [usage,    setUsage]    = useState(null)
  const [provider, setProv]     = useState('claude')
  const [apiKey,   setApiKey]   = useState('')
  const [keyVis,   setKeyVis]   = useState(false)
  const [model,    setModel]    = useState('claude-sonnet-4-20250514')
  const [alertEm,  setAlertEm]  = useState('')
  const [alertThr, setAlertThr] = useState(80)
  const [saving,   setSaving]   = useState(false)
  const [testMsg,  setTestMsg]  = useState('')

  useEffect(() => {
    async function load() {
      const [t, s] = await Promise.all([tenantApi.get(), statsApi.get()])
      const ten = t.tenant
      setProv(ten.aiProvider || 'claude')
      setModel(ten.aiModel   || 'claude-sonnet-4-20250514')
      setAlertEm(ten.alertEmail || '')
      setAlertThr(ten.alertThreshold || 80)
      setUsage(s)
    }
    load()
  }, [])

  async function saveProvider() {
    setSaving(true)
    try {
      await tenantApi.update({ aiProvider: provider, apiKey: apiKey || undefined, aiModel: model })
      await refreshUser()
      showToast('AI settings saved!')
    } catch(e) { showToast(e.message, true) }
    finally { setSaving(false) }
  }

  async function testConnection() {
    setTestMsg('Testing…')
    try {
      await tenantApi.update({ aiProvider: provider })
      setTimeout(() => setTestMsg(apiKey ? '✓ Key accepted — test a chat to confirm it works' : '✕ Enter your API key first'), 600)
    } catch { setTestMsg('✕ Error — check your key') }
  }

  async function saveAlerts() {
    setSaving(true)
    try {
      await tenantApi.update({ alertEmail: alertEm, alertThreshold: alertThr })
      showToast('Alert settings saved!')
    } catch(e) { showToast(e.message, true) }
    finally { setSaving(false) }
  }

  async function manageSubscription() {
    try {
      const { url } = await stripeApi.getPortal()
      window.location.href = url
    } catch { showToast('No active Stripe subscription found.', true) }
  }

  const pct    = usage?.usagePct || 0
  const barCls = pct>=100?'crit':pct>=80?'warn':''

  return (
    <PageShell title="API & Usage">

      {/* Provider */}
      <div className="kb-card">
        <div className="kb-header"><span className="kb-title">AI Provider & API Key</span></div>
        <div className="card-body">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            {[
              { id:'claude',  icon:'🤖', name:'Claude',  desc:'Anthropic — nuanced, conversational' },
              { id:'chatgpt', icon:'⚡', name:'ChatGPT', desc:'OpenAI GPT-4o — fast, widely used' },
            ].map(p => (
              <div key={p.id} onClick={() => { setProv(p.id); setModel(MODELS[p.id][0][0]) }}
                style={{ padding:16, background: provider===p.id ? 'rgba(79,142,247,.12)' : 'var(--s2)',
                  border: `1.5px solid ${provider===p.id ? 'var(--ac)' : 'rgba(255,255,255,.13)'}`,
                  borderRadius:12, cursor:'pointer', transition:'all .15s' }}>
                <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:5 }}>
                  <span style={{ fontSize:19 }}>{p.icon}</span>
                  <span style={{ fontSize:14, fontWeight:500, color:'var(--tx)' }}>{p.name}</span>
                </div>
                <div style={{ fontSize:12, color:'var(--tm)', lineHeight:1.5 }}>{p.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
            <div className="form-row" style={{ marginBottom:0 }}>
              <label className="form-label">{provider==='claude'?'Anthropic':'OpenAI'} API Key</label>
              <div style={{ position:'relative' }}>
                <input className="form-input" type={keyVis?'text':'password'} value={apiKey} onChange={e=>setApiKey(e.target.value)}
                  placeholder={provider==='claude'?'sk-ant-...':'sk-...'} style={{ paddingRight:60 }} />
                <button onClick={() => setKeyVis(v=>!v)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'var(--tm)', background:'none', border:'none', cursor:'pointer' }}>
                  {keyVis?'Hide':'Show'}
                </button>
              </div>
              <p style={{ fontSize:11, color:'var(--td)', marginTop:4 }}>Encrypted before storage. Never exposed to visitors.</p>
            </div>
            <div className="form-row" style={{ marginBottom:0 }}>
              <label className="form-label">Model</label>
              <select className="form-input" value={model} onChange={e=>setModel(e.target.value)} style={{ appearance:'none' }}>
                {MODELS[provider].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <button className="btn-pri btn-sm" onClick={saveProvider} disabled={saving}>{saving?'Saving…':'Save Changes'}</button>
            <button className="btn-sec btn-sm" onClick={testConnection}>Test Connection</button>
            {testMsg && <span style={{ fontSize:12, color: testMsg.startsWith('✓') ? 'var(--gr)' : 'var(--tm)' }}>{testMsg}</span>}
          </div>
        </div>
      </div>

      {/* Usage */}
      <div className="kb-card">
        <div className="kb-header">
          <span className="kb-title">Monthly Usage</span>
          {user?.plan !== 'starter' && (
            <button className="btn-sec btn-sm" onClick={manageSubscription}>Manage Subscription →</button>
          )}
        </div>
        <div className="card-body">
          {usage && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--tm)', marginBottom:8 }}>
                <span>{usage.used} conversations used</span>
                <span>{usage.limit} monthly limit ({(user?.plan||'Starter').charAt(0).toUpperCase()+(user?.plan||'starter').slice(1)})</span>
              </div>
              <div className="usage-bar-bg" style={{ height:10 }}>
                <div className={`usage-bar-fill ${barCls}`} style={{ width:`${pct}%` }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--td)', marginTop:5 }}>
                <span>{pct}% used</span><span>{Math.max(0, usage.limit - usage.used)} remaining</span>
              </div>
              {pct >= 80 && <div style={{ fontSize:12, color:'var(--am)', marginTop:8 }}>⚠ Approaching monthly limit. Consider upgrading your plan.</div>}
              {pct >= 100 && <div style={{ fontSize:12, color:'var(--rd)', marginTop:4 }}>🚫 Limit reached. Kaali will stop responding until you upgrade or the month resets.</div>}
            </>
          )}
          {/* Plan comparison */}
          {user?.plan === 'starter' && (
            <div style={{ marginTop:20, padding:14, background:'rgba(79,142,247,.07)', border:'0.5px solid rgba(79,142,247,.2)', borderRadius:9 }}>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--tx)', marginBottom:8 }}>Upgrade your plan</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  { plan:'growth',   label:'Growth',   price:'$29', limit:'2,000 conversations', docs:'10 PDFs' },
                  { plan:'business', label:'Business',  price:'$79', limit:'Unlimited',           docs:'Unlimited PDFs' },
                ].map(p => (
                  <div key={p.plan} style={{ padding:12, background:'var(--s2)', borderRadius:8 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:'var(--tx)', marginBottom:4 }}>{p.label} — {p.price}/mo</div>
                    <div style={{ fontSize:12, color:'var(--tm)' }}>{p.limit} · {p.docs}</div>
                    <button className="btn-pri btn-sm" style={{ marginTop:8, width:'100%' }}
                      onClick={() => stripeApi.createCheckout(p.plan).then(r => window.location.href=r.url).catch(()=>showToast('Stripe not configured yet',true))}>
                      Upgrade →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      <div className="kb-card">
        <div className="kb-header"><span className="kb-title">Usage Alerts</span></div>
        <div className="card-body">
          <p style={{ fontSize:12.5, color:'var(--tm)', marginBottom:14 }}>
            Get an email when your usage hits the threshold. The same email also receives new lead notifications.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
            <div className="form-row" style={{ marginBottom:0 }}>
              <label className="form-label">Alert email</label>
              <input className="form-input" type="email" value={alertEm} onChange={e=>setAlertEm(e.target.value)} />
            </div>
            <div className="form-row" style={{ marginBottom:0 }}>
              <label className="form-label">Alert at</label>
              <select className="form-input" value={alertThr} onChange={e=>setAlertThr(parseInt(e.target.value))} style={{ appearance:'none' }}>
                <option value={70}>70% of limit</option>
                <option value={80}>80% of limit (default)</option>
                <option value={90}>90% of limit</option>
              </select>
            </div>
          </div>
          <button className="btn-pri btn-sm" onClick={saveAlerts} disabled={saving}>{saving?'Saving…':'Save Alerts'}</button>
        </div>
      </div>
    </PageShell>
  )
}

function showToast(msg, isErr=false) {
  const t=document.createElement('div'); t.className='toast';
  t.textContent=msg; if(isErr) t.style.color='var(--rd)';
  document.body.appendChild(t); setTimeout(()=>t.remove(),2400);
}
