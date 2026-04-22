'use client'
import { useEffect, useState } from 'react'
import { tenant as tenantApi, services as svcApi, documents as docApi } from '@/lib/api-client'
import { PageShell, fmtDate }  from '../page'

export default function KnowledgePage() {
  const [desc,     setDesc]    = useState('')
  const [vbtns,    setVbtns]   = useState({ b1:'', b2:'', b3:'', b4:'' })
  const [savingVB, setSavingVB]= useState(false)
  const [svcs,     setSvcs]    = useState([])
  const [docs,     setDocs]    = useState([])
  const [saving,   setSaving]  = useState(false)
  const [uploading,setUpl]     = useState(false)
  const [modal,    setModal]   = useState(null)  // null | 'add' | {id,name,description}

  useEffect(() => {
    tenantApi.get().then(r => {
      setDesc(r.tenant.description || '')
      setVbtns({
        b1: r.tenant.visitor_btn_1 || '',
        b2: r.tenant.visitor_btn_2 || '',
        b3: r.tenant.visitor_btn_3 || '',
        b4: r.tenant.visitor_btn_4 || '',
      })
    })
    svcApi.list().then(r  => setSvcs(r.services || []))
    docApi.list().then(r  => setDocs(r.documents || []))
  }, [])

  async function saveDesc() {
    setSaving(true)
    try { await tenantApi.update({ description: desc }); showToast('Description saved!') }
    catch(e) { showToast(e.message, true) }
    finally { setSaving(false) }
  }

  async function saveSvc(data) {
    if (data.id) {
      const r = await svcApi.update(data)
      setSvcs(p => p.map(s => s.id === data.id ? r.service : s))
    } else {
      const r = await svcApi.add(data)
      setSvcs(p => [...p, r.service])
    }
    setModal(null); showToast(data.id ? 'Service updated!' : 'Service added!')
  }

  async function delSvc(id) {
    if (!confirm('Delete this service?')) return
    await svcApi.remove(id)
    setSvcs(p => p.filter(s => s.id !== id))
  }

  async function uploadDoc(e) {
    const file = e.target.files?.[0]; if (!file) return
    setUpl(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const r  = await docApi.upload(fd)
      setDocs(p => [...p, r.document])
      showToast('Document uploaded and indexed!')
    } catch(err) { showToast(err.message, true) }
    finally { setUpl(false); e.target.value = '' }
  }

  async function delDoc(id) {
    if (!confirm('Remove this document?')) return
    await docApi.remove(id)
    setDocs(p => p.filter(d => d.id !== id))
  }

  async function saveVbtns() {
    setSavingVB(true)
    try {
      await tenantApi.update({
        visitorBtn1: vbtns.b1 || 'I am looking to build a product',
        visitorBtn2: vbtns.b2 || 'I am your existing client',
        visitorBtn3: vbtns.b3 || 'I am an investor',
        visitorBtn4: vbtns.b4 || 'Just exploring',
      })
      showToast('Visitor buttons saved!')
    } catch(e) { showToast(e.message, true) }
    finally { setSavingVB(false) }
  }

  return (
    <PageShell title="Knowledge Base">
      {/* Company description */}
      <div className="kb-card">
        <div className="kb-header">
          <span className="kb-title">Company Description</span>
          <button className="btn-pri btn-sm" onClick={saveDesc} disabled={saving}>{saving?'Saving…':'Save'}</button>
        </div>
        <div className="card-body">
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={5}
            placeholder="Describe what your company does, who you serve, and what makes you different. The more detail, the better your bot will answer."
            style={{ width:'100%', background:'var(--s2)', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:9, padding:'11px 13px', fontSize:13, color:'var(--tx)', outline:'none', resize:'vertical', lineHeight:1.6, fontFamily:'inherit' }} />
          <p style={{ fontSize:12, color:'var(--td)', marginTop:6 }}>This text is injected into the AI's system prompt. Be specific about your services, ideal clients, and location if relevant.</p>
        </div>
      </div>

      {/* Services */}
      <div className="kb-card">
        <div className="kb-header">
          <span className="kb-title">Services ({svcs.length})</span>
          <button className="btn-pri btn-sm" onClick={() => setModal({ id:null, name:'', description:'' })}>+ Add Service</button>
        </div>
        <div className="card-body">
          {svcs.length ? svcs.map(s => (
            <div key={s.id} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', background:'var(--s2)', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:9, marginBottom:8 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--tx)', marginBottom:2 }}>{s.name}</div>
                <div style={{ fontSize:12, color:'var(--tm)', lineHeight:1.5 }}>{s.description}</div>
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <button className="btn-sec btn-sm" onClick={() => setModal(s)}>Edit</button>
                <button className="btn-sec btn-sm btn-danger" onClick={() => delSvc(s.id)}>Del</button>
              </div>
            </div>
          )) : (
            <p style={{ fontSize:13, color:'var(--td)' }}>No services yet. Add the offerings visitors will ask about most.</p>
          )}
        </div>
      </div>

      {/* Visitor Type Buttons */}
      <div className="kb-card">
        <div className="kb-header">
          <span className="kb-title">Visitor Type Buttons</span>
          <button className="btn-pri btn-sm" onClick={saveVbtns} disabled={savingVB}>{savingVB ? 'Saving…' : 'Save Buttons'}</button>
        </div>
        <div className="card-body">
          <p style={{ fontSize:13, color:'var(--tm)', marginBottom:14, lineHeight:1.6 }}>
            Customise the 4 buttons visitors see when they first open the chat. Keep them short and action-oriented.
          </p>
          <div className="form-2col">
            {[
              { key:'b1', icon:'🚀', default:'I am looking to build a product', type:'CLIENT'   },
              { key:'b2', icon:'🤝', default:'I am your existing client',       type:'EXISTING' },
              { key:'b3', icon:'📈', default:'I am an investor',                type:'INVESTOR' },
              { key:'b4', icon:'💬', default:'Just exploring',                  type:'GENERAL'  },
            ].map(btn => (
              <div key={btn.key} className="form-row" style={{ marginBottom:0 }}>
                <label className="form-label">{btn.icon} {btn.type}</label>
                <input className="form-input"
                  value={vbtns[btn.key]}
                  onChange={e => setVbtns(p => ({ ...p, [btn.key]: e.target.value }))}
                  placeholder={btn.default}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="kb-card">
        <div className="kb-header">
          <span className="kb-title">Documents & PDFs ({docs.length})</span>
          <label style={{ cursor:'pointer' }}>
            <span className="btn-pri btn-sm">{uploading ? 'Uploading…' : '+ Upload PDF'}</span>
            <input type="file" accept=".pdf,.txt" style={{ display:'none' }} onChange={uploadDoc} disabled={uploading} />
          </label>
        </div>
        <div className="card-body">
          <p style={{ fontSize:12, color:'var(--td)', marginBottom:12 }}>
            Upload PDFs (brochures, case studies, rate cards). Text is extracted automatically and used to answer visitor questions.
            Max 10MB per file.
          </p>
          {docs.length ? docs.map(d => (
            <div key={d.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 11px', background:'var(--s2)', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:9, marginBottom:7 }}>
              <span style={{ fontSize:16 }}>📄</span>
              <span style={{ flex:1, fontSize:13, color:'var(--tx)' }}>{d.name}</span>
              <span style={{ fontSize:11, color:'var(--td)' }}>{d.file_size_kb} KB · {fmtDate(d.created_at)}</span>
              <button className="btn-sec btn-sm btn-danger" onClick={() => delDoc(d.id)}>Remove</button>
            </div>
          )) : (
            <p style={{ fontSize:13, color:'var(--td)' }}>No documents yet.</p>
          )}
        </div>
      </div>

      {/* Service modal */}
      {modal !== null && (
        <Modal title={modal.id ? 'Edit Service' : 'Add Service'} onClose={() => setModal(null)}>
          <ServiceForm initial={modal} onSave={saveSvc} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </PageShell>
  )
}

function ServiceForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ id: initial.id || null, name: initial.name||'', description: initial.description||'' })
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!form.name.trim()) return
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="form-row">
        <label className="form-label">Service name</label>
        <input className="form-input" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Product Development" />
      </div>
      <div className="form-row" style={{ marginBottom:16 }}>
        <label className="form-label">Description</label>
        <textarea className="form-input" rows={3} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="What you offer and who benefits…" style={{ resize:'vertical' }} />
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button className="btn-sec" onClick={onCancel}>Cancel</button>
        <button className="btn-pri" onClick={submit} disabled={saving}>{saving?'Saving…':'Save'}</button>
      </div>
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'var(--s1)', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:14, padding:24, width:440, maxWidth:'92vw' }}>
        <div style={{ fontFamily:'var(--font-brand)', fontSize:16, fontWeight:700, color:'var(--tx)', marginBottom:16 }}>{title}</div>
        {children}
      </div>
    </div>
  )
}

function showToast(msg, isErr=false) {
  const t=document.createElement('div'); t.className='toast';
  t.textContent=msg; if(isErr) t.style.color='var(--rd)';
  document.body.appendChild(t); setTimeout(()=>t.remove(),2400);
}
