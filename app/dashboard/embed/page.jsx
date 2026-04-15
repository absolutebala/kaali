'use client'
import { useAuth }   from '@/lib/auth-context'
import { PageShell } from '../page'

export default function EmbedPage() {
  const { user } = useAuth()
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL || 'https://kaali.absoluteapplabs.com'
  const tid      = user?.id || '—'
  const snippet  = `<script src="${appUrl}/widget.js?id=${tid}" async></script>`

  function copy(txt, btnId) {
    navigator.clipboard?.writeText(txt).then(() => {
      const el = document.getElementById(btnId)
      if (el) { el.textContent = 'Copied!'; setTimeout(() => el.textContent = 'Copy', 1800) }
    })
  }

  return (
    <PageShell title="Embed Code">

      {/* Bot ID */}
      <div className="kb-card">
        <div className="kb-header"><span className="kb-title">Your Bot ID</span></div>
        <div className="card-body">
          <div style={{ display:'flex', alignItems:'center', gap:10, background:'var(--s2)', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:9, padding:'10px 13px', marginBottom:10 }}>
            <span style={{ fontFamily:'monospace', fontSize:13, color:'var(--ac)', flex:1 }}>{tid}</span>
            <button id="copy-tid" className="btn-sec btn-sm" onClick={() => copy(tid, 'copy-tid')}>Copy</button>
          </div>
          <p style={{ fontSize:12.5, color:'var(--tm)' }}>
            This uniquely identifies your workspace. Anyone with this ID can embed your bot, so keep it safe.
            Changes to your knowledge base and settings apply instantly — no re-embed needed.
          </p>
        </div>
      </div>

      {/* Installation */}
      <div className="kb-card">
        <div className="kb-header"><span className="kb-title">Installation</span></div>
        <div className="card-body">
          <ol style={{ counterReset:'step', listStyle:'none', display:'flex', flexDirection:'column', gap:20 }}>
            {[
              {
                title: 'Copy your embed snippet',
                desc:  'This single line of JavaScript is all your website needs.',
                code:  snippet,
                btnId: 'copy-snippet',
              },
              {
                title: 'Paste it before </body>',
                desc:  'Add it at the bottom of your HTML file, WordPress theme footer, Webflow page code, or any CMS custom code section.',
                code:  null,
              },
              {
                title: "You're live — no re-embed needed ever",
                desc:  'Kaali appears immediately. Any changes you make here (bot name, knowledge base, tone) take effect in real time. No code changes required.',
                code:  null,
              },
            ].map((step, i) => (
              <li key={i} style={{ display:'flex', gap:14 }}>
                <div style={{ width:24, height:24, background:'rgba(79,142,247,.12)', border:'0.5px solid rgba(79,142,247,.3)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:500, color:'var(--ac)', flexShrink:0, marginTop:2 }}>
                  {i+1}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--tx)', marginBottom:5 }}>{step.title}</div>
                  <div style={{ fontSize:12.5, color:'var(--tm)', lineHeight:1.6, marginBottom: step.code ? 10 : 0 }}>{step.desc}</div>
                  {step.code && (
                    <div style={{ background:'var(--bg)', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:9, padding:'13px 15px', fontFamily:'monospace', fontSize:12, color:'#93C5FD', lineHeight:1.7, position:'relative', wordBreak:'break-all' }}>
                      {step.code}
                      <button id={step.btnId} onClick={() => copy(step.code, step.btnId)}
                        style={{ position:'absolute', top:8, right:9, fontSize:11, color:'var(--tm)', background:'var(--s2)', border:'0.5px solid rgba(255,255,255,.07)', padding:'3px 9px', borderRadius:5, cursor:'pointer' }}>
                        Copy
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Platform guides */}
      <div className="kb-card">
        <div className="kb-header"><span className="kb-title">Platform-Specific Guides</span></div>
        <div className="card-body">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {[
              { name:'WordPress',  icon:'🔵', hint:'Appearance → Theme Editor → footer.php, or use "Insert Headers and Footers" plugin' },
              { name:'Webflow',    icon:'🟣', hint:'Project Settings → Custom Code → Footer Code' },
              { name:'Wix',        icon:'🟡', hint:'Settings → Advanced → Custom Code → Add to Body' },
              { name:'Shopify',    icon:'🟢', hint:'Online Store → Themes → Edit Code → theme.liquid before </body>' },
              { name:'Squarespace',icon:'⚫', hint:'Settings → Advanced → Code Injection → Footer' },
              { name:'Custom HTML',icon:'🔷', hint:'Paste before </body> in your index.html or layout file' },
            ].map(p => (
              <div key={p.name} style={{ padding:14, background:'var(--s2)', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:9 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:16 }}>{p.icon}</span>
                  <span style={{ fontSize:13, fontWeight:500, color:'var(--tx)' }}>{p.name}</span>
                </div>
                <div style={{ fontSize:11.5, color:'var(--tm)', lineHeight:1.5 }}>{p.hint}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Test note */}
      <div style={{ background:'rgba(34,209,122,.07)', border:'0.5px solid rgba(34,209,122,.2)', borderRadius:9, padding:'12px 16px', fontSize:13, color:'var(--tm)', marginTop:4 }}>
        💡 <strong style={{ color:'var(--tx)' }}>Test it first:</strong> The chat bubble on this dashboard is your live bot. Click it to verify your knowledge base and AI provider are working before embedding on your site.
      </div>
    </PageShell>
  )
}
