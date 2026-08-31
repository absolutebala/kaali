'use client'
import { useState }    from 'react'
import { useRouter }   from 'next/navigation'
import { useAuth }     from '@/lib/auth-context'
import { signInWithGoogle, signInWithLinkedIn } from '@/lib/social-auth'
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
        .auth-input:focus { border-color:#2563EB; }
        .auth-btn { width:100%; padding:13px; background:#FF5C00; color:#fff; border:none; border-radius:8px; font-size:15px; font-weight:600; font-family:Poppins,sans-serif; cursor:pointer; transition:all 0.2s; }
        .auth-btn:hover { background:#1D4ED8; }
        .auth-btn:disabled { opacity:0.6; cursor:not-allowed; }
      `}</style>

      {/* Left — brand panel */}
      <div style={{ width:'44%', background:'linear-gradient(145deg, #1E40AF 0%, #2563EB 50%, #0891B2 100%)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 56px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-80, right:-80, width:300, height:300, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
        <div style={{ position:'absolute', bottom:-60, left:-60, width:240, height:240, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
        <div style={{ position:'relative' }}>
          <div style={{ fontSize:22, fontWeight:700, color:'#fff', marginBottom:48 }}>
            NivoChat
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
              {/* Social login */}
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
                {[
                  { label:'Continue with Google',    icon: <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>, fn: signInWithGoogle },
                  { label:'Continue with LinkedIn',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>, fn: signInWithLinkedIn },
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
                <span style={{ fontSize:12, color:'#94A3B8', fontWeight:500 }}>or continue with email</span>
                <div style={{ flex:1, height:1, background:'#E2E8F0' }} />
              </div>

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
            <Link href="/auth/register" style={{ color:'#2563EB', fontWeight:600, textDecoration:'none' }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
