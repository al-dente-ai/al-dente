# 🚀 Al Dente Frontend Deployment Guide

## Prerequisites
- Domain configured in Cloudflare
- Home server with Ubuntu/Debian/CentOS
- SSH access to your server
- Docker (optional) or Nginx/Apache

## 🏗️ Deployment Options

### Option 1: Direct Nginx/Apache Deployment

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Nginx
sudo apt install nginx -y

# Or install Apache
sudo apt install apache2 -y
```

#### 2. Deploy Files
```bash
# Create directory
sudo mkdir -p /var/www/aldente

# Copy your dist folder to server
# (Use SCP, SFTP, or the deploy.ps1 script)
sudo cp -r /path/to/dist/* /var/www/aldente/

# Set permissions
sudo chown -R www-data:www-data /var/www/aldente
sudo chmod -R 755 /var/www/aldente
```

#### 3. Configure Web Server
```bash
# For Nginx
sudo cp nginx.conf /etc/nginx/sites-available/aldente
sudo ln -s /etc/nginx/sites-available/aldente /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# For Apache
sudo cp apache.conf /etc/apache2/sites-available/aldente.conf
sudo a2ensite aldente
sudo a2enmod rewrite ssl headers deflate proxy proxy_http
sudo systemctl restart apache2
```

### Option 2: Docker Deployment

#### 1. Build and Run
```bash
# Build the image
docker build -t aldente-frontend .

# Run with docker-compose
docker-compose up -d

# Or run directly
docker run -d --name aldente-frontend -p 8080:80 aldente-frontend
```

## ☁️ Cloudflare Configuration

### 1. DNS Settings
```
Type: A
Name: @ (or www)
Content: YOUR_SERVER_IP
Proxy: ✅ Proxied (orange cloud)
TTL: Auto
```

### 2. SSL/TLS Settings
- **SSL/TLS encryption mode**: Full (strict) or Full
- **Always Use HTTPS**: ON
- **HTTP Strict Transport Security (HSTS)**: ON

### 3. Speed Settings
```
Auto Minify:
- JavaScript: ✅
- CSS: ✅  
- HTML: ✅

Brotli: ✅
Rocket Loader: ✅ (test first)
```

### 4. Caching Rules
Create Page Rules for optimal caching:

**Rule 1: Static Assets**
```
URL: yourdomain.com/assets/*
Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
- Browser Cache TTL: 1 month
```

**Rule 2: HTML Files**
```
URL: yourdomain.com/*.html
Settings:
- Cache Level: Standard
- Edge Cache TTL: 2 hours
- Browser Cache TTL: 4 hours
```

**Rule 3: API Routes** (if proxying backend)
```
URL: yourdomain.com/api/*
Settings:
- Cache Level: Bypass
```

### 5. Security Settings
```
Security Level: Medium
Bot Fight Mode: ON
Browser Integrity Check: ON
Hotlink Protection: ON

Firewall Rules:
- Block common attack patterns
- Rate limiting for API endpoints
- Country blocking (if needed)
```

## 🔧 Environment Variables

Create `.env.production`:
```env
VITE_API_URL=https://api.yourdomain.com
# or if using same domain: https://yourdomain.com/api
```

## 📋 Deployment Checklist

### Before Deployment
- [ ] Update `.env.production` with correct API URL
- [ ] Run `npm run build` to create production build
- [ ] Test build locally with `npm run preview`

### Server Configuration  
- [ ] Web server configured (nginx/apache)
- [ ] SSL certificates installed (or using Cloudflare SSL)
- [ ] Firewall configured (allow ports 80, 443, SSH)
- [ ] Domain pointed to server IP

### Cloudflare Setup
- [ ] DNS A record pointing to server
- [ ] Proxy enabled (orange cloud)
- [ ] SSL/TLS set to Full or Full (strict)
- [ ] Page rules configured for caching
- [ ] Security settings configured

### Testing
- [ ] Site loads at your domain
- [ ] All routes work (test React Router)
- [ ] API calls work correctly
- [ ] Assets load from cache
- [ ] SSL certificate valid
- [ ] Mobile responsive
- [ ] Performance testing

## 🔄 Updates & Maintenance

### Quick Update Process
1. Run `npm run build` locally
2. Use deployment script: `.\deploy.ps1`
3. Or manually upload dist folder
4. Purge Cloudflare cache if needed

### Monitoring
- Monitor server resources (CPU, RAM, disk)
- Check Cloudflare analytics
- Monitor SSL certificate expiry
- Regular security updates

## 🚨 Troubleshooting

### Common Issues

**React Router 404s**
- Ensure SPA fallback is configured
- Check nginx/apache rewrite rules

**API Connection Issues**
- Verify VITE_API_URL in production build
- Check CORS settings on backend
- Verify firewall/security groups

**Cloudflare Issues**
- Try "Development Mode" to bypass cache
- Check SSL/TLS encryption mode
- Review firewall rules

**Performance Issues**
- Enable gzip/brotli compression
- Optimize Cloudflare caching rules
- Consider CDN for large assets

## 📞 Support

If you encounter issues:
1. Check server logs: `sudo tail -f /var/log/nginx/error.log`
2. Check Cloudflare dashboard for errors
3. Test with Cloudflare development mode
4. Verify DNS propagation with tools like dig or nslookup
