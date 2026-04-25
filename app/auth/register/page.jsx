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
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:"'Poppins', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        .auth-input { width:100%; padding:12px 16px; border:1.5px solid #E8E4DF; border-radius:8px; font-size:14px; font-family:Poppins,sans-serif; outline:none; transition:border-color 0.2s; color:#1A1A1A; background:#fff; }
        .auth-input:focus { border-color:#FF5C00; }
        .auth-btn { width:100%; padding:13px; background:#FF5C00; color:#fff; border:none; border-radius:8px; font-size:15px; font-weight:600; font-family:Poppins,sans-serif; cursor:pointer; transition:all 0.2s; }
        .auth-btn:hover { background:#E64D00; }
        .auth-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .step-inp { width:100%; padding:12px 16px; border:1.5px solid #E8E4DF; border-radius:8px; font-size:14px; font-family:Poppins,sans-serif; outline:none; transition:border-color 0.2s; color:#1A1A1A; background:#fff; margin-bottom:12px; }
        .step-inp:focus { border-color:#FF5C00; }
      `}</style>

      {/* Left — brand panel */}
      <div style={{ width:'44%', background:'linear-gradient(145deg, #FF5C00 0%, #FF8C42 100%)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 56px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-80, right:-80, width:300, height:300, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
        <div style={{ position:'absolute', bottom:-60, left:-60, width:240, height:240, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
        <div style={{ position:'relative' }}>
          <div style={{ fontSize:22, fontWeight:700, color:'#fff', marginBottom:48 }}>
            Absolute <span style={{ opacity:0.8 }}>AIChat</span>
          </div>
          <h2 style={{ fontSize:36, fontWeight:800, color:'#fff', lineHeight:1.2, marginBottom:16 }}>
            Your AI assistant, live in 5 minutes
          </h2>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.8)', lineHeight:1.7, marginBottom:48 }}>
            Set up your workspace, train your bot, and start capturing leads today.
          </p>
          {/* Step indicators */}
          {[['1','Create account'],['2','Add business info'],['3','Connect AI']].map(([n, label], i) => (
            <div key={n} style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700,
                background: step > i+1 ? 'rgba(255,255,255,0.9)' : step === i+1 ? '#fff' : 'rgba(255,255,255,0.2)',
                color: step === i+1 ? '#FF5C00' : step > i+1 ? '#FF5C00' : 'rgba(255,255,255,0.6)' }}>
                {step > i+1 ? '✓' : n}
              </div>
              <span style={{ fontSize:14, color: step >= i+1 ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: step === i+1 ? 600 : 400 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — wizard */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#FAFAF8', padding:32 }}>
        <div style={{ width:'100%', maxWidth:440 }}>
          {step === 1 && (
            <>
              <h1 style={{ fontSize:28, fontWeight:800, color:'#1A1A1A', marginBottom:6, letterSpacing:'-0.02em' }}>Create your account</h1>
              <p style={{ fontSize:15, color:'#6B6B6B', marginBottom:28 }}>Free forever. No credit card needed.</p>
              {error && <div style={{ background:'#FFF0EE', border:'1px solid rgba(255,92,0,0.2)', color:'#CC3D00', padding:'12px 16px', borderRadius:8, fontSize:14, marginBottom:20 }}>{error}</div>}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'#1A1A1A', marginBottom:5, display:'block' }}>First name</label>
                  <input className="auth-input" placeholder="Bala" value={form.firstName} onChange={e=>setForm(p=>({...p,firstName:e.target.value}))} />
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'#1A1A1A', marginBottom:5, display:'block' }}>Last name</label>
                  <input className="auth-input" placeholder="K" value={form.lastName} onChange={e=>setForm(p=>({...p,lastName:e.target.value}))} />
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'#1A1A1A', marginBottom:5, display:'block' }}>Company name</label>
                <input className="auth-input" placeholder="Absolute App Labs" value={form.company} onChange={e=>setForm(p=>({...p,company:e.target.value}))} />
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'#1A1A1A', marginBottom:5, display:'block' }}>Work email</label>
                <input className="auth-input" type="email" placeholder="you@company.com" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} />
              </div>
              <div style={{ marginBottom:24 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'#1A1A1A', marginBottom:5, display:'block' }}>Password</label>
                <input className="auth-input" type="password" placeholder="Min 8 characters" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} />
              </div>
              <button className="auth-btn" onClick={nextStep} disabled={loading}>{loading ? 'Creating account…' : 'Create account →'}</button>
              <p style={{ textAlign:'center', marginTop:20, fontSize:14, color:'#6B6B6B' }}>
                Already have an account?{' '}
                <a href="/auth/login" style={{ color:'#FF5C00', fontWeight:600, textDecoration:'none' }}>Sign in</a>
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <h1 style={{ fontSize:28, fontWeight:800, color:'#1A1A1A', marginBottom:6, letterSpacing:'-0.02em' }}>Tell us about your business</h1>
              <p style={{ fontSize:15, color:'#6B6B6B', marginBottom:28 }}>This trains your bot's personality and knowledge.</p>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'#1A1A1A', marginBottom:5, display:'block' }}>What does your company do?</label>
                <textarea className="auth-input" rows={4} placeholder="We are a software development company specialising in…" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} style={{ resize:'vertical' }} />
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'#1A1A1A', marginBottom:5, display:'block' }}>Bot name</label>
                <input className="auth-input" placeholder="Kaali" value={form.botName} onChange={e=>setForm(p=>({...p,botName:e.target.value}))} />
              </div>
              <div style={{ marginBottom:24 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'#1A1A1A', marginBottom:5, display:'block' }}>Response tone</label>
                <select className="auth-input" value={form.tone} onChange={e=>setForm(p=>({...p,tone:e.target.value}))} style={{ appearance:'none' }}>
                  <option value="friendly">Friendly & Conversational</option>
                  <option value="professional">Professional & Precise</option>
                  <option value="sharp">Sharp & Concise</option>
                </select>
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <button onClick={()=>setStep(1)} style={{ flex:1, padding:13, background:'transparent', border:'1.5px solid #E8E4DF', borderRadius:8, fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'Poppins' }}>← Back</button>
                <button className="auth-btn" onClick={nextStep} style={{ flex:2 }}>Continue →</button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h1 style={{ fontSize:28, fontWeight:800, color:'#1A1A1A', marginBottom:6, letterSpacing:'-0.02em' }}>Connect your AI</h1>
              <p style={{ fontSize:15, color:'#6B6B6B', marginBottom:28 }}>Paste your API key. Encrypted at rest. Never shared.</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                {[{id:'claude',icon:'🤖',name:'Claude',desc:'Anthropic'},{id:'chatgpt',icon:'💬',name:'ChatGPT',desc:'OpenAI'}].map(p => (
                  <div key={p.id} onClick={()=>setProv(p.id)} style={{ padding:16, border:`1.5px solid ${provider===p.id?'#FF5C00':'#E8E4DF'}`, borderRadius:12, cursor:'pointer', background:provider===p.id?'#FFF4EE':'#fff', transition:'all 0.15s' }}>
                    <div style={{ fontSize:22, marginBottom:4 }}>{p.icon}</div>
                    <div style={{ fontSize:14, fontWeight:600 }}>{p.name}</div>
                    <div style={{ fontSize:12, color:'#6B6B6B' }}>{p.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'#1A1A1A', marginBottom:5, display:'block' }}>API Key</label>
                <input className="auth-input" type="password" placeholder={provider==='claude'?'sk-ant-…':'sk-…'} value={form.apiKey} onChange={e=>setForm(p=>({...p,apiKey:e.target.value}))} />
              </div>
              <div style={{ marginBottom:24 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'#1A1A1A', marginBottom:5, display:'block' }}>Model</label>
                <select className="auth-input" value={form.model} onChange={e=>setForm(p=>({...p,model:e.target.value}))} style={{ appearance:'none' }}>
                  {(modelOpts[provider]||[]).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              {error && <div style={{ background:'#FFF0EE', border:'1px solid rgba(255,92,0,0.2)', color:'#CC3D00', padding:'12px 16px', borderRadius:8, fontSize:14, marginBottom:16 }}>{error}</div>}
              <div style={{ display:'flex', gap:12 }}>
                <button onClick={()=>setStep(2)} style={{ flex:1, padding:13, background:'transparent', border:'1.5px solid #E8E4DF', borderRadius:8, fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'Poppins' }}>← Back</button>
                <button className="auth-btn" onClick={nextStep} disabled={loading} style={{ flex:2 }}>{loading ? 'Finishing…' : 'Launch my bot 🚀'}</button>
              </div>
              <p style={{ textAlign:'center', marginTop:16, fontSize:13, color:'#6B6B6B' }}>
                <a href="/dashboard" style={{ color:'#FF5C00', textDecoration:'none' }}>Skip for now →</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
