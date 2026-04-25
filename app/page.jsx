'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const TENANT_ID = '837d7fc7-cd93-437c-957d-9a7dbbab4214'

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    const s = document.createElement('script')
    s.src = `https://aichat.absoluteapplabs.com/widget.js?id=${TENANT_ID}`
    s.async = true
    document.body.appendChild(s)
    return () => { window.removeEventListener('scroll', onScroll); s.remove() }
  }, [])

  return (
    <div style={{ fontFamily:"'Poppins', sans-serif", background:'#FAFAF8', color:'#1A1A1A', minHeight:'100vh', overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --orange: #FF5C00;
          --orange2: #FF8C42;
          --orange-pale: #FFF4EE;
          --dark: #1A1A1A;
          --muted: #6B6B6B;
          --border: #E8E4DF;
          --surface: #FFFFFF;
          --bg: #FAFAF8;
        }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--orange); color: #fff; padding: 14px 32px;
          border-radius: 8px; font-size: 15px; font-weight: 600;
          text-decoration: none; transition: all 0.2s; font-family: Poppins, sans-serif;
          border: none; cursor: pointer; letter-spacing: -0.01em;
        }
        .btn-primary:hover { background: #E64D00; transform: translateY(-1px); box-shadow: 0 12px 40px rgba(255,92,0,0.3); }
        .btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: var(--dark); padding: 14px 32px;
          border-radius: 8px; font-size: 15px; font-weight: 500;
          text-decoration: none; transition: all 0.2s; font-family: Poppins, sans-serif;
          border: 1.5px solid var(--border); cursor: pointer;
        }
        .btn-outline:hover { border-color: var(--orange); color: var(--orange); }
        .feature-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 28px 24px; transition: all 0.25s;
        }
        .feature-card:hover { border-color: var(--orange2); box-shadow: 0 8px 40px rgba(255,92,0,0.08); transform: translateY(-3px); }
        .section { padding: 96px 0; }
        .container { max-width: 1140px; margin: 0 auto; padding: 0 32px; }
        .tag { display: inline-block; background: var(--orange-pale); color: var(--orange);
          border: 1px solid rgba(255,92,0,0.15); padding: 5px 14px; border-radius: 6px;
          font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 16px; }
        .gradient-text { background: linear-gradient(135deg, var(--orange) 0%, var(--orange2) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .plan-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 20px; padding: 36px 32px; transition: all 0.2s; }
        .plan-card.featured { border-color: var(--orange); box-shadow: 0 0 0 4px rgba(255,92,0,0.08); }
        nav a { color: var(--muted); text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        nav a:hover { color: var(--orange); }
        @keyframes fade-up { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        .fade-up { animation: fade-up 0.7s ease forwards; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .chat-float { animation: float 4s ease-in-out infinite; }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-visual { display: none !important; }
          .plan-grid { grid-template-columns: 1fr !important; }
          .feat-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100,
        background: scrolled ? 'rgba(250,250,248,0.96)' : 'rgba(250,250,248,0.8)',
        backdropFilter:'blur(16px)', borderBottom:`1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
        transition:'all 0.3s', padding:'0 32px' }}>
        <div style={{ maxWidth:1140, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:68 }}>
          <div style={{ fontFamily:'Poppins', fontSize:18, fontWeight:700, letterSpacing:'-0.02em' }}>
            Absolute <span style={{ color:'var(--orange)' }}>AIChat</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:36 }}>
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <Link href="/auth/login" className="btn-outline" style={{ padding:'10px 22px', fontSize:14 }}>Sign in</Link>
            <Link href="/auth/register" className="btn-primary" style={{ padding:'10px 22px', fontSize:14 }}>Get started free</Link>
          </div>
        </div>
      </nav>

      {/* HERO — full viewport rectangle */}
      <section style={{ minHeight:'100vh', display:'flex', alignItems:'center', paddingTop:68, background:'linear-gradient(135deg, #FFFBF8 0%, #FFF4EE 50%, #FAFAF8 100%)' }}>
        <div className="container" style={{ width:'100%' }}>
          <div className="hero-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>

            {/* Left — text */}
            <div>
              <div className="tag fade-up">AI Chat Platform</div>
              <h1 className="fade-up" style={{ fontSize:'clamp(36px,4.5vw,58px)', fontWeight:800, lineHeight:1.1, letterSpacing:'-0.03em', marginBottom:20, animationDelay:'0.05s' }}>
                Turn every website<br />visitor into a <span className="gradient-text">paying customer</span>
              </h1>
              <p className="fade-up" style={{ fontSize:17, color:'var(--muted)', lineHeight:1.7, marginBottom:36, animationDelay:'0.1s', maxWidth:440 }}>
                Deploy an AI chat assistant trained on your business in minutes. Capture leads, answer questions 24/7, and hand off to live agents — all from one platform.
              </p>
              <div className="fade-up" style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:32, animationDelay:'0.15s' }}>
                <Link href="/auth/register" className="btn-primary" style={{ fontSize:16, padding:'15px 36px' }}>
                  Start free — no card needed
                </Link>
                <a href="#how" className="btn-outline" style={{ fontSize:16, padding:'15px 28px' }}>
                  See how it works
                </a>
              </div>
              <div className="fade-up" style={{ display:'flex', alignItems:'center', gap:24, animationDelay:'0.2s' }}>
                {[['100+','Businesses'], ['24/7','AI support'], ['5 min','Setup time']].map(([n, l]) => (
                  <div key={l}>
                    <div style={{ fontSize:22, fontWeight:700, color:'var(--orange)' }}>{n}</div>
                    <div style={{ fontSize:12, color:'var(--muted)', fontWeight:500 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — visual */}
            <div className="hero-visual fade-up" style={{ animationDelay:'0.2s', position:'relative' }}>
              {/* Background blob */}
              <div style={{ position:'absolute', inset:'-20px', background:'radial-gradient(ellipse at 60% 40%, rgba(255,92,0,0.1) 0%, transparent 70%)', borderRadius:'50%', filter:'blur(40px)' }} />

              {/* Main chat window */}
              <div className="chat-float" style={{ background:'#fff', borderRadius:20, boxShadow:'0 24px 80px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)', overflow:'hidden', position:'relative' }}>
                {/* Header */}
                <div style={{ background:'linear-gradient(135deg, var(--orange), var(--orange2))', padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#fff' }}>K</div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#fff' }}>Kaali — AI Assistant</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.8)' }}>● Online · Replies instantly</div>
                  </div>
                </div>
                {/* Messages */}
                <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12, background:'#F9F9F9', minHeight:220 }}>
                  <div style={{ background:'#fff', borderRadius:'16px 16px 16px 4px', padding:'12px 16px', fontSize:14, maxWidth:'80%', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', lineHeight:1.5 }}>
                    Hi! 👋 I'm Kaali. What brings you here today?
                  </div>
                  <div style={{ background:'var(--orange)', borderRadius:'16px 16px 4px 16px', padding:'12px 16px', fontSize:14, maxWidth:'80%', alignSelf:'flex-end', color:'#fff', lineHeight:1.5 }}>
                    I want to build a mobile app for my business
                  </div>
                  <div style={{ background:'#fff', borderRadius:'16px 16px 16px 4px', padding:'12px 16px', fontSize:14, maxWidth:'80%', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', lineHeight:1.5 }}>
                    Great! We've built 50+ apps. Could I get your name and email to connect you with our team? 🚀
                  </div>
                </div>
                {/* Input */}
                <div style={{ padding:'12px 16px', borderTop:'1px solid #EFEFEF', display:'flex', gap:10, alignItems:'center', background:'#fff' }}>
                  <input readOnly placeholder="Type your message…" style={{ flex:1, border:'1px solid #E8E8E8', borderRadius:8, padding:'10px 14px', fontSize:14, color:'#999', outline:'none', background:'#FAFAFA', fontFamily:'Poppins' }} />
                  <div style={{ width:36, height:36, background:'var(--orange)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                    <span style={{ color:'#fff', fontSize:14 }}>➤</span>
                  </div>
                </div>
              </div>

              {/* Floating stat badges */}
              <div style={{ position:'absolute', top:-16, right:-16, background:'#fff', borderRadius:12, padding:'10px 16px', boxShadow:'0 8px 24px rgba(0,0,0,0.1)', fontSize:13, fontWeight:600, border:'1px solid var(--border)' }}>
                ✅ Lead captured!
              </div>
              <div style={{ position:'absolute', bottom:24, left:-24, background:'#fff', borderRadius:12, padding:'10px 16px', boxShadow:'0 8px 24px rgba(0,0,0,0.1)', fontSize:13, fontWeight:600, border:'1px solid var(--border)' }}>
                🔴 Live agent joined
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="section" style={{ background:'#fff' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div className="tag">Features</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:800, letterSpacing:'-0.03em', marginBottom:12 }}>
              Everything to convert visitors into leads
            </h2>
            <p style={{ fontSize:17, color:'var(--muted)', maxWidth:500, margin:'0 auto' }}>One platform. Every tool you need to capture, qualify, and close.</p>
          </div>
          <div className="feat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:20 }}>
            {[
              { icon:'📚', title:'Smart Knowledge Base', desc:'Upload PDFs, scrape URLs, add Q&A pairs. Bot answers only from your content — never goes off-topic.' },
              { icon:'👥', title:'Automatic Lead Capture', desc:'Bot naturally captures name, email and company mid-conversation. No popups, no friction.' },
              { icon:'🔴', title:'Live Agent Handoff', desc:'Visitor requests a human — agent gets a ring alert and takes over in real time with full context.' },
              { icon:'🏢', title:'Visitor Intelligence & Dashboard', desc:'Company, location, device, UTM source — full profile for every visitor. Track leads, view transcripts, export CSV.' },
              { icon:'🔗', title:'CRM & Automation', desc:'HubSpot, Zoho CRM, Zapier. Leads sync automatically the moment they are captured.' },
              { icon:'🎨', title:'Fully Customisable', desc:'Your bot name, avatar, bubble color and display mode. Three widget modes — floating, always open, popup.' },
            ].map((f, i) => (
              <div key={i} className="feature-card">
                <div style={{ width:44, height:44, background:'var(--orange-pale)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:16 }}>{f.icon}</div>
                <h3 style={{ fontSize:16, fontWeight:700, marginBottom:8, letterSpacing:'-0.01em' }}>{f.title}</h3>
                <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="section" style={{ background:'var(--bg)' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div className="tag">How it works</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:800, letterSpacing:'-0.03em' }}>Live in under 5 minutes</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:24, maxWidth:960, margin:'0 auto' }}>
            {[
              { n:'1', title:'Sign up free', desc:'Create your workspace. No credit card required.' },
              { n:'2', title:'Train your bot', desc:'Upload PDFs, paste your URL, add Q&A pairs.' },
              { n:'3', title:'Add your AI key', desc:'Claude or OpenAI. Encrypted. Never marked up.' },
              { n:'4', title:'Embed one line', desc:'Copy the script tag. Paste into your site. Done.' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign:'center' }}>
                <div style={{ width:52, height:52, borderRadius:14, background:'var(--orange)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#fff', margin:'0 auto 16px' }}>{s.n}</div>
                <h3 style={{ fontSize:16, fontWeight:700, marginBottom:8, letterSpacing:'-0.01em' }}>{s.title}</h3>
                <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section" style={{ background:'#fff' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div className="tag">Testimonials</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:800, letterSpacing:'-0.03em' }}>Loved by businesses</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
            {[
              { quote:"We went live in 10 minutes. The bot captured 14 qualified leads in the first week while we slept.", name:"Sarah Chen", role:"Founder, TechFlow", initials:"SC" },
              { quote:"The live handoff is incredible. Visitors get instant AI responses, then I jump in when they're ready.", name:"Marcus Rivera", role:"Sales Lead, Growthly", initials:"MR" },
              { quote:"Finally a chatbot that understands our business. The knowledge base training is a game changer.", name:"Priya Nair", role:"Head of Marketing, LaunchPad", initials:"PN" },
            ].map((t, i) => (
              <div key={i} style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:16, padding:28 }}>
                <div style={{ color:'var(--orange)', fontSize:18, marginBottom:14, letterSpacing:2 }}>★★★★★</div>
                <p style={{ fontSize:15, lineHeight:1.7, color:'#333', marginBottom:20 }}>"{t.quote}"</p>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg, var(--orange), var(--orange2))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>{t.initials}</div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600 }}>{t.name}</div>
                    <div style={{ fontSize:12, color:'var(--muted)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="section" style={{ background:'var(--bg)' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div className="tag">Pricing</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:800, letterSpacing:'-0.03em', marginBottom:12 }}>Simple, transparent pricing</h2>
            <p style={{ fontSize:16, color:'var(--muted)' }}>Bring your own AI key — we never mark up AI usage</p>
          </div>
          <div className="plan-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, maxWidth:960, margin:'0 auto' }}>
            {[
              { name:'Starter', price:'$0', period:'forever free', features:['100 messages/mo','1 PDF upload','Lead dashboard','Claude or ChatGPT'], cta:'Start free', featured:false },
              { name:'Growth', price:'$29', period:'/month', features:['2,000 messages/mo','10 PDF uploads','Full analytics','Usage alerts at 80%','HubSpot + Zapier','Team members'], cta:'Get started', featured:true },
              { name:'Business', price:'$79', period:'/month', features:['Unlimited messages','Unlimited PDFs','Priority support','Advanced analytics','All integrations','Zoho CRM','Live agent handoff'], cta:'Get started', featured:false },
            ].map((p, i) => (
              <div key={i} className={`plan-card ${p.featured ? 'featured' : ''}`} style={{ position:'relative' }}>
                {p.featured && (
                  <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', background:'var(--orange)', color:'#fff', fontSize:11, fontWeight:700, padding:'4px 16px', borderRadius:100, letterSpacing:'0.06em', whiteSpace:'nowrap' }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ fontSize:14, fontWeight:600, color:p.featured ? 'var(--orange)' : 'var(--muted)', marginBottom:12 }}>{p.name}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:8 }}>
                  <span style={{ fontSize:44, fontWeight:800, letterSpacing:'-0.03em' }}>{p.price}</span>
                  <span style={{ fontSize:14, color:'var(--muted)' }}>{p.period}</span>
                </div>
                <div style={{ height:1, background:'var(--border)', margin:'20px 0' }} />
                <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, color:'#333' }}>
                      <div style={{ width:18, height:18, background:p.featured ? 'var(--orange)' : 'var(--orange-pale)', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ color:p.featured ? '#fff' : 'var(--orange)', fontSize:10, fontWeight:700 }}>✓</span>
                      </div>
                      {f}
                    </div>
                  ))}
                </div>
                <Link href="/auth/register" className="btn-primary" style={{ display:'block', textAlign:'center', width:'100%',
                  background:p.featured ? 'var(--orange)' : 'var(--dark)',
                  boxSizing:'border-box' }}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="section" style={{ background:'var(--orange)' }}>
        <div className="container" style={{ textAlign:'center' }}>
          <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:800, color:'#fff', letterSpacing:'-0.03em', marginBottom:12 }}>
            Start capturing leads today
          </h2>
          <p style={{ fontSize:17, color:'rgba(255,255,255,0.8)', marginBottom:32 }}>Free plan. No credit card. Live in 5 minutes.</p>
          <Link href="/auth/register" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#fff', color:'var(--orange)', padding:'16px 40px', borderRadius:8, fontSize:16, fontWeight:700, textDecoration:'none', transition:'all 0.2s', letterSpacing:'-0.01em' }}
            onMouseOver={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 40px rgba(0,0,0,0.15)' }}
            onMouseOut={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}>
            Get started free →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background:'var(--dark)', padding:'40px 32px' }}>
        <div style={{ maxWidth:1140, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:20 }}>
          <div style={{ fontFamily:'Poppins', fontSize:16, fontWeight:700, color:'#fff' }}>
            Absolute <span style={{ color:'var(--orange)' }}>AIChat</span>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:400, marginTop:4 }}>by Absolute App Labs</div>
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>© 2026 Absolute App Labs. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
