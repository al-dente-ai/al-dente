#!/bin/bash

# Email Verification Migration Script
# This script applies the email verification database migration

set -e  # Exit on error

echo "================================================"
echo "Email Verification Migration"
echo "================================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set DATABASE_URL in one of these ways:"
    echo "1. Export in your shell: export DATABASE_URL='postgresql://...'"
    echo "2. Set in .env file and run: source .env"
    echo "3. Run with: DATABASE_URL='postgresql://...' ./apply_email_verification.sh"
    echo ""
    exit 1
fi

echo "📊 Current Database: $DATABASE_URL"
echo ""

# Confirm before proceeding
read -p "Do you want to apply the email verification migration? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 0
fi

echo ""
echo "🔍 Checking database connection..."
if ! psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo "❌ ERROR: Cannot connect to database"
    echo "Please check your DATABASE_URL and database server"
    exit 1
fi

echo "✅ Database connection successful"
echo ""

echo "📦 Creating backup (optional but recommended)..."
BACKUP_FILE="backup_before_email_verification_$(date +%Y%m%d_%H%M%S).sql"
read -p "Create backup? (Y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo "Creating backup: $BACKUP_FILE"
    pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
    echo "✅ Backup created: $BACKUP_FILE"
fi

echo ""
echo "🚀 Applying email verification migration..."
echo ""

# Apply the migration
if psql "$DATABASE_URL" -f "002_add_email_verification.sql"; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "📋 Verification:"
    echo "----------------------------------------"
    
    # Verify the migration
    echo "Checking email_verified column..."
    psql "$DATABASE_URL" -c "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified';"
    
    echo ""
    echo "Checking email_verification_codes table..."
    psql "$DATABASE_URL" -c "\d email_verification_codes"
    
    echo ""
    echo "================================================"
    echo "✅ Email Verification Migration Complete!"
    echo "================================================"
    echo ""
    echo "Next steps:"
    echo "1. Configure email settings in your .env file"
    echo "2. Restart your backend server"
    echo "3. Test the verification flow"
    echo ""
    echo "See QUICK_START_EMAIL_VERIFICATION.md for details"
    echo ""
else
    echo ""
    echo "❌ ERROR: Migration failed"
    echo ""
    echo "If you created a backup, you can restore it with:"
    echo "psql \$DATABASE_URL < $BACKUP_FILE"
    echo ""
    exit 1
fi

