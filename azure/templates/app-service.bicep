// ============================================================================
// Azure App Service Bicep Template
// ============================================================================
// Purpose: Deploy App Service Plan and App Service for IT Project Management Platform
// Resources: App Service Plan, App Service, Application Insights integration
// ============================================================================

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Environment name (dev, staging, prod)')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environment string = 'dev'

@description('App Service Plan name')
param appServicePlanName string = 'asp-itpm-${environment}'

@description('App Service name')
param appServiceName string = 'app-itpm-${environment}-001'

@description('Container Registry name')
param acrName string = 'acritpm${environment}'

@description('Container image tag')
param imageTag string = 'latest'

@description('Key Vault name for secrets')
param keyVaultName string = 'kv-itpm-${environment}'

// ============================================================================
// App Service Plan
// ============================================================================
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: appServicePlanName
  location: location
  kind: 'linux'
  sku: {
    name: 'B1' // Basic tier
    tier: 'Basic'
    capacity: 1
  }
  properties: {
    reserved: true // Required for Linux
  }
}

// ============================================================================
// App Service
// ============================================================================
resource appService 'Microsoft.Web/sites@2022-09-01' = {
  name: appServiceName
  location: location
  kind: 'app,linux,container'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOCKER|${acrName}.azurecr.io/itpm-web:${imageTag}'
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      appSettings: [
        // Application settings with Key Vault references
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
        {
          name: 'WEBSITES_PORT'
          value: '3000'
        }
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        // Add more app settings as needed
        // Example Key Vault reference:
        // {
        //   name: 'DATABASE_URL'
        //   value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=ITPM-${toUpper(environment)}-DATABASE-URL)'
        // }
      ]
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// ============================================================================
// Outputs
// ============================================================================
output appServiceUrl string = 'https://${appService.properties.defaultHostName}'
output appServicePrincipalId string = appService.identity.principalId
output appServiceName string = appService.name
