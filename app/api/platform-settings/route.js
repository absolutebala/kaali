import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function OPTIONS() { return new NextResponse(null, { status: 204 }) }

export async function GET() {
  const { data } = await supabaseAdmin.from('platform_settings').select('logo_url').eq('id', 'singleton').single()
  return NextResponse.json({ logoUrl: data?.logo_url || '' })
}
