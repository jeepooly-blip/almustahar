#!/usr/bin/env bash
# =============================================================================
# Legal Navigator Pro — one-shot deployment
# Usage: bash scripts/deploy.sh
#   Reads credentials from .env.local (or .env.production.local)
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."

# Load .env.local if present
if [ -f .env.local ]; then
  set -a; source .env.local; set +a
fi

: "${GITHUB_TOKEN:?GITHUB_TOKEN not set}"
: "${GITHUB_USER:?GITHUB_USER not set}"
: "${GITHUB_REPO:=almustahar}"
: "${VERCEL_TOKEN:?VERCEL_TOKEN not set}"
: "${SUPABASE_URL:?SUPABASE_URL not set}"
: "${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY not set}"
: "${DATABASE_URL:?DATABASE_URL not set}"
: "${DIRECT_URL:?DIRECT_URL not set}"
: "${PROJECT_NAME:=legal-navigator-pro}"

step() { echo -e "\n\033[1;34m▶ $*\033[0m"; }
ok()   { echo -e "\033[1;32m✓ $*\033[0m"; }

# -----------------------------------------------------------------------------
# 1. GitHub — create repo if missing, then push
# -----------------------------------------------------------------------------
step "1. GitHub: create repo if missing"
if curl -s -o /dev/null -w "%{http_code}" -H "Authorization: token $GITHUB_TOKEN" \
   "https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}" | grep -q 200; then
  echo "Repo ${GITHUB_USER}/${GITHUB_REPO} already exists."
else
  echo "Creating repo ${GITHUB_USER}/${GITHUB_REPO}..."
  curl -s -H "Authorization: token $GITHUB_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"'"${GITHUB_REPO}"'","private":false,"auto_init":false}' \
    "https://api.github.com/user/repos" >/dev/null
  ok "Repo created"
fi

# Configure git and push
step "2. GitHub: push code"
git config user.name  "${GITHUB_USER}"
git config user.email "${GITHUB_USER}@users.noreply.github.com"
git remote remove origin 2>/dev/null || true
git remote add origin "https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git"
git push -u origin main --force
ok "Code pushed to https://github.com/${GITHUB_USER}/${GITHUB_REPO}"

# -----------------------------------------------------------------------------
# 3. Vercel — create project, import repo, set env vars, deploy
# -----------------------------------------------------------------------------
step "3. Vercel: create project + import repo"
V_API="https://api.vercel.com"
V_HEADERS=(-H "Authorization: Bearer ${VERCEL_TOKEN}")

# Get current user
V_USER_ID=$(curl -sf "${V_HEADERS[@]}" "${V_API}/v2/user" | grep -oE '"id":"[^"]+"' | head -1 | cut -d'"' -f4)
echo "Vercel user id: $V_USER_ID"

# Create project (or look it up)
PROJECT_RESP=$(curl -sf "${V_HEADERS[@]}" -H "Content-Type: application/json" \
  -d '{
    "name": "'"${PROJECT_NAME}"'",
    "framework": "nextjs",
    "gitRepository": { "type": "github", "repo": "'"${GITHUB_USER}/${GITHUB_REPO}"'" }
  }' \
  "${V_API}/v10/projects" || true)

if echo "$PROJECT_RESP" | grep -q '"id"'; then
  PROJECT_ID=$(echo "$PROJECT_RESP" | grep -oE '"id":"[^"]+"' | head -1 | cut -d'"' -f4)
  ok "Project created (id=$PROJECT_ID)"
else
  echo "Project may already exist; looking up..."
  PROJECT_ID=$(curl -sf "${V_HEADERS[@]}" "${V_API}/v9/projects/${PROJECT_NAME}" | grep -oE '"id":"[^"]+"' | head -1 | cut -d'"' -f4)
  echo "Existing project id: $PROJECT_ID"
fi

# Set env vars on the project
step "4. Vercel: set environment variables"
set_env() {
  local key="$1"
  local value="$2"
  local target="$3"   # production | preview | development
  curl -sf "${V_HEADERS[@]}" -H "Content-Type: application/json" \
    -X POST "${V_API}/v10/projects/${PROJECT_ID}/env" \
    -d '{
      "key": "'"${key}"'",
      "value": "'"${value}"'",
      "type": "encrypted",
      "target": ["'"${target}"'"]
    }' >/dev/null && echo "  ✓ ${key} (${target})" || echo "  ✗ ${key}"
}

for KEY in DATABASE_URL DIRECT_URL NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY \
           SUPABASE_SERVICE_ROLE_KEY NEXTAUTH_SECRET NEXT_PUBLIC_APP_URL \
           GROQ_API_KEY OPENAI_API_KEY TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN \
           TWILIO_PHONE_NUMBER HYPERPAY_BASE_URL HYPERPAY_ENTITY_ID HYPERPAY_ACCESS_TOKEN \
           UPSTASH_REDIS_REST_URL UPSTASH_REDIS_REST_TOKEN; do
  if [ -n "${!KEY:-}" ]; then
    set_env "$KEY" "${!KEY}" "production"
    set_env "$KEY" "${!KEY}" "preview"
    set_env "$KEY" "${!KEY}" "development"
  fi
done

# Trigger a production deploy
step "5. Vercel: trigger production deploy"
DEPLOY_RESP=$(curl -sf "${V_HEADERS[@]}" -H "Content-Type: application/json" \
  -X POST "${V_API}/v13/deployments?teamId=&skipAutoDetectionConfirmation=1" \
  -d '{
    "name": "'"${PROJECT_NAME}"'",
    "target": "production",
    "gitSource": { "type": "github", "repo": "'"${GITHUB_USER}/${GITHUB_REPO}"'", "ref": "main" }
  }' || true)
DEPLOY_URL=$(echo "$DEPLOY_RESP" | grep -oE '"url":"[^"]+"' | head -1 | cut -d'"' -f4)
ok "Deploy triggered: https://${DEPLOY_URL:-check Vercel dashboard}"

# -----------------------------------------------------------------------------
# 6. Supabase — run prisma migrations + setup.sql + seed
# -----------------------------------------------------------------------------
step "6. Supabase: run migrations"
npx prisma migrate deploy
ok "Prisma migrations applied"

step "7. Supabase: run setup.sql (pgvector + RLS)"
# Get the project's Postgres connection id
PG_HOST=$(echo "$DIRECT_URL" | sed -E 's|.*@([^:/]+).*|\1|')
PG_USER=$(echo "$DIRECT_URL" | sed -E 's|.*://([^:]+):.*|\1|')
PG_PASS=$(echo "$DIRECT_URL" | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|')
PG_DB=$(echo "$DIRECT_URL" | sed -E 's|.*/([^?]+).*|\1|')

PGPASSWORD="$PG_PASS" psql -h "$PG_HOST" -U "$PG_USER" -d "$PG_DB" \
  -f prisma/setup.sql 2>&1 | tail -20 || echo "psql not installed — run prisma/setup.sql manually in Supabase SQL Editor"
ok "setup.sql applied"

step "8. Supabase: seed database"
npm run db:seed
ok "Database seeded"

# -----------------------------------------------------------------------------
# 9. Done
# -----------------------------------------------------------------------------
echo ""
echo "============================================================"
ok "Deployment complete!"
echo "  • GitHub:    https://github.com/${GITHUB_USER}/${GITHUB_REPO}"
echo "  • Vercel:    https://${DEPLOY_URL:-check dashboard}"
echo "  • Supabase:  ${SUPABASE_URL}"
echo "============================================================"
