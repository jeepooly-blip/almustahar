# Legal Navigator Pro — MVP Webapp

A working MVP webapp built from the **Legal Navigator Pro** PRD (v2.0) — a B2B2C legal-tech platform for Jordan/MENA that helps citizens understand legal documents in Arabic, then connects them with verified lawyers.

> Looking to deploy? See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full GitHub → Vercel → Supabase guide.

## Tech stack (per PRD § 8.1)

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS** (navy + teal palette)
- **Prisma** + **PostgreSQL** (Supabase) — schema in `prisma/schema.prisma`
- **Supabase** — Postgres + Storage + Auth (RLS policies in `prisma/setup.sql`)
- **Tajawal** (Arabic) + **Inter** (Latin) typography
- **lucide-react** icons, **clsx** + **tailwind-merge** for class composition
- **zod** for request validation

## Quick start

```bash
npm install
cp .env.example .env.local       # fill in Supabase keys
npm run db:generate
npm run dev                       # http://localhost:3000
```

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | `prisma generate && next build` |
| `npm start` | Production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript only |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to DB (no migration files) |
| `npm run db:migrate` | Create + apply a migration |
| `npm run db:deploy` | Apply pending migrations (production) |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio |

## Implemented features

### Consumer (C-side)
- **Landing page** with hero, trust strip, 3-step explainer, features, analysis samples, lawyer preview, pricing teaser, and final CTA
- **Document upload** with drag-drop, camera capture, document-type selector, animated 6-stage analysis pipeline
- **Analysis result page** with summary, accordion (rights / obligations / risks / legal sources), lawyer-needed gauge, recommended next steps, and matching lawyers
- **Lawyer directory** with filter chips and rich profile cards
- **Lawyer profile** with stats and hire form (with optional pre-attached analysis context)
- **Auth (Phone OTP)** via `POST /api/auth/otp/request` + `/api/auth/otp/verify` (demo code: `1234` in dev)
- **User dashboard** with document history, analyses, lead status, and usage meters
- **Educational hub** (Learn) with category cards and article previews
- **Pricing** with full 3-tier consumer plans + 3-tier lawyer plans + FAQ
- **Legal pages** (Terms, Privacy, Disclaimer) in Arabic
- **Bilingual** AR (RTL, default) + EN (LTR) with localStorage persistence
- **PWA manifest**, **sitemap.xml**, **robots.txt**

### Lawyer (B-side)
- **Lawyer dashboard** with KPI cards, lead inbox (accept / counter / reject), performance chart, profile summary

### Admin
- **Admin panel** with KPIs, analysis review queue (approve / flag / reject with working API), lawyer verification queue, and analytics breakdowns

### Backend
- `POST /api/analyze` — generates an analysis and persists to DB (if configured)
- `POST /api/leads` — creates a hire request
- `POST /api/admin/analyses/:id/review` — approve/flag/reject
- `POST /api/auth/otp/request` — issues an OTP challenge
- `POST /api/auth/otp/verify` — verifies and creates a session

## Project structure

```
legal-navigator-pro/
├── prisma/
│   ├── schema.prisma      # Data model (PRD § 8.3)
│   ├── seed.ts            # Sample data
│   └── setup.sql          # pgvector + RLS policies (run in Supabase SQL editor)
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── api/           # Route handlers
│   │   ├── auth/login/    # Phone OTP flow
│   │   ├── upload/        # Document upload
│   │   ├── analyses/      # Analysis list + detail
│   │   ├── lawyers/       # Directory + profile
│   │   ├── dashboard/     # Citizen dashboard
│   │   ├── lawyer/        # Lawyer dashboard
│   │   ├── admin/         # Admin panel
│   │   ├── learn/         # Educational hub
│   │   ├── pricing/       # Subscription plans
│   │   ├── legal/         # Terms, privacy, disclaimer
│   │   └── ...
│   ├── components/        # UI primitives + composite components
│   │   ├── ui/            # Button, Card, Badge, Input, Alert, Toast, Accordion
│   │   ├── site-header.tsx
│   │   ├── site-footer.tsx
│   │   ├── hire-form.tsx
│   │   ├── admin-actions.tsx
│   │   ├── star-rating.tsx
│   │   └── lawyer-score-gauge.tsx
│   ├── lib/
│   │   ├── i18n.ts        # AR + EN dictionaries
│   │   ├── locale-provider.tsx
│   │   ├── session-provider.tsx
│   │   ├── session-server.ts
│   │   ├── types.ts       # Domain types
│   │   ├── mock-data.ts   # In-memory data (fallback)
│   │   ├── ai-mock.ts     # Mock analysis pipeline
│   │   ├── utils.ts
│   │   ├── db.ts          # Prisma client singleton
│   │   ├── supabase.ts    # Supabase clients (browser + admin)
│   │   └── data.ts        # Data access layer (Prisma → mock fallback)
│   └── app/
├── public/                # favicon, manifest
├── DEPLOYMENT.md          # ← Full deployment walkthrough
├── README.md              # ← You are here
└── .env.example           # All environment variables
```

## Data layer — works without a database

The data layer in `src/lib/data.ts` is designed to work in two modes:

1. **With database** (production): Set `DATABASE_URL` in `.env.local`. All API routes will read/write to Supabase via Prisma.

2. **Without database** (local dev / preview): The code falls back to in-memory mock data in `src/lib/mock-data.ts` so you can develop and demo the UI even before Supabase is set up.

Switching is automatic — no code changes needed.

## Demo credentials (no real backend)

- **Citizen login**: any phone (`+9627...`) + code `1234`
- **Lawyer login**: same OTP, choose "I'm a lawyer" on the role toggle
- **Admin**: navigate to `/admin` directly (no gate in MVP)

## What's NOT implemented (would need Phase X work)

These are clearly marked in the PRD and slot into the existing `/api/*` routes and `src/lib/ai-mock.ts` without UI changes:

- **Real LLM/RAG** — `src/lib/ai-mock.ts` is template-based; replace with Groq/OpenAI calls
- **Real OCR** — uploaded file metadata is not parsed
- **Real SMS OTP** — Twilio/Vonage wiring (calls already exist, just need credentials)
- **Payments** — HyperPay/PayTabs not integrated
- **File upload to Supabase Storage** — currently stored as URL strings
- **Rate limiting** (Upstash Redis)
- **E2E encryption**
- **Bar Association API**

## License

Proprietary — all rights reserved by Legal Navigator Pro.
