-- =============================================================================
-- Database Initialization Script
-- =============================================================================
-- Run this script to initialize a fresh database for local development
-- This is automatically executed by docker-compose on first run
-- =============================================================================

-- Run the initial schema migration
\i /docker-entrypoint-initdb.d/001_initial_schema.sql

-- Insert any seed data if needed for development
-- (Add development seed data here)

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO agent_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO agent_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO agent_user;
