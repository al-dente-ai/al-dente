-- Add phone number column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index on phone_number for lookups
CREATE INDEX IF NOT EXISTS users_phone_number_idx ON users(phone_number) WHERE phone_number IS NOT NULL;

-- Create phone_verification_codes table for SMS verification
CREATE TABLE IF NOT EXISTS phone_verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT NOT NULL,
  code VARCHAR(6) NOT NULL,
  purpose VARCHAR(50) NOT NULL, -- 'signup', 'password_reset', 'phone_change'
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup of verification codes
CREATE INDEX IF NOT EXISTS phone_verification_codes_lookup_idx 
  ON phone_verification_codes(phone_number, code, purpose) 
  WHERE verified = FALSE AND expires_at > NOW();

-- Index for cleanup of expired codes
CREATE INDEX IF NOT EXISTS phone_verification_codes_expires_idx 
  ON phone_verification_codes(expires_at) 
  WHERE verified = FALSE;

-- Function to count users per phone number
CREATE OR REPLACE FUNCTION count_users_per_phone(phone TEXT)
RETURNS INTEGER AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count
  FROM users
  WHERE phone_number = phone;
  RETURN user_count;
END;
$$ LANGUAGE plpgsql;

-- Add constraint check function (for application-level enforcement)
-- Note: PostgreSQL doesn't support function-based CHECK constraints,
-- so this will be enforced in the application code
COMMENT ON FUNCTION count_users_per_phone(TEXT) IS 
  'Returns the number of users with the given phone number. Maximum allowed is 5.';

