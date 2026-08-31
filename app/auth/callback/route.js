import { NextResponse } from 'next/server'

// Supabase sends tokens as hash fragments (#access_token=...)
// which can't be read server-side — redirect to client-side handler
export async function GET(request) {
  const { origin, searchParams } = new URL(request.url)
  const error = searchParams.get('error')
  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(searchParams.get('error_description') || error)}`)
  }
  // Redirect to client page that reads hash fragment
  return NextResponse.redirect(`${origin}/auth/social-success${request.url.includes('#') ? '' : ''}`)
}
