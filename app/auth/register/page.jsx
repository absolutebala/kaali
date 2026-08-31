'use client'
import { useState }      from 'react'
import { useRouter }     from 'next/navigation'
import { useAuth }       from '@/lib/auth-context'
import { signInWithGoogle, signInWithLinkedIn } from '@/lib/social-auth'
import Link              from 'next/link'

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

export default function RegisterPage() {
  const { register }          = useAuth()
  const router                = useRouter()
  const [step, setStep]       = useState(1)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  // GTM
  useEffect(() => {
    if (typeof window === 'undefined') return
    const s = document.createElement('script')
    s.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-T998Q8V6');`
    document.head.appendChild(s)
  }, [])
  const [provider, setProv]   = useState('claude')
  const [form, setForm]       = useState({
    firstName:'', lastName:'', company:'', email:'', password:'',
    description:'', botName:'', tone:'friendly',
    apiKey:'', model:'claude-sonnet-4-5',
  })

  const modelOpts = {
    claude:  [['claude-sonnet-4-5','Claude Sonnet 4 (Recommended)'],['claude-opus-4-5','Claude Opus 4'],['claude-haiku-4-5-20251001','Claude Haiku 4.5']],
    chatgpt: [['gpt-4o-mini','GPT-4o Mini (Recommended)'],['gpt-4o','GPT-4o']],
  }

  // ── Step 1: validate + register ─────────────────────────────────────────
  async function handleRegister() {
    setError('')
    if (!form.firstName.trim())    { setError('First name is required');  return false }
    if (!form.lastName.trim())     { setError('Last name is required');   return false }
    if (!form.company.trim())      { setError('Company name is required'); return false }
    if (!form.email.trim())        { setError('Email is required');        return false }
    if (!isValidEmail(form.email)) { setError('Please enter a valid email address'); return false }
    if (!form.password)            { setError('Password is required');     return false }
    if (form.password.length < 6)  { setError('Password must be at least 6 characters'); return false }

    setLoading(true)
    try {
      await register({
        name:     `${form.firstName.trim()} ${form.lastName.trim()}`,
        company:  form.company.trim(),
        email:    form.email.trim(),
        password: form.password,
      })
      return true
    } catch (err) { setError(err.message || 'Registration failed. Please try again.'); return false }
    finally { setLoading(false) }
  }

  // ── Step 3: save bot settings + API key then go to dashboard ────────────
  async function finishWizard() {
    setError(''); setLoading(true)
    try {
      const token = localStorage.getItem('kaali_token')
      // Always save bot settings using correct camelCase field names
      await fetch('/api/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          botName:     form.botName.trim() || 'Assistant',
          description: form.description,
          tone:        form.tone,
        }),
      })
      if (form.apiKey) {
        await fetch('/api/tenant', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ aiProvider: provider, apiKey: form.apiKey, aiModel: form.model }),
        })
      }
      router.replace('/dashboard/knowledge')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function nextStep() {
    if (step === 1) { const ok = await handleRegister(); if (ok) setStep(2) }
    else if (step === 2) setStep(3)
    else await finishWizard()
  }

  const inp = { className:'auth-input' }

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:"'Poppins', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        .auth-input { width:100%; padding:12px 16px; border:1.5px solid #E8E4DF; border-radius:8px; font-size:14px; font-family:Poppins,sans-serif; outline:none; transition:border-color 0.2s; color:#1A1A1A; background:#fff; box-sizing:border-box; }
        .auth-input:focus { border-color:#2563EB; }
        .auth-btn { padding:13px 24px; background:#2563EB; color:#fff; border:none; border-radius:8px; font-size:15px; font-weight:600; font-family:Poppins,sans-serif; cursor:pointer; transition:all 0.2s; }
        .auth-btn:hover { background:#E64D00; }
        .auth-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .back-btn { padding:13px 24px; background:transparent; border:1.5px solid #E8E4DF; border-radius:8px; font-size:15px; font-weight:600; font-family:Poppins,sans-serif; cursor:pointer; color:#1A1A1A; }
        .back-btn:hover { border-color:#2563EB; color:#2563EB; }
        label { font-size:12px; font-weight:600; color:#1A1A1A; margin-bottom:5px; display:block; }
      `}</style>

      {/* Left brand panel */}
      <div style={{ width:'44%', background:'linear-gradient(145deg, #1E40AF 0%, #2563EB 50%, #0891B2 100%)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 56px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-80, right:-80, width:300, height:300, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
        <div style={{ position:'absolute', bottom:-60, left:-60, width:240, height:240, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
        <div style={{ position:'relative' }}>
          <div style={{ fontSize:22, fontWeight:700, color:'#fff', marginBottom:48 }}>NivoChat</div>
          <h2 style={{ fontSize:36, fontWeight:800, color:'#fff', lineHeight:1.2, marginBottom:16 }}>Your AI assistant, live in 5 minutes</h2>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.8)', lineHeight:1.7, marginBottom:48 }}>Set up your workspace, train your bot, and start capturing leads today.</p>
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

      {/* Right wizard */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#FAFAF8', padding:40 }}>
        <div style={{ width:'100%', maxWidth:440 }}>

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <h1 style={{ fontSize:28, fontWeight:800, color:'#1A1A1A', marginBottom:6, letterSpacing:'-0.02em' }}>Create your account</h1>
              <p style={{ fontSize:15, color:'#6B6B6B', marginBottom:28 }}>Free forever. No credit card needed.</p>
              {error && <div style={{ background:'#FFF0EE', border:'1px solid rgba(255,92,0,0.2)', color:'#CC3D00', padding:'12px 16px', borderRadius:8, fontSize:14, marginBottom:20 }}>{error}</div>}

              {/* Social signup */}
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
                {[
                  { label:'Sign up with Google',    icon: <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>, fn: signInWithGoogle },
                  { label:'Sign up with LinkedIn',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>, fn: signInWithLinkedIn },
                ].map(({ label, icon, fn }) => (
                  <button key={label} type="button" onClick={fn}
                    style={{ width:'100%', padding:'11px 16px', background:'#fff', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:14, fontWeight:500, color:'#374151', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontFamily:'Inter,sans-serif', transition:'all .15s' }}
                    onMouseOver={e=>e.currentTarget.style.background='#F8FAFC'}
                    onMouseOut={e=>e.currentTarget.style.background='#fff'}>
                    {icon} {label}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                <div style={{ flex:1, height:1, background:'#E2E8F0' }} />
                <span style={{ fontSize:12, color:'#94A3B8', fontWeight:500 }}>or sign up with email</span>
                <div style={{ flex:1, height:1, background:'#E2E8F0' }} />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div>
                  <label>First name *</label>
                  <input {...inp} placeholder="Jane" value={form.firstName} onChange={e=>setForm(p=>({...p,firstName:e.target.value}))} />
                </div>
                <div>
                  <label>Last name *</label>
                  <input {...inp} placeholder="Smith" value={form.lastName} onChange={e=>setForm(p=>({...p,lastName:e.target.value}))} />
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label>Company name *</label>
                <input {...inp} placeholder="Your company" value={form.company} onChange={e=>setForm(p=>({...p,company:e.target.value}))} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label>Work email *</label>
                <input {...inp} type="email" placeholder="you@company.com" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} />
              </div>
              <div style={{ marginBottom:28 }}>
                <label>Password *</label>
                <input {...inp} type="password" placeholder="Min 6 characters" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} />
              </div>
              <button className="auth-btn" onClick={nextStep} disabled={loading} style={{ width:'100%' }}>
                {loading ? 'Creating account…' : 'Create account →'}
              </button>
              <p style={{ textAlign:'center', marginTop:20, fontSize:14, color:'#6B6B6B' }}>
                Already have an account?{' '}
                <Link href="/auth/login" style={{ color:'#2563EB', fontWeight:600, textDecoration:'none' }}>Sign in</Link>
              </p>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <h1 style={{ fontSize:28, fontWeight:800, color:'#1A1A1A', marginBottom:6, letterSpacing:'-0.02em' }}>Tell us about your business</h1>
              <p style={{ fontSize:15, color:'#6B6B6B', marginBottom:28 }}>This trains your bot's personality and knowledge.</p>
              {error && <div style={{ background:'#FFF0EE', border:'1px solid rgba(255,92,0,0.2)', color:'#CC3D00', padding:'12px 16px', borderRadius:8, fontSize:14, marginBottom:20 }}>{error}</div>}
              <div style={{ marginBottom:14 }}>
                <label>What does your company do?</label>
                <textarea {...inp} rows={4} placeholder="We are a software development company specialising in…" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} style={{ resize:'vertical' }} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label>Bot name</label>
                <input {...inp} placeholder="e.g. Aria, Max, Alex" value={form.botName} onChange={e=>setForm(p=>({...p,botName:e.target.value}))} />
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
              <p style={{ textAlign:'center', marginTop:16, fontSize:13, color:'#6B6B6B' }}>
                <Link href="/dashboard" style={{ color:'#2563EB', textDecoration:'none' }}>Skip for now →</Link>
              </p>
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
                    style={{ padding:16, border:`1.5px solid ${provider===p.id?'#2563EB':'#E2E8F0'}`, borderRadius:12, cursor:'pointer', background:provider===p.id?'#EFF6FF':'#fff', transition:'all 0.15s' }}>
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
                <Link href="/dashboard" style={{ color:'#2563EB', textDecoration:'none' }}>Skip for now →</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
