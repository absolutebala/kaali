'use client'
import { useState }      from 'react'
import { useAuth }       from '@/lib/auth-context'
import { services as svcApi, tenant as tenantApi } from '@/lib/api-client'
import Link              from 'next/link'
import { useRouter }     from 'next/navigation'

const STEPS = ['Your Business', 'Services', 'AI Provider']

export default function RegisterPage() {
  const { register }          = useAuth()
  const router                = useRouter()
  const [step, setStep]       = useState(1)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [provider, setProv]   = useState('claude')
  const [svcs, setSvcs]       = useState([])
  const [addingS, setAddingS] = useState(false)
  const [newSvc, setNewSvc]   = useState({ name:'', description:'' })

  const [form, setForm] = useState({
    firstName:'', lastName:'', company:'', email:'', password:'',
    botName:'Kaali', description:'', calendly:'',
    apiKey:'', model:'claude-sonnet-4-20250514', alertEmail:'',
  })

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleRegister() {
    setError(''); setLoading(true)
    try {
      await register({ name: form.firstName + ' ' + form.lastName, company: form.company, email: form.email, password: form.password })
      // wizard continues in step 2/3 — token is now set
    } catch(err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function finishWizard() {
    setError(''); setLoading(true)
    try {
      await tenantApi.update({
        botName:     form.botName,
        description: form.description,
        calendly:    form.calendly,
        aiProvider:  provider,
        apiKey:      form.apiKey,
        aiModel:     form.model,
        alertEmail:  form.alertEmail || form.email,
      })
      router.push('/dashboard')
    } catch(err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function nextStep() {
    if (step === 1) { await handleRegister(); if (!error) setStep(2) }
    else if (step === 2) setStep(3)
    else await finishWizard()
  }

  function ProvCard({ id, icon, name, desc }) {
    const sel = provider === id
    return (
      <div onClick={() => setProv(id)} style={{
        padding:16, background:'var(--s2)', border:`1.5px solid ${sel?'var(--ac)':'rgba(255,255,255,.13)'}`,
        borderRadius:12, cursor:'pointer', transition:'border-color .15s, background .15s',
        background: sel ? 'rgba(79,142,247,.12)' : 'var(--s2)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:5 }}>
          <span style={{ fontSize:19 }}>{icon}</span>
          <span style={{ fontSize:14, fontWeight:500, color:'var(--tx)' }}>{name}</span>
        </div>
        <div style={{ fontSize:12, color:'var(--tm)', lineHeight:1.5 }}>{desc}</div>
      </div>
    )
  }

  const modelOpts = {
    claude:   [['claude-sonnet-4-20250514','Claude Sonnet 4 (Recommended)'],['claude-opus-4-20250514','Claude Opus 4'],['claude-haiku-4-5-20251001','Claude Haiku 4.5']],
    chatgpt:  [['gpt-4o-mini','GPT-4o Mini (Recommended)'],['gpt-4o','GPT-4o']],
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center',
      padding:'40px 24px 60px', background:'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(79,142,247,.08) 0%, transparent 70%)' }}>
      <Link href="/" style={{ fontFamily:'var(--font-brand)', fontSize:16, color:'var(--tx)', marginBottom:36, display:'flex', alignItems:'center', gap:7 }}>
        <div style={{ width:7, height:7, background:'var(--ac)', borderRadius:'50%' }} />
        Absolute AIChat
      </Link>

      {/* Progress */}
      <div style={{ display:'flex', alignItems:'center', marginBottom:32 }}>
        {STEPS.map((s, i) => {
          const n   = i + 1
          const cls = n < step ? 'done' : n === step ? 'active' : 'future'
          return (
            <div key={s} style={{ display:'flex', alignItems:'center' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, fontWeight:500, flexShrink:0,
                background:   cls==='done' ? 'var(--ac)' : cls==='active' ? 'var(--s3)' : 'var(--s2)',
                border:       cls==='active' ? '2px solid var(--ac)' : cls==='done' ? 'none' : '0.5px solid rgba(255,255,255,.07)',
                color:        cls==='done' ? '#fff' : cls==='active' ? 'var(--ac)' : 'var(--td)',
              }}>{cls==='done' ? '✓' : n}</div>
              {i < STEPS.length-1 && (
                <div style={{ width:48, height:'0.5px', background: n < step ? 'rgba(79,142,247,.4)' : 'rgba(255,255,255,.07)' }} />
              )}
            </div>
          )
        })}
      </div>

      <div style={{ width:'100%', maxWidth:520, background:'var(--s1)', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:20, padding:34 }}>

        {error && (
          <div style={{ background:'rgba(248,113,113,.1)', border:'0.5px solid rgba(248,113,113,.3)', color:'var(--rd)', padding:'10px 13px', borderRadius:9, fontSize:13, marginBottom:16 }}>
            {error}
          </div>
        )}

        {/* ── Step 1: Account ── */}
        {step === 1 && (
          <>
            <h2 style={{ fontFamily:'var(--font-brand)', fontSize:20, fontWeight:700, color:'var(--tx)', marginBottom:5 }}>Create your account</h2>
            <p style={{ fontSize:13, color:'var(--tm)', marginBottom:26, lineHeight:1.6 }}>No credit card needed. Up and running in minutes.</p>
            <div className="form-2col">
              <div className="form-row"><label className="form-label">First name</label><input className="form-input" value={form.firstName} onChange={f('firstName')} placeholder="Bala" /></div>
              <div className="form-row"><label className="form-label">Last name</label><input className="form-input" value={form.lastName}  onChange={f('lastName')}  placeholder="Kumar" /></div>
            </div>
            <div className="form-row"><label className="form-label">Company</label><input className="form-input" value={form.company} onChange={f('company')} placeholder="Acme Inc." /></div>
            <div className="form-row"><label className="form-label">Work email</label><input className="form-input" type="email" value={form.email} onChange={f('email')} placeholder="you@company.com" /></div>
            <div className="form-row"><label className="form-label">Password</label><input className="form-input" type="password" value={form.password} onChange={f('password')} placeholder="Min 8 characters" /></div>
          </>
        )}

        {/* ── Step 2: Business info + services ── */}
        {step === 2 && (
          <>
            <h2 style={{ fontFamily:'var(--font-brand)', fontSize:20, fontWeight:700, color:'var(--tx)', marginBottom:5 }}>Your business</h2>
            <p style={{ fontSize:13, color:'var(--tm)', marginBottom:26, lineHeight:1.6 }}>This becomes your bot's knowledge base.</p>
            <div className="form-row"><label className="form-label">Bot name</label><input className="form-input" value={form.botName} onChange={f('botName')} placeholder="Kaali" /></div>
            <div className="form-row"><label className="form-label">What does your company do?</label>
              <textarea className="form-input" rows={3} value={form.description} onChange={f('description')} placeholder="We help businesses scale through…" style={{ resize:'vertical' }} />
            </div>
            <div className="form-row"><label className="form-label">Calendly URL <span style={{ color:'var(--td)' }}>(optional)</span></label><input className="form-input" value={form.calendly} onChange={f('calendly')} placeholder="https://calendly.com/yourlink" /></div>
            <div style={{ background:'var(--s2)', borderRadius:9, padding:12, marginTop:4 }}>
              <div style={{ fontSize:12, fontWeight:500, color:'var(--tm)', marginBottom:10 }}>Services (optional — add what you offer)</div>
              {svcs.map((s,i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 0', borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:'var(--tx)' }}>{s.name}</div>
                    <div style={{ fontSize:12, color:'var(--tm)' }}>{s.description}</div>
                  </div>
                  <button onClick={() => setSvcs(p => p.filter((_,j)=>j!==i))} style={{ fontSize:11, color:'var(--rd)', background:'none', border:'none', cursor:'pointer' }}>✕</button>
                </div>
              ))}
              {addingS ? (
                <div style={{ marginTop:8 }}>
                  <input className="form-input" style={{ marginBottom:6 }} placeholder="Service name" value={newSvc.name} onChange={e => setNewSvc(p=>({...p,name:e.target.value}))} />
                  <input className="form-input" style={{ marginBottom:8 }} placeholder="Short description" value={newSvc.description} onChange={e => setNewSvc(p=>({...p,description:e.target.value}))} />
                  <div style={{ display:'flex', gap:8 }}>
                    <button className="btn-pri btn-sm" onClick={()=>{if(newSvc.name.trim()){setSvcs(p=>[...p,{...newSvc}]);setNewSvc({name:'',description:''});setAddingS(false)}}}>Add</button>
                    <button className="btn-ghost btn-sm" onClick={()=>setAddingS(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={()=>setAddingS(true)} style={{ fontSize:12.5, color:'var(--ac)', background:'none', border:'none', cursor:'pointer', marginTop:8 }}>+ Add a service</button>
              )}
            </div>
          </>
        )}

        {/* ── Step 3: AI ── */}
        {step === 3 && (
          <>
            <h2 style={{ fontFamily:'var(--font-brand)', fontSize:20, fontWeight:700, color:'var(--tx)', marginBottom:5 }}>Connect your AI</h2>
            <p style={{ fontSize:13, color:'var(--tm)', marginBottom:26, lineHeight:1.6 }}>Your key is encrypted at rest. We never use it for anything else.</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <ProvCard id="claude"  icon="🤖" name="Claude"  desc="Anthropic — nuanced, conversational" />
              <ProvCard id="chatgpt" icon="⚡" name="ChatGPT" desc="OpenAI GPT-4o — fast, widely used" />
            </div>
            <div className="form-row">
              <label className="form-label">{provider==='claude'?'Anthropic':'OpenAI'} API Key</label>
              <input className="form-input" type="password" value={form.apiKey} onChange={f('apiKey')} placeholder={provider==='claude'?'sk-ant-...':'sk-...'} />
            </div>
            <div className="form-row">
              <label className="form-label">Model</label>
              <select className="form-input" value={form.model} onChange={f('model')} style={{ appearance:'none' }}>
                {modelOpts[provider].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">Usage alert email — notified at 80%</label>
              <input className="form-input" type="email" value={form.alertEmail||form.email} onChange={f('alertEmail')} placeholder={form.email} />
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:26, paddingTop:18, borderTop:'0.5px solid rgba(255,255,255,.07)' }}>
          <button style={{ fontSize:13, color:'var(--tm)', background:'none', border:'none', padding:8, cursor:'pointer' }}
            onClick={() => step > 1 ? setStep(s => s-1) : router.push('/auth/login')}>← Back</button>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:12, color:'var(--td)' }}>Step {step} of 3</span>
            <button className="btn-pri" style={{ padding:'9px 22px' }} disabled={loading} onClick={nextStep}>
              {loading ? 'Saving…' : step < 3 ? 'Continue →' : 'Finish Setup →'}
            </button>
          </div>
        </div>

        {step === 1 && (
          <p style={{ fontSize:13, color:'var(--tm)', textAlign:'center', marginTop:18 }}>
            Already have an account? <Link href="/auth/login" style={{ color:'var(--ac)' }}>Log in</Link>
          </p>
        )}
      </div>
    </div>
  )
}
