import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth }   from '@/lib/auth'

export async function OPTIONS() { return new NextResponse(null, { status: 204 }) }

export async function GET(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error
  const { data } = await supabaseAdmin
    .from('training_pairs')
    .select('id, question, answer, created_at')
    .eq('tenant_id', tenant.tenantId)
    .order('created_at', { ascending: false })
  return NextResponse.json({ pairs: data || [] })
}

export async function POST(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error
  const { question, answer } = await request.json()
  if (!question?.trim() || !answer?.trim())
    return NextResponse.json({ error: 'Question and answer are required.' }, { status: 400 })
  const { data } = await supabaseAdmin
    .from('training_pairs')
    .insert({ tenant_id: tenant.tenantId, question: question.trim(), answer: answer.trim() })
    .select('id, question, answer, created_at')
    .single()
  return NextResponse.json({ pair: data })
}

export async function PATCH(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error
  const { id, question, answer } = await request.json()
  const { data } = await supabaseAdmin
    .from('training_pairs')
    .update({ question: question.trim(), answer: answer.trim() })
    .eq('id', id)
    .eq('tenant_id', tenant.tenantId)
    .select('id, question, answer, created_at')
    .single()
  return NextResponse.json({ pair: data })
}

export async function DELETE(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  await supabaseAdmin.from('training_pairs').delete().eq('id', id).eq('tenant_id', tenant.tenantId)
  return NextResponse.json({ success: true })
}
