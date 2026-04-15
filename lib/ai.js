import Anthropic from '@anthropic-ai/sdk'
import OpenAI    from 'openai'
import { decryptKey } from './auth.js'

// ── BUILD SYSTEM PROMPT from tenant config ────────────────
export function buildSystemPrompt(tenant, services = [], documents = []) {
  const toneMap = {
    professional: 'professional and precise',
    friendly:     'warm and conversational',
    sharp:        'sharp, confident, and concise',
  }
  const tone = toneMap[tenant.tone] || 'warm and conversational'

  const servicesText = services.length
    ? services.map(s => `• ${s.name}: ${s.description}`).join('\n')
    : 'Services information not yet configured.'

  const docsText = documents.length
    ? '\n\nKNOWLEDGE BASE DOCUMENTS:\n' +
      documents.map(d => `--- ${d.name} ---\n${d.extracted_text}`).join('\n\n')
    : ''

  const calendlyLine = tenant.calendly_url
    ? `You can also offer to book a call: ${tenant.calendly_url}`
    : ''

  return `You are ${tenant.bot_name || 'Kaali'}, the AI assistant for ${tenant.company}.

ABOUT THIS COMPANY:
${tenant.description || 'A forward-thinking company delivering quality products and services.'}

SERVICES:
${servicesText}${docsText}

PERSONA:
Name: ${tenant.bot_name || 'Kaali'}
Tone: ${tone}
Keep replies to 2–4 sentences unless detail is explicitly requested. Never be robotic or stiff.

VISITOR TYPES AND HOW TO RESPOND:

CLIENT (building a product / evaluating this company):
- Understand their need first — ask 1–2 focused questions.
- After 2–3 exchanges, naturally ask: "I'd love to connect you with our team — could I get your name and email?"
- After capturing: "Thanks [name]! Our team will be in touch soon. ${calendlyLine}"

EXISTING CLIENT:
- Warm, familiar tone. Ask their name and company.
- Understand what they need — new project, support, billing, account.
- Capture contact if there's a new requirement.

INVESTOR:
- Professional. Briefly mention company vision and growth.
- Ask for contact details after 1–2 exchanges.

GENERAL / EXPLORING:
- Be genuinely helpful. Answer questions about the company warmly.
- Offer to connect if something interesting comes up.

LEAD CAPTURE RULE:
Ask naturally — never like a cold form. Example: "Before I loop in our team — could I get your name and email?"
Once you have BOTH name AND email, end your response with this JSON on the final line (nothing after it):
{"__lead__":true,"name":"VISITOR_NAME","email":"VISITOR_EMAIL","type":"CLIENT|EXISTING|INVESTOR|GENERAL"}

FALLBACK:
If you can't answer something, be honest. Offer to take their email for a team follow-up.

RULES:
- Never fabricate facts about the company
- Use the visitor's name once you know it
- De-escalate immediately if the visitor seems frustrated
- Remember everything in this conversation`
}

// ── CALL AI ───────────────────────────────────────────────
// Returns { text: string, error: string|null }
export async function callAI({ tenant, messages, services, documents }) {
  const apiKeyEnc = tenant.api_key_enc || ''
  const apiKey    = apiKeyEnc ? decryptKey(apiKeyEnc) : ''

  const systemPrompt = buildSystemPrompt(tenant, services, documents)

  try {
    if (tenant.ai_provider === 'chatgpt') {
      return await callOpenAI({ apiKey, model: tenant.ai_model, systemPrompt, messages })
    }
    return await callClaude({ apiKey, model: tenant.ai_model, systemPrompt, messages })
  } catch (err) {
    console.error('[Kaali AI Error]', err.message)
    return { text: null, error: err.message }
  }
}

// ── CLAUDE ────────────────────────────────────────────────
async function callClaude({ apiKey, model, systemPrompt, messages }) {
  const effectiveKey = apiKey || process.env.PLATFORM_ANTHROPIC_KEY
  if (!effectiveKey) {
    return { text: null, error: 'No Anthropic API key configured for this workspace.' }
  }

  const client = new Anthropic({ apiKey: effectiveKey })

  const response = await client.messages.create({
    model:      model || 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system:     systemPrompt,
    messages:   messages.map(m => ({ role: m.role, content: m.content })),
  })

  const text = response.content?.[0]?.text ?? ''
  return { text, error: null }
}

// ── OPENAI ────────────────────────────────────────────────
async function callOpenAI({ apiKey, model, systemPrompt, messages }) {
  const effectiveKey = apiKey || process.env.PLATFORM_OPENAI_KEY
  if (!effectiveKey) {
    return { text: null, error: 'No OpenAI API key configured for this workspace.' }
  }

  const client = new OpenAI({ apiKey: effectiveKey })

  const response = await client.chat.completions.create({
    model:    model || 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
  })

  const text = response.choices?.[0]?.message?.content ?? ''
  return { text, error: null }
}

// ── EXTRACT LEAD SIGNAL from AI response ─────────────────
export function extractLead(rawText) {
  const match = rawText.match(/\{"__lead__":true[^}]*\}/)
  if (!match) return { lead: null, cleanText: rawText }
  try {
    const lead      = JSON.parse(match[0])
    const cleanText = rawText.replace(match[0], '').trim()
    return { lead, cleanText }
  } catch {
    return { lead: null, cleanText: rawText }
  }
}
