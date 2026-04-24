/**
 * Zoho CRM Integration — Per-tenant
 * Each tenant provides their own Zoho CRM API token (OAuth access token).
 * Docs: https://www.zoho.com/crm/developer/docs/api/v6/insert-records.html
 */

export async function pushLeadToZoho({ token, name, email, type, company, designation, summary }) {
  if (!token?.trim()) {
    console.log('[Zoho] No token configured — skipping.')
    return null
  }

  const parts     = (name || '').trim().split(/\s+/)
  const firstName = parts[0] || name
  const lastName  = parts.slice(1).join(' ') || '-'

  const leadData = {
    First_Name:   firstName,
    Last_Name:    lastName,
    Email:        email,
    Company:      company || '',
    Title:        designation || '',
    Lead_Source:  'Chat Widget',
    Description:  summary  || '',
    Lead_Status:  'Not Contacted',
  }

  try {
    // Try Leads module first
    const res = await fetch('https://www.zohoapis.com/crm/v6/Leads', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Zoho-oauthtoken ${token}` },
      body: JSON.stringify({ data: [leadData] }),
    })

    const data = await res.json()

    if (data.data?.[0]?.status === 'success') {
      console.log('[Zoho] Lead created:', data.data[0].details?.id)
      return data.data[0].details
    }

    // If Leads fails, try Contacts module
    if (data.code === 'INVALID_MODULE' || res.status === 400) {
      const contactData = { ...leadData, Account_Name: company || '' }
      delete contactData.Company
      delete contactData.Lead_Status
      delete contactData.Lead_Source

      const res2 = await fetch('https://www.zohoapis.com/crm/v6/Contacts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Zoho-oauthtoken ${token}` },
        body: JSON.stringify({ data: [contactData] }),
      })
      const data2 = await res2.json()
      console.log('[Zoho Contacts]', data2.data?.[0]?.status)
      return data2.data?.[0]?.details || null
    }

    console.error('[Zoho] Failed:', JSON.stringify(data))
    return null
  } catch (err) {
    console.error('[Zoho] Error:', err.message)
    return null
  }
}
