'use client'
import { useState }    from 'react'
import { useRouter }   from 'next/navigation'
import { useAuth }     from '@/lib/auth-context'
import Link            from 'next/link'

export default function LoginPage() {
  const { login }             = useAuth()
  const router                = useRouter()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

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
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24,
      background:'radial-gradient(ellipse 60% 60% at 50% 0%, rgba(79,142,247,.09) 0%, transparent 70%)' }}>
      <div style={{ width:'100%', maxWidth:420, background:'var(--s1)', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:20, padding:36 }}>
        <Link href="/" style={{ fontFamily:'var(--font-brand)', fontSize:17, color:'var(--tx)', marginBottom:26, display:'flex', alignItems:'center', gap:7 }}>
          <div style={{ width:7, height:7, background:'var(--ac)', borderRadius:'50%' }} />
          Kaali
        </Link>
        <h1 style={{ fontFamily:'var(--font-brand)', fontSize:21, fontWeight:700, color:'var(--tx)', marginBottom:5 }}>Welcome back</h1>
        <p style={{ fontSize:13, color:'var(--tm)', marginBottom:26, lineHeight:1.6 }}>Sign in to your Kaali workspace.</p>

        {error && (
          <div style={{ background:'rgba(248,113,113,.1)', border:'0.5px solid rgba(248,113,113,.3)', color:'var(--rd)', padding:'10px 13px', borderRadius:9, fontSize:13, marginBottom:16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@company.com" required
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="form-row">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••" required
              value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          </div>
          <button type="submit" className="btn-pri" disabled={loading}
            style={{ width:'100%', padding:11, fontSize:13.5, borderRadius:9, justifyContent:'center', marginTop:6 }}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p style={{ fontSize:13, color:'var(--tm)', textAlign:'center', marginTop:18 }}>
          Don't have an account? <Link href="/auth/register" style={{ color:'var(--ac)' }}>Create one</Link>
        </p>
      </div>
    </div>
  )
}
