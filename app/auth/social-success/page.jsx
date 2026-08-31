'use client'
import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase'

function SocialSuccessInner() {
  const router = useRouter()

  useEffect(() => {
    async function handleOAuth() {
      try {
        // Supabase puts tokens in the URL hash — getSession reads them automatically
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session) {
          console.error('No session:', error?.message)
          router.replace('/auth/login?error=social_login_failed')
          return
        }

        const oauthUser = session.user
        const email     = oauthUser.email
        const fullName  = oauthUser.user_metadata?.full_name || oauthUser.user_metadata?.name || email.split('@')[0]
        const provider  = oauthUser.app_metadata?.provider || 'oauth'

        // Call our API to create/fetch tenant and get our JWT
        const res = await fetch('/api/auth/social-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            name: fullName,
            provider,
            accessToken: session.access_token,
            company: oauthUser.user_metadata?.hd || email.split('@')[1]?.split('.')[0] || 'My Company',
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Login failed')

        localStorage.setItem('kaali_token', data.token)
        const isNew = data.isNew
        router.replace(isNew ? '/dashboard/knowledge' : '/dashboard')
      } catch (err) {
        console.error('Social login error:', err.message)
        router.replace(`/auth/login?error=${encodeURIComponent(err.message)}`)
      }
    }

    handleOAuth()
  }, [])

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif', background:'#F8FAFC' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, border:'3px solid #2563EB', borderTopColor:'transparent', borderRadius:'50%', margin:'0 auto 16px', animation:'spin 0.8s linear infinite' }} />
        <div style={{ fontSize:15, color:'#64748B' }}>Signing you in…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}

export default function SocialSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F8FAFC' }}>
        <div style={{ fontSize:15, color:'#64748B' }}>Loading…</div>
      </div>
    }>
      <SocialSuccessInner />
    </Suspense>
  )
}
