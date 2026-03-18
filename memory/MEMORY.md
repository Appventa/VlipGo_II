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

### Phase 0 — Setup ✅
- [x] Project scaffolded (Vite + React + TS)
- [x] Convex initialized and schema deployed
- [x] Tailwind configured
- [x] Git connected to https://github.com/Appventa/VlipGo_II.git
- [x] Vercel connected and deploying from main

### Phase 1 — Auth ✅
- [x] Convex Auth (password provider) configured
- [x] Register / Login / AdminLogin pages functional
- [x] Role enforcement — ProtectedRoute + Convex mutation layer
- [ ] ADMIN user seeding (manual: edit role in Convex dashboard)

### Phase 2 — Templates (Admin) ✅
- [x] Admin layout + sidebar
- [x] Template CRUD with field builder
- [x] Thumbnail upload via Convex storage

### Phase 3 — Shop (Customer) ✅
- [x] TemplatesPage (grid, filter, search)
- [x] TemplateDetailPage
- [x] CustomizePage (dynamic form + image upload)
- [x] OrdersPage + OrderDetailPage (real-time progress bar + download)

### Phase 4 — Payments ⏭ Bypassed for dev
- [x] Jobs created as PAID immediately (Stripe bypassed)
- [ ] Stripe Checkout — add when ready for production

### Phase 5 — Rendering ✅
- [x] jobs:updateRenderProgress mutation
- [x] Admin jobs oversight table (sort/filter/retry)
- [x] Nexrender cloud dispatch (internalAction → nexrender API)
- [x] /api/nexrender-callback HTTP endpoint (Convex site)
- [x] Full end-to-end render tested: TEXT field → MP4 download ✅

### Phase 5b — Preview/HD Flow ✅
- [x] Two-step render: LQ preview → customer approves → HQ final
- [x] renderPhase field on job (PREVIEW/FINAL) — reliable, no webhook data dependency
- [x] Admin template editor: amber LQ + green HQ nexrender template sections
- [x] One nexrender file, two AE compositions — confirmed working end-to-end
- [x] OrdersPage: PREVIEW_READY cards with inline Watch modal + Render HD button
- [x] OrderDetailPage: video player + forced blob download (not browser open)

### Phase 6 — Polish ⬜
- [ ] Stripe payment integration (re-enable when going live)
- [ ] 24h PENDING job expiry (scheduled action)
- [ ] Admin dashboard stats

---

## Key Decisions Log
- **2026-03-18** — Hard reset git history, new repo VlipGo_II. Starting clean from PRD.
- **2026-03-18** — Stripe bypassed for dev; jobs go straight to PAID+QUEUED.
- **2026-03-18** — Nexrender integration deferred until first AE test template is ready.
- **2026-03-18** — Full render pipeline verified end-to-end. dispatch is internalAction (not action) — critical for internal.nexrender.dispatch reference to resolve.
- **2026-03-18** — Nexrender "Preview" toggle is template-level quality setting, not a per-job flag. Use two AE compositions (LQ + HQ) in one .aep file, linked via nexrenderComposition (LQ) + nexrenderFinalComposition (HQ) fields.
- **2026-03-18** — Force blob download for cross-origin MP4: fetch → createObjectURL → click anchor with download attr. Browser ignores download attr on cross-origin <a href> tags.
