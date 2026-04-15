export async function pushLeadToHubSpot({ token, name, email, type, company, summary }) {
  if (!token?.trim()) return null
  const HS = 'https://api.hubapi.com'
  const h = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  const parts = (name||'').trim().split(/\s+/)
  const props = { email, firstname: parts[0]||name, lastname: parts.slice(1).join(' ')||'', company: company||'', hs_lead_status: 'NEW' }
  try {
    const sr = await fetch(`${HS}/crm/v3/objects/contacts/search`, {
      method:'POST', headers:h,
      body: JSON.stringify({ filterGroups:[{ filters:[{ propertyName:'email', operator:'EQ', value:email }] }], properties:['email'], limit:1 }),
    })
    const sd = await sr.json()
    if (sd.results?.length > 0) {
      await fetch(`${HS}/crm/v3/objects/contacts/${sd.results[0].id}`, { method:'PATCH', headers:h, body:JSON.stringify({ properties:props }) })
      return { action:'updated' }
    }
    const cr = await fetch(`${HS}/crm/v3/objects/contacts`, { method:'POST', headers:h, body:JSON.stringify({ properties:props }) })
    const cd = await cr.json()
    if (!cr.ok) { console.error('[HubSpot]', cd); return null }
    return { action:'created', contactId: cd.id }
  } catch(err) { console.error('[HubSpot]', err.message); return null }
}
