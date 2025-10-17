# Al Dente - AI-Powered Pantry Management & Recipe Generation

![Node](https://img.shields.io/badge/node-18%2B-339933?logo=node.js)
![React](https://img.shields.io/badge/react-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/typescript-5.3-3178C6?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/postgresql-13%2B-336791?logo=postgresql)
![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)

Al Dente is a modern, full-stack web application that revolutionizes how you manage your pantry and discover new recipes. Using cutting-edge AI technology, it automatically recognizes food items from photos and generates personalized recipes based on your available ingredients.

👉 [Al Dente](https://al-dente.site/)

## Key Features

### AI-Powered Food Recognition
- **Smart Image Scanning**: Upload photos of your food and let OpenAI Vision API automatically identify items
- **Automatic Categorization**: AI assigns appropriate food categories (produce, dairy, meat, etc.)
- **Expiry Prediction**: Conservative expiry date suggestions based on food type
- **Confidence Scoring**: Know how certain the AI is about its predictions
- **Multi-Format Support**: PNG, JPEG, JPG, WebP up to 16MB
- **Drag & Drop Interface**: Modern, intuitive file upload experience

### Intelligent Recipe Generation  
- **Personalized Recipes**: Generate recipes based on your actual pantry inventory
- **Meal Type Filtering**: Breakfast, lunch, dinner, or snack options
- **Custom Preferences**: Add dietary restrictions and cuisine preferences
- **Recipe Images**: Beautiful food photography generated with DALL-E 3
- **Ingredient Mapping**: Recipes automatically link to your actual pantry items
- **Detailed Instructions**: Step-by-step cooking directions with prep time and servings

### Advanced Pantry Management
- **Comprehensive Inventory**: Track name, amount, expiry dates, categories, and notes
- **Fuzzy Search**: PostgreSQL trigram-based search finds items even with typos
- **Smart Filtering**: Filter by categories, expiry dates, and custom criteria
- **Expiry Alerts**: Visual indicators for items approaching expiration
- **Bulk Operations**: Efficient management of large inventories
- **Optimistic Updates**: Instant UI feedback with automatic error rollback

### Secure & Scalable
- **JWT Authentication**: Secure user accounts with email/password
- **SMS Verification**: Twilio-powered phone verification for signup and password reset
- **Multi-Tier Rate Limiting**: Separate limits for general API (100/15min), auth (10/15min), and uploads (20/hour)
- **Input Validation**: Comprehensive validation using Zod schemas on both frontend and backend
- **Image Security**: Safe file upload with type, size, and content validation
- **Security Audit Trail**: Login event tracking with IP and user agent logging
- **Production Ready**: Docker deployment with health checks and monitoring

## Architecture Overview
[![React](https://skillicons.dev/icons?i=react)](https://react.dev)
[![TypeScript](https://skillicons.dev/icons?i=typescript)](https://www.typescriptlang.org/)
[![Vite](https://skillicons.dev/icons?i=vite)](https://vitejs.dev/)
[![TailwindCSS](https://skillicons.dev/icons?i=tailwind)](https://tailwindcss.com/)
[![Node.js](https://skillicons.dev/icons?i=nodejs)](https://nodejs.org/)
[![Express](https://skillicons.dev/icons?i=express)](https://expressjs.com/)

[![PostgreSQL](https://skillicons.dev/icons?i=postgres)](https://www.postgresql.org/)
[![Supabase](https://skillicons.dev/icons?i=supabase)](https://supabase.com/)

[![Docker](https://skillicons.dev/icons?i=docker)](https://www.docker.com/)
[![Nginx](https://skillicons.dev/icons?i=nginx)](https://nginx.org/)
[![Cloudflare](https://skillicons.dev/icons?i=cloudflare)](https://www.cloudflare.com/)


### Tech Stack

**Frontend**
- **React 18** with TypeScript for type safety
- **Vite** for lightning-fast development and builds
- **Tailwind CSS** for modern, responsive design
- **Zustand** for lightweight state management with persistence
- **React Hook Form** with Zod validation
- **Axios** for API communication with interceptors
- **React Router** for client-side routing

**Backend**
- **Node.js 18+** with Express.js framework
- **TypeScript** for end-to-end type safety
- **PostgreSQL 13+** with pg_trgm extensions for fuzzy search
- **Drizzle ORM** for type-safe database queries
- **OpenAI API** for Vision (GPT-4 Turbo), GPT-4, and DALL-E 3
- **Twilio** for SMS verification and 2FA
- **Supabase** for secure image storage and CDN
- **Argon2** for password hashing
- **Pino** with pino-http for structured logging
- **Swagger/OpenAPI** for interactive API documentation
- **Helmet** for security headers
- **Express Rate Limit** for DDoS protection

**Infrastructure**
- **Docker & Docker Compose** for containerization
- **Nginx** reverse proxy with SSL/TLS termination
- **Cloudflare** for CDN, DDoS protection, and DNS
- **Health checks** for all services with auto-restart
- **Centralized logging** for troubleshooting
- **Multi-network architecture** for service isolation

## Quick Start

### Prerequisites

- **Node.js 18+**
- **PostgreSQL 13+** with `pg_trgm` extension enabled
- **OpenAI API Key** with GPT-4 Turbo and DALL-E 3 access
- **Supabase Project** with Storage bucket configured
- **Twilio Account** (optional) for SMS verification features
- **Docker & Docker Compose** (for deployment)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd al-dente
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run build
   npm run migrate  # Set up database
   npm run dev      # Start development server
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Configure VITE_API_URL=http://localhost:3000
   npm run dev      # Start development server
   ```

4. **Environment Configuration**

   **Backend (.env)**
   ```env
   NODE_ENV=development
   PORT=3000
   DATABASE_URL=postgresql://username:password@localhost:5432/al_dente
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   OPENAI_API_KEY=sk-your-openai-api-key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   SUPABASE_IMAGE_BUCKET=pantry-images
   FRONTEND_ORIGIN=http://localhost:5173
   LOG_LEVEL=info
   
   # Optional: Twilio SMS Verification
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

   **Frontend (.env)**
   ```env
   VITE_API_URL=http://localhost:3000
   ```
   
   > **Note**: The app works without Twilio credentials, but phone verification features will be disabled.

### Production Deployment

1. **Configure environment variables**
   ```bash
   # Copy and edit environment files
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. **Deploy with Docker Compose**
   ```bash
   # Build and start all services
   docker-compose up -d

   # View logs
   docker-compose logs -f

   # Stop services
   docker-compose down
   ```

3. **Access the application**
   - Frontend: `http://localhost:9080`
   - Backend API: `http://localhost:9080/api`
   - API Documentation: `http://localhost:9080/api-docs`

## API Documentation

The API provides comprehensive endpoints for authentication, pantry management, AI scanning, and recipe generation.

### Core Endpoints

**Authentication**
- `POST /auth/signup` - Create account with email, password, and phone
- `POST /auth/login` - Authenticate and receive JWT token
- `POST /auth/verify-phone` - Verify phone with 6-digit SMS code
- `POST /auth/send-verification-code` - Resend verification code
- `POST /auth/request-password-reset` - Request password reset via email
- `POST /auth/reset-password` - Reset password with phone verification
- `POST /auth/change-phone` - Change phone number with verification
- `GET /auth/me` - Get current user profile

**Pantry Items**
- `GET /items` - List items with search, filtering, sorting, and pagination
- `POST /items` - Create new pantry item
- `GET /items/:id` - Get specific item by ID
- `PUT /items/:id` - Update existing item
- `DELETE /items/:id` - Remove item from pantry

**AI Scanning**
- `POST /scan/upload` - Upload image for AI food recognition (16MB max)

**Recipe Generation**
- `POST /recipes/generate` - Generate AI-powered recipes from pantry
- `GET /recipes` - List saved recipes with pagination
- `POST /recipes` - Create custom recipe
- `GET /recipes/:id` - Get specific recipe
- `DELETE /recipes/:id` - Delete recipe

### Interactive Documentation

Visit `/api-docs` for the complete Swagger/OpenAPI documentation with:
- Live API testing interface
- Request/response schemas
- Authentication examples
- Error code documentation

## Usage Examples

### Basic Workflow

1. **Create Account**: Sign up with email, password, and phone number
2. **Verify Phone**: Enter 6-digit SMS code to verify your account (optional but recommended)
3. **Scan Food Items**: Upload photos of groceries for automatic AI recognition
4. **Manage Pantry**: Edit, categorize, and track expiry dates with smart search
5. **Generate Recipes**: Get personalized AI recipes based on available ingredients
6. **Cook & Enjoy**: Follow step-by-step instructions with AI-generated images

### API Examples

**Sign up with phone verification:**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "phoneNumber": "+12345678900"
  }'
# Returns JWT token and indicates phone verification required
```

**Scan a food item:**
```bash
curl -X POST http://localhost:3000/scan/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@groceries.jpg"
```

**Generate recipes:**
```bash
curl -X POST http://localhost:3000/recipes/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "meal_type": "dinner",
    "user_prompt": "healthy Mediterranean cuisine",
    "dietary": "vegetarian",
    "cuisines": "mediterranean",
    "count": 2,
    "generate_images": true
  }'
```

## Development

### Available Scripts

**Backend**
- `npm run dev` - Development server with hot reload
- `npm run build` - TypeScript compilation
- `npm run start` - Production server
- `npm run migrate` - Database migrations
- `npm test` - Run test suite

**Frontend**
- `npm run dev` - Vite development server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - ESLint checking

### Database Schema

- **users**: User accounts with email/password auth and phone verification
- **items**: Pantry inventory with fuzzy search indexes (pg_trgm) and category arrays
- **recipes**: Generated and saved recipes with ingredients, steps, and item mapping
- **login_events**: Security audit trail with IP and user agent tracking
- **phone_verification_codes**: SMS verification codes with expiry and attempt limiting
- **email_verification_codes**: Email verification codes (future use)

## SMS Verification System

Al Dente includes a comprehensive SMS verification system powered by Twilio:

### Features
- **Account Verification**: New users receive a 6-digit SMS code during signup
- **Password Recovery**: Reset passwords securely using SMS verification
- **Phone Number Management**: Change phone numbers with verification
- **US/Canada Support**: Currently supports +1 country code phone numbers

### Security Measures
- **Time-Limited Codes**: 10-minute expiration on all verification codes
- **Attempt Limiting**: Maximum 5 verification attempts per code
- **Account Limits**: Maximum 5 accounts per phone number
- **Purpose Isolation**: Separate verification flows for signup, password reset, and phone changes
- **Graceful Fallback**: App functions without Twilio credentials (verification disabled)

### User Experience
- **Masked Phone Numbers**: Privacy-preserving display (e.g., +1 (***) ***-1234)
- **Resend Functionality**: Users can request new codes if expired or not received
- **Clear Error Messages**: Helpful feedback for common issues (expired, invalid, max attempts)
- **Two-Step Flows**: Intuitive verification modals with step-by-step guidance

### Configuration
Set up Twilio integration in `backend/.env`:
```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

For detailed setup instructions, see `SMS_VERIFICATION_SETUP.md`.

## Security Features

- **Password Security**: Argon2 hashing with salt (industry-standard)
- **JWT Authentication**: Secure token-based auth with configurable expiry
- **SMS Verification**: Two-factor authentication via Twilio
  - 6-digit verification codes with 10-minute expiry
  - Maximum 5 attempts per code
  - Maximum 5 accounts per phone number
- **Multi-Tier Rate Limiting**: 
  - General API: 100 requests per 15 minutes
  - Authentication: 10 attempts per 15 minutes (failed attempts only)
  - File Uploads: 20 uploads per hour
- **Input Validation**: Comprehensive validation with Zod on frontend and backend
- **File Security**: Safe image upload with type, size (16MB max), and MIME validation
- **SQL Injection Protection**: Parameterized queries with Drizzle ORM
- **CORS Configuration**: Secure cross-origin requests with origin whitelist
- **Security Headers**: Helmet.js for XSS, clickjacking, and other protections
- **Audit Logging**: Login events tracked with IP address and user agent
- **Non-Root Containers**: Docker containers run with least privilege

## Deployment Options

### Docker Deployment (Recommended)
- **Single Command**: `docker-compose up -d` for full stack deployment
- **PowerShell Script**: `./deploy-docker.ps1` for Windows with dev/prod modes
- **Health Checks**: Automatic service monitoring with auto-restart
- **Multi-Service Architecture**: Backend, Frontend, Nginx, all containerized
- **SSL/TLS Ready**: Nginx with SSL certificate support
- **Network Isolation**: Separate networks for edge and internal services
- **Resource Management**: Container resource limits and reservations
- **Log Management**: Persistent logs with rotation support

### Manual Deployment
- **Process Manager**: Use PM2 or systemd for Node.js process management
- **Reverse Proxy**: Nginx or Apache with SPA fallback configuration
- **Database**: Managed PostgreSQL (AWS RDS, DigitalOcean, Supabase) recommended
- **Storage**: Supabase Storage, AWS S3, or compatible object storage
- **SSL Certificates**: Let's Encrypt with Certbot or Cloudflare Origin Certificates
- **Cloudflare Integration**: CDN, DDoS protection, and edge caching

### Deployment Documentation
- See `DOCKER_DEPLOYMENT.md` for complete Docker setup guide
- See `frontend/DEPLOYMENT.md` for frontend-specific deployment
- See `SMS_VERIFICATION_SETUP.md` for Twilio SMS configuration

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow TypeScript and ESLint standards
4. Write tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **OpenAI** for advanced AI capabilities (GPT-4 Turbo Vision, GPT-4, DALL-E 3)
- **Twilio** for reliable SMS delivery and phone verification
- **Supabase** for secure storage and database infrastructure
- **PostgreSQL** for powerful fuzzy search with pg_trgm extensions
- **React & TypeScript** communities for excellent tooling and ecosystem
- **Drizzle ORM** for type-safe database interactions
- **Open Source** contributors who make projects like this possible

---

**Made with love for home cooks who want to reduce food waste and discover amazing recipes.**

**Al-Dente and the contributors to this project are not responsible and do not take credit for the recipes created.**
