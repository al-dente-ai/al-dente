-- Rollback Migration: Remove Email Verification
-- Description: Rollback the email verification feature
-- Date: 2025-10-13

BEGIN;

-- Drop the unique index first
DROP INDEX IF EXISTS email_verification_codes_active_user_idx;

-- Drop other indexes
DROP INDEX IF EXISTS email_verification_codes_expires_at_idx;
DROP INDEX IF EXISTS email_verification_codes_code_idx;
DROP INDEX IF EXISTS email_verification_codes_user_id_idx;

-- Drop the email verification codes table
DROP TABLE IF EXISTS email_verification_codes;

-- Remove email_verified column from users table
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;

COMMIT;

