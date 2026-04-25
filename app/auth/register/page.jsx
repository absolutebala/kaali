'use client'
import { useState }      from 'react'
import { useRouter }     from 'next/navigation'
import { useAuth }       from '@/lib/auth-context'
import Link              from 'next/link'

export default function RegisterPage() {
  const { register }          = useAuth()
  const router                = useRouter()
  const [step, setStep]       = useState(1)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [provider, setProv]   = useState('claude')
  const [form, setForm]       = useState({
    firstName:'', lastName:'', company:'', email:'', password:'',
    description:'', botName:'Kaali', tone:'friendly',
    apiKey:'', model:'claude-sonnet-4-20250514',
  })

  const modelOpts = {
    claude:  [['claude-sonnet-4-20250514','Claude Sonnet 4 (Recommended)'],['claude-opus-4-20250514','Claude Opus 4'],['claude-haiku-4-5-20251001','Claude Haiku 4.5']],
    chatgpt: [['gpt-4o-mini','GPT-4o Mini (Recommended)'],['gpt-4o','GPT-4o']],
  }

  async function handleRegister() {
    setError(''); setLoading(true)
    try {
      await register({
        name: (form.firstName + ' ' + form.lastName).trim(),
        company: form.company, email: form.email, password: form.password,
      })
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function finishWizard() {
    setError(''); setLoading(true)
    try {
      const token = localStorage.getItem('kaali_token')
      if (form.description || form.botName !== 'Kaali' || form.tone !== 'friendly') {
        await fetch('/api/tenant', { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
          body: JSON.stringify({ description: form.description, bot_name: form.botName, response_tone: form.tone }) })
      }
      if (form.apiKey) {
        await fetch('/api/tenant', { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
          body: JSON.stringify({ ai_provider: provider, api_key: form.apiKey, ai_model: form.model }) })
      }
      router.replace('/dashboard')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function nextStep() {
    if (step === 1) { await handleRegister(); if (!error) setStep(2) }
    else if (step === 2) setStep(3)
    else await finishWizard()
  }

  const inp = { className:'auth-input' }

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:"'Poppins', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        .auth-input { width:100%; padding:12px 16px; border:1.5px solid #E8E4DF; border-radius:8px; font-size:14px; font-family:Poppins,sans-serif; outline:none; transition:border-color 0.2s; color:#1A1A1A; background:#fff; }
        .auth-input:focus { border-color:#FF5C00; }
        .auth-btn { padding:13px 24px; background:#FF5C00; color:#fff; border:none; border-radius:8px; font-size:15px; font-weight:600; font-family:Poppins,sans-serif; cursor:pointer; transition:all 0.2s; }
        .auth-btn:hover { background:#E64D00; }
        .auth-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .back-btn { padding:13px 24px; background:transparent; border:1.5px solid #E8E4DF; border-radius:8px; font-size:15px; font-weight:600; font-family:Poppins,sans-serif; cursor:pointer; color:#1A1A1A; }
        .back-btn:hover { border-color:#FF5C00; color:#FF5C00; }
        label { font-size:12px; font-weight:600; color:#1A1A1A; margin-bottom:5px; display:block; }
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
          {[['1','Create account'],['2','Add business info'],['3','Connect AI']].map(([n, label], i) => (
            <div key={n} style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700,
                background: step > i+1 ? 'rgba(255,255,255,0.9)' : step === i+1 ? '#fff' : 'rgba(255,255,255,0.2)',
                color: step >= i+1 ? '#FF5C00' : 'rgba(255,255,255,0.6)' }}>
                {step > i+1 ? '✓' : n}
              </div>
              <span style={{ fontSize:14, color: step >= i+1 ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: step === i+1 ? 600 : 400 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — wizard */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#FAFAF8', padding:40 }}>
        <div style={{ width:'100%', maxWidth:440 }}>

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <h1 style={{ fontSize:28, fontWeight:800, color:'#1A1A1A', marginBottom:6, letterSpacing:'-0.02em' }}>Create your account</h1>
              <p style={{ fontSize:15, color:'#6B6B6B', marginBottom:28 }}>Free forever. No credit card needed.</p>
              {error && <div style={{ background:'#FFF0EE', border:'1px solid rgba(255,92,0,0.2)', color:'#CC3D00', padding:'12px 16px', borderRadius:8, fontSize:14, marginBottom:20 }}>{error}</div>}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div>
                  <label>First name</label>
                  <input {...inp} placeholder="Bala" value={form.firstName} onChange={e=>setForm(p=>({...p,firstName:e.target.value}))} />
                </div>
                <div>
                  <label>Last name</label>
                  <input {...inp} placeholder="K" value={form.lastName} onChange={e=>setForm(p=>({...p,lastName:e.target.value}))} />
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label>Company name</label>
                <input {...inp} placeholder="Absolute App Labs" value={form.company} onChange={e=>setForm(p=>({...p,company:e.target.value}))} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label>Work email</label>
                <input {...inp} type="email" placeholder="you@company.com" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} />
              </div>
              <div style={{ marginBottom:28 }}>
                <label>Password</label>
                <input {...inp} type="password" placeholder="Min 8 characters" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} />
              </div>
              <button className="auth-btn" onClick={nextStep} disabled={loading} style={{ width:'100%' }}>
                {loading ? 'Creating account…' : 'Create account →'}
              </button>
              <p style={{ textAlign:'center', marginTop:20, fontSize:14, color:'#6B6B6B' }}>
                Already have an account?{' '}
                <Link href="/auth/login" style={{ color:'#FF5C00', fontWeight:600, textDecoration:'none' }}>Sign in</Link>
              </p>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <h1 style={{ fontSize:28, fontWeight:800, color:'#1A1A1A', marginBottom:6, letterSpacing:'-0.02em' }}>Tell us about your business</h1>
              <p style={{ fontSize:15, color:'#6B6B6B', marginBottom:28 }}>This trains your bot's personality and knowledge.</p>
              <div style={{ marginBottom:14 }}>
                <label>What does your company do?</label>
                <textarea {...inp} rows={4} placeholder="We are a software development company specialising in…" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} style={{ resize:'vertical' }} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label>Bot name</label>
                <input {...inp} placeholder="Kaali" value={form.botName} onChange={e=>setForm(p=>({...p,botName:e.target.value}))} />
              </div>
              <div style={{ marginBottom:28 }}>
                <label>Response tone</label>
                <select {...inp} value={form.tone} onChange={e=>setForm(p=>({...p,tone:e.target.value}))} style={{ appearance:'none' }}>
                  <option value="friendly">Friendly & Conversational</option>
                  <option value="professional">Professional & Precise</option>
                  <option value="sharp">Sharp & Concise</option>
                </select>
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <button className="back-btn" onClick={()=>setStep(1)} style={{ flex:1 }}>← Back</button>
                <button className="auth-btn" onClick={nextStep} style={{ flex:2 }}>Continue →</button>
              </div>
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>
              <h1 style={{ fontSize:28, fontWeight:800, color:'#1A1A1A', marginBottom:6, letterSpacing:'-0.02em' }}>Connect your AI</h1>
              <p style={{ fontSize:15, color:'#6B6B6B', marginBottom:28 }}>Paste your API key. Encrypted at rest. Never shared.</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                {[{id:'claude',icon:'🤖',name:'Claude',desc:'Anthropic'},{id:'chatgpt',icon:'💬',name:'ChatGPT',desc:'OpenAI'}].map(p => (
                  <div key={p.id} onClick={()=>{ setProv(p.id); setForm(prev=>({...prev,model:modelOpts[p.id][0][0]})) }}
                    style={{ padding:16, border:`1.5px solid ${provider===p.id?'#FF5C00':'#E8E4DF'}`, borderRadius:12, cursor:'pointer', background:provider===p.id?'#FFF4EE':'#fff', transition:'all 0.15s' }}>
                    <div style={{ fontSize:22, marginBottom:4 }}>{p.icon}</div>
                    <div style={{ fontSize:14, fontWeight:600 }}>{p.name}</div>
                    <div style={{ fontSize:12, color:'#6B6B6B' }}>{p.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:14 }}>
                <label>API Key</label>
                <input {...inp} type="password" placeholder={provider==='claude'?'sk-ant-…':'sk-…'} value={form.apiKey} onChange={e=>setForm(p=>({...p,apiKey:e.target.value}))} />
              </div>
              <div style={{ marginBottom:24 }}>
                <label>Model</label>
                <select {...inp} value={form.model} onChange={e=>setForm(p=>({...p,model:e.target.value}))} style={{ appearance:'none' }}>
                  {(modelOpts[provider]||[]).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              {error && <div style={{ background:'#FFF0EE', border:'1px solid rgba(255,92,0,0.2)', color:'#CC3D00', padding:'12px 16px', borderRadius:8, fontSize:14, marginBottom:16 }}>{error}</div>}
              <div style={{ display:'flex', gap:12 }}>
                <button className="back-btn" onClick={()=>setStep(2)} style={{ flex:1 }}>← Back</button>
                <button className="auth-btn" onClick={nextStep} disabled={loading} style={{ flex:2 }}>{loading ? 'Finishing…' : 'Launch my bot 🚀'}</button>
              </div>
              <p style={{ textAlign:'center', marginTop:16, fontSize:13, color:'#6B6B6B' }}>
                <Link href="/dashboard" style={{ color:'#FF5C00', textDecoration:'none' }}>Skip for now →</Link>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
