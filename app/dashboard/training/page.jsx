'use client'
import { useEffect, useState } from 'react'
import { PageShell, fmtDate }   from '../page'
import { useRouter }             from 'next/navigation'

function api(path, opts={}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('kaali_token') : ''
  return fetch(path, { ...opts, headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}`, ...(opts.headers||{}) } }).then(r => r.json())
}

export default function TrainingPage() {
  const router = useRouter()
  const [pairs,   setPairs]   = useState([])
  const [loading, setLoading] = useState(true)
  const [form,    setForm]    = useState({ question:'', answer:'' })
  const [editId,  setEditId]  = useState(null)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('sa_impersonating')) {
      router.replace('/dashboard/knowledge'); return
    }
    load()
  }, [])

  async function load() {
    setLoading(true)
    const d = await api('/api/training')
    setPairs(d.pairs || []); setLoading(false)
  }

  async function save() {
    if (!form.question.trim() || !form.answer.trim()) return
    setSaving(true)
    try {
      if (editId) {
        await api('/api/training', { method:'PATCH', body: JSON.stringify({ id: editId, ...form }) })
        showToast('Q&A updated!')
      } else {
        await api('/api/training', { method:'POST', body: JSON.stringify(form) })
        showToast('Q&A pair added!')
      }
      setForm({ question:'', answer:'' }); setEditId(null); load()
    } catch(e) { showToast(e.message, true) }
    finally { setSaving(false) }
  }

  async function remove(id) {
    await api('/api/training?id=' + id, { method:'DELETE' })
    setPairs(p => p.filter(x => x.id !== id)); showToast('Removed.')
  }

  function startEdit(pair) {
    setEditId(pair.id); setForm({ question: pair.question, answer: pair.answer })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <PageShell title="Training" action={
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 12px', background:'rgba(34,209,122,.1)', border:'0.5px solid rgba(34,209,122,.25)', borderRadius:8 }}>
        <span style={{ fontSize:12, color:'#5EDFAC' }}>🧠 {pairs.length} Q&A pair{pairs.length !== 1 ? 's' : ''} trained</span>
      </div>
    }>
      <div style={{ padding:'12px 16px', background:'rgba(79,142,247,.08)', border:'0.5px solid rgba(79,142,247,.2)', borderRadius:10, marginBottom:16, fontSize:13, color:'var(--tm)', lineHeight:1.6 }}>
        💡 Add question & answer pairs to train your bot. When a visitor asks something similar, the bot will use your exact answer. Great for FAQs, pricing, processes, and anything the bot keeps getting wrong.
      </div>

      <div className="kb-card">
        <div className="kb-header">
          <span className="kb-title">{editId ? '✏️ Edit Q&A Pair' : '+ Add Q&A Pair'}</span>
          {editId && <button className="btn-ghost btn-sm" onClick={() => { setEditId(null); setForm({ question:'', answer:'' }) }}>Cancel</button>}
        </div>
        <div className="card-body">
          <div className="form-row">
            <label className="form-label">Question — what the visitor might ask</label>
            <input className="form-input" value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} placeholder="e.g. How long does a typical project take?" />
          </div>
          <div className="form-row" style={{ marginBottom:16 }}>
            <label className="form-label">Answer — what the bot should respond with</label>
            <textarea className="form-input" rows={4} value={form.answer} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))}
              placeholder="e.g. Most projects take 4–8 weeks depending on complexity…" style={{ resize:'vertical' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button className="btn-pri" onClick={save} disabled={saving || !form.question.trim() || !form.answer.trim()}>
              {saving ? 'Saving…' : editId ? 'Update Pair' : '+ Add Q&A Pair'}
            </button>
          </div>
        </div>
      </div>

      <div className="kb-card">
        <div className="kb-header"><span className="kb-title">Trained Pairs ({pairs.length})</span></div>
        {loading ? (
          <div style={{ padding:32, textAlign:'center', color:'var(--tm)', fontSize:13 }}>Loading…</div>
        ) : pairs.length ? pairs.map((p, i) => (
          <div key={p.id} style={{ padding:'14px 18px', borderBottom: i < pairs.length-1 ? '0.5px solid rgba(255,255,255,.05)' : 'none' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:11, fontWeight:500, padding:'2px 8px', borderRadius:6, background:'rgba(79,142,247,.12)', color:'#7EB3FF' }}>Q</span>
                  <span style={{ fontSize:13, fontWeight:500, color:'var(--tx)' }}>{p.question}</span>
                </div>
                <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                  <span style={{ fontSize:11, fontWeight:500, padding:'2px 8px', borderRadius:6, background:'rgba(34,209,122,.1)', color:'#5EDFAC', flexShrink:0, marginTop:1 }}>A</span>
                  <span style={{ fontSize:13, color:'var(--tm)', lineHeight:1.6 }}>{p.answer}</span>
                </div>
              </div>
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                <button className="btn-ghost btn-sm" onClick={() => startEdit(p)}>Edit</button>
                <button className="btn-sec btn-sm btn-danger" onClick={() => remove(p.id)}>Remove</button>
              </div>
            </div>
            <div style={{ fontSize:11, color:'var(--td)', marginTop:8 }}>Added {fmtDate(p.created_at)}</div>
          </div>
        )) : (
          <div className="empty-state"><div className="empty-ico">🧠</div>No training pairs yet — add your first Q&A above</div>
        )}
      </div>
    </PageShell>
  )
}

function showToast(msg, isErr=false) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg
  if (isErr) t.style.color = 'var(--rd)'
  document.body.appendChild(t); setTimeout(() => t.remove(), 2400)
}
