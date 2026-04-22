'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV = [
  { href:'/superadmin/dashboard',      icon:'📊', label:'Overview'      },
  { href:'/superadmin/tenants',        icon:'🏢', label:'Tenants'       },
  { href:'/superadmin/team',           icon:'👤', label:'Team'          },
  { href:'/superadmin/settings',       icon:'⚙️', label:'Settings'      },
]

export default function SuperAdminLayout({ children }) {
  const [admin,   setAdmin]   = useState(null)
  const [loading, setLoading] = useState(true)
  const router  = useRouter()
  const path    = usePathname()

  useEffect(() => {
    if (path === '/superadmin/login') { setLoading(false); return }
    const token = localStorage.getItem('sa_token')
    const adm   = localStorage.getItem('sa_admin')
    if (!token || !adm) { router.replace('/superadmin/login'); return }
    try { setAdmin(JSON.parse(adm)) } catch {}
    setLoading(false)
  }, [path])

  if (path === '/superadmin/login') return <>{children}</>

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#05080F', color:'#6E7E9E', fontSize:13 }}>
      Loading…
    </div>
  )

  function logout() {
    localStorage.removeItem('sa_token')
    localStorage.removeItem('sa_admin')
    router.push('/superadmin/login')
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#05080F' }}>
      {/* Sidebar */}
      <aside style={{ width:220, background:'#060A14', borderRight:'0.5px solid rgba(248,113,113,.15)', display:'flex', flexDirection:'column', flexShrink:0, position:'sticky', top:0, height:'100vh' }}>
        <div style={{ padding:'18px 16px 14px', borderBottom:'0.5px solid rgba(248,113,113,.15)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:4 }}>
            <div style={{ width:30, height:30, background:'linear-gradient(145deg,#991B1B,#F87171)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>🔐</div>
            <div>
              <div style={{ fontFamily:'system-ui', fontSize:13, fontWeight:700, color:'#E5EBF8' }}>Absolute AIChat</div>
              <div style={{ fontSize:10, color:'#F87171' }}>Absolute App Labs</div>
            </div>
          </div>
          {admin && <div style={{ fontSize:11, color:'#6E7E9E', marginTop:6, padding:'3px 8px', background:'rgba(248,113,113,.08)', border:'0.5px solid rgba(248,113,113,.2)', borderRadius:6, display:'inline-block' }}>{admin.role}</div>}
        </div>

        <nav style={{ padding:'10px 8px', flex:1 }}>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:8, fontSize:13, color: path===n.href ? '#E5EBF8' : '#6E7E9E', background: path===n.href ? 'rgba(248,113,113,.12)' : 'none', marginBottom:1, transition:'all .15s', textDecoration:'none' }}>
              <span style={{ width:16, textAlign:'center', fontSize:13 }}>{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>

        <div style={{ padding:'10px 8px', borderTop:'0.5px solid rgba(248,113,113,.1)' }}>
          {admin && (
            <div style={{ padding:'8px 10px', marginBottom:4 }}>
              <div style={{ fontSize:12.5, color:'#E5EBF8' }}>{admin.name}</div>
              <div style={{ fontSize:11, color:'#3A4A6A' }}>{admin.email}</div>
            </div>
          )}
          <button onClick={logout} style={{ width:'100%', fontSize:12, color:'#F87171', background:'none', border:'none', padding:'8px 10px', borderRadius:7, cursor:'pointer', textAlign:'left' }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex:1, overflowY:'auto' }}>{children}</div>
    </div>
  )
}
