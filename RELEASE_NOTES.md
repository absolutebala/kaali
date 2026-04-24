# Absolute AIChat — Release Notes

---

## v2.3.0 — 18 Apr 2026

### New Features
- **Visitor Intelligence** — Widget now captures country, city, device, OS, browser, referrer, UTM source, pages visited, session count via IP geolocation (ipapi.co)
- **Lead Profile Panel** — Click any lead to see full profile: contact details, company, role, location with country flag, session intelligence, pages visited, chat summary
- **Company & Role Capture** — AI naturally asks for company name and job title during lead capture. Stored per lead
- **Platform Logo Upload** — Super admin can upload company logo from Settings. Logo replaces "Absolute AIChat" text in dashboard sidebar
- **Avatar Upload** — Tenants can upload a bot avatar photo in Settings. Shows in widget header (not bubble)
- **Bubble Color Picker** — Choose any color for the chat bubble. Color themes the entire widget (send button, visitor buttons)
- **Widget Display Modes** — Three modes configurable from Settings: Floating Bubble, Always Open, Centre Popup
- **Grouped Conversations** — Chats page now groups by Today / Yesterday / This Week / Last Week. Toggle between Timeline and Category view

### Improvements
- **AI Scope Control** — Bot now redirects off-topic questions back to company topics. No more answering unrelated questions
- **Indexed Pages Fix** — Each scraped URL now gets its own document record. Multiple pages from same domain no longer overwrite each other
- **Super Admin Restricted View** — When super admin uses "Login As", they only see Knowledge Base, Embed Code, and Settings. Leads and Chats are hidden
- **Platform Rename** — System renamed from "Kaali" to "Absolute AIChat" across all platform UI. Bot name "Kaali" remains configurable per tenant
- **Design Refresh** — Improved typography (14px base), better contrast (#F0F4FF primary, #C8D4F0 secondary), more readable dark theme across all dashboard pages
- **Labels Fixed** — "conversations" renamed to "Messages" in usage bars and CTAs throughout dashboard

### Bug Fixes
- Fixed indexed pages showing same domain name for all scraped URLs
- Fixed super admin Reset Usage setting limit to 999999 instead of plan default
- Fixed `sa_token` persisting in localStorage causing leads/chats redirect for regular tenants
- Fixed widget panel position reverting to above bubble after deployments
- Fixed avatar image blocked by browser due to missing Supabase storage policy

---

## v2.2.0 — 17 Apr 2026

### New Features
- **Zapier Webhook (per-tenant)** — Each tenant can add their own Zapier Catch Hook URL in Settings. Fires JSON payload on every lead capture with name, email, type, summary, company, timestamp
- **HubSpot Integration (per-tenant)** — Each tenant enters their own HubSpot Private App token. Auto-creates/updates contacts on lead capture. Removed platform-level token dependency
- **Editable Company Name** — Tenants can now update their company name from Settings
- **API Key Links** — Direct links to Anthropic Console and OpenAI Platform added inside each provider card in API & Usage page
- **Usage Renamed** — "Conversations used" renamed to "Messages used" with clarification that each visitor message = 1

### Improvements
- Website URL scraping available in Knowledge Base — import any public page as knowledge
- Staging branch set up on Vercel for preview deployments before production
- Super admin impersonation now uses dedicated `sa_impersonating` flag instead of `sa_token`

### Bug Fixes
- Fixed `NAV_FULL is not defined` SSR error on dashboard pages
- Fixed conflicting superadmin login route file
- Fixed settings form resetting after save due to premature `refreshUser()` call

---

## v2.1.0 — 16 Apr 2026

### New Features
- **Super Admin Dashboard** — Full platform management at `/superadmin/login`
  - Platform overview: total tenants, leads, messages, new this week, plan breakdown chart
  - Tenant management: search/filter, edit plans, reset usage, delete tenants
  - Impersonate tenant: "Login As" issues tenant JWT for troubleshooting
  - Cross-tenant leads view: all leads across all clients in one table
  - Cross-tenant conversations: browse any tenant's chat transcripts
  - Team management: add members with roles (Super Admin, Support, Billing, Read Only), activate/deactivate, change password
  - Platform settings: environment variable reference panel
- **Role Permissions** — superadmin: full access. support: view + impersonate. billing: plans + analytics. readonly: view only

### Technical
- Added `superadmin_users` table to Supabase
- Separate JWT with `role: superadmin_user` claim, 8-hour expiry
- First-time setup from `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD` env vars

---

## v2.0.0 — 15 Apr 2026

### Platform Launch

**Backend API (Phase 1)**
- Multi-tenant registration and login with JWT + bcrypt
- AI proxy for Claude (Anthropic) and ChatGPT (OpenAI) — API keys encrypted at rest, never exposed to browser
- Knowledge base: company description, services, PDF upload (text extraction via pdf-parse), website URL scraping
- Lead extraction: AI detects name + email from conversation, stores with visitor type and summary
- Usage tracking: conversation counter per tenant, 80% alert threshold, plan limits enforced
- Public widget-config endpoint + widget.js embeddable script

**Frontend Dashboard (Phase 2)**
- Landing page with pricing and features
- 3-step registration wizard: account → business info + services → AI provider + API key
- 7-page tenant dashboard: Overview, Leads, Conversations, Knowledge Base, API & Usage, Embed Code, Settings
- Stripe billing: Checkout sessions, webhooks (plan upgrade/downgrade/renewal), customer portal
- HubSpot CRM integration, Zapier webhook integration
- Nodemailer email alerts for lead capture and usage threshold

**Widget Features**
- Floating bubble with pulse animation
- 4 visitor types: Looking to Build, Existing Client, Investor, Just Exploring
- Natural lead capture flow
- Calendly booking link for qualified leads
- "Powered by Absolute App Labs" attribution
- Live widget preview in dashboard for testing

**Plans**
- Starter: $0 / 100 messages / 1 PDF
- Growth: $29/mo / 2,000 messages / 10 PDFs
- Business: $79/mo / Unlimited messages / Unlimited PDFs

---

## Roadmap

### v2.4.0 (Next)
- SendGrid / Resend for production email delivery
- Analytics page — conversations over time, top questions, conversion rate
- Monthly usage reset via Vercel cron job
- Weekly email summary every Monday
- GDPR consent banner option

### v2.5.0
- Mobile widget polish — full-screen on mobile, touch gestures
- Centre popup widget mode fix
- Multilingual support — auto-detect visitor language
- Super admin platform analytics — MRR, churn, plan funnel

### v3.0.0
- Lead scoring (AI rates 1–10)
- A/B test welcome messages
- Built-in calendar booking in chat
- Auto knowledge refresh on schedule
- Custom domain per tenant (white-label)
