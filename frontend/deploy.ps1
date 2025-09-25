# PowerShell deployment script for Al Dente Frontend
# Run this script to build and deploy to your home server

param(
    [string]$ServerPath = "/var/www/aldente",
    [string]$ServerUser = "your-user",
    [string]$ServerHost = "your-server-ip",
    [switch]$Build = $true
)

Write-Host "🚀 Deploying Al Dente Frontend..." -ForegroundColor Green

# Step 1: Build for production
if ($Build) {
    Write-Host "📦 Building for production..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
}

# Step 2: Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$deployPackage = "aldente-frontend-$timestamp.tar.gz"

# Create tar.gz (requires WSL or tar.exe)
if (Get-Command wsl -ErrorAction SilentlyContinue) {
    wsl tar -czf $deployPackage -C dist .
} else {
    # Alternative: use 7zip or WinRAR command line
    Write-Host "⚠️  WSL not found. Please manually create archive of dist/ folder" -ForegroundColor Yellow
    Write-Host "Or install WSL for automatic packaging" -ForegroundColor Yellow
}

# Step 3: Upload to server (requires SSH key setup)
if (Test-Path $deployPackage) {
    Write-Host "🚀 Uploading to server..." -ForegroundColor Yellow
    
    # Upload package
    scp $deployPackage "${ServerUser}@${ServerHost}:/tmp/"
    
    # Deploy on server
    ssh "${ServerUser}@${ServerHost}" @"
        # Backup current deployment
        sudo cp -r $ServerPath ${ServerPath}.backup.$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
        
        # Extract new deployment
        sudo mkdir -p $ServerPath
        sudo tar -xzf /tmp/$deployPackage -C $ServerPath
        
        # Set permissions
        sudo chown -R www-data:www-data $ServerPath
        sudo chmod -R 755 $ServerPath
        
        # Reload web server
        sudo nginx -t && sudo systemctl reload nginx || sudo systemctl reload apache2
        
        # Cleanup
        rm /tmp/$deployPackage
        
        echo "✅ Deployment completed successfully!"
"@
    
    # Cleanup local package
    Remove-Item $deployPackage
    
    Write-Host "🎉 Deployment completed! Your site should be live." -ForegroundColor Green
} else {
    Write-Host "❌ Deployment package not found!" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Don't forget to:" -ForegroundColor Cyan
Write-Host "  1. Configure Cloudflare DNS and proxy settings" -ForegroundColor White
Write-Host "  2. Set up SSL certificates" -ForegroundColor White
Write-Host "  3. Configure caching rules in Cloudflare" -ForegroundColor White
