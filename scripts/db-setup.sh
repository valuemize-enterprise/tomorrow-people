#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════
# db-setup.sh — Tomorrow's People database setup
#
# Usage:
#   chmod +x scripts/db-setup.sh
#
#   Development:   ./scripts/db-setup.sh dev
#   Production:    ./scripts/db-setup.sh prod
#   Reset (dev):   ./scripts/db-setup.sh reset
#   Seed:          ./scripts/db-setup.sh seed
# ════════════════════════════════════════════════════════════════════

set -euo pipefail

MODE="${1:-dev}"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

log()  { echo -e "${GREEN}▶ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
err()  { echo -e "${RED}✗ $1${NC}"; exit 1; }

# ── Verify DATABASE_URL is set ────────────────────────────────────
if [ -z "${DATABASE_URL:-}" ]; then
  err "DATABASE_URL is not set. Copy .env.example to .env and fill it in."
fi

case "$MODE" in

# ── Development setup ─────────────────────────────────────────────
dev)
  log "Running development migration..."
  npx prisma migrate dev --name "$(date +%Y%m%d)_init" --skip-seed

  log "Generating Prisma client..."
  npx prisma generate

  log "Applying performance indexes (raw SQL)..."
  npx prisma db execute --stdin << 'SQL'
    -- Partial index: only index active habits, reducing index size by ~50%
    -- for inactive habit reads. Prisma cannot express partial indexes natively.
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_habits_active_stack
      ON habits(user_id, stack_order)
      WHERE is_active = TRUE;

    -- Descending date index on daily_logs for streak recalculation.
    -- recalcStreak always queries ORDER BY date DESC LIMIT 90 — this avoids
    -- a reverse scan of the ascending unique index.
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_logs_habit_date_desc
      ON daily_logs(habit_id, date DESC);

    -- Covering index for getProgressSummary: avoids heap fetch entirely
    -- by including status in the index alongside the filter columns.
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_logs_user_date_status
      ON daily_logs(user_id, date, status);
SQL

  log "Seeding demo data..."
  npm run db:seed

  log "Done — open Prisma Studio with: npx prisma studio"
  ;;

# ── Production deployment ─────────────────────────────────────────
prod)
  warn "Production deployment — no seed data will be applied."
  warn "Verify DATABASE_URL points to the correct production database."
  read -r -p "Continue? [y/N] " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }

  log "Applying migrations (deploy mode — no interactive prompts)..."
  npx prisma migrate deploy

  log "Generating Prisma client..."
  npx prisma generate

  log "Applying performance indexes..."
  npx prisma db execute --stdin << 'SQL'
    -- Partial index for active habits only
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_habits_active_stack
      ON habits(user_id, stack_order)
      WHERE is_active = TRUE;

    -- Descending date index for streak recalculation
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_logs_habit_date_desc
      ON daily_logs(habit_id, date DESC);

    -- Covering index for date+status filter queries
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_logs_user_date_status
      ON daily_logs(user_id, date, status);

    -- Update PostgreSQL statistics after bulk index creation
    ANALYZE habits, daily_logs, streaks;
SQL

  log "Production database is ready."
  ;;

# ── Reset (dev only) ──────────────────────────────────────────────
reset)
  warn "This will DROP all tables and re-apply all migrations."
  warn "Only safe in development. NEVER run against production."
  read -r -p "Continue? [y/N] " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }

  log "Resetting database..."
  npx prisma migrate reset --force

  log "Seeding demo data..."
  npm run db:seed

  log "Reset complete."
  ;;

# ── Seed only ─────────────────────────────────────────────────────
seed)
  log "Running seed..."
  npm run db:seed
  ;;

*)
  err "Unknown mode: $MODE. Use: dev | prod | reset | seed"
  ;;
esac
