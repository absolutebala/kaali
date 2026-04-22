'use client'
import { useRouter } from 'next/navigation'
import styles from './landing.module.css'

export default function LandingPage() {
  const router = useRouter()

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Background effects */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        background:'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(79,142,247,.11) 0%, transparent 70%)' }} />
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        backgroundImage:'radial-gradient(rgba(79,142,247,.08) 1px, transparent 1px)',
        backgroundSize:'28px 28px' }} />

      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'16px 56px', borderBottom:'0.5px solid rgba(255,255,255,.07)',
        backdropFilter:'blur(14px)', background:'rgba(5,8,15,.82)' }}>
        <div style={{ fontFamily:'var(--font-brand)', fontSize:19, letterSpacing:'-.3px', display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:8, height:8, background:'var(--ac)', borderRadius:'50%' }} />
          Absolute AIChat
        </div>
        <div style={{ display:'flex', gap:30, listStyle:'none' }}>
          {['Features','Pricing','Docs'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize:13.5, color:'var(--tm)', transition:'color .18s' }}
               onMouseOver={e=>e.target.style.color='var(--tx)'}
               onMouseOut={e=>e.target.style.color='var(--tm)'}>{l}</a>
          ))}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-ghost" onClick={() => router.push('/auth/login')}>Log in</button>
          <button className="btn-pri"  onClick={() => router.push('/auth/register')}>Start Free →</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ position:'relative', zIndex:1, display:'grid', gridTemplateColumns:'1fr 1fr',
        alignItems:'center', gap:48, maxWidth:1160, margin:'0 auto', padding:'80px 56px 60px' }}>
        <div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, fontSize:11, fontWeight:500,
            letterSpacing:'2px', textTransform:'uppercase', color:'var(--ac)', marginBottom:22,
            background:'rgba(79,142,247,.12)', border:'0.5px solid rgba(79,142,247,.25)',
            padding:'5px 12px', borderRadius:20 }}>
            <div style={{ width:5, height:5, background:'var(--ac)', borderRadius:'50%',
              animation:'pulse 2s ease-in-out infinite' }} />
            AI Chat Platform for Businesses
          </div>
          <h1 style={{ fontFamily:'var(--font-brand)', fontSize:'clamp(36px,4.5vw,58px)',
            fontWeight:700, lineHeight:1.07, letterSpacing:'-1.4px', marginBottom:18 }}>
            Your Website.<br />Your AI.<br />
            <span style={{ color:'var(--ac)' }}>Live in Minutes.</span>
          </h1>
          <p style={{ fontSize:15.5, color:'var(--tm)', lineHeight:1.72, maxWidth:420, marginBottom:32 }}>
            Absolute AIChat gives your visitors instant, intelligent answers from your own content — and turns them into leads, bookings, and clients.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:14 }}>
            <button className="btn-pri" style={{ padding:'11px 28px', fontSize:14 }}
              onClick={() => router.push('/auth/register')}>Start for Free →</button>
            <button className="btn-sec" onClick={() => router.push('/auth/register')}>See Live Demo</button>
          </div>
          <p style={{ fontSize:12, color:'var(--td)' }}>No credit card required · Bring your own API key · Works on any website</p>
        </div>

        {/* Mock browser */}
        <div style={{ display:'flex', justifyContent:'center' }}>
          <MockBrowser />
        </div>
      </div>

      <hr style={{ border:'none', borderTop:'0.5px solid rgba(255,255,255,.07)', maxWidth:1160, margin:'0 auto' }} />

      {/* Features */}
      <section id="features" style={{ position:'relative', zIndex:1, maxWidth:1160, margin:'0 auto', padding:'72px 56px' }}>
        <div style={{ fontSize:11, fontWeight:500, letterSpacing:'2px', textTransform:'uppercase', color:'var(--ac)', marginBottom:10 }}>Features</div>
        <h2 style={{ fontFamily:'var(--font-brand)', fontSize:'clamp(26px,3vw,38px)', fontWeight:700, letterSpacing:'-.7px', marginBottom:12 }}>Everything your chatbot needs</h2>
        <p style={{ fontSize:15, color:'var(--tm)', maxWidth:460, lineHeight:1.7, marginBottom:44 }}>Built for businesses that want more than a generic widget.</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1px', background:'rgba(255,255,255,.07)', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:16, overflow:'hidden' }}>
          {[
            { ic:'🧠', nm:'AI from Your Content', ds:'Learns from your company info, services, and PDFs. Every answer is accurate and on-brand.' },
            { ic:'👥', nm:'Smart Lead Capture',    ds:'Detects potential clients and captures their contact at exactly the right moment.' },
            { ic:'📅', nm:'Meeting Scheduling',    ds:'Offers Calendly bookings to qualified visitors — without leaving the chat.' },
            { ic:'🔑', nm:'Your Own API Key',      ds:'Claude or ChatGPT — your key, your data, no markup on AI usage. Ever.' },
            { ic:'📊', nm:'Full Dashboard',        ds:'Transcripts, leads, usage tracking, status management, and CSV export.' },
            { ic:'🚀', nm:'One-Line Embed',        ds:'A single script tag. Works on WordPress, Webflow, Wix, or any custom site.' },
          ].map(f => (
            <div key={f.nm} style={{ background:'var(--bg)', padding:26, transition:'background .2s', cursor:'default' }}
              onMouseOver={e=>e.currentTarget.style.background='var(--s1)'}
              onMouseOut={e=>e.currentTarget.style.background='var(--bg)'}>
              <div style={{ fontSize:20, marginBottom:12 }}>{f.ic}</div>
              <div style={{ fontSize:14, fontWeight:500, color:'var(--tx)', marginBottom:5 }}>{f.nm}</div>
              <div style={{ fontSize:13, color:'var(--tm)', lineHeight:1.6 }}>{f.ds}</div>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border:'none', borderTop:'0.5px solid rgba(255,255,255,.07)', maxWidth:1160, margin:'0 auto' }} />

      {/* Pricing */}
      <section id="pricing" style={{ position:'relative', zIndex:1, maxWidth:1160, margin:'0 auto', padding:'72px 56px' }}>
        <div style={{ fontSize:11, fontWeight:500, letterSpacing:'2px', textTransform:'uppercase', color:'var(--ac)', marginBottom:10 }}>Pricing</div>
        <h2 style={{ fontFamily:'var(--font-brand)', fontSize:'clamp(26px,3vw,38px)', fontWeight:700, letterSpacing:'-.7px', marginBottom:12 }}>Simple, honest pricing</h2>
        <p style={{ fontSize:15, color:'var(--tm)', maxWidth:460, lineHeight:1.7, marginBottom:44 }}>You bring your own API key — we only charge for the platform.</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {[
            { plan:'Starter',  price:'$0',  sub:'Free forever', features:['100 messages/mo','1 PDF upload','Leads dashboard','Claude or ChatGPT'], featured:false },
            { plan:'Growth',   price:'$99', sub:'Per workspace', features:['2,000 messages/mo','10 PDF uploads','Full analytics & export','Usage alerts at 80%'], featured:true },
            { plan:'Business', price:'$199', sub:'Per workspace', features:['Unlimited messages','Unlimited PDFs','Priority support','Advanced analytics'], featured:false },
          ].map(p => (
            <div key={p.plan} style={{ background:'var(--s1)', border:`0.5px solid ${p.featured ? 'rgba(79,142,247,.4)' : 'rgba(255,255,255,.07)'}`, borderRadius:16, padding:26, position:'relative' }}>
              {p.featured && <div style={{ position:'absolute', top:-11, left:'50%', transform:'translateX(-50%)', fontSize:10, fontWeight:500, color:'#fff', background:'var(--ac)', padding:'3px 12px', borderRadius:20, whiteSpace:'nowrap' }}>Most Popular</div>}
              <div style={{ fontSize:12, fontWeight:500, color:'var(--tm)', marginBottom:7, textTransform:'uppercase', letterSpacing:'.5px' }}>{p.plan}</div>
              <div style={{ fontFamily:'var(--font-brand)', fontSize:38, fontWeight:700, color:'var(--tx)', lineHeight:1, marginBottom:3 }}>{p.price}<span style={{ fontSize:13, color:'var(--tm)', fontFamily:'var(--font-body)', fontWeight:400 }}>/mo</span></div>
              <div style={{ fontSize:11, color:'var(--td)', marginBottom:20 }}>{p.sub}</div>
              <ul style={{ listStyle:'none', marginBottom:24, display:'flex', flexDirection:'column', gap:9 }}>
                {p.features.map(f => <li key={f} style={{ fontSize:13, color:'var(--tm)', display:'flex', alignItems:'center', gap:8 }}><span style={{ color:'var(--gr)', fontWeight:700 }}>✓</span>{f}</li>)}
              </ul>
              <button onClick={() => router.push('/auth/register')}
                style={{ width:'100%', padding:10, borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', transition:'all .15s',
                  background: p.featured ? 'var(--ac)' : 'var(--s2)',
                  color: p.featured ? '#fff' : 'var(--tm)',
                  border: p.featured ? 'none' : '0.5px solid rgba(255,255,255,.13)' }}>
                {p.plan === 'Starter' ? 'Get Started Free' : `Start ${p.plan} →`}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop:'0.5px solid rgba(255,255,255,.07)', padding:'32px 56px', display:'flex', alignItems:'center', justifyContent:'space-between', maxWidth:1160, margin:'0 auto' }}>
        <div style={{ fontFamily:'var(--font-brand)', fontSize:15, color:'var(--tm)' }}>Absolute AIChat by <span style={{ color:'var(--ac)' }}>Absolute App Labs</span></div>
        <div style={{ display:'flex', gap:22 }}>
          {['Features','Pricing','Docs','Privacy'].map(l => (
            <a key={l} href="#" style={{ fontSize:13, color:'var(--td)', transition:'color .15s' }}
               onMouseOver={e=>e.target.style.color='var(--tm)'} onMouseOut={e=>e.target.style.color='var(--td)'}>{l}</a>
          ))}
        </div>
        <div style={{ fontSize:12, color:'var(--td)' }}>© 2025 Absolute App Labs. All rights reserved.</div>
      </footer>

      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }`}</style>
    </div>
  )
}

function MockBrowser() {
  return (
    <div style={{ width:'100%', maxWidth:420, background:'var(--s1)', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:14, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,.7)' }}>
      <div style={{ background:'var(--s2)', padding:'10px 14px', display:'flex', alignItems:'center', gap:8, borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>
        <div style={{ display:'flex', gap:5 }}>
          {['#EF4444','#FBBF24','#22D17A'].map(c => <div key={c} style={{ width:9, height:9, borderRadius:'50%', background:c }} />)}
        </div>
        <div style={{ flex:1, background:'var(--s3)', borderRadius:5, height:20, margin:'0 8px', display:'flex', alignItems:'center', padding:'0 10px', fontSize:10, color:'var(--td)' }}>yourcompany.com</div>
      </div>
      <div style={{ padding:24, minHeight:300, position:'relative' }}>
        <div style={{ fontFamily:'var(--font-brand)', fontSize:13, color:'var(--tx)', marginBottom:16 }}>YourBrand</div>
        <div style={{ fontFamily:'var(--font-brand)', fontSize:19, color:'var(--tx)', lineHeight:1.2, marginBottom:8 }}>Solutions that<br />Move Business</div>
        <div style={{ fontSize:11, color:'var(--tm)', lineHeight:1.6, maxWidth:200, marginTop:8 }}>Enterprise software for modern teams. Built to scale.</div>
        {/* Mini chat panel */}
        <div style={{ position:'absolute', bottom:60, right:10, width:196, background:'var(--s1)', border:'0.5px solid rgba(255,255,255,.13)', borderRadius:12, overflow:'hidden', boxShadow:'0 12px 36px rgba(0,0,0,.6)' }}>
          <div style={{ background:'var(--s2)', padding:'8px 10px', display:'flex', alignItems:'center', gap:7, borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>
            <div style={{ width:22, height:22, background:'linear-gradient(145deg,#1D4FD8,#4F8EF7)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-brand)', fontSize:9, fontWeight:700, color:'#fff', flexShrink:0 }}>K</div>
            <div><div style={{ fontSize:11, fontWeight:500, color:'var(--tx)' }}>Absolute AIChat</div><div style={{ fontSize:9, color:'var(--gr)' }}>● Online</div></div>
          </div>
          <div style={{ padding:8, display:'flex', flexDirection:'column', gap:5 }}>
            {[
              { b:true,  t:"Hi! 👋 What brings you here today?" },
              { b:false, t:"I need a software solution" },
              { b:true,  t:"Great! Tell me more about your team." },
            ].map((m, i) => (
              <div key={i} style={{ padding:'6px 8px', borderRadius:8, fontSize:10, lineHeight:1.4, maxWidth:'88%',
                alignSelf: m.b ? 'flex-start' : 'flex-end',
                background: m.b ? 'var(--s2)' : '#1B3FA0',
                color: m.b ? 'var(--tx)' : '#DDE9FF',
                border: m.b ? '0.5px solid rgba(255,255,255,.07)' : 'none',
                borderBottomLeftRadius: m.b ? 2 : 8,
                borderBottomRightRadius: m.b ? 8 : 2,
              }}>{m.t}</div>
            ))}
          </div>
        </div>
        {/* Bubble */}
        <div style={{ position:'absolute', bottom:14, right:14, width:38, height:38, background:'linear-gradient(145deg,#1D4FD8,#4F8EF7)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(30,79,216,.5)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        </div>
      </div>
    </div>
  )
}
