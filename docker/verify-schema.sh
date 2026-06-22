#!/bin/sh
# ============================================================================
# Schema 漂移硬閘門驗證（doc 11）：確認 live DB 完全符合 HEAD schema
# ============================================================================
# 用途：部署後驗證 ADD COLUMN = 0（否則代表 DB 缺欄位 → 登入後 API 層會 500）。
# 設計：只輸出純 ASCII 的「關鍵字計數」，避免 Windows az container logs 讀到
#       prisma 的 Unicode 進度符號（✔ 等）而 cp1252 crash。
#       prisma 的進度輸出走 stderr，--script 的 SQL 走 stdout；2>/dev/null 丟棄 stderr。
# 通過標準：ADD_COLUMN_COUNT=0
# 執行：sh /work/verify-schema.sh（DATABASE_URL 由 env 提供）
# ============================================================================
DIFF=$(prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel /work/prisma/schema.prisma --script 2>/dev/null)
echo "ADD_COLUMN_COUNT=$(printf '%s' "$DIFF" | grep -c 'ADD COLUMN')"
echo "DROP_COLUMN_COUNT=$(printf '%s' "$DIFF" | grep -c 'DROP COLUMN')"
echo "CREATE_TABLE_COUNT=$(printf '%s' "$DIFF" | grep -c 'CREATE TABLE')"
echo "ALTER_TABLE_COUNT=$(printf '%s' "$DIFF" | grep -c 'ALTER TABLE')"
echo "TOTAL_NONEMPTY_LINES=$(printf '%s' "$DIFF" | grep -c .)"
