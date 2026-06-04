# =============================================================================
# Legal Navigator Pro — one-shot deployment (PowerShell / Windows-friendly)
# Usage: pwsh scripts/deploy.ps1
#   Reads credentials from .env.local
# =============================================================================
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

# Load .env.local
if (Test-Path ".env.local") {
  Get-Content ".env.local" | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]*)=(.*)$") {
      Set-Item -Path "Env:\$($matches[1].Trim())" -Value $matches[2].Trim()
    }
  }
}

foreach ($k in "GITHUB_TOKEN","GITHUB_USER","VERCEL_TOKEN","SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY","DATABASE_URL","DIRECT_URL") {
  if (-not (Test-Path "Env:\$k")) { throw "$k not set" }
}

$GITHUB_REPO = if ($Env:GITHUB_REPO) { $Env:GITHUB_REPO } else { "almustahar" }
$PROJECT_NAME = if ($Env:PROJECT_NAME) { $Env:PROJECT_NAME } else { "legal-navigator-pro" }

function Step($msg) { Write-Host "`n[1;34m▶ $msg[0m" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "[1;32m✓ $msg[0m" -ForegroundColor Green }

# -----------------------------------------------------------------------------
# 1. GitHub: create repo if missing
# -----------------------------------------------------------------------------
Step "1. GitHub: create repo if missing"
$repoResp = Invoke-RestMethod -Headers @{Authorization = "token $Env:GITHUB_TOKEN"} `
  -Uri "https://api.github.com/repos/$Env:GITHUB_USER/$GITHUB_REPO" -Method Get
if (-not $repoResp) {
  $body = @{
    name = $GITHUB_REPO
    private = $false
    auto_init = $false
  } | ConvertTo-Json
  Invoke-RestMethod -Headers @{Authorization = "token $Env:GITHUB_TOKEN"} `
    -Uri "https://api.github.com/user/repos" -Method Post -Body $body -ContentType "application/json" | Out-Null
  Ok "Repo created"
} else {
  Write-Host "Repo $Env:GITHUB_USER/$GITHUB_REPO already exists"
}

# -----------------------------------------------------------------------------
# 2. GitHub: push
# -----------------------------------------------------------------------------
Step "2. GitHub: push code"
git config user.name  $Env:GITHUB_USER
git config user.email "$Env:GITHUB_USER@users.noreply.github.com"
git remote remove origin 2>$null
git remote add origin "https://$Env:GITHUB_TOKEN@github.com/$Env:GITHUB_USER/$GITHUB_REPO.git"
git push -u origin main --force
Ok "Code pushed to https://github.com/$Env:GITHUB_USER/$GITHUB_REPO"

# -----------------------------------------------------------------------------
# 3. Vercel: create project
# -----------------------------------------------------------------------------
Step "3. Vercel: create project + import repo"
$vHeaders = @{ Authorization = "Bearer $Env:VERCEL_TOKEN" }
$vApi = "https://api.vercel.com"

# Get Vercel user
$user = Invoke-RestMethod -Headers $vHeaders -Uri "$vApi/v2/user"
Write-Host "Vercel user: $($user.username)"

$projBody = @{
  name = $PROJECT_NAME
  framework = "nextjs"
  gitRepository = @{
    type = "github"
    repo = "$Env:GITHUB_USER/$GITHUB_REPO"
  }
} | ConvertTo-Json

try {
  $project = Invoke-RestMethod -Headers $vHeaders -Uri "$vApi/v10/projects" -Method Post -Body $projBody -ContentType "application/json"
  Ok "Project created (id=$($project.id))"
} catch {
  $project = Invoke-RestMethod -Headers $vHeaders -Uri "$vApi/v9/projects/$PROJECT_NAME"
  Write-Host "Existing project (id=$($project.id))"
}
$PROJECT_ID = $project.id

# -----------------------------------------------------------------------------
# 4. Vercel: set environment variables
# -----------------------------------------------------------------------------
Step "4. Vercel: set environment variables"
$envKeys = @(
  "DATABASE_URL","DIRECT_URL","NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY","NEXTAUTH_SECRET","NEXT_PUBLIC_APP_URL",
  "GROQ_API_KEY","OPENAI_API_KEY","TWILIO_ACCOUNT_SID","TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER","HYPERPAY_BASE_URL","HYPERPAY_ENTITY_ID","HYPERPAY_ACCESS_TOKEN",
  "UPSTASH_REDIS_REST_URL","UPSTASH_REDIS_REST_TOKEN"
)

foreach ($key in $envKeys) {
  $val = (Get-Item "Env:\$key" -ErrorAction SilentlyContinue).Value
  if ($val) {
    foreach ($target in @("production","preview","development")) {
      $body = @{ key = $key; value = $val; type = "encrypted"; target = @($target) } | ConvertTo-Json
      try {
        Invoke-RestMethod -Headers $vHeaders -Uri "$vApi/v10/projects/$PROJECT_ID/env" -Method Post -Body $body -ContentType "application/json" | Out-Null
        Write-Host "  ✓ $key ($target)"
      } catch {
        Write-Host "  ! $key ($target): $($_.Exception.Message)"
      }
    }
  }
}

# -----------------------------------------------------------------------------
# 5. Vercel: trigger deploy
# -----------------------------------------------------------------------------
Step "5. Vercel: trigger production deploy"
$deployBody = @{
  name = $PROJECT_NAME
  target = "production"
  gitSource = @{
    type = "github"
    repo = "$Env:GITHUB_USER/$GITHUB_REPO"
    ref = "main"
  }
} | ConvertTo-Json
$deploy = Invoke-RestMethod -Headers $vHeaders -Uri "$vApi/v13/deployments" -Method Post -Body $deployBody -ContentType "application/json"
Ok "Deploy triggered: https://$($deploy.url)"

# -----------------------------------------------------------------------------
# 6. Supabase: migrations + setup + seed
# -----------------------------------------------------------------------------
Step "6. Supabase: run prisma migrations"
npx prisma migrate deploy
Ok "Migrations applied"

Step "7. Supabase: run setup.sql (pgvector + RLS)"
# Extract DB components from DIRECT_URL
$regex = [regex]'postgresql://(?<u>[^:]+):(?<p>[^@]+)@(?<h>[^:/]+):(?<pt>\d+)/(?<d>[^?]+)'
$m = $regex.Match($Env:DIRECT_URL)
$pgHost = $m.Groups['h'].Value
$pgUser = $m.Groups['u'].Value
$pgPass = $m.Groups['p'].Value
$pgDb   = $m.Groups['d'].Value
$Env:PGPASSWORD = $pgPass

# Try to use psql; if not available, just print instructions
if (Get-Command psql -ErrorAction SilentlyContinue) {
  psql -h $pgHost -U $pgUser -d $pgDb -f prisma/setup.sql 2>&1 | Select-Object -Last 20
  Ok "setup.sql applied"
} else {
  Write-Host "psql not found. Please run prisma/setup.sql manually in Supabase SQL Editor." -ForegroundColor Yellow
  Ok "(setup.sql ready for manual run)"
}

Step "8. Supabase: seed"
npm run db:seed
Ok "Database seeded"

Write-Host "`n============================================================" -ForegroundColor Green
Ok "Deployment complete!"
Write-Host "  GitHub:    https://github.com/$Env:GITHUB_USER/$GITHUB_REPO"
Write-Host "  Vercel:    https://$($deploy.url)"
Write-Host "  Supabase:  $Env:SUPABASE_URL"
Write-Host "============================================================" -ForegroundColor Green
