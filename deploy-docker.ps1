# PowerShell script to deploy Al Dente full stack with Docker

param(
    [switch]$Build = $true,
    [switch]$Dev = $false,
    [string]$Environment = "production"
)

Write-Host "🚀 Deploying Al Dente Full Stack Application..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Please create one from .env.example" -ForegroundColor Yellow
    Write-Host "   Required variables:" -ForegroundColor White
    Write-Host "   - JWT_SECRET" -ForegroundColor White
    Write-Host "   - OPENAI_API_KEY" -ForegroundColor White
    Write-Host "   - SUPABASE_URL" -ForegroundColor White
    Write-Host "   - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor White
    exit 1
}

# Build images if requested
if ($Build) {
    Write-Host "🔨 Building Docker images..." -ForegroundColor Yellow
    docker-compose build --no-cache
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker build failed!" -ForegroundColor Red
        exit 1
    }
}

# Start services
Write-Host "🚀 Starting services..." -ForegroundColor Yellow

if ($Dev) {
    # Development mode with hot reload
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
} else {
    # Production mode
    docker-compose up -d
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start services!" -ForegroundColor Red
    exit 1
}

# Wait for services to be healthy
Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
$maxWait = 120 # 2 minutes
$waited = 0

do {
    Start-Sleep 5
    $waited += 5
    $status = docker-compose ps --format json | ConvertFrom-Json
    $healthy = $true
    
    foreach ($service in $status) {
        if ($service.Health -ne "healthy" -and $service.Health -ne "") {
            $healthy = $false
            break
        }
    }
    
    if ($waited -ge $maxWait) {
        Write-Host "⚠️  Timeout waiting for services. Check logs with: docker-compose logs" -ForegroundColor Yellow
        break
    }
} while (-not $healthy)

# Show status
Write-Host "📋 Service Status:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost" -ForegroundColor White
Write-Host "🔌 API: http://localhost/api" -ForegroundColor White
Write-Host "📚 API Docs: http://localhost/api-docs" -ForegroundColor White
Write-Host "💾 Database: localhost:5432" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Useful commands:" -ForegroundColor Cyan
Write-Host "  View logs: docker-compose logs -f" -ForegroundColor White
Write-Host "  Stop services: docker-compose down" -ForegroundColor White
Write-Host "  Restart: docker-compose restart" -ForegroundColor White
Write-Host "  Update: docker-compose pull && docker-compose up -d" -ForegroundColor White
