-- Create tenants table in public schema
-- Run this SQL script to create the tenants table manually
-- This avoids using TypeORM synchronize which can break existing data

CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster lookups (optional)
CREATE INDEX IF NOT EXISTS idx_tenants_name ON public.tenants(name);

