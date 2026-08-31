import { supabase } from './supabase'

const REDIRECT_URL = typeof window !== 'undefined'
  ? `${window.location.origin}/auth/callback`
  : 'https://nivochat.idataone.com/auth/callback'

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: REDIRECT_URL, scopes: 'email profile' },
  })
}

  return supabase.auth.signInWithOAuth({
    options: { redirectTo: REDIRECT_URL, scopes: 'email profile' },
  })
}

export async function signInWithLinkedIn() {
  return supabase.auth.signInWithOAuth({
    provider: 'linkedin_oidc',
    options: { redirectTo: REDIRECT_URL, scopes: 'openid profile email' },
  })
}
