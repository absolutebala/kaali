import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnon) {
  throw new Error('Missing Supabase environment variables. Check .env.local')
}

// ── CLIENT-SIDE Supabase (anon key — limited access, safe to expose) ──
export const supabase = createClient(supabaseUrl, supabaseAnon)

// ── SERVER-SIDE Supabase (service role — full access, API routes only) ──
// This bypasses Row Level Security. Use ONLY in server-side code (API routes).
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession:   false,
  },
})
