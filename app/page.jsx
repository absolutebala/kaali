'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function LandingPage() {
  const [isIndia, setIsIndia] = useState(false)
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => { if (d.country_code === 'IN') setIsIndia(true) })
      .catch(() => {})
  }, [])

  function PricingCards() {
    const ALL_FEATURES = [
      'AI chat widget (embed anywhere)',
      'Lead capture & dashboard',
      'Knowledge base (PDF + URL)',
      'Claude & ChatGPT support',
      'HubSpot + Zapier + Calendly',
      'Live agent handoff',
      'Analytics dashboard',
      'Visitor intelligence',
    ]
    const plans = [
      {
        name: 'Starter', sub: 'Free forever', popular: false,
        price: 'Free', period: '',
        cta: 'Get Started Free', ctaHref: '/auth/register',
        highlight: ['50 chats / month', '1 seat'],
        note: 'All features included',
      },
      {
        name: 'Growth', sub: 'Most popular', popular: true,
        price: isIndia ? '₹2,499' : '$25', period: '/ month',
        cta: 'Start Free Trial', ctaHref: '/auth/register',
        highlight: ['Unlimited chats', '10 seats'],
        note: 'All features included',
      },
      {
        name: 'Enterprise', sub: 'One-time payment', popular: false,
        price: '$1,000', period: 'one-time',
        cta: 'Contact Us', ctaHref: 'mailto:info@idataone.com',
        highlight: ['Unlimited chats', 'Unlimited seats', 'On-Premise deployment'],
        note: 'Everything in Growth +',
        extra: ['Dedicated server setup', 'Priority SLA support', 'Custom integrations'],
      },
    ]
    return (
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24, alignItems:'start', paddingTop:36 }}>
        {plans.map(p => (
          <div key={p.name} className={`card${p.popular?' pricing-popular':''}`}
            style={{ padding:36, display:'flex', flexDirection:'column', position:'relative', marginTop: p.popular ? -16 : 0, zIndex: p.popular ? 2 : 1 }}>
            {p.popular && (
              <div style={{ position:'absolute', top:-18, left:'50%', transform:'translateX(-50%)', background:'#2563EB', color:'#fff', fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', padding:'6px 20px', borderRadius:99, boxShadow:'0 4px 12px rgba(37,99,235,0.35)', whiteSpace:'nowrap' }}>Most Popular</div>
            )}
            {/* Plan name */}
            <div style={{ fontSize:20, fontWeight:800, color:'#0F172A', marginBottom:2 }}>{p.name}</div>
            <div style={{ fontSize:12, color: p.popular ? '#2563EB' : '#64748B', fontWeight:600, marginBottom:20 }}>{p.sub}</div>
            {/* Price */}
            <div style={{ marginBottom:24 }}>
              <span style={{ fontSize:40, fontWeight:900, color:'#0F172A' }}>{p.price}</span>
              {p.period && <span style={{ fontSize:14, color:'#64748B', marginLeft:4 }}>{p.period}</span>}
            </div>
            {/* Key highlights */}
            <div style={{ background: p.popular ? '#EFF6FF' : '#F8FAFC', borderRadius:10, padding:'14px 16px', marginBottom:20 }}>
              {p.highlight.map(h => (
                <div key={h} style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:600, color: p.popular ? '#1D4ED8' : '#0F172A', marginBottom:6 }}>
                  <span style={{ fontSize:16 }}>✦</span> {h}
                </div>
              ))}
            </div>
            {/* Features */}
            <div style={{ fontSize:12, fontWeight:600, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10 }}>{p.note}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:28, flex:1 }}>
              {ALL_FEATURES.map(f => (
                <div key={f} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#475569' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
                  {f}
                </div>
              ))}
              {(p.extra||[]).map(f => (
                <div key={f} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#475569' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
                  {f}
                </div>
              ))}
            </div>
            {/* CTA */}
            <a href={p.ctaHref} style={{ display:'block', textAlign:'center', padding:'14px', borderRadius:12, fontWeight:700, fontSize:14, cursor:'pointer', textDecoration:'none',
              background: p.popular ? '#2563EB' : '#fff', color: p.popular ? '#fff' : '#334155',
              border: p.popular ? 'none' : '1.5px solid #E2E8F0', boxShadow: p.popular ? '0 4px 16px rgba(37,99,235,0.28)' : 'none' }}>
              {p.cta}
            </a>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        #how-it-works, #integrations, #pricing { scroll-margin-top: 72px; }
        html { scroll-behavior: smooth; }
        body { background: #FAFAFC; font-family: 'Inter', sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased; }
        ::selection { background: #2563EB; color: #fff; }
        a { text-decoration: none; color: inherit; }
        .hero-gradient { background: radial-gradient(100% 50% at 50% 0%, rgba(37,99,235,0.06) 0%, rgba(250,250,252,0) 100%); }
        .btn-primary { display:inline-flex; align-items:center; gap:8px; padding:14px 28px; background:#2563EB; color:#fff; border-radius:12px; font-weight:700; font-size:15px; box-shadow:0 4px 20px rgba(37,99,235,0.28); transition:all .2s; cursor:pointer; border:none; }
        .btn-primary:hover { background:#1D4ED8; transform:translateY(-1px); }
        .btn-secondary { display:inline-flex; align-items:center; gap:8px; padding:14px 28px; background:#fff; color:#374151; border-radius:12px; font-weight:600; font-size:15px; border:1.5px solid #E2E8F0; transition:all .2s; cursor:pointer; }
        .btn-secondary:hover { background:#F8FAFC; }
        .card { background:#fff; border:1px solid rgba(226,232,240,0.8); border-radius:20px; box-shadow:0 2px 12px rgba(0,0,0,0.04); }
        .card { overflow: visible !important; }
        .pricing-popular { border:2px solid #2563EB !important; box-shadow:0 8px 40px rgba(37,99,235,0.18) !important; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .pulse { animation:pulse 2s ease-in-out infinite; }
        @media (max-width:768px) { .hide-mobile { display:none!important; } }

        /* How it works visual */
        .flow-step { display:flex; flex-direction:column; align-items:center; gap:12px; }
        .flow-card { background:#fff; border:1px solid #E2E8F0; border-radius:14px; padding:18px; box-shadow:0 4px 20px rgba(0,0,0,0.06); width:100%; }
        .flow-number { font-size:48px; font-weight:900; color:rgba(37,99,235,0.15); line-height:1; }
        .flow-connector { display:flex; align-items:center; gap:0; flex:1; min-width:40px; }
        .flow-line { flex:1; height:2px; background:linear-gradient(90deg,#BFDBFE,#93C5FD); border-radius:1px; }
        .flow-dot { width:10px; height:10px; border-radius:50%; background:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,0.2); flex-shrink:0; }

        /* Install section */
        .install-step { display:flex; gap:20px; align-items:flex-start; }
        .install-num { width:36px; height:36px; border-radius:10px; background:#EFF6FF; color:#2563EB; font-weight:800; font-size:16px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .code-block { background:#0F172A; color:#E2E8F0; padding:14px 18px; border-radius:10px; font-family:monospace; font-size:13px; line-height:1.7; overflow-x:auto; margin-top:8px; }
        .code-block .tag { color:#93C5FD; }
        .code-block .attr { color:#86EFAC; }
        .code-block .val { color:#FDE68A; }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ position:'fixed', top:0, left:0, right:0, zIndex:50, backdropFilter:'blur(12px)', background:'rgba(255,255,255,0.88)', borderBottom:'1px solid rgba(226,232,240,0.8)' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', height:72, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center' }}>
            <img src="/logo.png" alt="NivoChat" style={{ height:55, width:'auto', objectFit:'contain' }} />
          </div>

          <nav className="hide-mobile" style={{ display:'flex', gap:36, fontSize:14, fontWeight:500, color:'#475569' }}>
            {[['How It Works','#how-it-works'],['Integrations','#integrations'],['Pricing','#pricing']].map(([n,h]) => (
              <a key={n} href={h} onMouseOver={e=>e.target.style.color='#0F172A'} onMouseOut={e=>e.target.style.color='#475569'} style={{ transition:'color .15s' }}>{n}</a>
            ))}
          </nav>

          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <Link href="/auth/login" className="hide-mobile" style={{ fontSize:14, fontWeight:500, color:'#475569' }}>Login</Link>
            <Link href="/auth/register" className="btn-primary" style={{ padding:'10px 22px', fontSize:14 }}>Start Free</Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="hero-gradient" style={{ padding:'80px 24px 120px', paddingTop:152, textAlign:'center', overflow:'hidden' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <h1 style={{ fontSize:'clamp(36px,6vw,66px)', fontWeight:900, color:'#0F172A', lineHeight:1.1, letterSpacing:'-.03em', marginBottom:22 }}>
            Don't make your customers search.<br />
            <span style={{ color:'#2563EB' }}>Let them ask.</span>
          </h1>
          <p style={{ fontSize:18, color:'#64748B', maxWidth:560, margin:'0 auto 36px', lineHeight:1.7 }}>
            NivoChat gives your website an AI assistant trained on your business that answers questions, captures leads, and hands conversations to your team when needed.
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:12, justifyContent:'center', marginBottom:32 }}>
            <Link href="/auth/register" className="btn-primary">Start Free — No credit card →</Link>
            <a href="#how-it-works" className="btn-secondary">See How It Works</a>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:24, fontSize:13, color:'#64748B', fontWeight:500 }}>
            {['No credit card required','Set up in 5 minutes','Cancel anytime'].map(t => (
              <span key={t} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Browser mockup */}
        <div style={{ maxWidth:960, margin:'56px auto 0', borderRadius:20, border:'1px solid rgba(226,232,240,0.8)', background:'#fff', boxShadow:'0 24px 80px rgba(0,0,0,0.10)', overflow:'hidden', textAlign:'left' }}>
          <div style={{ padding:'14px 20px', background:'#F1F5F9', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ display:'flex', gap:6 }}>
              {[0,1,2].map(i => <div key={i} style={{ width:11, height:11, borderRadius:'50%', background:'#CBD5E1' }} />)}
            </div>
            <div style={{ flex:1, background:'#fff', border:'1px solid #E2E8F0', borderRadius:6, padding:'4px 16px', fontSize:11, color:'#64748B', fontFamily:'monospace', textAlign:'center', maxWidth:360, margin:'0 auto' }}>
              https://acme-solutions.com
            </div>
          </div>
          <div style={{ padding:'48px 56px', background:'#F8FAFC', minHeight:360, position:'relative' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #E2E8F0', paddingBottom:20, marginBottom:32 }}>
              <div style={{ fontWeight:900, fontSize:16, letterSpacing:'2px', color:'#1E293B' }}>ACME SOLUTIONS</div>
              <div className="hide-mobile" style={{ display:'flex', gap:28, fontSize:12, color:'#64748B', fontWeight:500 }}>
                {['Home','Services','About','Contact'].map(n=><span key={n}>{n}</span>)}
              </div>
            </div>
            <h2 style={{ fontSize:34, fontWeight:900, color:'#0F172A', lineHeight:1.2, marginBottom:12 }}>Build better.<br/>Grow faster.</h2>
            <p style={{ fontSize:13, color:'#64748B', lineHeight:1.7, maxWidth:300 }}>We build custom web & mobile apps that scale with your growing operations.</p>
            <div style={{ position:'absolute', bottom:28, right:32, width:290 }}>
              <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:18, boxShadow:'0 12px 40px rgba(0,0,0,0.1)', padding:16, fontSize:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid #F1F5F9', paddingBottom:10, marginBottom:10 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#2563EB,#06B6D4)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:11 }}>N</div>
                  <div>
                    <div style={{ fontWeight:700, color:'#0F172A', fontSize:12 }}>ACME Assistant</div>
                    <div style={{ fontSize:10, color:'#10B981', fontWeight:600 }}>Powered by NivoChat</div>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <div style={{ background:'#F1F5F9', color:'#334155', padding:'8px 12px', borderRadius:'12px 12px 12px 3px', maxWidth:'82%', lineHeight:1.5 }}>Hi! How can I help you?</div>
                  <div style={{ background:'#2563EB', color:'#fff', padding:'8px 12px', borderRadius:'12px 12px 3px 12px', maxWidth:'82%', marginLeft:'auto', lineHeight:1.5 }}>Do you build mobile apps?</div>
                  <div style={{ background:'#F1F5F9', color:'#334155', padding:'8px 12px', borderRadius:'12px 12px 12px 3px', maxWidth:'82%', lineHeight:1.5 }}>Yes! Custom iOS & Android. Want examples?</div>
                </div>
              </div>
              <div style={{ marginTop:8, background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:20, height:20, borderRadius:'50%', background:'#10B981', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, flexShrink:0 }}>✓</div>
                <div style={{ fontSize:11 }}>
                  <div style={{ fontWeight:700, color:'#064E3B' }}>Lead Captured</div>
                  <div style={{ color:'#065F46' }}>John Mathew (john@acme.com)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding:'100px 24px 100px', background:'#F0F4FF' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <h2 style={{ fontSize:38, fontWeight:800, color:'#0F172A', letterSpacing:'-.02em', marginBottom:14 }}>How NivoChat works</h2>
            <p style={{ fontSize:17, color:'#64748B' }}>From visitor to valuable customer in four simple steps</p>
          </div>

          {/* Visual flow */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 40px 1fr 40px 1fr 40px 1fr', alignItems:'center', gap:0, marginBottom:0 }}>
            {/* Step 1 */}
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:42, fontWeight:900, color:'rgba(37,99,235,0.18)', marginBottom:12 }}>01</div>
              <div style={{ background:'#fff', border:'1px solid #DBEAFE', borderRadius:16, padding:20, boxShadow:'0 4px 20px rgba(37,99,235,0.08)' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>🖥️</div>
                <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', letterSpacing:'1px', textTransform:'uppercase', marginBottom:6 }}>Company Site</div>
                <div style={{ background:'#F1F5F9', borderRadius:8, padding:'8px 10px', fontSize:11, color:'#475569' }}>
                  <div style={{ height:6, background:'#CBD5E1', borderRadius:3, marginBottom:5 }}/>
                  <div style={{ height:6, background:'#E2E8F0', borderRadius:3, width:'70%', marginBottom:5 }}/>
                  <div style={{ display:'flex', gap:4, marginTop:8 }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', background:'linear-gradient(135deg,#2563EB,#06B6D4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontSize:8, color:'#fff' }}>💬</span>
                    </div>
                    <div style={{ fontSize:10, color:'#2563EB', fontWeight:600, alignSelf:'center' }}>Chat opens</div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:15, fontWeight:700, color:'#0F172A', marginBottom:4 }}>Visitor arrives</div>
                <div style={{ fontSize:13, color:'#64748B', lineHeight:1.6 }}>A visitor lands on your website looking for instant answers.</div>
              </div>
            </div>

            {/* Connector */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', paddingBottom:80 }}>
              <div style={{ height:2, width:'100%', background:'linear-gradient(90deg,#BFDBFE,#93C5FD)', borderRadius:1, position:'relative' }}>
                <div style={{ position:'absolute', right:-5, top:'50%', transform:'translateY(-50%)', width:10, height:10, borderRadius:'50%', background:'#2563EB', boxShadow:'0 0 0 3px rgba(37,99,235,0.2)' }} />
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:42, fontWeight:900, color:'rgba(37,99,235,0.18)', marginBottom:12 }}>02</div>
              <div style={{ background:'#fff', border:'1px solid #DBEAFE', borderRadius:16, padding:20, boxShadow:'0 4px 20px rgba(37,99,235,0.08)' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', letterSpacing:'1px', textTransform:'uppercase', marginBottom:10 }}>AI Dashboard</div>
                <div style={{ display:'flex', justifyContent:'center', gap:10, alignItems:'center' }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#2563EB,#06B6D4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🤖</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    {['📄 PDF','❓ FAQs','📝 Articles'].map(l=>(
                      <div key={l} style={{ background:'#F1F5F9', borderRadius:6, padding:'3px 8px', fontSize:10, color:'#475569', fontWeight:500 }}>{l}</div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:15, fontWeight:700, color:'#0F172A', marginBottom:4 }}>NivoChat AI answers</div>
                <div style={{ fontSize:13, color:'#64748B', lineHeight:1.6 }}>Instantly answers questions using your business information.</div>
              </div>
            </div>

            {/* Connector */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', paddingBottom:80 }}>
              <div style={{ height:2, width:'100%', background:'linear-gradient(90deg,#93C5FD,#BFDBFE)', borderRadius:1, position:'relative' }}>
                <div style={{ position:'absolute', right:-5, top:'50%', transform:'translateY(-50%)', width:10, height:10, borderRadius:'50%', background:'#2563EB', boxShadow:'0 0 0 3px rgba(37,99,235,0.2)' }} />
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:42, fontWeight:900, color:'rgba(37,99,235,0.18)', marginBottom:12 }}>03</div>
              <div style={{ background:'#fff', border:'1px solid #DBEAFE', borderRadius:16, padding:20, boxShadow:'0 4px 20px rgba(37,99,235,0.08)' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', letterSpacing:'1px', textTransform:'uppercase', marginBottom:10 }}>CRM</div>
                <div style={{ background:'#F1F5F9', borderRadius:8, padding:10 }}>
                  <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:6 }}>
                    <span style={{ background:'#10B981', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:6 }}>NEW LEAD</span>
                  </div>
                  {['Name','Email','Interests'].map(f=>(
                    <div key={f} style={{ marginBottom:5 }}>
                      <div style={{ fontSize:9, color:'#94A3B8', marginBottom:2 }}>{f}</div>
                      <div style={{ height:7, background:'#E2E8F0', borderRadius:3 }} />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:15, fontWeight:700, color:'#0F172A', marginBottom:4 }}>Lead captured</div>
                <div style={{ fontSize:13, color:'#64748B', lineHeight:1.6 }}>Visitor details captured automatically in your dashboard.</div>
              </div>
            </div>

            {/* Connector */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', paddingBottom:80 }}>
              <div style={{ height:2, width:'100%', background:'linear-gradient(90deg,#BFDBFE,#93C5FD)', borderRadius:1, position:'relative' }}>
                <div style={{ position:'absolute', right:-5, top:'50%', transform:'translateY(-50%)', width:10, height:10, borderRadius:'50%', background:'#2563EB', boxShadow:'0 0 0 3px rgba(37,99,235,0.2)' }} />
              </div>
            </div>

            {/* Step 4 */}
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:42, fontWeight:900, color:'rgba(37,99,235,0.18)', marginBottom:12 }}>04</div>
              <div style={{ background:'#fff', border:'1px solid #DBEAFE', borderRadius:16, padding:20, boxShadow:'0 4px 20px rgba(37,99,235,0.08)' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', letterSpacing:'1px', textTransform:'uppercase', marginBottom:10 }}>Team Collab</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', background:'#DBEAFE' }} />
                    <div style={{ height:8, background:'#E2E8F0', borderRadius:4, flex:1 }} />
                  </div>
                  <div style={{ display:'flex', gap:6, alignItems:'center', justifyContent:'flex-end' }}>
                    <div style={{ height:8, background:'#DBEAFE', borderRadius:4, flex:1 }} />
                    <div style={{ width:22, height:22, borderRadius:'50%', background:'#BBF7D0' }} />
                  </div>
                  <div style={{ textAlign:'center', marginTop:4 }}>
                    <span style={{ background:'#10B981', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:8 }}>HANDOFF</span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:15, fontWeight:700, color:'#0F172A', marginBottom:4 }}>Human takes over</div>
                <div style={{ fontSize:13, color:'#64748B', lineHeight:1.6 }}>Conversations handed to your team whenever needed.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INSTALL IN 5 MINUTES ── */}
      <section id="integrations" style={{ padding:'100px 24px', background:'#fff', borderTop:'1px solid #E2E8F0' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center' }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 14px', borderRadius:99, background:'#EFF6FF', color:'#2563EB', fontSize:12, fontWeight:700, marginBottom:20 }}>
              ⚡ Setup in 5 minutes
            </div>
            <h2 style={{ fontSize:38, fontWeight:800, color:'#0F172A', letterSpacing:'-.02em', marginBottom:16, lineHeight:1.15 }}>
              One line of code.<br/>Infinite conversations.
            </h2>
            <p style={{ fontSize:16, color:'#64748B', lineHeight:1.7, marginBottom:36 }}>
              Paste one script tag on your website and NivoChat is live. No developer needed. Works on any platform.
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
              {[
                ['1','Create your account', 'Sign up free at nivochat.idataone.com. No credit card required.'],
                ['2','Train your bot', 'Add your company description, upload PDFs, or paste your website URL.'],
                ['3','Copy your embed code', 'One script tag. Paste it before </body> on any page.'],
                ['4','Go live', 'Your AI chat widget appears instantly — ready to answer visitors.'],
              ].map(([n, title, desc]) => (
                <div key={n} style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                  <div style={{ width:34, height:34, borderRadius:10, background:'#EFF6FF', color:'#2563EB', fontWeight:800, fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{n}</div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#0F172A', marginBottom:4 }}>{title}</div>
                    <div style={{ fontSize:13, color:'#64748B', lineHeight:1.6 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Code snippet */}
          <div>
            <div style={{ background:'#0F172A', borderRadius:18, overflow:'hidden', boxShadow:'0 24px 60px rgba(0,0,0,0.2)' }}>
              {/* Terminal bar */}
              <div style={{ padding:'14px 20px', background:'#1E293B', display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ display:'flex', gap:6 }}>
                  {['#F87171','#FBBF24','#34D399'].map(c=><div key={c} style={{ width:11, height:11, borderRadius:'50%', background:c }} />)}
                </div>
                <span style={{ fontSize:11, color:'#64748B', marginLeft:8, fontFamily:'monospace' }}>index.html</span>
              </div>
              <div style={{ padding:'24px', fontFamily:'monospace', fontSize:13, lineHeight:2, color:'#E2E8F0' }}>
                <div style={{ color:'#64748B' }}>{`<!-- Paste before </body> -->`}</div>
                <div style={{ color:'#93C5FD' }}>{`<script`}</div>
                <div style={{ paddingLeft:16 }}>
                  <span style={{ color:'#86EFAC' }}>src</span>
                  <span style={{ color:'#E2E8F0' }}>=</span>
                  <span style={{ color:'#FDE68A' }}>{`"https://nivochat.idataone.com/`}</span>
                </div>
                <div style={{ paddingLeft:16 }}>
                  <span style={{ color:'#FDE68A' }}>{`widget.js?id=YOUR_ID"`}</span>
                </div>
                <div style={{ paddingLeft:16 }}>
                  <span style={{ color:'#86EFAC' }}>async</span>
                </div>
                <div style={{ color:'#93C5FD' }}>{`></script>`}</div>
              </div>
            </div>

            {/* Platform badges */}
            <div style={{ marginTop:24 }}>
              <div style={{ fontSize:12, color:'#94A3B8', fontWeight:600, marginBottom:14, textTransform:'uppercase', letterSpacing:'1px' }}>Works on any platform</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                {['WordPress','Webflow','Shopify','Wix','Squarespace','React','Vue','Any HTML'].map(p=>(
                  <span key={p} style={{ padding:'6px 14px', background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontWeight:600, color:'#475569' }}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE ANALYTICS ── */}
      <section style={{ padding:'100px 24px', background:'#F8FAFC', borderTop:'1px solid #E2E8F0' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', maxWidth:600, margin:'0 auto 56px' }}>
            <h2 style={{ fontSize:38, fontWeight:800, color:'#0F172A', letterSpacing:'-.02em', marginBottom:14 }}>See every visitor. Capture every opportunity.</h2>
            <p style={{ fontSize:17, color:'#64748B', lineHeight:1.7 }}>Know who's on your website and what they're interested in.</p>
          </div>
          <div className="card" style={{ padding:32, boxShadow:'0 8px 40px rgba(0,0,0,0.07)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #F1F5F9', paddingBottom:20, marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ width:10, height:10, borderRadius:'50%', background:'#10B981', display:'inline-block' }} className="pulse" />
                <span style={{ fontWeight:700, color:'#1E293B', fontSize:14 }}>Live Visitors: <span style={{ color:'#2563EB' }}>12</span></span>
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:'#64748B', letterSpacing:'1px', textTransform:'uppercase' }}>Real-time Analytics</span>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', fontSize:13, borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#F8FAFC', borderBottom:'1px solid #F1F5F9' }}>
                    {['Visitor','Company','Location','Page','Source','Time'].map(h=>(
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontWeight:700, fontSize:11, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.8px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[['John Mathew','ACME Corp','Chennai, IN','Pricing','Google','2m'],['Sarah Williams','TechFlow','Bangalore, IN','Services','LinkedIn','3m']].map(([n,co,loc,pg,src,t],i)=>(
                    <tr key={i} style={{ borderBottom:'1px solid #F8FAFC' }}>
                      <td style={{ padding:'14px 16px', fontWeight:700, color:'#0F172A' }}>{n}</td>
                      <td style={{ padding:'14px 16px', color:'#475569' }}>{co}</td>
                      <td style={{ padding:'14px 16px', color:'#475569' }}>{loc}</td>
                      <td style={{ padding:'14px 16px' }}><span style={{ background:'#EFF6FF', color:'#1D4ED8', fontWeight:600, padding:'3px 10px', borderRadius:6, fontSize:12 }}>{pg}</span></td>
                      <td style={{ padding:'14px 16px', color:'#475569' }}>{src}</td>
                      <td style={{ padding:'14px 16px', color:'#64748B' }}>{t}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>


      {/* ── INTEGRATIONS ── */}
      <section style={{ padding:'80px 24px', background:'#fff', borderTop:'1px solid #E2E8F0' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#64748B', letterSpacing:'2px', textTransform:'uppercase', marginBottom:16 }}>Works with your existing tools</div>
          <h2 style={{ fontSize:34, fontWeight:800, color:'#0F172A', letterSpacing:'-.02em', marginBottom:12 }}>Connect your favourite tools</h2>
          <p style={{ fontSize:16, color:'#64748B', maxWidth:520, margin:'0 auto 48px', lineHeight:1.7 }}>NivoChat connects with the tools you already use — no extra setup needed.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:20, textAlign:'left' }}>
            {[
              { icon:'🟠', name:'HubSpot', desc:'Auto-create and update contacts in HubSpot when a lead is captured. Zero manual entry.', badge:'CRM' },
              { icon:'⚡', name:'Zapier', desc:'Connect to 6,000+ apps. Fire a Zap on every lead capture — Slack, Sheets, email, you name it.', badge:'Automation' },
              { icon:'📅', name:'Calendly', desc:'Qualified leads get a booking link inside the chat. Book discovery calls without leaving the conversation.', badge:'Scheduling' },
              { icon:'🤖', name:'Claude & ChatGPT', desc:'Bring your own API key. Use Claude Sonnet, Claude Haiku, GPT-4o, or GPT-4o Mini — your choice.', badge:'AI' },
            ].map(({ icon, name, desc, badge }) => (
              <div key={name} style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:16, padding:24 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:28 }}>{icon}</span>
                    <span style={{ fontSize:16, fontWeight:700, color:'#0F172A' }}>{name}</span>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, color:'#2563EB', background:'#EFF6FF', padding:'3px 10px', borderRadius:99, letterSpacing:'0.5px' }}>{badge}</span>
                </div>
                <p style={{ fontSize:13, color:'#64748B', lineHeight:1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── FOOTER (iDataOne style) ── */}
      <footer style={{ background:'#0B1120', color:'#94A3B8', padding:'56px 24px 32px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:48, marginBottom:48 }}>
            {/* Brand */}
            <div>
              <div style={{ marginBottom:16 }}>
                <img src="/logo.png" alt="NivoChat" style={{ height:52, width:'auto', objectFit:'contain' }} />
              </div>
              <p style={{ fontSize:13, lineHeight:1.7, color:'#64748B', maxWidth:260 }}>
                AI-powered chat for your website. Answer questions, capture leads, and close more deals — 24/7.
              </p>
              <div style={{ marginTop:20, display:'flex', gap:12 }}>
                <a href="https://idataone.com" style={{ fontSize:12, color:'#475569', fontWeight:500 }}>iDataOne.com</a>
                <span style={{ color:'#1E293B' }}>·</span>
                <a href="mailto:info@idataone.com" style={{ fontSize:12, color:'#475569', fontWeight:500 }}>info@idataone.com</a>
              </div>
            </div>

            {/* Product */}
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#fff', letterSpacing:'1px', textTransform:'uppercase', marginBottom:16 }}>Product</div>
              {['How It Works','Integrations','Pricing','Login'].map(l=>(
                <a key={l} href={l==='Login'?'/auth/login':`#${l.toLowerCase().replace(/ /g,'-')}`} style={{ display:'block', fontSize:13, color:'#64748B', marginBottom:10, transition:'color .15s' }}
                  onMouseOver={e=>e.target.style.color='#E2E8F0'} onMouseOut={e=>e.target.style.color='#64748B'}>{l}</a>
              ))}
            </div>

            {/* Company */}
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#fff', letterSpacing:'1px', textTransform:'uppercase', marginBottom:16 }}>Company</div>
              {[['iDataOne','https://idataone.com'],['Case Studies','https://idataone.com/case-studies'],['Contact','https://idataone.com/contact'],['WhatsApp','https://wa.me/916385155341']].map(([l,h])=>(
                <a key={l} href={h} target="_blank" rel="noopener" style={{ display:'block', fontSize:13, color:'#64748B', marginBottom:10 }}
                  onMouseOver={e=>e.target.style.color='#E2E8F0'} onMouseOut={e=>e.target.style.color='#64748B'}>{l}</a>
              ))}
            </div>

            {/* Other products */}
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#fff', letterSpacing:'1px', textTransform:'uppercase', marginBottom:16 }}>Also by iDataOne</div>
              {[['Infra360 PMS','https://idataone.com/infra360PMS'],['iSportOne','https://idataone.com/isportone'],['DatInsights','https://idataone.com']].map(([l,h])=>(
                <a key={l} href={h} target="_blank" rel="noopener" style={{ display:'block', fontSize:13, color:'#64748B', marginBottom:10 }}
                  onMouseOver={e=>e.target.style.color='#E2E8F0'} onMouseOut={e=>e.target.style.color='#64748B'}>{l}</a>
              ))}
            </div>
          </div>

          <div style={{ borderTop:'1px solid #1E293B', paddingTop:28, display:'flex', justifyContent:'flex-end' }}>
            <p style={{ fontSize:12, color:'#334155' }}>
              <a href="https://idataone.com" style={{ color:'#475569' }}>Built by iDataOne</a> · Chennai, India 🇮🇳
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
