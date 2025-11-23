#!/bin/bash
# ==============================================================================
# List Secrets in Azure Key Vault
# ==============================================================================
# 用途: 列出指定環境 Key Vault 中的所有密鑰
# 使用: ./list-secrets.sh <environment>
# ==============================================================================

set -e
set -u

BLUE='\033[0;34m'; GREEN='\033[0;32m'; NC='\033[0m'
log_info() { echo -e "${BLUE}ℹ️  ${NC}$1"; }

if [ $# -eq 0 ]; then
    echo "使用方式: $0 <environment>"
    exit 1
fi

ENVIRONMENT=$1
KV_NAME="kv-itpm-${ENVIRONMENT}"

log_info "列出 Key Vault 密鑰: $KV_NAME"

az keyvault secret list \
  --vault-name "$KV_NAME" \
  --query "[].{Name:name, Enabled:attributes.enabled, Updated:attributes.updated}" \
  -o table
