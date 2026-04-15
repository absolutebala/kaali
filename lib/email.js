import nodemailer from 'nodemailer'

function getTransport() {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

// ── USAGE ALERT ───────────────────────────────────────────
export async function sendUsageAlert({ to, companyName, pct, used, limit }) {
  const transport = getTransport()
  const isOver    = pct >= 100

  await transport.sendMail({
    from:    process.env.EMAIL_FROM,
    to,
    subject: isOver
      ? `[Kaali] Monthly limit reached — ${companyName}`
      : `[Kaali] You've used ${pct}% of your monthly conversations — ${companyName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px">
        <h2 style="color:#0f172a;margin-bottom:8px">${isOver ? '🚫 Monthly limit reached' : '⚠️ Usage alert'}</h2>
        <p style="color:#475569;margin-bottom:16px">
          ${isOver
            ? `Your Kaali workspace for <strong>${companyName}</strong> has reached its monthly conversation limit.`
            : `Your Kaali workspace for <strong>${companyName}</strong> has used <strong>${pct}%</strong> of its monthly conversations.`
          }
        </p>
        <div style="background:#e2e8f0;border-radius:8px;height:10px;margin-bottom:16px">
          <div style="background:${pct>=100?'#ef4444':pct>=80?'#f59e0b':'#3b82f6'};width:${Math.min(pct,100)}%;height:100%;border-radius:8px"></div>
        </div>
        <p style="color:#64748b;font-size:14px">${used} of ${limit} conversations used this month.</p>
        ${isOver
          ? `<p style="color:#ef4444;font-size:14px">Kaali will stop responding until you upgrade your plan.</p>`
          : ''
        }
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
           style="display:inline-block;margin-top:20px;background:#3b82f6;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:500">
          Manage Plan →
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">
          Powered by Absolute App Labs · <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#94a3b8">kaali.absoluteapplabs.com</a>
        </p>
      </div>
    `,
  })
}

// ── NEW LEAD NOTIFICATION ─────────────────────────────────
export async function sendLeadAlert({ to, companyName, lead, summary }) {
  const transport = getTransport()
  await transport.sendMail({
    from:    process.env.EMAIL_FROM,
    to,
    subject: `[Kaali] New lead captured — ${lead.name} (${lead.type})`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px">
        <h2 style="color:#0f172a;margin-bottom:8px">👤 New lead captured</h2>
        <p style="color:#475569;margin-bottom:20px">A new visitor on your <strong>${companyName}</strong> website has shared their contact details.</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;width:100px">Name</td><td style="padding:8px 0;color:#0f172a;font-weight:500">${lead.name}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Email</td><td style="padding:8px 0"><a href="mailto:${lead.email}" style="color:#3b82f6">${lead.email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Type</td><td style="padding:8px 0;color:#0f172a">${lead.type}</td></tr>
          ${summary ? `<tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;vertical-align:top">Summary</td><td style="padding:8px 0;color:#475569;font-size:13px">${summary}</td></tr>` : ''}
        </table>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
           style="display:inline-block;margin-top:24px;background:#3b82f6;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:500">
          View in Dashboard →
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">
          Powered by Absolute App Labs
        </p>
      </div>
    `,
  })
}
