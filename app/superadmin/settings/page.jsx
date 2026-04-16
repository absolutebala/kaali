'use client'
import { PageShell } from '../dashboard/page'

export default function SASettings() {
  return (
    <PageShell title="Platform Settings">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {[
          { icon:'🌐', label:'App URL', value: process.env.NEXT_PUBLIC_APP_URL || 'kaali-complete.vercel.app', desc:'Your live Vercel deployment URL' },
          { icon:'📧', label:'Email Provider', value: 'Nodemailer (configured in Vercel env)', desc:'Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS' },
          { icon:'💳', label:'Stripe', value: 'Configured via STRIPE_SECRET_KEY', desc:'Manage plans at dashboard.stripe.com' },
          { icon:'🗄️', label:'Database', value: 'Supabase PostgreSQL', desc:'Manage at supabase.com/dashboard' },
        ].map(s => (
          <div key={s.label} style={{ background:'#0C1220', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, padding:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <span style={{ fontSize:20 }}>{s.icon}</span>
              <span style={{ fontSize:13, fontWeight:500, color:'#E5EBF8' }}>{s.label}</span>
            </div>
            <div style={{ fontSize:12.5, color:'#4F8EF7', fontFamily:'monospace', marginBottom:6, wordBreak:'break-all' }}>{s.value}</div>
            <div style={{ fontSize:12, color:'#6E7E9E' }}>{s.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:16, background:'#0C1220', border:'0.5px solid rgba(255,255,255,.07)', borderRadius:12, padding:16 }}>
        <div style={{ fontSize:13, fontWeight:500, color:'#E5EBF8', marginBottom:12 }}>Environment Variables Reference</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            ['SUPERADMIN_EMAIL',          'First-time login email'],
            ['SUPERADMIN_PASSWORD',        'First-time login password'],
            ['NEXT_PUBLIC_SUPABASE_URL',   'Supabase project URL'],
            ['SUPABASE_SERVICE_ROLE_KEY',  'Supabase service role key'],
            ['JWT_SECRET',                 'JWT signing secret'],
            ['STRIPE_SECRET_KEY',          'Stripe secret key'],
            ['EMAIL_HOST',                 'SMTP host for emails'],
            ['NEXT_PUBLIC_APP_URL',        'Your Vercel deployment URL'],
          ].map(([k, v]) => (
            <div key={k} style={{ padding:'8px 12px', background:'#111A2E', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
              <span style={{ fontSize:11.5, color:'#4F8EF7', fontFamily:'monospace' }}>{k}</span>
              <span style={{ fontSize:11, color:'#6E7E9E' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop:16, padding:14, background:'rgba(251,191,36,.07)', border:'0.5px solid rgba(251,191,36,.2)', borderRadius:10, fontSize:12.5, color:'#6E7E9E', lineHeight:1.6 }}>
        ⚠ To update environment variables, go to <strong style={{ color:'#FBBF24' }}>Vercel → your kaali project → Settings → Environment Variables</strong>, then redeploy from the Deployments tab.
      </div>
    </PageShell>
  )
}
