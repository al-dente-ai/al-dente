-- Migration: Add Email Verification
-- Description: Adds email verification functionality with 6-digit codes that expire after 10 minutes
-- Date: 2025-10-13

BEGIN;

-- Add email_verified column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Create email verification codes table
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS email_verification_codes_user_id_idx ON email_verification_codes (user_id);
CREATE INDEX IF NOT EXISTS email_verification_codes_code_idx ON email_verification_codes (code);
CREATE INDEX IF NOT EXISTS email_verification_codes_expires_at_idx ON email_verification_codes (expires_at);

-- Add constraint to ensure only one unverified code per user at a time
-- Note: We check expiration in application logic, not in the index predicate
CREATE UNIQUE INDEX IF NOT EXISTS email_verification_codes_active_user_idx 
ON email_verification_codes (user_id) 
WHERE verified = FALSE;

COMMIT;

