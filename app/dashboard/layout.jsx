'use client'
import { useEffect }   from 'react'
import { useRouter }   from 'next/navigation'
import { useAuth }     from '@/lib/auth-context'
import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import dynamic         from 'next/dynamic'

const KaaliWidget = dynamic(() => import('@/components/KaaliWidget'), { ssr: false })

const NAV = [
  { href:'/dashboard',               icon:'📊', label:'Overview'      },
  { href:'/dashboard/leads',         icon:'👥', label:'Leads'         },
  { href:'/dashboard/conversations', icon:'💬', label:'Conversations' },
  { href:'/dashboard/knowledge',     icon:'📚', label:'Knowledge Base'},
  { href:'/dashboard/api-usage',     icon:'🔑', label:'API & Usage'   },
  { href:'/dashboard/embed',         icon:'🔧', label:'Embed Code'    },
  { href:'/dashboard/settings',      icon:'⚙️', label:'Settings'      },
]

export default function DashboardLayout({ children }) {
  const { user, loading, logout } = useAuth()
  const router  = useRouter()
  const path    = usePathname()

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login')
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--tm)', fontSize:13 }}>
        Loading…
      </div>
    )
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <aside style={{ width:224, background:'#060A14', borderRight:'0.5px solid rgba(255,255,255,.07)', display:'flex', flexDirection:'column', flexShrink:0, position:'sticky', top:0, height:'100vh', overflowY:'auto' }}>
        <div style={{ padding:'18px 16px 14px', borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>
          <div style={{ fontFamily:'var(--font-brand)', fontSize:14, color:'var(--tx)', letterSpacing:'-.3px' }}>
            Kaali <span style={{ color:'var(--ac)' }}>Admin</span>
          </div>
          <div style={{ fontSize:11, color:'var(--tm)', marginTop:2 }}>{user.company}</div>
          <div style={{ display:'inline-block', fontSize:10, fontWeight:500, color:'var(--ac)', background:'rgba(79,142,247,.12)', border:'0.5px solid rgba(79,142,247,.25)', padding:'2px 8px', borderRadius:10, marginTop:5 }}>
            {(user.plan||'starter').charAt(0).toUpperCase()+(user.plan||'starter').slice(1)}
          </div>
        </div>

        <nav style={{ padding:'10px 8px', flex:1 }}>
          <div style={{ fontSize:10, fontWeight:500, letterSpacing:'1.4px', textTransform:'uppercase', color:'var(--td)', padding:'4px 10px 6px', marginTop:8 }}>Overview</div>
          {NAV.slice(0,3).map(n => <NavItem key={n.href} {...n} active={path===n.href} />)}
          <div style={{ fontSize:10, fontWeight:500, letterSpacing:'1.4px', textTransform:'uppercase', color:'var(--td)', padding:'4px 10px 6px', marginTop:8 }}>Configuration</div>
          {NAV.slice(3).map(n => <NavItem key={n.href} {...n} active={path===n.href} />)}
        </nav>

        <div style={{ padding:'10px 8px', borderTop:'0.5px solid rgba(255,255,255,.07)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(145deg,#1D4FD8,#4F8EF7)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-brand)', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>
              {(user.name||'?').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:12.5, color:'var(--tx)' }}>{user.name}</div>
              <div style={{ fontSize:11, color:'var(--td)' }}>{user.email}</div>
            </div>
          </div>
          <button onClick={logout} style={{ width:'100%', fontSize:12, color:'var(--tm)', background:'none', border:'none', padding:'8px 10px', borderRadius:7, cursor:'pointer', textAlign:'left', marginTop:2 }}>
            Sign out
          </button>
        </div>
      </aside>

      <div style={{ flex:1, overflowY:'auto' }}>
        {children}
      </div>

      <KaaliWidget />
    </div>
  )
}

function NavItem({ href, icon, label, active }) {
  return (
    <Link href={href} style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:8, fontSize:13, color: active ? 'var(--tx)' : 'var(--tm)', background: active ? 'rgba(79,142,247,.12)' : 'none', marginBottom:1, transition:'background .15s, color .15s', textDecoration:'none' }}>
      <span style={{ width:16, textAlign:'center', fontSize:13, flexShrink:0 }}>{icon}</span>
      <span>{label}</span>
    </Link>
  )
}
