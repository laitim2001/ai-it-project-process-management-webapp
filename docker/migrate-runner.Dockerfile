# ============================================================================
# Migration Runner — 一次性遷移執行器(供 Azure Container Instance 使用)
# ============================================================================
# 目的:從 Azure 內部(ACI)對 Azure PostgreSQL 套用 FIX-141 baseline + pending
#       migrations。使用 debian(glibc/openssl-3.0.x)的全新 prisma,確保
#       schema-engine 可正常執行(app 映像的 alpine schema-engine 為 openssl-1.1.x,
#       與映像的 openssl-3.0 不相容,無法跑 migrate)。
#
# Build:  docker build -f docker/migrate-runner.Dockerfile -t <acr>/itpm-migrate:<tag> .
# 連線測試(唯讀,預設 CMD): 直接執行映像 → prisma migrate status
# 實際遷移(破壞性,需明確指定): --command-line "sh /work/migrate-baseline.sh"
# 必要環境變數:DATABASE_URL(以 secure-environment-variables 傳入)
# ============================================================================
FROM node:20-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends postgresql-client ca-certificates openssl \
 && rm -rf /var/lib/apt/lists/*

# 全新安裝 prisma 5.22.0 —— postinstall 會依平台下載正確的 debian-openssl-3.0.x engine
RUN npm install -g prisma@5.22.0

# 帶入 schema 與全部 migrations(含 00000000000000_init + 5 個新 migration)
COPY packages/db/prisma /work/prisma
# 帶入破壞性遷移腳本(非預設執行)
COPY docker/migrate-baseline.sh /work/migrate-baseline.sh
RUN chmod +x /work/migrate-baseline.sh

WORKDIR /work

# 安全預設:唯讀 migrate status(用於連線測試)。
# 破壞性遷移必須明確以 --command-line "sh /work/migrate-baseline.sh" 觸發。
CMD ["prisma", "migrate", "status", "--schema=/work/prisma/schema.prisma"]
