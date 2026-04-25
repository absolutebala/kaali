'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const TENANT_ID = '837d7fc7-cd93-437c-957d-9a7dbbab4214'

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    // Load live demo widget
    const s = document.createElement('script')
    s.src = `https://aichat.absoluteapplabs.com/widget.js?id=${TENANT_ID}`
    s.async = true
    document.body.appendChild(s)
    return () => { window.removeEventListener('scroll', onScroll); s.remove() }
  }, [])

  return (
    <div style={{ fontFamily:"'DM Sans', sans-serif", background:'#0A0A0A', color:'#F5F0EB', minHeight:'100vh', overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --orange: #FF5C00;
          --orange-light: #FF8A40;
          --orange-glow: rgba(255,92,0,0.15);
          --surface: #141414;
          --border: rgba(255,255,255,0.08);
          --text: #F5F0EB;
          --muted: #8A8070;
        }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--orange); color: #fff; padding: 14px 28px;
          border-radius: 100px; font-size: 15px; font-weight: 500;
          text-decoration: none; transition: all 0.2s;
          border: none; cursor: pointer;
        }
        .btn-primary:hover { background: var(--orange-light); transform: translateY(-1px); box-shadow: 0 8px 32px rgba(255,92,0,0.4); }
        .btn-ghost {
          display: inline-flex; align-items: center;
          background: transparent; color: var(--text); padding: 14px 28px;
          border-radius: 100px; font-size: 15px; font-weight: 400;
          text-decoration: none; transition: all 0.2s;
          border: 1px solid var(--border);
        }
        .btn-ghost:hover { border-color: var(--orange); color: var(--orange); }
        .feature-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 28px;
          transition: all 0.2s;
        }
        .feature-card:hover { border-color: rgba(255,92,0,0.3); transform: translateY(-2px); }
        .section { padding: 100px 0; }
        .container { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
        .tag { display: inline-block; background: var(--orange-glow); color: var(--orange);
          border: 1px solid rgba(255,92,0,0.2); padding: 6px 14px; border-radius: 100px;
          font-size: 13px; font-weight: 500; letter-spacing: 0.02em; margin-bottom: 20px; }
        h1, h2 { font-family: 'Syne', sans-serif; }
        .gradient-text { background: linear-gradient(135deg, var(--orange) 0%, #FFB347 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .divider { height: 1px; background: var(--border); }
        @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.6 } 100% { transform: scale(1.4); opacity: 0 } }
        @keyframes fade-up { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        .fade-up { animation: fade-up 0.6s ease forwards; }
        .step-line { position: absolute; left: 19px; top: 44px; bottom: 0; width: 1px; background: linear-gradient(to bottom, var(--orange), transparent); }
      `}</style>

      {/* NAV */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between',
        background: scrolled ? 'rgba(10,10,10,0.95)' : 'transparent', backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none', transition:'all 0.3s' }}>
        <div style={{ fontFamily:'Syne, sans-serif', fontSize:20, fontWeight:800 }}>
          Absolute <span style={{ color:'var(--orange)' }}>AIChat</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:32, fontSize:14, color:'var(--muted)' }}>
          <a href="#features" style={{ color:'var(--muted)', textDecoration:'none' }}>Features</a>
          <a href="#how" style={{ color:'var(--muted)', textDecoration:'none' }}>How it works</a>
          <a href="#pricing" style={{ color:'var(--muted)', textDecoration:'none' }}>Pricing</a>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <Link href="/auth/login" className="btn-ghost" style={{ padding:'10px 20px', fontSize:14 }}>Sign in</Link>
          <Link href="/auth/register" className="btn-primary" style={{ padding:'10px 20px', fontSize:14 }}>Get started free</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ paddingTop:160, paddingBottom:100, position:'relative', overflow:'hidden' }}>
        {/* Background glow */}
        <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:600, height:400, background:'radial-gradient(ellipse, rgba(255,92,0,0.12) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div className="container" style={{ textAlign:'center', position:'relative' }}>
          <div className="tag fade-up">🤖 AI-powered chat for your business</div>
          <h1 className="fade-up" style={{ fontSize:'clamp(48px,7vw,88px)', lineHeight:1.05, fontWeight:800, marginBottom:24, animationDelay:'0.1s' }}>
            Turn visitors into<br /><span className="gradient-text">leads & customers</span>
          </h1>
          <p className="fade-up" style={{ fontSize:20, color:'var(--muted)', maxWidth:560, margin:'0 auto 40px', lineHeight:1.6, animationDelay:'0.2s' }}>
            Deploy an intelligent AI chat assistant on your website in minutes. Powered by Claude or ChatGPT. Built on your knowledge base.
          </p>
          <div className="fade-up" style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap', animationDelay:'0.3s' }}>
            <Link href="/auth/register" className="btn-primary" style={{ fontSize:16, padding:'16px 36px' }}>
              Start for free →
            </Link>
            <a href="#how" className="btn-ghost" style={{ fontSize:16, padding:'16px 36px' }}>
              See how it works
            </a>
          </div>
          <p style={{ marginTop:20, fontSize:13, color:'var(--muted)' }}>No credit card required · Free plan available · Live in 5 minutes</p>

          {/* Hero visual */}
          <div className="fade-up" style={{ marginTop:72, animationDelay:'0.4s' }}>
            <div style={{ display:'inline-block', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:3, boxShadow:'0 40px 80px rgba(0,0,0,0.6)' }}>
              <div style={{ background:'#0D0D0D', borderRadius:18, padding:24, minWidth:320, textAlign:'left' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg, var(--orange), #FF8A40)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne', fontWeight:800, fontSize:14, color:'#fff' }}>K</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500 }}>Kaali</div>
                    <div style={{ fontSize:11, color:'#5EDFAC' }}>● Online</div>
                  </div>
                </div>
                {[
                  { role:'bot', msg:"Hi! 👋 I'm Kaali. What brings you here today?" },
                  { role:'user', msg:"I want to build a mobile app" },
                  { role:'bot', msg:"Great! We've built 50+ apps. What type — iOS, Android, or both? I can connect you with our team." },
                ].map((m, i) => (
                  <div key={i} style={{ marginBottom:12, display:'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth:'80%', padding:'10px 14px', borderRadius:14, fontSize:13, lineHeight:1.5,
                      background: m.role==='user' ? 'var(--orange)' : 'rgba(255,255,255,0.06)',
                      color: m.role==='user' ? '#fff' : 'var(--text)' }}>
                      {m.msg}
                    </div>
                  </div>
                ))}
                <div style={{ marginTop:16, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'var(--muted)', display:'flex', justifyContent:'space-between' }}>
                  <span>Type your message…</span>
                  <span style={{ color:'var(--orange)' }}>➤</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGOS */}
      <section style={{ padding:'40px 0', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
        <div className="container" style={{ textAlign:'center' }}>
          <p style={{ fontSize:13, color:'var(--muted)', marginBottom:24 }}>WORKS WITH YOUR FAVOURITE AI PROVIDERS</p>
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:48, flexWrap:'wrap' }}>
            {['Claude (Anthropic)', 'ChatGPT (OpenAI)', 'HubSpot', 'Zoho CRM', 'Zapier', 'Stripe'].map(name => (
              <span key={name} style={{ fontSize:15, fontWeight:500, color:'var(--muted)' }}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="section">
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <div className="tag">Features</div>
            <h2 style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:800, lineHeight:1.1 }}>
              Everything you need to<br />convert visitors into leads
            </h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:16 }}>
            {[
              { icon:'🤖', title:'AI-Powered Chat', desc:'Claude or ChatGPT — bring your own API key. We never mark up AI usage.' },
              { icon:'📚', title:'Smart Knowledge Base', desc:'Upload PDFs, scrape URLs, add Q&A pairs. Bot answers from your content only.' },
              { icon:'👥', title:'Lead Capture', desc:'Automatically captures name, email, company from natural conversation.' },
              { icon:'🔴', title:'Live Agent Handoff', desc:'Visitor requests a human — agent gets notified, takes over chat in real time.' },
              { icon:'🏢', title:'Visitor Intelligence', desc:'Company name, location, device, browser, referrer — for every chat.' },
              { icon:'🔗', title:'CRM Integrations', desc:'HubSpot, Zoho CRM, Zapier — leads sync automatically on capture.' },
              { icon:'👤', title:'Team Access', desc:'Invite team members with Admin, Sales, or Custom role-based permissions.' },
              { icon:'🎨', title:'Fully Customisable', desc:'Your bot name, avatar, bubble color, widget mode. Embed with one line of code.' },
              { icon:'📊', title:'Lead Dashboard', desc:'Track leads, update status, export CSV, view full conversation transcripts.' },
            ].map((f, i) => (
              <div key={i} className="feature-card">
                <div style={{ fontSize:28, marginBottom:12 }}>{f.icon}</div>
                <h3 style={{ fontFamily:'Syne', fontSize:18, fontWeight:700, marginBottom:8 }}>{f.title}</h3>
                <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="section" style={{ background:'var(--surface)' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <div className="tag">How it works</div>
            <h2 style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:800 }}>Live in 5 minutes</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:32, maxWidth:800, margin:'0 auto' }}>
            {[
              { n:'01', title:'Sign up free', desc:'Create your workspace. No credit card needed.' },
              { n:'02', title:'Add your knowledge', desc:'Upload PDFs, paste your website URL, or type Q&A pairs.' },
              { n:'03', title:'Connect your AI key', desc:'Paste your Anthropic or OpenAI API key. We encrypt it.' },
              { n:'04', title:'Embed one line', desc:'Copy the script tag and paste it into your website. Done.' },
            ].map((s, i) => (
              <div key={i} style={{ position:'relative' }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:'var(--orange-glow)', border:'1px solid rgba(255,92,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'var(--orange)', marginBottom:16 }}>{s.n}</div>
                <h3 style={{ fontFamily:'Syne', fontSize:18, fontWeight:700, marginBottom:8 }}>{s.title}</h3>
                <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <div className="tag">Testimonials</div>
            <h2 style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:800 }}>Loved by businesses</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:16 }}>
            {[
              { quote:"We went live in under 10 minutes. Within the first week, the bot captured 14 qualified leads while we slept.", name:"Sarah Chen", role:"Founder, TechFlow", avatar:"SC" },
              { quote:"The live handoff feature is incredible. Visitors get instant AI responses, and when they're ready, I jump in seamlessly.", name:"Marcus Rivera", role:"Sales Lead, Growthly", avatar:"MR" },
              { quote:"Finally a chatbot that actually understands our business. The knowledge base training is a game changer.", name:"Priya Nair", role:"Head of Marketing, LaunchPad", avatar:"PN" },
            ].map((t, i) => (
              <div key={i} className="feature-card">
                <div style={{ marginBottom:16, color:'var(--orange)', fontSize:20 }}>★★★★★</div>
                <p style={{ fontSize:15, lineHeight:1.7, color:'rgba(245,240,235,0.85)', marginBottom:20 }}>"{t.quote}"</p>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg, var(--orange), #FF8A40)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff' }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500 }}>{t.name}</div>
                    <div style={{ fontSize:12, color:'var(--muted)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="section" style={{ background:'var(--surface)' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <div className="tag">Pricing</div>
            <h2 style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:800 }}>Simple, transparent pricing</h2>
            <p style={{ marginTop:12, color:'var(--muted)', fontSize:16 }}>You bring your own AI key — we never mark up AI usage</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:16, maxWidth:900, margin:'0 auto' }}>
            {[
              { name:'Starter', price:'$0', period:'forever', color:'var(--muted)', features:['100 messages/mo','1 PDF upload','Lead dashboard','Claude or ChatGPT'], cta:'Start free' },
              { name:'Growth', price:'$29', period:'/month', color:'var(--orange)', featured:true, features:['2,000 messages/mo','10 PDF uploads','Full analytics','Usage alerts','HubSpot + Zapier'], cta:'Get started' },
              { name:'Business', price:'$79', period:'/month', color:'#fff', features:['Unlimited messages','Unlimited PDFs','Priority support','Advanced analytics','All integrations','Team members'], cta:'Get started' },
            ].map((p, i) => (
              <div key={i} style={{ background: p.featured ? 'linear-gradient(135deg, rgba(255,92,0,0.15), rgba(255,92,0,0.05))' : '#0D0D0D',
                border: p.featured ? '1px solid rgba(255,92,0,0.4)' : '1px solid var(--border)',
                borderRadius:20, padding:32, position:'relative' }}>
                {p.featured && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'var(--orange)', color:'#fff', fontSize:11, fontWeight:600, padding:'4px 14px', borderRadius:100, letterSpacing:'0.05em' }}>MOST POPULAR</div>}
                <div style={{ fontSize:15, fontWeight:500, color:p.color, marginBottom:16 }}>{p.name}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:24 }}>
                  <span style={{ fontFamily:'Syne', fontSize:48, fontWeight:800 }}>{p.price}</span>
                  <span style={{ color:'var(--muted)', fontSize:15 }}>{p.period}</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, color:'rgba(245,240,235,0.8)' }}>
                      <span style={{ color:'var(--orange)', fontSize:16 }}>✓</span>{f}
                    </div>
                  ))}
                </div>
                <Link href="/auth/register" className="btn-primary" style={{ width:'100%', justifyContent:'center', background: p.featured ? 'var(--orange)' : 'rgba(255,255,255,0.08)', color: p.featured ? '#fff' : 'var(--text)' }}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container" style={{ textAlign:'center' }}>
          <div style={{ background:'linear-gradient(135deg, rgba(255,92,0,0.12), rgba(255,92,0,0.04))', border:'1px solid rgba(255,92,0,0.2)', borderRadius:24, padding:'80px 40px' }}>
            <h2 style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:800, marginBottom:16 }}>
              Ready to turn visitors<br />into <span className="gradient-text">customers?</span>
            </h2>
            <p style={{ fontSize:18, color:'var(--muted)', marginBottom:36 }}>Start free. No credit card. Live in 5 minutes.</p>
            <Link href="/auth/register" className="btn-primary" style={{ fontSize:17, padding:'18px 44px' }}>
              Get started free →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:'1px solid var(--border)', padding:'40px 24px' }}>
        <div className="container" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:20 }}>
          <div style={{ fontFamily:'Syne', fontSize:18, fontWeight:800 }}>
            Absolute <span style={{ color:'var(--orange)' }}>AIChat</span>
          </div>
          <div style={{ display:'flex', gap:32, fontSize:14, color:'var(--muted)' }}>
            <Link href="/auth/login" style={{ color:'var(--muted)', textDecoration:'none' }}>Sign in</Link>
            <Link href="/auth/register" style={{ color:'var(--muted)', textDecoration:'none' }}>Register</Link>
            <a href="https://absoluteapplabs.com" target="_blank" rel="noopener" style={{ color:'var(--muted)', textDecoration:'none' }}>Absolute App Labs</a>
          </div>
          <div style={{ fontSize:13, color:'var(--muted)' }}>© 2026 Absolute App Labs</div>
        </div>
      </footer>
    </div>
  )
}
