/**
 * HubSpot Integration
 * Pushes captured leads to HubSpot CRM as Contacts.
 * Uses Private App Access Token (no OAuth needed).
 *
 * Setup:
 *  1. HubSpot → Settings → Integrations → Private Apps → Create
 *  2. Scopes: crm.objects.contacts.write, crm.objects.contacts.read
 *  3. Copy the access token → HUBSPOT_ACCESS_TOKEN in .env.local
 */

const HS_BASE    = 'https://api.hubapi.com'
const HS_TOKEN   = () => process.env.HUBSPOT_ACCESS_TOKEN

function hsHeaders() {
  return {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${HS_TOKEN()}`,
  }
}

// ── Push a captured lead to HubSpot Contacts ─────────────
export async function pushLeadToHubSpot({ name, email, type, company, summary }) {
  if (!HS_TOKEN()) {
    console.log('[HubSpot] HUBSPOT_ACCESS_TOKEN not set — skipping.')
    return null
  }

  // Split name into first/last (best effort)
  const parts     = (name || '').trim().split(/\s+/)
  const firstName = parts[0] || name
  const lastName  = parts.slice(1).join(' ') || ''

  const properties = {
    email,
    firstname:    firstName,
    lastname:     lastName,
    company:      company || '',
    hs_lead_status: 'NEW',
    // Custom properties — create these in HubSpot if you want them stored:
    // kaali_visitor_type: type,
    // kaali_summary:      summary,
  }

  try {
    // Check if contact already exists
    const searchRes = await fetch(`${HS_BASE}/crm/v3/objects/contacts/search`, {
      method:  'POST',
      headers: hsHeaders(),
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
        properties: ['email', 'firstname', 'lastname'],
        limit: 1,
      }),
    })
    const searchData = await searchRes.json()

    if (searchData.results?.length > 0) {
      // Contact exists — update it
      const contactId = searchData.results[0].id
      await fetch(`${HS_BASE}/crm/v3/objects/contacts/${contactId}`, {
        method:  'PATCH',
        headers: hsHeaders(),
        body: JSON.stringify({ properties }),
      })
      console.log(`[HubSpot] Updated contact: ${email}`)
      return { action: 'updated', contactId }
    }

    // Create new contact
    const createRes = await fetch(`${HS_BASE}/crm/v3/objects/contacts`, {
      method:  'POST',
      headers: hsHeaders(),
      body: JSON.stringify({ properties }),
    })
    const created = await createRes.json()

    if (!createRes.ok) {
      console.error('[HubSpot] Create error:', created)
      return null
    }

    console.log(`[HubSpot] Created contact: ${email} (id: ${created.id})`)
    return { action: 'created', contactId: created.id }

  } catch (err) {
    // Non-fatal — Kaali still works even if HubSpot is down
    console.error('[HubSpot] Error:', err.message)
    return null
  }
}

// ── Push via HubSpot Forms API (alternative approach) ─────
// Use this if you prefer form submissions over Contacts API.
export async function pushLeadViaForm({ name, email, type, summary }) {
  const portalId = process.env.HUBSPOT_PORTAL_ID
  const formId   = process.env.HUBSPOT_FORM_ID

  if (!portalId || !formId) {
    console.log('[HubSpot Forms] Portal/Form ID not set — skipping.')
    return null
  }

  const parts     = (name || '').trim().split(/\s+/)
  const firstName = parts[0] || name
  const lastName  = parts.slice(1).join(' ') || ''

  try {
    const res = await fetch(
      `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: [
            { name: 'firstname', value: firstName },
            { name: 'lastname',  value: lastName  },
            { name: 'email',     value: email      },
            { name: 'message',   value: `Kaali lead — Type: ${type}. ${summary || ''}` },
          ],
          context: { pageUri: 'kaali-widget', pageName: 'Kaali AI Chat' },
        }),
      }
    )

    if (!res.ok) {
      const err = await res.json()
      console.error('[HubSpot Forms] Error:', err)
      return null
    }

    console.log(`[HubSpot Forms] Submitted: ${email}`)
    return { action: 'submitted' }
  } catch (err) {
    console.error('[HubSpot Forms] Error:', err.message)
    return null
  }
}
