# 🐳 Al Dente Docker Deployment Guide

Complete Docker Compose setup for running the full Al Dente stack (frontend + backend + database) together.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │    Frontend      │    │    Backend      │
│   Port 80/443   │───▶│   (React App)    │    │   (Express API) │
│                 │    │   Port 80        │    │   Port 3000     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               │
         │              ┌─────────────────┐             │
         └──────────────│   PostgreSQL    │◀────────────┘
                        │   Port 5432     │
                        └─────────────────┘
```

## 📋 Prerequisites

- Docker & Docker Compose installed
- Domain name (optional, for production)
- Environment variables configured

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file in the root directory:

```env
# Required Variables
JWT_SECRET=your-super-secret-jwt-key-for-production-min-32-chars-long
OPENAI_API_KEY=sk-your-openai-api-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_IMAGE_BUCKET=pantry-images

# Optional
COMPOSE_PROJECT_NAME=aldente
```

### 2. Production Deployment

```powershell
# Using the PowerShell script (Windows)
.\deploy-docker.ps1

# Or manually with Docker Compose
docker-compose up -d --build
```

### 3. Development Mode

```powershell
# Development with hot reload
.\deploy-docker.ps1 -Dev

# Or manually
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

## 🌐 Service URLs

Once deployed, access your application at:

- **Frontend**: http://localhost
- **API**: http://localhost/api
- **API Documentation**: http://localhost/api-docs
- **Database**: localhost:5432 (dev mode only)

## 📁 Project Structure

```
al-dente/
├── docker-compose.yml           # Main production configuration
├── docker-compose.dev.yml       # Development overrides
├── deploy-docker.ps1            # Deployment script
├── nginx/                       # Nginx configuration
│   ├── nginx.conf              # Main nginx config
│   └── conf.d/
│       ├── default.conf        # Production routing
│       └── dev.conf           # Development routing
├── frontend/
│   ├── Dockerfile.prod         # Production frontend image
│   ├── Dockerfile.dev          # Development frontend image
│   └── nginx-docker.conf       # Frontend nginx config
└── backend/
    └── Dockerfile              # Backend image
```

## 🔧 Configuration Details

### Frontend Configuration

The frontend is configured to:
- Use `/api` as the base URL for API calls
- Handle React Router with proper SPA routing
- Serve optimized production builds
- Cache static assets with appropriate headers

### Backend Configuration

The backend runs with:
- PostgreSQL database connection
- All required environment variables
- Health checks enabled
- Production optimizations

### Nginx Proxy

Routes traffic as follows:
- `/api/*` → Backend service (with `/api` prefix removed)
- `/api-docs` → Backend Swagger documentation
- `/*` → Frontend application

## 🔒 Security Features

- Rate limiting on API endpoints
- Security headers (CSRF, XSS protection)
- CORS configuration
- Non-root containers
- Health checks for all services

## 🛠️ Management Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### Service Management
```bash
# Stop all services
docker-compose down

# Restart services
docker-compose restart

# Update and restart
docker-compose pull && docker-compose up -d

# Scale services (if needed)
docker-compose up -d --scale backend=2
```

### Database Operations
```bash
# Access database
docker-compose exec postgres psql -U postgres -d al_dente

# Backup database
docker-compose exec postgres pg_dump -U postgres al_dente > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres -d al_dente < backup.sql
```

## 🌍 Production Deployment

### 1. Domain Configuration

Update your domain's DNS to point to your server:
```
Type: A
Name: @ (or www)
Content: YOUR_SERVER_IP
```

### 2. SSL/HTTPS Setup

For production with SSL, create an SSL directory:
```bash
mkdir ssl
# Copy your SSL certificates to ./ssl/cert.pem and ./ssl/private.key
```

Update nginx configuration to use SSL:
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/private.key;
    # ... rest of configuration
}
```

### 3. Cloudflare Integration

If using Cloudflare:
1. Set DNS to proxied (orange cloud)
2. SSL/TLS mode: "Full" or "Full (strict)"
3. Configure page rules for caching
4. Use Cloudflare Origin certificates

## 📊 Monitoring & Health Checks

### Health Check Endpoints

- **Nginx**: `http://localhost/health`
- **Frontend**: `http://localhost/health` (via nginx)
- **Backend**: `http://localhost/api/health`
- **Database**: Automatic health checks

### Service Status
```bash
# Check service status
docker-compose ps

# Check health status
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

## 🐛 Troubleshooting

### Common Issues

**Services won't start**
```bash
# Check logs
docker-compose logs

# Check disk space
df -h

# Check memory
free -h
```

**Database connection issues**
```bash
# Check if database is healthy
docker-compose exec postgres pg_isready -U postgres

# Check database logs
docker-compose logs postgres
```

**API not accessible**
```bash
# Check backend health
curl http://localhost/api/health

# Check nginx configuration
docker-compose exec nginx nginx -t
```

**Frontend not loading**
```bash
# Check frontend container
docker-compose logs frontend

# Test frontend health
curl http://localhost/health
```

### Performance Optimization

For production, consider:
- Adding Redis for session storage
- Implementing log rotation
- Setting up monitoring (Prometheus/Grafana)
- Using multi-stage builds for smaller images
- Implementing backup strategies

## 🔄 Updates & Maintenance

### Application Updates
1. Pull latest code
2. Rebuild images: `docker-compose build --no-cache`
3. Restart services: `docker-compose up -d`

### Database Migrations
```bash
# Run migrations
docker-compose exec backend npm run migrate
```

### Cleanup
```bash
# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Full cleanup (WARNING: removes all stopped containers)
docker system prune -a
```

## 📞 Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify environment variables are set correctly
3. Ensure all required ports are available
4. Check Docker daemon status
5. Verify disk space and memory availability

## 🎯 Next Steps

- [ ] Set up monitoring and alerting
- [ ] Configure automatic backups
- [ ] Implement CI/CD pipeline
- [ ] Add SSL certificates
- [ ] Configure log aggregation
- [ ] Set up domain and DNS
