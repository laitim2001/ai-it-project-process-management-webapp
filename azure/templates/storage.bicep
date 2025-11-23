// ============================================================================
// Azure Blob Storage Bicep Template
// ============================================================================
// Purpose: Deploy Blob Storage for IT Project Management Platform file uploads
// Resources: Storage Account, Blob Containers
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

@description('Storage account name (must be globally unique, lowercase, no hyphens)')
param storageAccountName string = 'stitpm${environment}001'

// ============================================================================
// Storage Account
// ============================================================================
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    accessTier: 'Hot'
  }
}

// ============================================================================
// Blob Service
// ============================================================================
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  name: 'default'
  parent: storageAccount
  properties: {
    cors: {
      corsRules: []
    }
    deleteRetentionPolicy: {
      enabled: true
      days: 7
    }
  }
}

// ============================================================================
// Blob Containers
// ============================================================================
resource quotesContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: 'quotes'
  parent: blobService
  properties: {
    publicAccess: 'None'
  }
}

resource invoicesContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: 'invoices'
  parent: blobService
  properties: {
    publicAccess: 'None'
  }
}

// ============================================================================
// Outputs
// ============================================================================
output storageAccountName string = storageAccount.name
output storageAccountId string = storageAccount.id
output quotesContainerName string = quotesContainer.name
output invoicesContainerName string = invoicesContainer.name
output blobEndpoint string = storageAccount.properties.primaryEndpoints.blob
