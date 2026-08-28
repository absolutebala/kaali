'use client'
import { useEffect } from 'react'
import Link from 'next/link'

const TENANT_ID = 'acc90501-bfcb-4131-ba76-9dc446b9f836'

export default function LandingPage() {
  useEffect(() => {
    const s = document.createElement('script')
    s.src = `https://nivochat.idataone.com/widget.js?id=${TENANT_ID}`
    s.async = true
    document.body.appendChild(s)
    return () => { s.remove() }
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #FAFAFC; font-family: 'Inter', sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased; }
        ::selection { background: #2563EB; color: #fff; }
        a { text-decoration: none; color: inherit; }
        .hero-gradient { background: radial-gradient(100% 50% at 50% 0%, rgba(37,99,235,0.05) 0%, rgba(250,250,252,0) 100%); }
        .btn-primary { display:inline-flex; align-items:center; gap:8px; padding:14px 28px; background:#2563EB; color:#fff; border-radius:12px; font-weight:600; font-size:15px; box-shadow:0 4px 20px rgba(37,99,235,0.25); transition:all .2s; cursor:pointer; border:none; }
        .btn-primary:hover { background:#1D4ED8; transform:translateY(-1px); }
        .btn-secondary { display:inline-flex; align-items:center; gap:8px; padding:14px 28px; background:#fff; color:#374151; border-radius:12px; font-weight:600; font-size:15px; border:1.5px solid #E2E8F0; transition:all .2s; cursor:pointer; }
        .btn-secondary:hover { background:#F8FAFC; }
        .card { background:#fff; border:1px solid rgba(226,232,240,0.8); border-radius:20px; box-shadow:0 2px 12px rgba(0,0,0,0.04); }
        .pricing-popular { border:2px solid #2563EB; transform:scale(1.04); box-shadow:0 8px 40px rgba(37,99,235,0.15); }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .animate-pulse { animation:pulse 2s ease-in-out infinite; }
        @media (max-width:768px) { .hide-mobile { display:none!important; } .pricing-popular { transform:none; } }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ position:'sticky', top:0, zIndex:50, backdropFilter:'blur(12px)', background:'rgba(255,255,255,0.85)', borderBottom:'1px solid rgba(226,232,240,0.8)' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', height:72, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg, #2563EB, #06B6D4)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(37,99,235,0.3)' }}>
              <img src="/favicon.png" alt="NivoChat" style={{ width:26, height:26, objectFit:'contain' }} />
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:'#0F172A', letterSpacing:'-.4px' }}>NivoChat</div>
              <div style={{ fontSize:9, fontWeight:700, color:'#64748B', letterSpacing:'1.5px', textTransform:'uppercase' }}>by iDataOne</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="hide-mobile" style={{ display:'flex', gap:36, fontSize:14, fontWeight:500, color:'#475569' }}>
            {['Features','How It Works','Integrations','Pricing'].map(n => (
              <a key={n} href={`#${n.toLowerCase().replace(/ /g,'-')}`} style={{ transition:'color .15s' }}
                onMouseOver={e=>e.target.style.color='#0F172A'} onMouseOut={e=>e.target.style.color='#475569'}>{n}</a>
            ))}
          </nav>

          {/* CTA */}
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <Link href="/auth/login" className="hide-mobile" style={{ fontSize:14, fontWeight:500, color:'#475569' }}>Login</Link>
            <Link href="/auth/register" className="btn-primary" style={{ padding:'10px 22px', fontSize:14 }}>Start Free</Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="hero-gradient" style={{ padding:'80px 24px 120px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ maxWidth:860, margin:'0 auto', position:'relative', zIndex:1 }}>
          {/* Badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:99, border:'1px solid #BFDBFE', background:'#EFF6FF', color:'#2563EB', fontSize:12, fontWeight:700, marginBottom:28 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#2563EB', display:'inline-block' }} className="animate-pulse" />
            Enterprise AI Conversation Layer
          </div>

          <h1 style={{ fontSize:'clamp(38px,6vw,68px)', fontWeight:800, color:'#0F172A', lineHeight:1.12, letterSpacing:'-.03em', marginBottom:24 }}>
            Don't make your customers search.<br />
            <span style={{ color:'#2563EB' }}>Let them ask.</span>
          </h1>

          <p style={{ fontSize:18, color:'#64748B', maxWidth:580, margin:'0 auto 40px', lineHeight:1.7 }}>
            NivoChat gives your website an AI assistant trained on your business that answers questions, captures leads, and hands conversations to your team when needed.
          </p>

          <div style={{ display:'flex', flexWrap:'wrap', gap:12, justifyContent:'center', marginBottom:36 }}>
            <Link href="/auth/register" className="btn-primary">Start Free — It's Free →</Link>
            <a href="#how-it-works" className="btn-secondary">See How It Works</a>
          </div>

          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:24, fontSize:13, color:'#64748B', fontWeight:500 }}>
            {['No credit card required','Set up in minutes','Cancel anytime'].map(t => (
              <span key={t} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Browser mockup */}
        <div style={{ maxWidth:960, margin:'56px auto 0', borderRadius:20, border:'1px solid rgba(226,232,240,0.8)', background:'#fff', boxShadow:'0 24px 80px rgba(0,0,0,0.10)', overflow:'hidden', textAlign:'left' }}>
          {/* Browser chrome */}
          <div style={{ padding:'14px 20px', background:'#F1F5F9', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ display:'flex', gap:6 }}>
              {['#CBD5E1','#CBD5E1','#CBD5E1'].map((c,i) => <div key={i} style={{ width:11, height:11, borderRadius:'50%', background:c }} />)}
            </div>
            <div style={{ flex:1, background:'#fff', border:'1px solid #E2E8F0', borderRadius:6, padding:'4px 16px', fontSize:11, color:'#64748B', fontFamily:'monospace', textAlign:'center', maxWidth:360, margin:'0 auto' }}>
              https://acme-solutions.com
            </div>
          </div>

          {/* Page content */}
          <div style={{ padding:'48px 56px', background:'#F8FAFC', minHeight:380, position:'relative' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #E2E8F0', paddingBottom:20, marginBottom:32 }}>
              <div style={{ fontWeight:900, fontSize:16, letterSpacing:'2px', color:'#1E293B' }}>ACME SOLUTIONS</div>
              <div className="hide-mobile" style={{ display:'flex', gap:28, fontSize:12, color:'#64748B', fontWeight:500 }}>
                {['Home','Services','About','Contact'].map(n => <span key={n}>{n}</span>)}
              </div>
            </div>
            <h2 style={{ fontSize:36, fontWeight:900, color:'#0F172A', lineHeight:1.2, marginBottom:12 }}>Build better.<br/>Grow faster.</h2>
            <p style={{ fontSize:13, color:'#64748B', lineHeight:1.7, maxWidth:320 }}>We build custom web & mobile apps that scale with your growing operations.</p>

            {/* Chat widget mockup */}
            <div style={{ position:'absolute', bottom:28, right:32, width:300 }}>
              <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:20, boxShadow:'0 16px 48px rgba(0,0,0,0.12)', padding:18, fontSize:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid #F1F5F9', paddingBottom:12, marginBottom:12 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#2563EB,#06B6D4)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:12 }}>N</div>
                  <div>
                    <div style={{ fontWeight:700, color:'#0F172A', fontSize:12 }}>ACME Assistant</div>
                    <div style={{ fontSize:10, color:'#10B981', fontWeight:600 }}>Powered by NivoChat</div>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ background:'#F1F5F9', color:'#334155', padding:'10px 14px', borderRadius:'16px 16px 16px 4px', maxWidth:'80%', lineHeight:1.5 }}>Hi! How can I help you today?</div>
                  <div style={{ background:'#2563EB', color:'#fff', padding:'10px 14px', borderRadius:'16px 16px 4px 16px', maxWidth:'80%', marginLeft:'auto', lineHeight:1.5 }}>Do you build mobile apps?</div>
                  <div style={{ background:'#F1F5F9', color:'#334155', padding:'10px 14px', borderRadius:'16px 16px 16px 4px', maxWidth:'80%', lineHeight:1.5 }}>Yes! We build custom iOS & Android apps. Want to see examples?</div>
                </div>
              </div>
              <div style={{ marginTop:10, background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:14, padding:'12px 16px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
                <div style={{ width:22, height:22, borderRadius:'50%', background:'#10B981', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0 }}>✓</div>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#064E3B' }}>Lead Captured</div>
                  <div style={{ fontSize:11, color:'#065F46' }}>John Mathew (john@acme.com)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY ── */}
      <section style={{ padding:'56px 24px', borderTop:'1px solid #E2E8F0', borderBottom:'1px solid #E2E8F0', background:'#fff', textAlign:'center' }}>
        <p style={{ fontSize:11, fontWeight:700, color:'#64748B', letterSpacing:'2px', textTransform:'uppercase', marginBottom:32 }}>Trusted by modern teams worldwide</p>
        <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'24px 48px', opacity:0.45 }}>
          {['AURA LOGISTICS','VERTIGO SaaS','FINSCALE','KINETIC LABS'].map(n => (
            <span key={n} style={{ fontWeight:900, fontSize:16, color:'#1E293B', letterSpacing:'1px' }}>{n}</span>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding:'100px 24px', background:'#F8FAFC' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', maxWidth:600, margin:'0 auto 64px' }}>
            <h2 style={{ fontSize:38, fontWeight:800, color:'#0F172A', letterSpacing:'-.02em', marginBottom:14 }}>How NivoChat works</h2>
            <p style={{ fontSize:17, color:'#64748B', lineHeight:1.7 }}>From visitor to valuable customer in four simple steps</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:20 }}>
            {[
              ['01','Visitor arrives','A visitor lands on your website looking for instant answers.'],
              ['02','NivoChat AI answers','Instantly answers questions using your business information.'],
              ['03','Lead captured','Visitor details are captured automatically in your dashboard.'],
              ['04','Human takes over','Conversations can be handed over to your team whenever needed.'],
            ].map(([n, title, desc]) => (
              <div key={n} className="card" style={{ padding:32 }}>
                <div style={{ fontSize:32, fontWeight:900, color:'rgba(37,99,235,0.2)', marginBottom:20 }}>{n}</div>
                <h3 style={{ fontSize:16, fontWeight:700, color:'#0F172A', marginBottom:8 }}>{title}</h3>
                <p style={{ fontSize:13, color:'#64748B', lineHeight:1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE ANALYTICS ── */}
      <section style={{ padding:'100px 24px', background:'#fff', borderTop:'1px solid #E2E8F0' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', maxWidth:600, margin:'0 auto 56px' }}>
            <h2 style={{ fontSize:38, fontWeight:800, color:'#0F172A', letterSpacing:'-.02em', marginBottom:14 }}>See every visitor. Capture every opportunity.</h2>
            <p style={{ fontSize:17, color:'#64748B', lineHeight:1.7 }}>Know who's on your website and what they're interested in.</p>
          </div>
          <div className="card" style={{ padding:32, boxShadow:'0 8px 40px rgba(0,0,0,0.08)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #F1F5F9', paddingBottom:20, marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ width:10, height:10, borderRadius:'50%', background:'#10B981', display:'inline-block' }} className="animate-pulse" />
                <span style={{ fontWeight:700, color:'#1E293B', fontSize:14 }}>Live Visitors: <span style={{ color:'#2563EB' }}>12</span></span>
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:'#64748B', letterSpacing:'1px', textTransform:'uppercase' }}>Real-time Analytics</span>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', fontSize:13, borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#F8FAFC', borderBottom:'1px solid #F1F5F9' }}>
                    {['Visitor','Company','Location','Page','Source','Time'].map(h => (
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontWeight:700, fontSize:11, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.8px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['John Mathew','ACME Corp','Chennai, IN','Pricing','Google','2m'],
                    ['Sarah Williams','TechFlow','Bangalore, IN','Services','LinkedIn','3m'],
                  ].map(([name, co, loc, page, src, time], i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #F8FAFC' }}>
                      <td style={{ padding:'14px 16px', fontWeight:700, color:'#0F172A' }}>{name}</td>
                      <td style={{ padding:'14px 16px', color:'#475569' }}>{co}</td>
                      <td style={{ padding:'14px 16px', color:'#475569' }}>{loc}</td>
                      <td style={{ padding:'14px 16px' }}><span style={{ background:'#EFF6FF', color:'#1D4ED8', fontWeight:600, padding:'3px 10px', borderRadius:6, fontSize:12 }}>{page}</span></td>
                      <td style={{ padding:'14px 16px', color:'#475569' }}>{src}</td>
                      <td style={{ padding:'14px 16px', color:'#64748B' }}>{time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding:'100px 24px', background:'#F8FAFC', borderTop:'1px solid #E2E8F0' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', maxWidth:600, margin:'0 auto 64px' }}>
            <h2 style={{ fontSize:38, fontWeight:800, color:'#0F172A', letterSpacing:'-.02em', marginBottom:14 }}>Simple, transparent pricing</h2>
            <p style={{ fontSize:17, color:'#64748B', lineHeight:1.7 }}>Start free. Upgrade when you grow.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24, alignItems:'start' }}>
            {[
              { name:'FREE', sub:'For getting started', price:'₹0', cta:'Get Started Free', popular:false },
              { name:'GROWTH', sub:'For growing businesses', price:'₹1,499', cta:'Start 7-Day Free Trial', popular:true },
              { name:'BUSINESS', sub:'For scaling teams', price:'₹4,999', cta:'Start 7-Day Free Trial', popular:false },
            ].map(p => (
              <div key={p.name} className={`card${p.popular?' pricing-popular':''}`} style={{ padding:40, display:'flex', flexDirection:'column', gap:0, position:'relative' }}>
                {p.popular && (
                  <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', background:'#2563EB', color:'#fff', fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', padding:'4px 16px', borderRadius:99, boxShadow:'0 4px 12px rgba(37,99,235,0.3)', whiteSpace:'nowrap' }}>Most Popular</div>
                )}
                <div style={{ fontSize:18, fontWeight:800, color:'#0F172A', marginBottom:4 }}>{p.name}</div>
                <div style={{ fontSize:12, color:'#64748B', marginBottom:28 }}>{p.sub}</div>
                <div style={{ fontSize:38, fontWeight:900, color:'#0F172A', marginBottom:32 }}>{p.price} <span style={{ fontSize:14, fontWeight:400, color:'#64748B' }}>/ month</span></div>
                <Link href="/auth/register" style={{
                  display:'block', textAlign:'center', padding:'14px', borderRadius:12, fontWeight:700, fontSize:14, cursor:'pointer',
                  background: p.popular ? '#2563EB' : '#fff',
                  color: p.popular ? '#fff' : '#334155',
                  border: p.popular ? 'none' : '1.5px solid #E2E8F0',
                  boxShadow: p.popular ? '0 4px 16px rgba(37,99,235,0.25)' : 'none',
                }}>{p.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:'#0F172A', color:'#94A3B8', padding:'64px 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', gap:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#2563EB,#06B6D4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <img src="/favicon.png" alt="NivoChat" style={{ width:22, height:22, objectFit:'contain' }} />
            </div>
            <div>
              <span style={{ fontSize:16, fontWeight:800, color:'#fff' }}>NivoChat</span>
              <span style={{ fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'1.5px', marginLeft:8 }}>by iDataOne</span>
            </div>
          </div>
          <p style={{ fontSize:12 }}>© 2026 iDataOne Private Limited. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}
