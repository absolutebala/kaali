import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from('platform_settings')
      .select('logo_url')
      .eq('id', 'singleton')
      .single()
    return NextResponse.json({ logoUrl: data?.logo_url || null })
  } catch {
    return NextResponse.json({ logoUrl: null })
  }
}
