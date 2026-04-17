'use client'
import { useEffect, useState } from 'react'
import { tenant as tenantApi, services as svcApi, documents as docApi } from '@/lib/api-client'
import { PageShell, fmtDate }  from '../page'

export default function KnowledgePage() {
  const [desc,      setDesc]     = useState('')
  const [svcs,      setSvcs]     = useState([])
  const [docs,      setDocs]     = useState([])
  const [saving,    setSaving]   = useState(false)
  const [uploading, setUpl]      = useState(false)
  const [scraping,  setScraping] = useState(false)
  const [scrapeUrl, setScrapeUrl]= useState('')
  const [scrapeMsg, setScrapeMsg]= useState('')
  const [modal,     setModal]    = useState(null)

  useEffect(() => {
    tenantApi.get().then(r => setDesc(r.tenant.description || ''))
    svcApi.list().then(r  => setSvcs(r.services || []))
    docApi.list().then(r  => setDocs(r.documents || []))
  }, [])

  async function saveDesc() {
    setSaving(true)
    try { await tenantApi.update({ description: desc }); showToast('Saved!') }
    catch(e) { showToast(e.message, true) }
    finally { setSaving(false) }
  }

  async function saveSvc(data) {
    if (data.id) { const r=await svcApi.update(data); setSvcs(p=>p.map(s=>s.id===data.id?r.service:s)) }
    else { const r=await svcApi.add(data); setSvcs(p=>[...p,r.service]) }
    setModal(null); showToast(data.id?'Updated!':'Added!')
  }

  async function delSvc(id) {
    if (!confirm('Delete?')) return
    await svcApi.remove(id); setSvcs(p=>p.filter(s=>s.id!==id))
  }

  async function uploadDoc(e) {
    const file=e.target.files?.[0]; if(!file) return
    setUpl(true)
    try { const fd=new FormData(); fd.append('file',file); const r=await docApi.upload(fd); setDocs(p=>[...p,r.document]); showToast('Uploaded!') }
    catch(err) { showToast(err.message,true) }
    finally { setUpl(false); e.target.value='' }
  }

  async function scrapeWebsite() {
    if (!scrapeUrl.trim()) return
    setScraping(true); setScrapeMsg('')
    try {
      const res = await fetch('/api/scrape', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${localStorage.getItem('kaali_token')}` },
        body: JSON.stringify({ url: scrapeUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setScrapeMsg(`✓ ${data.message}`)
      setScrapeUrl('')
      const r = await docApi.list(); setDocs(r.documents||[]); setScrapeUrl('')
      showToast('Website content indexed!')
    } catch(err) { setScrapeMsg(`✕ ${err.message}`) }
    finally { setScraping(false) }
  }

  async function delDoc(id) {
    if (!confirm('Remove?')) return
    await docApi.remove(id); setDocs(p=>p.filter(d=>d.id!==id))
  }

  return (
    <PageShell title="Knowledge Base">

      <div className="kb-card">
        <div className="kb-header"><span className="kb-title">Company Description</span><button className="btn-pri btn-sm" onClick={saveDesc} disabled={saving}>{saving?'Saving…':'Save'}</button></div>
        <div className="card-body">
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={5} placeholder="Describe what your company does, who you serve, and what makes you different…"
            style={{ width:'100%', background:'var(--s2)', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:9, padding:'11px 13px', fontSize:13, color:'var(--tx)', outline:'none', resize:'vertical', lineHeight:1.6, fontFamily:'inherit' }} />
        </div>
      </div>

      <div className="kb-card">
        <div className="kb-header">
          <span className="kb-title">Import from Website URL</span>
          <span style={{ fontSize:11, color:'var(--gr)', background:'rgba(34,209,122,.1)', border:'0.5px solid rgba(34,209,122,.25)', padding:'2px 9px', borderRadius:20 }}>New</span>
        </div>
        <div className="card-body">
          <p style={{ fontSize:12.5, color:'var(--tm)', marginBottom:14, lineHeight:1.6 }}>
            Paste any public URL. Kaali fetches the page and uses its content to answer visitor questions. Add multiple pages for better coverage.
          </p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <input value={scrapeUrl} onChange={e=>setScrapeUrl(e.target.value)} onKeyDown={e=>e.key==='Enter'&&scrapeWebsite()}
              placeholder="https://absoluteapplabs.com/services"
              style={{ flex:1, minWidth:240, background:'var(--s2)', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:9, padding:'10px 13px', fontSize:13, color:'var(--tx)', outline:'none' }} />
            <button className="btn-pri" onClick={scrapeWebsite} disabled={scraping||!scrapeUrl.trim()}>{scraping?'Fetching…':'↓ Import Page'}</button>
          </div>
          {scrapeMsg && <p style={{ fontSize:12.5, marginTop:10, color:scrapeMsg.startsWith('✓')?'var(--gr)':'var(--rd)' }}>{scrapeMsg}</p>}
          <div style={{ marginTop:14, padding:12, background:'var(--s2)', borderRadius:9 }}>
            <p style={{ fontSize:12, color:'var(--td)', marginBottom:6, fontWeight:500 }}>💡 Suggested pages to import:</p>
            {['Homepage — general overview','/about — company story and team','/services — what you offer','/contact — how to reach you'].map(p=>(
              <div key={p} style={{ fontSize:12, color:'var(--tm)', padding:'3px 0' }}>→ {p}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="kb-card">
        <div className="kb-header"><span className="kb-title">Services ({svcs.length})</span><button className="btn-pri btn-sm" onClick={()=>setModal({id:null,name:'',description:''})}>+ Add</button></div>
        <div className="card-body">
          {svcs.length ? svcs.map(s=>(
            <div key={s.id} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', background:'var(--s2)', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:9, marginBottom:8 }}>
              <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:500, color:'var(--tx)', marginBottom:2 }}>{s.name}</div><div style={{ fontSize:12, color:'var(--tm)', lineHeight:1.5 }}>{s.description}</div></div>
              <div style={{ display:'flex', gap:6 }}><button className="btn-sec btn-sm" onClick={()=>setModal(s)}>Edit</button><button className="btn-sec btn-sm btn-danger" onClick={()=>delSvc(s.id)}>Del</button></div>
            </div>
          )) : <p style={{ fontSize:13, color:'var(--td)' }}>No services yet.</p>}
        </div>
      </div>

      <div className="kb-card">
        <div className="kb-header">
          <span className="kb-title">Documents & Indexed Pages ({docs.length})</span>
          <label style={{ cursor:'pointer' }}><span className="btn-pri btn-sm">{uploading?'Uploading…':'+ Upload PDF'}</span><input type="file" accept=".pdf,.txt" style={{ display:'none' }} onChange={uploadDoc} disabled={uploading} /></label>
        </div>
        <div className="card-body">
          {docs.length ? docs.map(d=>(
            <div key={d.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 11px', background:'var(--s2)', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:9, marginBottom:7 }}>
              <span style={{ fontSize:16 }}>{d.name.startsWith('Website:')?'🌐':'📄'}</span>
              <span style={{ flex:1, fontSize:13, color:'var(--tx)' }}>{d.name}</span>
              <span style={{ fontSize:11, color:'var(--td)' }}>{d.file_size_kb}KB · {fmtDate(d.created_at)}</span>
              <button className="btn-sec btn-sm btn-danger" onClick={()=>delDoc(d.id)}>Remove</button>
            </div>
          )) : <p style={{ fontSize:13, color:'var(--td)' }}>No documents yet.</p>}
        </div>
      </div>

      {modal!==null && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={{ background:'var(--s1)', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:14, padding:24, width:440, maxWidth:'92vw' }}>
            <div style={{ fontFamily:'var(--font-brand)', fontSize:16, fontWeight:700, color:'var(--tx)', marginBottom:16 }}>{modal.id?'Edit Service':'Add Service'}</div>
            <SvcForm initial={modal} onSave={saveSvc} onCancel={()=>setModal(null)} />
          </div>
        </div>
      )}
    </PageShell>
  )
}

function SvcForm({ initial, onSave, onCancel }) {
  const [form,setSform]=useState({id:initial.id||null,name:initial.name||'',description:initial.description||''})
  const [saving,setSaving]=useState(false)
  async function submit(){if(!form.name.trim())return;setSaving(true);try{await onSave(form)}finally{setSaving(false)}}
  return (
    <div>
      <div className="form-row"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e=>setSform(p=>({...p,name:e.target.value}))} placeholder="e.g. Product Development" /></div>
      <div className="form-row" style={{ marginBottom:16 }}><label className="form-label">Description</label><textarea className="form-input" rows={3} value={form.description} onChange={e=>setSform(p=>({...p,description:e.target.value}))} style={{ resize:'vertical' }} /></div>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}><button className="btn-sec" onClick={onCancel}>Cancel</button><button className="btn-pri" onClick={submit} disabled={saving}>{saving?'Saving…':'Save'}</button></div>
    </div>
  )
}

function showToast(msg,isErr=false){const t=document.createElement('div');t.className='toast';t.textContent=msg;if(isErr)t.style.color='var(--rd)';document.body.appendChild(t);setTimeout(()=>t.remove(),2400)}
