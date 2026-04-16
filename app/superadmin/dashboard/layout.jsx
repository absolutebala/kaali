'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { saToken }             from '@/lib/sa-client'
import Link                    from 'next/link'

const NAV = [
  { href:'/superadmin/dashboard',              icon:'📊', label:'Overview',       perm:'analytics' },
  { href:'/superadmin/dashboard/tenants',      icon:'🏢', label:'Tenants',        perm:'tenants' },
  { href:'/superadmin/dashboard/analytics',    icon:'📈', label:'Analytics',      perm:'analytics' },
  { href:'/superadmin/dashboard/team',         icon:'👥', label:'Team',           perm:'team' },
  { href:'/superadmin/dashboard/announcements',icon:'📣', label:'Announcements',  perm:'settings' },
  { href:'/superadmin/dashboard/settings',     icon:'⚙️', label:'Settings',       perm:'settings' },
]

export default function SADashboardLayout({ children }) {
  const router  = useRouter()
  const path    = usePathname()
  const [admin, setAdmin] = useState(null)

  useEffect(() => {
    const token = saToken.get()
    if (!token) { router.replace('/superadmin/login'); return }
    // Decode token to get admin info (basic decode, no verify — server verifies on each request)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.role !== 'superadmin') throw new Error()
      setAdmin(payload)
    } catch {
      saToken.clear()
      router.replace('/superadmin/login')
    }
  }, [])

  function logout() {
    saToken.clear()
    router.push('/superadmin/login')
  }

  if (!admin) {
    return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#030508', color:'#6E7E9E', fontSize:13 }}>Loading…</div>
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#030508' }}>
      {/* Sidebar */}
      <aside style={{ width:230, background:'#060A14', borderRight:'0.5px solid rgba(255,255,255,.07)', display:'flex', flexDirection:'column', position:'sticky', top:0, height:'100vh', flexShrink:0 }}>
        <div style={{ padding:'18px 16px 14px', borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:6 }}>
            <div style={{ width:28, height:28, background:'linear-gradient(145deg,#1D4FD8,#4F8EF7)', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-brand)', fontSize:12, fontWeight:700, color:'#fff' }}>K</div>
            <div>
              <div style={{ fontFamily:'var(--font-brand)', fontSize:13, color:'#E5EBF8' }}>Kaali</div>
              <div style={{ fontSize:10, color:'#4F8EF7' }}>Super Admin</div>
            </div>
          </div>
          {/* Impersonation warning */}
          {admin.impersonatedBy && (
            <div style={{ fontSize:10, color:'#FBBF24', background:'rgba(251,191,36,.1)', border:'0.5px solid rgba(251,191,36,.25)', padding:'4px 8px', borderRadius:6, marginTop:6 }}>
              ⚠ Impersonating tenant
            </div>
          )}
        </div>

        <nav style={{ padding:'10px 8px', flex:1 }}>
          <div style={{ fontSize:10, fontWeight:500, letterSpacing:'1.4px', textTransform:'uppercase', color:'#3A4A6A', padding:'4px 10px 6px', marginTop:6 }}>Platform</div>
          {NAV.map(n => {
            const hasPerm = admin.saRole === 'owner' || admin.permissions?.[n.perm]
            if (!hasPerm) return null
            const active = path === n.href
            return (
              <Link key={n.href} href={n.href} style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:8, fontSize:13, color: active ? '#E5EBF8' : '#6E7E9E', background: active ? 'rgba(79,142,247,.12)' : 'none', marginBottom:1, textDecoration:'none', transition:'all .15s' }}>
                <span style={{ width:16, textAlign:'center', fontSize:13 }}>{n.icon}</span>
                <span>{n.label}</span>
              </Link>
            )
          })}
          <div style={{ fontSize:10, fontWeight:500, letterSpacing:'1.4px', textTransform:'uppercase', color:'#3A4A6A', padding:'4px 10px 6px', marginTop:12 }}>Account</div>
          <Link href="/dashboard" style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:8, fontSize:13, color:'#6E7E9E', textDecoration:'none', transition:'all .15s' }}>
            <span style={{ width:16, textAlign:'center' }}>↗</span>
            <span>Tenant Dashboard</span>
          </Link>
        </nav>

        <div style={{ padding:'10px 8px', borderTop:'0.5px solid rgba(255,255,255,.07)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(145deg,#1D4FD8,#4F8EF7)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-brand)', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>
              {(admin.name||'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:12, color:'#E5EBF8' }}>{admin.name}</div>
              <div style={{ fontSize:10, color:'#3A4A6A', textTransform:'capitalize' }}>{admin.saRole}</div>
            </div>
          </div>
          <button onClick={logout} style={{ width:'100%', fontSize:12, color:'#6E7E9E', background:'none', border:'none', padding:'7px 10px', borderRadius:7, cursor:'pointer', textAlign:'left' }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {children}
      </div>
    </div>
  )
}
