'use client'
import { useState }    from 'react'
import { useRouter }   from 'next/navigation'
import { useAuth }     from '@/lib/auth-context'
import Link            from 'next/link'

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth()
  const router                                 = useRouter()
  const [form,    setForm]    = useState({ email: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  // Auto-redirect if already logged in
  if (!authLoading && user) {
    router.replace('/dashboard')
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(form)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:"'Poppins', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        .auth-input { width:100%; padding:12px 16px; border:1.5px solid #E8E4DF; border-radius:8px; font-size:14px; font-family:Poppins,sans-serif; outline:none; transition:border-color 0.2s; color:#1A1A1A; background:#fff; }
        .auth-input:focus { border-color:#FF5C00; }
        .auth-btn { width:100%; padding:13px; background:#FF5C00; color:#fff; border:none; border-radius:8px; font-size:15px; font-weight:600; font-family:Poppins,sans-serif; cursor:pointer; transition:all 0.2s; }
        .auth-btn:hover { background:#E64D00; }
        .auth-btn:disabled { opacity:0.6; cursor:not-allowed; }
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
            Your AI-powered chat assistant is waiting
          </h2>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.8)', lineHeight:1.7, marginBottom:48 }}>
            Sign in to manage your bot, view leads, and respond to visitors in real time.
          </p>
          {[
            '📚 Knowledge base trained on your content',
            '👥 Automatic lead capture 24/7',
            '🔴 Live agent handoff',
          ].map(f => (
            <div key={f} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14, fontSize:14, color:'rgba(255,255,255,0.9)' }}>
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#FAFAF8', padding:32 }}>
        <div style={{ width:'100%', maxWidth:420 }}>
          <h1 style={{ fontSize:28, fontWeight:800, color:'#1A1A1A', marginBottom:6, letterSpacing:'-0.02em' }}>Welcome back</h1>
          <p style={{ fontSize:15, color:'#6B6B6B', marginBottom:32 }}>Sign in to your workspace</p>

          {error && (
            <div style={{ background:'#FFF0EE', border:'1px solid rgba(255,92,0,0.2)', color:'#CC3D00', padding:'12px 16px', borderRadius:8, fontSize:14, marginBottom:20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:'#1A1A1A', marginBottom:6, display:'block' }}>Email address</label>
              <input className="auth-input" type="email" placeholder="you@company.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:'#1A1A1A', marginBottom:6, display:'block' }}>Password</label>
              <input className="auth-input" type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
            </div>
            <button type="submit" className="auth-btn" disabled={loading} style={{ marginTop:8 }}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <p style={{ textAlign:'center', marginTop:24, fontSize:14, color:'#6B6B6B' }}>
            Don't have an account?{' '}
            <Link href="/auth/register" style={{ color:'#FF5C00', fontWeight:600, textDecoration:'none' }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
