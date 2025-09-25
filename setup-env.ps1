# Environment Setup Script for Al Dente Docker Deployment

Write-Host "🔧 Al Dente Environment Setup" -ForegroundColor Green
Write-Host "This script will help you create the required .env file for Docker deployment.`n" -ForegroundColor White

# Check if .env already exists
if (Test-Path ".env") {
    $overwrite = Read-Host ".env file already exists. Overwrite? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "Setup cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "Please provide the following required environment variables:`n" -ForegroundColor Cyan

# JWT Secret
Write-Host "1. JWT Secret (for authentication tokens)" -ForegroundColor Yellow
Write-Host "   This should be a long, random string (minimum 32 characters)" -ForegroundColor Gray
$jwtSecret = ""
while ($jwtSecret.Length -lt 32) {
    $jwtSecret = Read-Host "JWT_SECRET"
    if ($jwtSecret.Length -lt 32) {
        Write-Host "   ⚠️  JWT secret must be at least 32 characters long" -ForegroundColor Red
    }
}

# OpenAI API Key
Write-Host "`n2. OpenAI API Key (for AI recipe generation)" -ForegroundColor Yellow
Write-Host "   Get this from https://platform.openai.com/api-keys" -ForegroundColor Gray
$openaiKey = ""
while ($openaiKey -eq "" -or !$openaiKey.StartsWith("sk-")) {
    $openaiKey = Read-Host "OPENAI_API_KEY"
    if (!$openaiKey.StartsWith("sk-")) {
        Write-Host "   ⚠️  OpenAI API key should start with 'sk-'" -ForegroundColor Red
    }
}

# Supabase URL
Write-Host "`n3. Supabase Project URL (for image storage)" -ForegroundColor Yellow
Write-Host "   Get this from your Supabase project settings" -ForegroundColor Gray
$supabaseUrl = ""
while ($supabaseUrl -eq "" -or !$supabaseUrl.StartsWith("https://")) {
    $supabaseUrl = Read-Host "SUPABASE_URL"
    if (!$supabaseUrl.StartsWith("https://")) {
        Write-Host "   ⚠️  Supabase URL should start with 'https://'" -ForegroundColor Red
    }
}

# Supabase Service Role Key
Write-Host "`n4. Supabase Service Role Key (for server-side operations)" -ForegroundColor Yellow
Write-Host "   Get this from your Supabase project API settings" -ForegroundColor Gray
$supabaseKey = ""
while ($supabaseKey -eq "") {
    $supabaseKey = Read-Host "SUPABASE_SERVICE_ROLE_KEY" 
}

# Image Bucket Name
Write-Host "`n5. Supabase Storage Bucket Name (optional, default: pantry-images)" -ForegroundColor Yellow
$imageBucket = Read-Host "SUPABASE_IMAGE_BUCKET [pantry-images]"
if ($imageBucket -eq "") {
    $imageBucket = "pantry-images"
}

# Project Name
Write-Host "`n6. Docker Compose Project Name (optional, default: aldente)" -ForegroundColor Yellow
$projectName = Read-Host "COMPOSE_PROJECT_NAME [aldente]"
if ($projectName -eq "") {
    $projectName = "aldente"
}

# Create .env file
$envContent = @"
# Al Dente Full Stack Environment Configuration
# Generated on $(Get-Date)

# Authentication
JWT_SECRET=$jwtSecret

# OpenAI Configuration
OPENAI_API_KEY=$openaiKey

# Supabase Configuration
SUPABASE_URL=$supabaseUrl
SUPABASE_SERVICE_ROLE_KEY=$supabaseKey
SUPABASE_IMAGE_BUCKET=$imageBucket

# Docker Configuration
COMPOSE_PROJECT_NAME=$projectName

# Database Configuration (using Docker defaults)
POSTGRES_DB=al_dente
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
"@

# Write to .env file
$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "`n✅ Environment file created successfully!" -ForegroundColor Green
Write-Host "📝 Configuration saved to .env" -ForegroundColor White

Write-Host "`n🚀 Next steps:" -ForegroundColor Cyan
Write-Host "1. Review the .env file and make any necessary adjustments" -ForegroundColor White
Write-Host "2. Run the deployment script: .\deploy-docker.ps1" -ForegroundColor White
Write-Host "3. Access your application at http://localhost" -ForegroundColor White

Write-Host "`n🔒 Security Note:" -ForegroundColor Red
Write-Host "Keep your .env file secure and never commit it to version control!" -ForegroundColor Yellow
