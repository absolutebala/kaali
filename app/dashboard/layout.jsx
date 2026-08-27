'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

const NAV_FULL = [
  { href:'/dashboard',               icon:'📊', label:'Overview'      },
  { href:'/dashboard/leads',         icon:'👥', label:'Leads'         },
  { href:'/dashboard/conversations', icon:'💬', label:'Chats'         },
  { href:'/dashboard/live',          icon:'🔴', label:'Live'          },
  { href:'/dashboard/analytics',     icon:'📈', label:'Analytics'     },
  { href:'/dashboard/knowledge',     icon:'📚', label:'Knowledge Base'},
  { href:'/dashboard/training',      icon:'🧠', label:'Training'      },
  { href:'/dashboard/api-usage',     icon:'🔑', label:'API & Usage'   },
  { href:'/dashboard/embed',         icon:'🔧', label:'Embed Code'    },
  { href:'/dashboard/settings',      icon:'⚙️',  label:'Settings'      },
  { href:'/dashboard/team',          icon:'👤', label:'Team'          },
]

const NAV_RESTRICTED = [
  { href:'/dashboard/knowledge', icon:'📚', label:'Knowledge Base'},
  { href:'/dashboard/embed',     icon:'🔧', label:'Embed Code'    },
  { href:'/dashboard/settings',  icon:'⚙️',  label:'Settings'      },
]

// ── Sidebar colours ───────────────────────────────────────
const SB_BG       = '#1F1B4B'   // indigo
const SB_BORDER   = 'rgba(255,255,255,.09)'
const SB_LABEL    = 'rgba(255,255,255,.32)'
const SB_TEXT     = 'rgba(255,255,255,.58)'
const SB_ACTIVE   = 'rgba(255,255,255,.12)'
const SB_ACTIVE_C = '#FF8C42'   // orange

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
    s.id  = 'kaali-preview-script'
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
    return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--tm)', fontSize:14 }}>Loading…</div>
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

  const kbIdx  = NAV.findIndex(n => n.href === '/dashboard/knowledge')
  const splitAt = kbIdx === -1 ? 5 : kbIdx

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>

      {/* ── Sidebar ── */}
      <aside style={{ width:224, background: SB_BG, borderRight:'none', display:'flex', flexDirection:'column', flexShrink:0, position:'sticky', top:0, height:'100vh', overflowY:'auto' }}>

        {/* Brand / logo */}
        <div style={{ padding:'20px 16px 16px', borderBottom:`1px solid ${SB_BORDER}` }}>
          {logoUrl ? (
            <img src={logoUrl} alt="NivoChat" style={{ maxWidth:'140px', maxHeight:'32px', objectFit:'contain', marginBottom:6 }} />
          ) : (
            <div style={{ fontSize:16, fontWeight:700, color:'#fff', letterSpacing:'-.4px', marginBottom:4 }}>
              Nivo<span style={{ color:'#FF8C42' }}>Chat</span>
            </div>
          )}
          <div style={{ fontSize:12, color: SB_LABEL, marginBottom:8 }}>{user.company}</div>
          <div style={{ display:'inline-block', fontSize:11, fontWeight:500,
            color:'#FF8C42', background:'rgba(255,140,66,.18)', border:'0.5px solid rgba(255,140,66,.35)',
            padding:'2px 10px', borderRadius:10 }}>
            {(user.plan||'starter').charAt(0).toUpperCase()+(user.plan||'starter').slice(1)}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding:'10px 8px', flex:1 }}>
          {isImpersonating ? (
            <>
              <div style={{ fontSize:10, fontWeight:600, letterSpacing:'1.2px', textTransform:'uppercase', color:'#F87171', padding:'4px 10px 6px', marginTop:8 }}>Viewing As Client</div>
              {NAV_RESTRICTED.map(n => <NavItem key={n.href} {...n} active={path===n.href} />)}
              <div style={{ margin:'12px 4px 0', padding:'10px', background:'rgba(248,113,113,.08)', border:'0.5px solid rgba(248,113,113,.2)', borderRadius:8 }}>
                <div style={{ fontSize:11, color:'#F87171', marginBottom:4 }}>👁 Admin View</div>
                <div style={{ fontSize:11, color: SB_LABEL, lineHeight:1.5, marginBottom:6 }}>Leads and chats are hidden.</div>
                <button onClick={() => { localStorage.removeItem('kaali_token'); localStorage.removeItem('sa_token'); localStorage.removeItem('sa_impersonating'); window.location.href = '/superadmin/dashboard' }}
                  style={{ fontSize:11, color:'#F87171', background:'none', border:'none', cursor:'pointer', padding:0 }}>← Back to Admin</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize:10, fontWeight:600, letterSpacing:'1.2px', textTransform:'uppercase', color: SB_LABEL, padding:'4px 10px 6px', marginTop:8 }}>Overview</div>
              {NAV.slice(0, splitAt).map(n => <NavItem key={n.href} {...n} active={path===n.href} />)}
              <div style={{ fontSize:10, fontWeight:600, letterSpacing:'1.2px', textTransform:'uppercase', color: SB_LABEL, padding:'4px 10px 6px', marginTop:12 }}>Configuration</div>
              {NAV.slice(splitAt).map(n => <NavItem key={n.href} {...n} active={path===n.href} />)}
            </>
          )}
        </nav>

        {/* User footer */}
        <div style={{ padding:'10px 8px', borderTop:`1px solid ${SB_BORDER}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px' }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(145deg,#534AB7,#7F77DD)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
              {(user.name||'?').charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.88)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize:11, color: SB_LABEL, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.email}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            style={{ width:'100%', fontSize:12, color: SB_LABEL, background:'none', border:'none', padding:'6px 10px', borderRadius:7, cursor:'pointer', textAlign:'left' }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div style={{ flex:1, overflowY:'auto', background:'var(--bg)' }}>{children}</div>
    </div>
  )
}

function NavItem({ href, icon, label, active }) {
  return (
    <Link href={href} style={{
      display:'flex', alignItems:'center', gap:9,
      padding:'8px 10px', borderRadius:8, fontSize:13,
      color:      active ? SB_ACTIVE_C : SB_TEXT,
      background: active ? SB_ACTIVE   : 'none',
      borderLeft: active ? `2px solid ${SB_ACTIVE_C}` : '2px solid transparent',
      marginBottom:2, transition:'all .15s', textDecoration:'none',
    }}>
      <span style={{ width:18, textAlign:'center', fontSize:15, flexShrink:0 }}>{icon}</span>
      <span style={{ fontWeight: active ? 600 : 400 }}>{label}</span>
    </Link>
  )
}
