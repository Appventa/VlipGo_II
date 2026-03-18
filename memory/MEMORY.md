# VlipGo II — Project Memory

## Project
Self-serve video customization SaaS. Customers browse After Effects templates, fill a form, pay via Stripe, and download a rendered MP4. No video editing software required.

**Repo:** https://github.com/Appventa/VlipGo_II.git
**Deploy:** Vercel (connected to main branch)
**PRD:** `VlipGo_MVP_PRD.pdf` in project root

---

## Tech Stack
- **Frontend:** React 18 + Vite + React Router v6 + TypeScript
- **Styling:** TailwindCSS v3.4 + clsx + Lucide React
- **Backend/DB:** Convex (serverless, real-time)
- **Auth:** Convex Auth — Password provider
- **Validation:** Zod
- **Payments:** Stripe Checkout (webhook → PAID → dispatch render)
- **Rendering:** Nexrender worker (headless After Effects)
- **File Storage:** Convex File Storage

---

## Architecture Rules (ADRs — never violate)
1. **Payment before render** — Nexrender job dispatched ONLY after Stripe webhook confirms PAID. Never on client redirect.
2. **Real-time progress** — Nexrender worker pushes progress via Convex mutation (server API key). Frontend uses `useQuery` — no polling.
3. **Double role enforcement** — React Router guard (redirect) AND Convex mutation `ctx.auth` check. Never trust client alone.
4. **Dynamic form** — CustomizePage renders fields from `templateFields` array. No hardcoded template UI. Zod schema built at runtime.

---

## Database Schema (5 tables)
- `users` — role ("ADMIN"|"CUSTOMER"), email, name
- `templates` — title, description, category, tags, price, currency, thumbnailUrl, nexrenderComposition, isPublished, isArchived
- `templateFields` — templateId, label, type ("TEXT"|"IMAGE"|"COLOR"), nexrenderLayer, required, order
- `jobs` — userId, templateId, paymentStatus ("PENDING"|"PAID"|"FAILED"), stripePaymentIntentId, renderStatus ("QUEUED"|"RENDERING"|"DONE"|"ERROR"), renderProgress, outputUrl, errorMessage
- `jobAssets` — jobId, fieldId, value (text/hex/Convex storage URL)

---

## Route Map
| Route | Component | Guard |
|---|---|---|
| / | HomePage | Public |
| /login · /register | AuthPage | Public (redirect if authed) |
| /templates | TemplatesPage | Public |
| /templates/:id | TemplateDetailPage | Public |
| /templates/:id/customize | CustomizePage | CUSTOMER |
| /orders | OrdersPage | CUSTOMER |
| /orders/:jobId | OrderDetailPage | CUSTOMER |
| /admin/login | AdminLoginPage | Public |
| /admin | AdminDashboardPage | ADMIN |
| /admin/templates | AdminTemplatesPage | ADMIN |
| /admin/templates/new · /:id/edit | AdminNewTemplatePage | ADMIN |
| /admin/jobs | AdminJobsPage | ADMIN |

---

## Environment Variables
| Variable | Where |
|---|---|
| VITE_CONVEX_URL | Frontend .env |
| VITE_STRIPE_PUBLISHABLE_KEY | Frontend .env |
| STRIPE_SECRET_KEY | Convex env |
| STRIPE_WEBHOOK_SECRET | Convex env |
| NEXRENDER_API_URL | Convex env |
| NEXRENDER_API_SECRET | Convex env |
| NEXRENDER_CALLBACK_SECRET | Convex env |
| CONVEX_NEXRENDER_KEY | Nexrender worker |

---

## Progress & Milestones

### Phase 0 — Setup ⬜
- [ ] Project scaffolded (Vite + React + TS)
- [ ] Convex initialized and schema deployed
- [ ] Tailwind configured
- [ ] Git connected to https://github.com/Appventa/VlipGo_II.git
- [ ] Vercel connected

### Phase 1 — Auth ⬜
- [ ] Convex Auth (password provider) configured
- [ ] Register / Login pages functional
- [ ] Role claim in JWT, ADMIN seeding

### Phase 2 — Templates (Admin) ⬜
- [ ] Admin layout + sidebar
- [ ] Template CRUD with field builder
- [ ] Thumbnail upload via Convex storage

### Phase 3 — Shop (Customer) ⬜
- [ ] TemplatesPage (grid, filter, search)
- [ ] TemplateDetailPage
- [ ] CustomizePage (dynamic form + image upload)

### Phase 4 — Payments ⬜
- [ ] Stripe Checkout Session created on job submit
- [ ] Stripe webhook HTTP action (PAID → dispatch)
- [ ] Idempotency on stripePaymentIntentId

### Phase 5 — Rendering ⬜
- [ ] Nexrender job dispatch (payload contract)
- [ ] jobs:updateRenderProgress mutation (server API key)
- [ ] OrderDetailPage real-time progress bar + download

### Phase 6 — Polish ⬜
- [ ] Edge-case handling (failed payments, render errors, retries)
- [ ] Admin jobs oversight table (sort/filter/retry)
- [ ] 24h PENDING job expiry (scheduled action)

---

## Key Decisions Log
- **2026-03-18** — Hard reset git history, new repo VlipGo_II. Starting clean from PRD.
- **2026-03-18** — Using `writing-plans` → `subagent-driven-development` skill workflow.
