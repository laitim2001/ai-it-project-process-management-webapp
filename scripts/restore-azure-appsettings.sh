#!/bin/bash

# ============================================================================
# Restore Azure App Service Application Settings
# ============================================================================
# This script restores all environment variables for the Azure App Service
# using a single az webapp config appsettings set command to avoid wiping
# existing settings.
# ============================================================================

APP_NAME="app-itpm-dev-001"
RESOURCE_GROUP="rg-itpm-dev"

echo "🔧 Restoring Azure App Service application settings..."
echo "App: $APP_NAME"
echo "Resource Group: $RESOURCE_GROUP"
echo ""

# Use az webapp config appsettings set with ALL settings in one command
# to avoid the "replace all" behavior
az webapp config appsettings set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    WEBSITES_ENABLE_APP_SERVICE_STORAGE="false" \
    DOCKER_REGISTRY_SERVER_URL="https://acritpmdev.azurecr.io" \
    NODE_ENV="production" \
    APP_NAME="IT Project Process Management Platform" \
    WEBSITES_PORT="3000" \
    AZURE_STORAGE_CONTAINER_QUOTES="quotes" \
    AZURE_STORAGE_CONTAINER_INVOICES="invoices" \
    DOCKER_ENABLE_CI="true" \
    DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://kv-itpm-dev.vault.azure.net/secrets/ITPM-DEV-DATABASE-URL/)" \
    NEXTAUTH_SECRET="@Microsoft.KeyVault(SecretUri=https://kv-itpm-dev.vault.azure.net/secrets/ITPM-DEV-NEXTAUTH-SECRET/)" \
    NEXTAUTH_URL="@Microsoft.KeyVault(SecretUri=https://kv-itpm-dev.vault.azure.net/secrets/ITPM-DEV-NEXTAUTH-URL/)" \
    AZURE_AD_TENANT_ID="@Microsoft.KeyVault(SecretUri=https://kv-itpm-dev.vault.azure.net/secrets/ITPM-DEV-AZUREAD-TENANT-ID/)" \
    AZURE_AD_CLIENT_ID="@Microsoft.KeyVault(SecretUri=https://kv-itpm-dev.vault.azure.net/secrets/ITPM-DEV-AZUREAD-CLIENT-ID/)" \
    AZURE_AD_CLIENT_SECRET="@Microsoft.KeyVault(SecretUri=https://kv-itpm-dev.vault.azure.net/secrets/ITPM-DEV-AZUREAD-CLIENT-SECRET/)" \
    AZURE_STORAGE_ACCOUNT_NAME="@Microsoft.KeyVault(SecretUri=https://kv-itpm-dev.vault.azure.net/secrets/ITPM-DEV-STORAGE-ACCOUNT-NAME/)" \
    AZURE_STORAGE_ACCOUNT_KEY="@Microsoft.KeyVault(SecretUri=https://kv-itpm-dev.vault.azure.net/secrets/ITPM-DEV-STORAGE-ACCOUNT-KEY/)" \
    SENDGRID_API_KEY="@Microsoft.KeyVault(SecretUri=https://kv-itpm-dev.vault.azure.net/secrets/ITPM-DEV-SENDGRID-API-KEY/)" \
    SENDGRID_FROM_EMAIL="@Microsoft.KeyVault(SecretUri=https://kv-itpm-dev.vault.azure.net/secrets/ITPM-DEV-SENDGRID-FROM-EMAIL/)" \
    DOCKER_REGISTRY_SERVER_USERNAME="@Microsoft.KeyVault(SecretUri=https://kv-itpm-dev.vault.azure.net/secrets/ITPM-DEV-ACR-USERNAME/)" \
    DOCKER_REGISTRY_SERVER_PASSWORD="@Microsoft.KeyVault(SecretUri=https://kv-itpm-dev.vault.azure.net/secrets/ITPM-DEV-ACR-PASSWORD/)" \
  --output none

if [ $? -eq 0 ]; then
  echo "✅ Application settings restored successfully!"
  echo ""
  echo "Verifying configuration..."
  az webapp config appsettings list \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "[?name=='DATABASE_URL' || name=='NEXTAUTH_SECRET' || name=='DOCKER_REGISTRY_SERVER_PASSWORD'].{name:name, hasValue:(value != null)}" \
    --output table
else
  echo "❌ Failed to restore application settings"
  exit 1
fi
