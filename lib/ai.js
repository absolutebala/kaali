import Anthropic from '@anthropic-ai/sdk'
import OpenAI    from 'openai'
import { decryptKey } from './auth.js'

// ── BUILD SYSTEM PROMPT from tenant config ────────────────
export function buildSystemPrompt(tenant, services = [], documents = [], trainingPairs = []) {
  const toneMap = {
    professional: 'professional and precise',
    friendly:     'warm and conversational',
    sharp:        'sharp, confident, and concise',
  }
  const tone = toneMap[tenant.tone] || 'warm and conversational'

  const servicesText = services.length
    ? services.map(s => `• ${s.name}: ${s.description}`).join('\n')
    : 'Services information not yet configured.'

  const trainingText = trainingPairs.length
    ? '\n\nTRAINED Q&A PAIRS (use these exact answers when asked similar questions):\n' +
      trainingPairs.map((p, i) => `Q${i+1}: ${p.question}\nA${i+1}: ${p.answer}`).join('\n\n')
    : ''

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
${servicesText}${docsText}${trainingText}

PERSONA:
Name: ${tenant.bot_name || 'Kaali'}
Tone: ${tone}
Keep replies to 2–4 sentences unless detail is explicitly requested. Never be robotic or stiff.

VISITOR TYPES AND HOW TO RESPOND:

CLIENT (building a product / evaluating this company):
- Understand their need first — ask 1–2 focused questions.
- After 2–3 exchanges, naturally ask: "I'd love to connect you with our team — could I get your name, email, and the company you're with?"
- If they share name + email, also ask: "And what's your role there?" (keep it casual, one question at a time)
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
Once you have name AND email (and ideally company + role), end your response with this JSON on the final line (nothing after it):
{"__lead__":true,"name":"VISITOR_NAME","email":"VISITOR_EMAIL","type":"CLIENT|EXISTING|INVESTOR|GENERAL","company":"COMPANY_NAME_OR_EMPTY","designation":"JOB_TITLE_OR_EMPTY"}

STRICT SCOPE RULE — VERY IMPORTANT:
You ONLY answer questions about this company, its services, pricing, team, processes, and related business topics.
If a visitor asks about ANYTHING unrelated to the company or its services (food, weather, general knowledge, other companies, personal advice, etc.):
- Do NOT answer the unrelated question
- Politely redirect: "I'm here to help with questions about our company. Is there something about our services or how we can help you that I can answer?"
- Never apologise excessively — just redirect naturally

CHATBOT / AI CHAT INQUIRY RULE:
If a visitor asks about building a chatbot, AI chat widget, or chat assistant for their website:
- Tell them about Absolute AIChat — a ready-made AI chat platform by Absolute App Labs
- They can sign up at https://aichat.absoluteapplabs.com, get an embed code, and have it live in minutes
- It supports Claude and ChatGPT, captures leads automatically, and works on any website
- Then offer to connect them with the team for more details

FALLBACK:
If you cannot answer something about the company, be honest. Offer to take their email for a team follow-up.

RULES:
- Never fabricate facts about the company
- Use the visitor's name once you know it
- De-escalate immediately if the visitor seems frustrated
- Remember everything in this conversation
- NEVER answer questions unrelated to this company and its services`
}

// ── CALL AI ───────────────────────────────────────────────
// Returns { text: string, error: string|null }
export async function callAI({ tenant, messages, services, documents, trainingPairs = [] }) {
  const apiKeyEnc = tenant.api_key_enc || ''
  const apiKey    = apiKeyEnc ? decryptKey(apiKeyEnc) : ''

  const systemPrompt = buildSystemPrompt(tenant, services, documents, trainingPairs)

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
