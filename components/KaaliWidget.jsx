'use client'
/**
 * KaaliWidget — renders the floating chat bubble + panel on the dashboard
 * so tenants can test their bot without leaving the admin panel.
 *
 * Import and render once inside the dashboard layout:
 *   import KaaliWidget from '@/components/KaaliWidget'
 *   // ... in your layout JSX:
 *   <KaaliWidget />
 */
import { useEffect, useRef } from 'react'
import { useAuth }           from '@/lib/auth-context'

export default function KaaliWidget() {
  const { user }   = useAuth()
  const injectedRef = useRef(false)
  const appUrl      = process.env.NEXT_PUBLIC_APP_URL || ''

  useEffect(() => {
    if (!user?.id || injectedRef.current) return
    injectedRef.current = true

    // Remove any previous widget instance
    document.getElementById('kaali-bubble')?.remove()
    document.getElementById('kaali-panel')?.remove()
    document.getElementById('kaali-styles')?.remove()
    window.__kaali_started = false

    // Inject widget script with tenant's own ID
    const script    = document.createElement('script')
    script.src      = `${appUrl}/widget.js?id=${user.id}`
    script.async    = true
    script.id       = 'kaali-widget-script'
    document.body.appendChild(script)

    return () => {
      // Cleanup on unmount
      script.remove()
      document.getElementById('kaali-bubble')?.remove()
      document.getElementById('kaali-panel')?.remove()
      document.getElementById('kaali-styles')?.remove()
    }
  }, [user?.id])

  // Nothing to render — widget injects its own DOM
  return null
}
