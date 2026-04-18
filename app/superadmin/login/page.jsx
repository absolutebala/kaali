'use client'
import { useState }  from 'react'
import { useRouter } from 'next/navigation'

export default function SuperAdminLogin() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function login(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res  = await fetch('/api/superadmin/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email, password }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      localStorage.setItem('sa_token', data.token)
      localStorage.setItem('sa_admin', JSON.stringify(data.admin))
      router.push('/superadmin/dashboard')
    } catch(err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const inp = { width:'100%', background:'#111A2E', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:9, padding:'10px 13px', fontSize:13, color:'#E5EBF8', outline:'none' }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#05080F', backgroundImage:'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(248,113,113,.08) 0%, transparent 70%)' }}>
      <div style={{ width:'100%', maxWidth:400, background:'#0C1220', border:'0.5px solid rgba(248,113,113,.2)', borderRadius:20, padding:36 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28 }}>
          <div style={{ width:36, height:36, background:'linear-gradient(145deg,#991B1B,#F87171)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🔐</div>
          <div>
            <div style={{ fontFamily:'system-ui', fontSize:15, fontWeight:700, color:'#E5EBF8' }}>Absolute AIChat Admin</div>
            <div style={{ fontSize:11, color:'#6E7E9E' }}>Restricted access — Absolute App Labs</div>
          </div>
        </div>
        {error && <div style={{ background:'rgba(248,113,113,.1)', border:'0.5px solid rgba(248,113,113,.3)', color:'#F87171', padding:'10px 13px', borderRadius:9, fontSize:13, marginBottom:16 }}>{error}</div>}
        <form onSubmit={login}>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:'#6E7E9E', display:'block', marginBottom:5 }}>Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required style={inp} placeholder="admin@absoluteapplabs.com" />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, color:'#6E7E9E', display:'block', marginBottom:5 }}>Password</label>
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required style={inp} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} style={{ width:'100%', padding:11, background:'linear-gradient(135deg,#991B1B,#DC2626)', border:'none', borderRadius:9, color:'#fff', fontSize:13.5, fontWeight:500, cursor:'pointer' }}>
            {loading ? 'Signing in…' : 'Sign In to Super Admin →'}
          </button>
        </form>
        <p style={{ fontSize:11, color:'#3A4A6A', textAlign:'center', marginTop:20 }}>This page is for Absolute App Labs administrators only.</p>
      </div>
    </div>
  )
}
