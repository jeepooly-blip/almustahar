# Deployment Guide — Legal Navigator Pro

Step-by-step instructions for pushing the codebase to GitHub, deploying to Vercel, and connecting the Supabase database.

## 1. Push to GitHub

The repo is initialized in `legal-navigator-pro/`. To push:

```bash
cd legal-navigator-pro
# Stage everything
git add .
# First commit
git commit -m "Initial commit — Legal Navigator Pro MVP"
# Set main branch
git branch -M main
# Add your GitHub remote (replace <USER> with your GitHub username)
git remote add origin https://github.com/<USER>/almustahar.git
# Push
git push -u origin main
```

If the repo does not exist on GitHub yet, create it first at https://github.com/new with the name `almustahar` (no README, no .gitignore — we already have them).

### Authentication

If you have a GitHub Personal Access Token (PAT), use it when prompted for a password:

```bash
# Option A: use a credential helper so git remembers the token
git config --global credential.helper store
# Then on first push, paste your PAT as the password.

# Option B: embed the token in the remote URL (less secure)
git remote set-url origin https://<TOKEN>@github.com/<USER>/almustahar.git
```

## 2. Deploy to Vercel

### Option A — Vercel Dashboard (recommended for first deploy)

1. Go to https://vercel.com/new
2. Import the `almustahar` GitHub repo
3. Vercel auto-detects Next.js 15. Confirm these settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `prisma generate && next build` (auto-detected)
   - **Output Directory**: `.next`
4. **Environment Variables** — add the following (see `.env.example` for descriptions):

   | Variable | Required | Notes |
   |----------|----------|-------|
   | `DATABASE_URL` | Yes | Supabase Pooler connection string |
   | `DIRECT_URL` | Yes | Supabase direct connection string |
   | `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
   | `NEXTAUTH_SECRET` | Yes | `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | Yes | `https://your-app.vercel.app` |
   | `NEXT_PUBLIC_APP_URL` | Yes | Same as above |
   | `GROQ_API_KEY` | Optional | For AI analysis |
   | `OPENAI_API_KEY` | Optional | For embeddings / fallback |
   | `TWILIO_*` / `VONAGE_*` | Optional | For real SMS OTP |
   | `HYPERPAY_*` | Optional | For payments |
   | `UPSTASH_REDIS_REST_URL/TOKEN` | Optional | For rate limiting |

5. Click **Deploy**. The first build will take 2–3 minutes.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

## 3. Connect the Supabase Database

### 3.1 Create the Supabase project

1. Go to https://supabase.com/dashboard and create a new project
2. Pick the closest region (e.g. `eu-west-1` for Jordan/MENA)
3. Save the database password securely — you'll need it for the connection string

### 3.2 Get the connection strings

In Supabase Dashboard → **Settings → Database** → **Connection string**:

- **Transaction mode (pooled)** — for the app, port `6543`:
  ```
  postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
  ```
  → put in `DATABASE_URL`

- **Session mode (direct)** — for migrations, port `5432`:
  ```
  postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
  ```
  → put in `DIRECT_URL`

### 3.3 Get the API keys

In **Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `anon` `public` key
- `SUPABASE_SERVICE_ROLE_KEY` = `service_role` key (server-only, never expose)

### 3.4 Run migrations

From your local machine (with `.env` filled in):

```bash
# 1. Create the tables from prisma/schema.prisma
npx prisma migrate deploy

# 2. Seed the database
npm run db:seed

# 3. Run the manual SQL setup (pgvector + RLS)
#    Open Supabase SQL Editor and paste the contents of:
#    prisma/setup.sql
```

Or from Vercel (recommended for production):

Add a one-off deploy step in `vercel.json` or just run migrations locally against the production URL.

### 3.5 Verify

```bash
# Check the app is reading from Supabase
npx prisma studio
# Open http://localhost:5555 and confirm the seeded data is there
```

## 4. Post-deployment checklist

- [ ] Custom domain connected (Vercel → Settings → Domains)
- [ ] `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` updated to the production URL
- [ ] Supabase **Auth → URL Configuration** — add the production domain to allowed redirect URLs
- [ ] Supabase **Auth → Email Templates** — localize for Arabic
- [ ] HyperPay / PayTabs live keys (when going live)
- [ ] Twilio / Vonage live credentials (when going live)
- [ ] PostHog / GA project keys
- [ ] Enable Vercel Analytics + Speed Insights
- [ ] Set up error monitoring (Sentry recommended)
- [ ] First production deploy logged: review Vercel → Logs for any errors
- [ ] Backup strategy in place (Supabase does daily backups on Pro plan)

## 5. Local development with the real database

```bash
# 1. Copy env example
cp .env.example .env.local
# 2. Fill in your Supabase keys
# 3. Generate Prisma client
npm run db:generate
# 4. Push schema (no migration files for now)
npm run db:push
# 5. Seed
npm run db:seed
# 6. Run the SQL setup in Supabase dashboard (prisma/setup.sql)
# 7. Dev server
npm run dev
```

## Useful commands

```bash
npm run dev          # dev server with HMR
npm run build        # production build
npm run start        # production server
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run db:studio    # Prisma Studio (DB GUI)
npm run db:seed      # reseed the database
```

## Rollback

```bash
# Vercel: instant rollback from the dashboard
# Or via CLI:
vercel rollback

# Database: Supabase keeps daily backups on Pro plan
# Restore from dashboard → Database → Backups
```
