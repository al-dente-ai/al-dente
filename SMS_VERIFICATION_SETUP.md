# SMS Verification Setup Guide

This document provides instructions for setting up and using the SMS verification feature in the Al Dente application.

## Overview

SMS verification has been implemented for:
1. **User Signup** - Phone verification required during account creation
2. **Password Reset** - SMS-based password recovery using verification codes
3. **Phone Number Storage** - Maximum of 5 user accounts per phone number

## Features Implemented

### Backend

#### Database Schema (`backend/src/sql/002_phone_verification.sql`)
- Added `phone_number` and `phone_verified` columns to `users` table
- Created `phone_verification_codes` table for storing verification codes
- Added indexes for efficient lookups
- Implemented functions to count users per phone number

#### SMS Service (`backend/src/utils/sms.ts`)
- Twilio integration for sending SMS messages
- 6-digit verification code generation
- Phone number formatting (E.164 format)
- Graceful fallback if Twilio is not configured

#### Authentication Service (`backend/src/services/authService.ts`)
- **`signup()`** - Creates user with phone number, sends verification code
- **`sendVerificationCode()`** - Sends SMS code with 10-minute expiration
- **`verifyPhone()`** - Validates verification code (max 5 attempts)
- **`requestPasswordReset()`** - Sends reset code to user's verified phone
- **`resetPassword()`** - Resets password using phone verification

#### API Endpoints (`backend/src/routes/auth.ts`)
- `POST /auth/signup` - Sign up with email, password, and phone number
- `POST /auth/verify-phone` - Verify phone with 6-digit code
- `POST /auth/send-verification-code` - Resend verification code
- `POST /auth/request-password-reset` - Request password reset by email
- `POST /auth/reset-password` - Reset password with phone verification

### Frontend

#### Signup Flow (`frontend/src/pages/Auth/Signup.tsx`)
- Phone number input field with validation
- Verification modal after successful signup
- Resend code functionality
- Real-time validation using validator package

#### Password Reset Flow (`frontend/src/pages/Auth/PasswordReset.tsx`)
- Two-step process: email → phone verification
- Enter email to request reset
- Enter phone number, code, and new password
- Resend code option

#### Validation (`frontend/src/lib/validators.ts`)
- Phone number validation using `validator` package
- 6-digit code validation
- Password strength requirements

## Configuration

### 1. Install Dependencies

Backend packages have been installed:
```bash
cd backend
npm install validator twilio @types/validator
```

Frontend packages have been installed:
```bash
cd frontend
npm install validator
```

### 2. Set Up Twilio Account

1. Create a Twilio account at https://www.twilio.com/
2. Get your Account SID and Auth Token from the Twilio Console
3. Purchase a phone number with SMS capabilities

### 3. Configure Environment Variables

Add the following to `backend/.env`:

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

**Note**: The application will start without Twilio credentials, but SMS functionality will not work until these are configured.

### 4. Run Database Migration

Run the migration to add phone verification tables and columns:

```bash
cd backend
npm run build
npm run migrate
```

This will execute:
- `001_init.sql` - Initial schema
- `002_phone_verification.sql` - Phone verification schema

## Testing

### Manual Testing Steps

#### 1. Test Signup with Phone Verification

```bash
# Start backend
cd backend
npm run dev

# Start frontend (in another terminal)
cd frontend
npm run dev
```

1. Navigate to `/signup`
2. Enter email, phone number (+1234567890 format), and password
3. Click "Create account"
4. Verification modal should appear
5. Check your phone for the 6-digit code
6. Enter code and click "Verify"
7. Should redirect to dashboard

#### 2. Test Password Reset

1. Navigate to `/login`
2. Click "Forgot your password?"
3. Enter your email address
4. Click "Send verification code"
5. Enter your phone number and the code received
6. Enter new password and confirm
7. Click "Reset password"
8. Should redirect to login page

#### 3. Test Phone Number Limit

Create 6 accounts with the same phone number - the 6th should fail with an error message about reaching the maximum limit.

### API Testing with curl

#### Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "phoneNumber": "+1234567890"
  }'
```

#### Verify Phone
```bash
curl -X POST http://localhost:3000/api/auth/verify-phone \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "code": "123456"
  }'
```

#### Request Password Reset
```bash
curl -X POST http://localhost:3000/api/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

#### Reset Password
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "code": "123456",
    "newPassword": "newpassword123"
  }'
```

## Security Features

1. **Code Expiration**: Verification codes expire after 10 minutes
2. **Attempt Limiting**: Maximum 5 verification attempts per code
3. **Phone Number Limit**: Maximum 5 accounts per phone number
4. **Rate Limiting**: Auth endpoints are rate-limited to prevent abuse
5. **Secure Password Storage**: Passwords are hashed using Argon2

## Phone Number Format

The system accepts phone numbers in various formats and normalizes them to E.164:
- `+12345678900` (E.164 format)
- `12345678900` (country code with no +)
- `2345678900` (10 digits, assumes +1 for US/Canada)

Examples:
- US/Canada: `+12345678900` or `2345678900`
- UK: `+441234567890`
- India: `+911234567890`

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "SMS service is not available" | Twilio not configured | Add Twilio credentials to `.env` |
| "Invalid or expired verification code" | Code incorrect or expired | Request new code |
| "Too many verification attempts" | 5 failed attempts | Request new code |
| "This phone number has reached the maximum number of associated accounts" | 5 accounts already use this number | Use a different phone number |
| "No verified phone number associated with this account" | Password reset for account without verified phone | Contact support or use a different recovery method |

## Troubleshooting

### SMS not received

1. **Check Twilio configuration**
   - Verify Account SID and Auth Token in `.env`
   - Ensure phone number is in E.164 format with country code

2. **Check Twilio Console**
   - Log in to Twilio Console
   - Check "Logs" section for delivery status
   - Verify phone number has SMS capabilities

3. **Trial Account Limitations**
   - Twilio trial accounts can only send to verified phone numbers
   - Upgrade to send to any number

### Migration Issues

If the migration fails:

1. **Check database connection**
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

2. **Manually run SQL**
   ```bash
   psql $DATABASE_URL < backend/src/sql/002_phone_verification.sql
   ```

3. **Verify tables created**
   ```sql
   \dt phone_verification_codes
   \d users
   ```

## Development Notes

### Phone Number Validation

The system uses the `validator` package for phone number validation:
- Frontend: Validates format before submission
- Backend: Re-validates and formats to E.164

### Verification Code Storage

Codes are stored in the database with:
- 10-minute expiration
- Purpose tracking (signup, password_reset, phone_change)
- Attempt counter
- User association

### Cleanup

Consider adding a cron job to clean up expired verification codes:

```sql
DELETE FROM phone_verification_codes 
WHERE expires_at < NOW() AND verified = FALSE;
```

## Future Enhancements

Potential improvements:
1. Phone number change functionality
2. Two-factor authentication (2FA) using SMS
3. International phone number support with country code selection
4. Rate limiting per phone number
5. Automated cleanup of expired codes
6. SMS delivery status tracking
7. Alternative to SMS (email verification, authenticator apps)

## Support

For issues or questions:
1. Check Twilio Console for SMS delivery logs
2. Check backend logs for error messages
3. Verify database schema is up to date
4. Ensure all environment variables are set correctly

