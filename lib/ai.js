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

  const b2bLine = tenant.b2b_mode
    ? '- If they share name + email, also ask: "And what company are you with and what\'s your role?" (keep it casual)'
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

SCOPE RULE — VERY IMPORTANT:
Your job is to understand visitor INTENT, not just keywords. Ask yourself: "Could this company help with what the visitor is asking?"

RESPOND POSITIVELY when a visitor asks about:
- Any problem or project that this company's services could help solve — even if the visitor mentions a third-party platform, tool, or technology (e.g. Shopify, Salesforce, WordPress, AWS, etc.)
- Building, integrating, or improving any software, app, or digital product — these are potential projects
- Any industry or business domain where this company's expertise is relevant
- Example: A visitor asking "I need a Shopify app for dropshipping" is asking about software development — respond enthusiastically, ask questions to understand their needs, and position the company's capabilities

REDIRECT POLITELY only when the request has NO possible connection to the company's services:
- Personal advice unrelated to business (relationships, health, cooking, travel for leisure, etc.)
- General knowledge questions with no business intent (history trivia, weather, sports scores, etc.)
- Example redirects: "What's the weather today?" or "Who won the World Cup?" — these have no business intent

When redirecting, say something like: "That's a bit outside what I can help with here — I'm focused on how [company] can help your business. Is there a project or challenge I can help you explore?"

WHEN IN DOUBT — lean towards engaging. A visitor curious about anything tech, business, or digital is a potential lead.

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
- When in doubt about scope, engage rather than redirect — every curious visitor is a potential lead`
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
