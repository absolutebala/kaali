import Anthropic from '@anthropic-ai/sdk'
import OpenAI    from 'openai'
import { decryptKey } from './auth.js'

// ── BUILD SYSTEM PROMPT from tenant config ────────────────
export function buildSystemPrompt(tenant, services = [], documents = [], trainingPairs = [], agentsOnline = false, visitorLabel = null, visitorType = 'GENERAL') {
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

  // Check agent availability for proactive offer
  const agentsOnlineMsg = agentsOnline
    ? 'There are team members currently online and available. After 2-3 exchanges, if the visitor seems interested or has a specific requirement, naturally offer: "By the way, one of our team members is available right now — would you like me to connect you?" Only offer once per conversation.'
    : 'No team members are currently online. Do not offer live chat. If visitor asks for a human, say: "Our team isn\'t online right now, but I can take your details and someone will follow up shortly."'

  const b2bLine = tenant.b2b_mode
    ? '- If they share name + email, also ask: "And what company are you with and what\'s your role?" (keep it casual)'
    : ''

  const calendlyLine = tenant.calendly_url
    ? `You can also offer to book a call: ${tenant.calendly_url}`
    : ''

  return `You are ${tenant.bot_name || 'Assistant'}, the AI assistant for ${tenant.company}.

STRICT RULES:
- You ONLY represent ${tenant.company}. Never say "something we're working on together" or imply a shared project with the visitor.
- Answer questions directly using the information below. Do not ask clarifying questions if the answer is in the description.
- If asked about pricing, give the exact price from the description immediately.
- Never say "I'm not sure" if the answer is in the description below.

ABOUT THIS COMPANY:
${tenant.description || 'A forward-thinking company delivering quality products and services.'}

SERVICES:
${servicesText}${docsText}${trainingText}

PERSONA:
Name: ${tenant.bot_name || 'Assistant'}
Tone: ${tone}
Keep replies to 1–2 sentences max. Be concise, warm, and conversational — like a sharp colleague, not a consultant writing a report.
Never use bullet points or numbered lists. Ask only ONE question at a time. Never ask multiple questions in one message.
Sound human — use natural phrasing, not corporate language.

VISITOR INTENT:
The visitor selected: "${visitorLabel || visitorType || 'General enquiry'}"
Use this to understand their intent and tailor your response accordingly. Answer their specific need directly.

LEAD CAPTURE RULE:
Your PRIMARY goal is to answer the visitor's question. Lead capture is SECONDARY.
- ALWAYS answer the question first and completely before asking for contact details.
- After answering 2 questions, THEN ask for their name naturally: "By the way, what's your name?"
- Once you have their name, ask for email in your next reply: "Thanks [name]! What's the best email to reach you?"
- Once you have BOTH name and email, append this JSON on the very last line of your response (nothing after it):
{"__lead__":true,"name":"VISITOR_NAME","email":"VISITOR_EMAIL","type":"CLIENT|EXISTING|INVESTOR|GENERAL","company":"COMPANY_NAME_OR_EMPTY","designation":"JOB_TITLE_OR_EMPTY"}
- NEVER delay or withhold an answer to collect contact details first.
- If visitor explicitly asks you not to ask for details, respect that and just answer.

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
PROACTIVE AGENT OFFER RULE:
${agentsOnlineMsg}

CHATBOT / AI CHAT INQUIRY RULE:
If a visitor asks about building a chatbot, AI chat widget, or chat assistant for their website:
- Tell them about NivoChat — a ready-made AI chat platform by NivoChat
- They can sign up at https://nivochat.idataone.com, get an embed code, and have it live in minutes
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
export async function callAI({ tenant, messages, services, documents, trainingPairs = [], agentsOnline = false, visitorLabel = null, visitorType = 'GENERAL' }) {
  const apiKeyEnc = tenant.api_key_enc || ''
  // Global key (Growth/Enterprise via platform_settings) is stored as plain text
  const apiKey = tenant._usingGlobalKey ? apiKeyEnc : (apiKeyEnc ? decryptKey(apiKeyEnc) : '')

  const systemPrompt = buildSystemPrompt(tenant, services, documents, trainingPairs, agentsOnline, visitorLabel, visitorType)

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
    model:      model || 'claude-sonnet-4-5',
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
  if (!rawText) return { lead: null, cleanText: rawText }
  
  // Try to find JSON block with __lead__ key - handles multiline and nested
  const jsonStart = rawText.lastIndexOf('{"__lead__":true')
  if (jsonStart === -1) return { lead: null, cleanText: rawText }
  
  // Find the matching closing brace
  let depth = 0, end = -1
  for (let i = jsonStart; i < rawText.length; i++) {
    if (rawText[i] === '{') depth++
    else if (rawText[i] === '}') { depth--; if (depth === 0) { end = i; break } }
  }
  
  if (end === -1) return { lead: null, cleanText: rawText }
  
  try {
    const jsonStr   = rawText.slice(jsonStart, end + 1)
    const lead      = JSON.parse(jsonStr)
    if (!lead.__lead__ || !lead.email) return { lead: null, cleanText: rawText }
    const cleanText = (rawText.slice(0, jsonStart) + rawText.slice(end + 1)).trim()
    return { lead, cleanText }
  } catch {
    return { lead: null, cleanText: rawText }
  }
}
