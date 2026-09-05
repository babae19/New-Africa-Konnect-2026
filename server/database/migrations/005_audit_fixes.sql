-- Phase 5: Audit Fixes (Timeline & Digital Signatures)
-- Migration: 005_audit_fixes.sql

-- Add timeline fields to projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP,
ADD COLUMN IF NOT EXISTS duration VARCHAR(100);

-- Add signature metadata to contracts
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS signature_metadata JSONB;

-- Add index for deadline
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects(deadline);
