#!/bin/sh
# ============================================================================
# FIX-141 baseline 對齊 + 套用 pending migrations(company/dev = UAT)
# ============================================================================
# 由 migration runner 映像在 ACI 內執行。讀取 DATABASE_URL(env)。
# 步驟:0 連線/狀態 → 1 印出舊 _prisma_migrations(可逆紀錄)→ 2 DELETE
#       → 3 標記 baseline init 已套用 → 4 migrate deploy → 5 最終狀態
# 任何一步失敗即中止(set -e),並以非零 exit 反映於 ACI 紀錄。
# ============================================================================
set -e
SCHEMA=/work/prisma/schema.prisma

echo "=============================================="
echo "ITPM company/dev — FIX-141 baseline + migrate"
echo "=============================================="

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL 未設置"; exit 1
fi

echo ""
echo "=== STEP 0: 連線 + 目前 migrate 狀態(套用前)==="
prisma migrate status --schema="$SCHEMA" || echo "(status 顯示分歧 — baseline 對齊前屬預期)"

echo ""
echo "=== STEP 1: 印出舊 _prisma_migrations(可逆紀錄,含 checksum)==="
psql "$DATABASE_URL" -P pager=off -c 'SELECT id, migration_name, checksum, started_at, finished_at, applied_steps_count FROM "_prisma_migrations" ORDER BY started_at;'

echo ""
echo "=== STEP 2: DELETE FROM _prisma_migrations(只動遷移元資料,不碰業務資料)==="
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c 'DELETE FROM "_prisma_migrations";'
echo "deleted."

echo ""
echo "=== STEP 3: 標記 baseline 00000000000000_init 為已套用(不重跑建表 SQL)==="
prisma migrate resolve --applied 00000000000000_init --schema="$SCHEMA"

echo ""
echo "=== STEP 4: migrate deploy(套用 5 個新 migration)==="
prisma migrate deploy --schema="$SCHEMA"

echo ""
echo "=== STEP 5: 最終 migrate status(期望:up to date)==="
prisma migrate status --schema="$SCHEMA"

echo ""
echo "=== DONE — baseline + migrate 完成 ==="
