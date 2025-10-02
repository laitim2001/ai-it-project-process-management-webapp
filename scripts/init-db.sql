-- ==============================================================================
-- IT Project Process Management Platform
-- Database Initialization Script
-- ==============================================================================
--
-- This script runs automatically when the PostgreSQL container is first created
-- It sets up initial database configuration and extensions
--
-- ==============================================================================

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- For UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- For text search optimization
CREATE EXTENSION IF NOT EXISTS "btree_gin";      -- For improved indexing

-- Set timezone
SET timezone = 'Asia/Taipei';

-- Create a read-only user for reporting (optional)
-- CREATE USER itpm_readonly WITH PASSWORD 'readonly_password';
-- GRANT CONNECT ON DATABASE itpm_dev TO itpm_readonly;
-- GRANT USAGE ON SCHEMA public TO itpm_readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO itpm_readonly;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO itpm_readonly;

-- Log successful initialization
DO $$
BEGIN
  RAISE NOTICE 'Database initialization completed successfully';
  RAISE NOTICE 'Extensions installed: uuid-ossp, pg_trgm, btree_gin';
  RAISE NOTICE 'Timezone set to: Asia/Taipei';
END $$;
