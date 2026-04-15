# Kaali — Complete Setup Guide

> Phase 1 + Phase 2 · Built by Absolute App Labs

---

## What you have

```
kaali/
├── Phase 1 — Backend API (Next.js API routes)
│   ├── 10 API endpoints (auth, chat, leads, conversations, services, documents, stats, widget-config)
│   ├── Supabase schema (tenants, leads, conversations, messages, services, documents)
│   ├── AI proxy — Claude + OpenAI, key encrypted at rest
│   ├── widget.js — the embeddable script served per tenant
│   └── Email alerts — usage + lead notifications via Nodemailer
│
└── Phase 2 — Full Frontend (React / Next.js pages) + Integrations
    ├── Landing page (pricing, features, CTA)
    ├── Auth (register + login with JWT)
    ├── Onboarding wizard (3-step: account → business → AI)
    ├── Dashboard (7 pages: overview, leads, conversations, knowledge, API & usage, embed, settings)
    ├── Stripe billing (checkout, webhook, portal)
    └── HubSpot CRM (auto-push leads to Contacts)
```

---

## Setup in 30 minutes

### Step 1 — Clone and install

```bash
# Extract the zip
unzip kaali-complete.zip && cd kaali
npm install
```

---

### Step 2 — Supabase

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. **SQL Editor → New Query** → paste `supabase/schema.sql` → **Run**
3. **SQL Editor → New Query** → paste `supabase/migrations/002_stripe.sql` → **Run**
4. **Storage → New Bucket** → name it `kaali-documents` → set to **Private**
5. **Settings → API** → copy:
   - Project URL
   - anon / public key
   - service_role key (keep this secret)

---

### Step 3 — Environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `JWT_SECRET` | Run: `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (dev) or your Vercel URL (prod) |
| `EMAIL_HOST` etc. | [Ethereal](https://ethereal.email) for dev, SendGrid/Resend for prod |

**Stripe** (optional for dev, required for paid plans):
1. [stripe.com](https://stripe.com) → Dashboard → Create account
2. **Developers → API Keys** → copy publishable + secret key
3. **Products → Add Product** → create Growth ($29/mo) and Business ($79/mo) → copy Price IDs
4. Set `STRIPE_PRICE_GROWTH` and `STRIPE_PRICE_BUSINESS`

**HubSpot** (optional):
1. HubSpot → **Settings → Integrations → Private Apps → Create**
2. Scopes: `crm.objects.contacts.write`, `crm.objects.contacts.read`
3. Copy access token → `HUBSPOT_ACCESS_TOKEN`

---

### Step 4 — Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) → you see the Kaali landing page.

**Test the full flow:**
1. Click **Start for Free** → register an account
2. Complete the 3-step wizard (use any API key or leave blank for now)
3. You're in the dashboard — try the chat bubble bottom-right
4. Check **Embed Code** → copy your snippet

---

### Step 5 — Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Set all `.env.local` variables in **Vercel → Project → Settings → Environment Variables**.

Update `NEXT_PUBLIC_APP_URL` to your Vercel domain.

**Set up Stripe webhook** (for billing to work in production):
1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://your-vercel-domain.vercel.app/api/stripe/webhook`
3. Events to listen: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET` in Vercel env vars

---

## Embed code for your clients

Once deployed, every registered client gets:

```html
<script src="https://kaali.absoluteapplabs.com/widget.js?id=THEIR_TENANT_ID" async></script>
```

- Bot fetches config from `/api/widget-config/:tenantId` (public, no auth)
- All chat goes through `/api/chat` (secured, rate-limited by usage limit)
- Their API key **never touches the browser** — it lives on your server

---

## API Reference (quick)

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | None | Create account → JWT |
| POST | `/api/auth/login` | None | Login → JWT |
| GET  | `/api/auth/me` | JWT | Current tenant profile |
| GET/PATCH | `/api/tenant` | JWT | Bot settings |
| CRUD | `/api/services` | JWT | Manage services |
| CRUD | `/api/documents` | JWT | PDF upload / delete |
| GET/PATCH | `/api/leads` | JWT | Lead management |
| GET  | `/api/conversations` | JWT | Transcripts |
| GET  | `/api/stats` | JWT | Dashboard numbers |
| GET  | `/api/widget-config/:id` | None | Public widget config |
| POST | `/api/chat` | None (tenantId) | AI proxy |
| POST | `/api/stripe/checkout` | JWT | Create Stripe session |
| POST | `/api/stripe/portal` | JWT | Customer billing portal |
| POST | `/api/stripe/webhook` | Stripe sig | Handle billing events |

---

## Phase 3 Roadmap

- [ ] Usage reset cron job (monthly via Vercel cron)
- [ ] Zapier webhook on lead capture
- [ ] Analytics page (conversations over time, top questions asked)
- [ ] GDPR consent banner option
- [ ] Bot avatar / logo customisation
- [ ] Multi-language support
- [ ] A/B test welcome messages

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL + Storage) |
| Auth | JWT (jsonwebtoken + bcrypt) |
| AI — Claude | @anthropic-ai/sdk |
| AI — ChatGPT | openai |
| Billing | Stripe |
| CRM | HubSpot Contacts API |
| Email | Nodemailer |
| PDF parsing | pdf-parse |
| Hosting | Vercel |

---

*Built by [Absolute App Labs](https://absoluteapplabs.com)*
