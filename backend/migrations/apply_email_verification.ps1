# Email Verification Migration Script (PowerShell)
# This script applies the email verification database migration

$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Email Verification Migration" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "❌ ERROR: DATABASE_URL environment variable is not set" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please set DATABASE_URL in one of these ways:"
    Write-Host "1. In PowerShell: `$env:DATABASE_URL = 'postgresql://...'"
    Write-Host "2. Set in .env file and load it"
    Write-Host "3. Run with: `$env:DATABASE_URL='postgresql://...'; .\apply_email_verification.ps1"
    Write-Host ""
    exit 1
}

Write-Host "📊 Current Database: $env:DATABASE_URL" -ForegroundColor Yellow
Write-Host ""

# Confirm before proceeding
$confirmation = Read-Host "Do you want to apply the email verification migration? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "❌ Migration cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔍 Checking database connection..." -ForegroundColor Yellow

try {
    $testQuery = "SELECT version();"
    $null = psql $env:DATABASE_URL -c $testQuery 2>&1
    Write-Host "✅ Database connection successful" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Cannot connect to database" -ForegroundColor Red
    Write-Host "Please check your DATABASE_URL and database server" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Creating backup (optional but recommended)..." -ForegroundColor Yellow
$backupConfirmation = Read-Host "Create backup? (Y/n)"

if ($backupConfirmation -ne 'n' -and $backupConfirmation -ne 'N') {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "backup_before_email_verification_$timestamp.sql"
    Write-Host "Creating backup: $backupFile" -ForegroundColor Yellow
    
    try {
        pg_dump $env:DATABASE_URL > $backupFile
        Write-Host "✅ Backup created: $backupFile" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Warning: Backup failed, but continuing..." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🚀 Applying email verification migration..." -ForegroundColor Yellow
Write-Host ""

# Apply the migration
try {
    psql $env:DATABASE_URL -f "002_add_email_verification.sql"
    
    Write-Host ""
    Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Verification:" -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Cyan
    
    # Verify the migration
    Write-Host "Checking email_verified column..." -ForegroundColor Yellow
    psql $env:DATABASE_URL -c "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified';"
    
    Write-Host ""
    Write-Host "Checking email_verification_codes table..." -ForegroundColor Yellow
    psql $env:DATABASE_URL -c "\d email_verification_codes"
    
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "✅ Email Verification Migration Complete!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Configure email settings in your .env file"
    Write-Host "2. Restart your backend server"
    Write-Host "3. Test the verification flow"
    Write-Host ""
    Write-Host "See QUICK_START_EMAIL_VERIFICATION.md for details"
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: Migration failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    
    if ($backupFile) {
        Write-Host "If you created a backup, you can restore it with:" -ForegroundColor Yellow
        Write-Host "psql `$env:DATABASE_URL < $backupFile" -ForegroundColor Yellow
    }
    Write-Host ""
    exit 1
}

