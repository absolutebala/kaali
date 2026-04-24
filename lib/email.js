/**
 * Email — powered by Resend
 * Env vars: RESEND_API_KEY, EMAIL_FROM
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://kaali-complete.vercel.app'

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) { console.warn('[Email] RESEND_API_KEY not set — skipping'); return }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', Authorization:`Bearer ${apiKey}` },
    body: JSON.stringify({
      from:    process.env.EMAIL_FROM || 'noreply@absoluteapplabs.com',
      to,
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('[Resend]', err)
    throw new Error(err.message || 'Email send failed')
  }
  return res.json()
}

// ── NEW LEAD NOTIFICATION ─────────────────────────────────
export async function sendLeadAlert({ to, companyName, lead, summary, country, city, device }) {
  const locationLine = [city, country].filter(Boolean).join(', ')

  return sendEmail({
    to,
    subject: `[Absolute AIChat] New lead: ${lead.name} — ${companyName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:#1E3A5F;padding:24px 32px">
          <div style="font-size:13px;color:#93C5FD;margin-bottom:4px">Absolute AIChat</div>
          <h2 style="color:#ffffff;margin:0;font-size:22px">👤 New lead captured</h2>
          <div style="color:#93C5FD;font-size:13px;margin-top:6px">${companyName}</div>
        </div>
        <div style="padding:28px 32px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#94a3b8;font-size:13px;width:120px">Name</td>
                <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#0f172a;font-weight:600">${lead.name}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#94a3b8;font-size:13px">Email</td>
                <td style="padding:10px 0;border-bottom:1px solid #f1f5f9"><a href="mailto:${lead.email}" style="color:#3b82f6;text-decoration:none">${lead.email}</a></td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#94a3b8;font-size:13px">Visitor type</td>
                <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#0f172a">${lead.type || 'General'}</td></tr>
            ${lead.company ? `<tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#94a3b8;font-size:13px">Company</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#0f172a">${lead.company}</td></tr>` : ''}
            ${lead.designation ? `<tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#94a3b8;font-size:13px">Role</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#0f172a">${lead.designation}</td></tr>` : ''}
            ${locationLine ? `<tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#94a3b8;font-size:13px">Location</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#0f172a">📍 ${locationLine}</td></tr>` : ''}
            ${device ? `<tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#94a3b8;font-size:13px">Device</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#0f172a">💻 ${device}</td></tr>` : ''}
            ${summary ? `<tr><td style="padding:10px 0;color:#94a3b8;font-size:13px;vertical-align:top">Summary</td><td style="padding:10px 0;color:#475569;font-size:13px;line-height:1.6">${summary}</td></tr>` : ''}
          </table>
          <a href="${APP_URL}/dashboard/leads"
             style="display:inline-block;margin-top:24px;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
            View Lead in Dashboard →
          </a>
        </div>
        <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
          <p style="color:#94a3b8;font-size:12px;margin:0">Powered by <a href="https://aichat.absoluteapplabs.com" style="color:#94a3b8">Absolute AIChat</a></p>
        </div>
      </div>
    `,
  })
}

// ── USAGE ALERT ───────────────────────────────────────────
export async function sendUsageAlert({ to, companyName, pct, used, limit }) {
  const isOver = pct >= 100
  return sendEmail({
    to,
    subject: isOver
      ? `[Absolute AIChat] Monthly limit reached — ${companyName}`
      : `[Absolute AIChat] You've used ${pct}% of your monthly messages — ${companyName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:#1E3A5F;padding:24px 32px">
          <div style="font-size:13px;color:#93C5FD;margin-bottom:4px">Absolute AIChat</div>
          <h2 style="color:#ffffff;margin:0;font-size:22px">${isOver ? '🚫 Monthly limit reached' : '⚠️ Usage alert'}</h2>
          <div style="color:#93C5FD;font-size:13px;margin-top:6px">${companyName}</div>
        </div>
        <div style="padding:28px 32px">
          <p style="color:#475569;margin-bottom:20px">
            ${isOver ? 'Your workspace has reached its monthly message limit.' : `Your workspace has used <strong>${pct}%</strong> of its monthly messages.`}
          </p>
          <div style="background:#e2e8f0;border-radius:8px;height:12px;margin-bottom:12px">
            <div style="background:${pct>=100?'#ef4444':pct>=80?'#f59e0b':'#3b82f6'};width:${Math.min(pct,100)}%;height:100%;border-radius:8px"></div>
          </div>
          <p style="color:#64748b;font-size:14px">${used} of ${limit} messages used this month.</p>
          ${isOver ? '<p style="color:#ef4444;font-size:14px">The bot will stop responding until you upgrade your plan.</p>' : ''}
          <a href="${APP_URL}/dashboard/api-usage"
             style="display:inline-block;margin-top:20px;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
            Manage Plan →
          </a>
        </div>
        <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
          <p style="color:#94a3b8;font-size:12px;margin:0">Powered by <a href="https://aichat.absoluteapplabs.com" style="color:#94a3b8">Absolute AIChat</a></p>
        </div>
      </div>
    `,
  })
}

// ── LIVE AGENT HANDOFF NOTIFICATION ──────────────────────
export async function sendHandoffAlert({ to, companyName, visitorType, pageUrl, conversationId }) {
  return sendEmail({
    to,
    subject: `[Absolute AIChat] Visitor requesting live agent — ${companyName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:#1E3A5F;padding:24px 32px">
          <div style="font-size:13px;color:#93C5FD;margin-bottom:4px">Absolute AIChat</div>
          <h2 style="color:#ffffff;margin:0;font-size:22px">🔔 Visitor wants to chat live</h2>
          <div style="color:#93C5FD;font-size:13px;margin-top:6px">${companyName}</div>
        </div>
        <div style="padding:28px 32px">
          <p style="color:#475569;margin-bottom:20px">A visitor is requesting a live agent on your website.</p>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;width:120px">Visitor type</td>
                <td style="padding:8px 0;color:#0f172a">${visitorType || 'General'}</td></tr>
            <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Page</td>
                <td style="padding:8px 0;color:#0f172a">${pageUrl || 'Unknown'}</td></tr>
          </table>
          <a href="${APP_URL}/dashboard/live?id=${conversationId}"
             style="display:inline-block;margin-top:24px;background:#22D17A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
            Accept Chat →
          </a>
        </div>
        <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
          <p style="color:#94a3b8;font-size:12px;margin:0">Powered by <a href="https://aichat.absoluteapplabs.com" style="color:#94a3b8">Absolute AIChat</a></p>
        </div>
      </div>
    `,
  })
}
