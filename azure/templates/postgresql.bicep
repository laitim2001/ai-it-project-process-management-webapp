// ============================================================================
// Azure PostgreSQL Flexible Server Bicep Template
// ============================================================================
// Purpose: Deploy PostgreSQL Flexible Server for IT Project Management Platform
// Resources: PostgreSQL server, firewall rules, database
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

@description('PostgreSQL server name')
param serverName string = 'psql-itpm-${environment}-001'

@description('PostgreSQL administrator login')
@secure()
param administratorLogin string

@description('PostgreSQL administrator password')
@secure()
param administratorPassword string

@description('PostgreSQL version')
@allowed([
  '16'
  '15'
  '14'
])
param postgresqlVersion string = '16'

@description('Database name')
param databaseName string = 'itpm_${environment}'

// ============================================================================
// PostgreSQL Flexible Server
// ============================================================================
resource postgresqlServer 'Microsoft.DBforPostgreSQL/flexibleServers@2022-12-01' = {
  name: serverName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: postgresqlVersion
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorPassword
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

// ============================================================================
// Firewall Rule: Allow Azure Services
// ============================================================================
resource firewallRuleAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2022-12-01' = {
  name: 'AllowAllAzureServicesAndResourcesWithinAzureIps'
  parent: postgresqlServer
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ============================================================================
// Database
// ============================================================================
resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2022-12-01' = {
  name: databaseName
  parent: postgresqlServer
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// ============================================================================
// Outputs
// ============================================================================
output serverFqdn string = postgresqlServer.properties.fullyQualifiedDomainName
output databaseName string = database.name
output connectionString string = 'postgresql://${administratorLogin}:${administratorPassword}@${postgresqlServer.properties.fullyQualifiedDomainName}:5432/${databaseName}?sslmode=require'
