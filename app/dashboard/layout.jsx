'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

const NAV_FULL = [
  { href:'/dashboard',               icon:'📊', label:'Overview'      },
  { href:'/dashboard/leads',         icon:'👥', label:'Leads'         },
  { href:'/dashboard/conversations', icon:'💬', label:'Chats'         },
  { href:'/dashboard/knowledge',     icon:'📚', label:'Knowledge Base'},
  { href:'/dashboard/training',      icon:'🧠', label:'Training'      },
  { href:'/dashboard/api-usage',     icon:'🔑', label:'API & Usage'   },
  { href:'/dashboard/embed',         icon:'🔧', label:'Embed Code'    },
  { href:'/dashboard/settings',      icon:'⚙️', label:'Settings'      },
  { href:'/dashboard/team',          icon:'👤', label:'Team'          },
]

const NAV_RESTRICTED = [
  { href:'/dashboard/knowledge', icon:'📚', label:'Knowledge Base'},
  { href:'/dashboard/embed',     icon:'🔧', label:'Embed Code'    },
  { href:'/dashboard/settings',  icon:'⚙️', label:'Settings'      },
]

export default function DashboardLayout({ children }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const path   = usePathname()
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login')
    if (typeof window !== 'undefined') {
      setIsImpersonating(!!localStorage.getItem('sa_impersonating'))
      fetch('/api/platform-settings').then(r=>r.json()).then(d=>{ if(d.logoUrl) setLogoUrl(d.logoUrl) }).catch(()=>{})
    }
  }, [loading, user, router])

  useEffect(() => {
    if (!user?.id) return
    const existing = document.getElementById('kaali-preview-script')
    if (existing) return
    const s = document.createElement('script')
    s.id = 'kaali-preview-script'
    s.src = `/widget.js?id=${user.id}&t=${Date.now()}`
    s.async = true
    document.body.appendChild(s)
    return () => {
      s.remove()
      document.getElementById('kaali-bubble')?.remove()
      document.getElementById('kaali-panel')?.remove()
    }
  }, [user?.id])

  if (loading || !user) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--tm)', fontSize:14 }}>
        Loading…
      </div>
    )
  }

  const allowedPages = user?.allowedPages || null
  const NAV = isImpersonating ? NAV_RESTRICTED
    : allowedPages ? NAV_FULL.filter(n => {
        const page = n.href.replace('/dashboard/', '').replace('/dashboard', 'overview')
        return allowedPages.includes(page)
      })
    : NAV_FULL

  function handleLogout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sa_token')
      localStorage.removeItem('sa_impersonating')
    }
    logout()
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <aside style={{ width:224, background:'#080C17', borderRight:'0.5px solid rgba(255,255,255,.07)', display:'flex', flexDirection:'column', flexShrink:0, position:'sticky', top:0, height:'100vh', overflowY:'auto' }}>
        <div style={{ padding:'20px 16px 16px', borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Absolute AIChat" style={{ maxWidth:'160px', maxHeight:'36px', objectFit:'contain', marginBottom:4 }} />
          ) : (
            <div style={{ fontFamily:'var(--font-brand)', fontSize:13, color:'var(--tx)', letterSpacing:'-.3px', marginBottom:4 }}>
              Absolute <span style={{ color:'var(--ac)' }}>AIChat</span>
            </div>
          )}
          <div style={{ fontSize:12, color:'var(--tm)', marginBottom:8 }}>{user.company}</div>
          <div style={{ display:'inline-block', fontSize:11, fontWeight:500, color:'var(--ac)', background:'rgba(79,142,247,.12)', border:'0.5px solid rgba(79,142,247,.25)', padding:'2px 10px', borderRadius:10 }}>
            {(user.plan||'starter').charAt(0).toUpperCase()+(user.plan||'starter').slice(1)}
          </div>
        </div>

        <nav style={{ padding:'10px 8px', flex:1 }}>
          {isImpersonating ? (
            <>
              <div style={{ fontSize:10, fontWeight:500, letterSpacing:'1.4px', textTransform:'uppercase', color:'#F87171', padding:'4px 10px 6px', marginTop:8 }}>Viewing As Client</div>
              {NAV_RESTRICTED.map(n => <NavItem key={n.href} {...n} active={path===n.href} />)}
              <div style={{ margin:'12px 4px 0', padding:'10px', background:'rgba(248,113,113,.08)', border:'0.5px solid rgba(248,113,113,.2)', borderRadius:8 }}>
                <div style={{ fontSize:11, color:'#F87171', marginBottom:4 }}>👁 Admin View</div>
                <div style={{ fontSize:11, color:'#6B7A99', lineHeight:1.5, marginBottom:6 }}>Leads and chats are hidden.</div>
                <button onClick={() => { localStorage.removeItem('kaali_token'); localStorage.removeItem('sa_token'); localStorage.removeItem('sa_impersonating'); window.location.href = '/superadmin/dashboard' }}
                  style={{ fontSize:11, color:'#F87171', background:'none', border:'none', cursor:'pointer', padding:0 }}>
                  ← Back to Admin
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize:10, fontWeight:500, letterSpacing:'1.4px', textTransform:'uppercase', color:'var(--td)', padding:'4px 10px 6px', marginTop:8 }}>Overview</div>
              {NAV.slice(0, NAV.findIndex(n=>n.href==='/dashboard/knowledge') === -1 ? 3 : NAV.findIndex(n=>n.href==='/dashboard/knowledge')).map(n => <NavItem key={n.href} {...n} active={path===n.href} />)}
              <div style={{ fontSize:10, fontWeight:500, letterSpacing:'1.4px', textTransform:'uppercase', color:'var(--td)', padding:'4px 10px 6px', marginTop:8 }}>Configuration</div>
              {NAV.slice(NAV.findIndex(n=>n.href==='/dashboard/knowledge') === -1 ? 3 : NAV.findIndex(n=>n.href==='/dashboard/knowledge')).map(n => <NavItem key={n.href} {...n} active={path===n.href} />)}
            </>
          )}
        </nav>

        <div style={{ padding:'10px 8px', borderTop:'0.5px solid rgba(255,255,255,.07)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px' }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(145deg,#1D4FD8,#4F8EF7)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-brand)', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
              {(user.name||'?').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:13, color:'var(--ts)' }}>{user.name}</div>
              <div style={{ fontSize:11, color:'var(--td)' }}>{user.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width:'100%', fontSize:12, color:'var(--tm)', background:'none', border:'none', padding:'8px 10px', borderRadius:7, cursor:'pointer', textAlign:'left', marginTop:2 }}>
            Sign out
          </button>
        </div>
      </aside>
      <div style={{ flex:1, overflowY:'auto' }}>{children}</div>
    </div>
  )
}

function NavItem({ href, icon, label, active }) {
  return (
    <Link href={href} style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 10px', borderRadius:8, fontSize:13, color: active ? 'var(--tx)' : 'var(--tm)', background: active ? 'rgba(79,142,247,.12)' : 'none', borderRight: active ? '2px solid var(--ac)' : '2px solid transparent', marginBottom:2, transition:'all .15s', textDecoration:'none' }}>
      <span style={{ width:16, textAlign:'center', fontSize:14, flexShrink:0 }}>{icon}</span>
      <span>{label}</span>
    </Link>
  )
}
