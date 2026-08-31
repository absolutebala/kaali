import { supabase } from './supabase'

const REDIRECT_URL = typeof window !== 'undefined'
  ? `${window.location.origin}/auth/social-success`
  : 'https://nivochat.idataone.com/auth/social-success'

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: REDIRECT_URL, scopes: 'email profile' },
  })
}

export async function signInWithLinkedIn() {
  return supabase.auth.signInWithOAuth({
    provider: 'linkedin_oidc',
    options: { redirectTo: REDIRECT_URL, scopes: 'openid profile email' },
  })
}
