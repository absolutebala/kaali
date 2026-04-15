# Kaali — AI Chat Platform

> Powered by Absolute App Labs

A multi-tenant SaaS platform that lets any business embed an AI chat widget on their website in under 10 minutes. Built with Next.js 14, Supabase, and the Anthropic / OpenAI APIs.

---

## Architecture

```
kaali/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.js   ← POST  Create account
│   │   │   ├── login/route.js      ← POST  Login → JWT
│   │   │   └── me/route.js         ← GET   Current tenant profile
│   │   ├── chat/route.js           ← POST  AI proxy (called by widget.js)
│   │   ├── tenant/route.js         ← GET/PATCH  Bot settings
│   │   ├── services/route.js       ← CRUD  Company services (used in AI prompt)
│   │   ├── documents/route.js      ← CRUD  PDF uploads → text extraction
│   │   ├── leads/route.js          ← GET/PATCH  Captured leads
│   │   ├── conversations/route.js  ← GET   Conversation list + transcripts
│   │   ├── stats/route.js          ← GET   Dashboard overview numbers
│   │   └── widget-config/
│   │       └── [tenantId]/route.js ← GET   Public config for widget.js
│   ├── layout.jsx
│   └── page.jsx                    ← Redirects to /app.html (SaaS frontend)
├── lib/
│   ├── supabase.js                 ← Supabase client (anon + admin)
│   ├── auth.js                     ← JWT sign/verify + bcrypt + API key encrypt
│   ├── ai.js                       ← Claude + OpenAI proxy + system prompt builder
│   └── email.js                    ← Usage alerts + lead notifications (Nodemailer)
├── middleware.js                   ← CORS headers for all /api/* routes
├── public/
│   ├── widget.js                   ← The embeddable chat widget (self-contained IIFE)
│   └── app.html                    ← SaaS frontend (copy kaali-saas.html here)
├── supabase/
│   └── schema.sql                  ← Full DB schema — run once in Supabase SQL editor
├── .env.example                    ← All required environment variables documented
├── next.config.mjs
└── package.json
```

---

## Phase 1 Setup (30 minutes)

### 1. Clone and install

```bash
git clone https://github.com/your-org/kaali.git
cd kaali
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → Create new project
2. **SQL Editor** → New query → Paste the contents of `supabase/schema.sql` → Run
3. **Storage** → Create a new bucket called `kaali-documents` (set to private)
4. **Settings → API** → Copy your project URL, anon key, and service role key

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `JWT_SECRET` | Run: `openssl rand -base64 32` |
| `EMAIL_HOST` / `EMAIL_USER` / `EMAIL_PASS` | [Ethereal](https://ethereal.email) for dev, SendGrid for prod |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for dev |

### 4. Add the SaaS frontend

Copy `kaali-saas.html` (the previously built frontend demo) into `public/` and rename it `app.html`:

```bash
cp ../kaali-saas.html public/app.html
```

Then update the API calls in `app.html` to hit your backend instead of using localStorage.  
*(Full frontend migration to Next.js pages is Phase 2.)*

### 5. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000` — you'll see the Kaali landing page.

---

## API Reference

All protected routes require: `Authorization: Bearer <JWT_TOKEN>`

### Auth

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, company, email, password }` | `{ token, tenant }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ token, tenant }` |
| GET  | `/api/auth/me` | — | `{ tenant, services, documents }` |

### Tenant Settings

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| GET   | `/api/tenant` | — | `{ tenant }` |
| PATCH | `/api/tenant` | `{ botName?, description?, tone?, calendly?, aiProvider?, apiKey?, aiModel?, alertEmail?, alertThreshold? }` | `{ tenant }` |

### Chat (called by widget.js — no auth required, uses tenantId)

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| POST | `/api/chat` | `{ tenantId, messages, conversationId?, visitorType?, pageUrl? }` | `{ text, conversationId, leadCaptured, lead?, usagePct }` |

### Services

| Method | Endpoint | Body / Params | Returns |
|---|---|---|---|
| GET    | `/api/services` | — | `{ services }` |
| POST   | `/api/services` | `{ name, description }` | `{ service }` |
| PATCH  | `/api/services` | `{ id, name?, description? }` | `{ service }` |
| DELETE | `/api/services?id=<uuid>` | — | `{ success }` |

### Documents (PDF upload)

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| GET    | `/api/documents` | — | `{ documents }` |
| POST   | `/api/documents` | `FormData: file` (PDF/TXT, max 10MB) | `{ document }` |
| DELETE | `/api/documents?id=<uuid>` | — | `{ success }` |

### Leads

| Method | Endpoint | Params | Returns |
|---|---|---|---|
| GET   | `/api/leads` | `?type=CLIENT&status=new&page=1&limit=50` | `{ leads, total }` |
| PATCH | `/api/leads` | `{ id, status }` | `{ lead }` |

### Conversations

| Method | Endpoint | Params | Returns |
|---|---|---|---|
| GET | `/api/conversations` | `?page=1&limit=30` | `{ conversations, total }` |
| GET | `/api/conversations?id=<uuid>` | — | `{ conversation, messages }` |

### Stats

| Method | Endpoint | Returns |
|---|---|---|
| GET | `/api/stats` | `{ totalConversations, totalLeads, clientLeads, weekConversations, usagePct, used, limit, plan }` |

### Widget Config (public — no auth)

| Method | Endpoint | Returns |
|---|---|---|
| GET | `/api/widget-config/:tenantId` | `{ tenantId, company, botName, tone, calendly, apiUrl, limited }` |

---

## Deploying to Vercel

```bash
npm install -g vercel
vercel
```

Set all `.env.local` variables in **Vercel Dashboard → Project → Settings → Environment Variables**.

Update `NEXT_PUBLIC_APP_URL` to your Vercel domain (e.g. `https://kaali.absoluteapplabs.com`).

---

## Embed Code for Clients

Once deployed, each client gets a unique one-liner:

```html
<script src="https://kaali.absoluteapplabs.com/widget.js?id=TENANT_ID" async></script>
```

The widget fetches config from `/api/widget-config/:tenantId` and all chat goes through `/api/chat`.  
**The client's API key never touches the browser.**

---

## Phase 2 Roadmap

- [ ] Migrate frontend from `app.html` → proper Next.js pages with React
- [ ] Stripe billing integration (plan limits enforced server-side)
- [ ] Supabase Storage signed URLs for secure PDF access
- [ ] HubSpot / Zapier webhook on lead capture
- [ ] Analytics page (conversations over time, top questions)
- [ ] GDPR consent banner option
- [ ] Bot avatar customisation
- [ ] A/B test welcome messages

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| Auth | JWT (jsonwebtoken) + bcrypt |
| AI — Claude | @anthropic-ai/sdk |
| AI — ChatGPT | openai |
| Email | Nodemailer (Ethereal dev / SendGrid prod) |
| PDF Extraction | pdf-parse |
| Hosting | Vercel |

---

*Built by Absolute App Labs · [absoluteapplabs.com](https://absoluteapplabs.com)*
