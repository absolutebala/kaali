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

export async function signInWithMicrosoft() {
  return supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: { redirectTo: REDIRECT_URL, scopes: 'email profile' },
  })
}

export async function signInWithLinkedIn() {
  return supabase.auth.signInWithOAuth({
    provider: 'linkedin_oidc',
    options: { redirectTo: REDIRECT_URL, scopes: 'openid profile email' },
  })
}
