# 🍝 Al Dente - AI-Powered Pantry Management & Recipe Generation

Al Dente is a modern, full-stack web application that revolutionizes how you manage your pantry and discover new recipes. Using cutting-edge AI technology, it automatically recognizes food items from photos and generates personalized recipes based on your available ingredients.

👉 [Al Dente](https://al-dente.site/)

## ✨ Key Features

### 🤖 AI-Powered Food Recognition
- **Smart Image Scanning**: Upload photos of your food and let OpenAI Vision API automatically identify items
- **Automatic Categorization**: AI assigns appropriate food categories (produce, dairy, meat, etc.)
- **Expiry Prediction**: Conservative expiry date suggestions based on food type
- **Confidence Scoring**: Know how certain the AI is about its predictions

### 👨‍🍳 Intelligent Recipe Generation  
- **Personalized Recipes**: Generate recipes based on your actual pantry inventory
- **Meal Type Filtering**: Breakfast, lunch, dinner, or snack options
- **Custom Preferences**: Add dietary restrictions and cuisine preferences
- **Recipe Images**: Beautiful food photography generated with DALL-E 3
- **Ingredient Mapping**: Recipes link to your actual pantry items

### 📦 Advanced Pantry Management
- **Comprehensive Inventory**: Track name, amount, expiry dates, categories, and notes
- **Fuzzy Search**: PostgreSQL trigram-based search finds items even with typos
- **Smart Filtering**: Filter by categories, expiry dates, and custom criteria
- **Expiry Alerts**: Visual indicators for items approaching expiration
- **Bulk Operations**: Efficient management of large inventories

### 🔐 Secure & Scalable
- **JWT Authentication**: Secure user accounts with email/password
- **Rate Limiting**: Protection against abuse and API overuse
- **Input Validation**: Comprehensive validation using Zod schemas
- **Image Security**: Safe file upload with type and size validation
- **Production Ready**: Docker deployment with health checks

## 🏗️ Architecture Overview

### Tech Stack

**Frontend**
- **React 18** with TypeScript for type safety
- **Vite** for lightning-fast development and builds
- **Tailwind CSS** for modern, responsive design
- **Zustand** for lightweight state management
- **React Hook Form** with Zod validation
- **Axios** for API communication

**Backend**
- **Node.js** with Express.js framework
- **TypeScript** for end-to-end type safety
- **PostgreSQL** with trigram extensions for fuzzy search
- **OpenAI API** for Vision, GPT-4, and DALL-E 3
- **Supabase** for secure image storage and CDN
- **Argon2** for password hashing
- **Pino** for structured logging

**Infrastructure**
- **Docker** containerization for easy deployment
- **Nginx** reverse proxy with SSL termination
- **Health checks** for service monitoring
- **Centralized logging** for troubleshooting

### Project Structure

```
al-dente/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Route-specific page components
│   │   ├── store/           # Zustand state management
│   │   ├── lib/             # API client and utilities
│   │   └── routes/          # React Router configuration
│   └── dist/                # Production build output
├── backend/                  # Express.js API server
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic layer
│   │   ├── middleware/      # Express middleware
│   │   ├── schemas/         # Zod validation schemas
│   │   └── utils/           # Helper utilities
│   └── dist/                # Compiled TypeScript output
├── nginx/                   # Nginx configuration
├── ssl/                     # SSL certificates (not in repo)
└── docker-compose.yml       # Production deployment
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **PostgreSQL 13+** with `pg_trgm` extension
- **OpenAI API Key** with GPT-4 and DALL-E access
- **Supabase Project** with Storage bucket configured
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
   FRONTEND_ORIGIN=http://localhost:3001
   LOG_LEVEL=info
   ```

   **Frontend (.env)**
   ```env
   VITE_API_URL=http://localhost:3000
   ```

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

## 📚 API Documentation

The API provides comprehensive endpoints for authentication, pantry management, AI scanning, and recipe generation.

### Core Endpoints

- **Authentication**: `POST /auth/signup`, `POST /auth/login`
- **Pantry Items**: `GET|POST|PUT|DELETE /items` with search and pagination
- **AI Scanning**: `POST /scan/upload` for image analysis
- **Recipe Generation**: `POST /recipes/generate` for AI-powered recipes

### Interactive Documentation

Visit `/api-docs` for the complete Swagger/OpenAPI documentation with:
- Live API testing interface
- Request/response schemas
- Authentication examples
- Error code documentation

## 🎯 Usage Examples

### Basic Workflow

1. **Create Account**: Sign up with email and password
2. **Scan Food Items**: Upload photos of groceries for automatic recognition
3. **Manage Pantry**: Edit, categorize, and track expiry dates
4. **Generate Recipes**: Get personalized recipes based on available ingredients
5. **Cook & Enjoy**: Follow step-by-step instructions with generated images

### API Examples

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
    "count": 2,
    "generate_images": true
  }'
```

## 🛠️ Development

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

- **users**: User accounts with secure authentication
- **items**: Pantry inventory with fuzzy search indexes
- **recipes**: Generated and saved recipes with ingredients
- **login_events**: Security audit trail

## 🔒 Security Features

- **Password Security**: Argon2 hashing with salt
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive validation with Zod
- **File Security**: Safe image upload with validation
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Secure cross-origin requests

## 🚢 Deployment Options

### Docker Deployment (Recommended)
- **Single Command**: `docker-compose up -d`
- **Health Checks**: Automatic service monitoring
- **SSL Ready**: Nginx with SSL termination
- **Scalable**: Easy horizontal scaling

### Manual Deployment
- **Process Manager**: Use PM2 or similar
- **Reverse Proxy**: Nginx or Apache
- **Database**: Managed PostgreSQL recommended
- **Storage**: Supabase or S3-compatible storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow TypeScript and ESLint standards
4. Write tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **OpenAI** for advanced AI capabilities (Vision, GPT-4, DALL-E 3)
- **Supabase** for reliable storage and database infrastructure
- **React & TypeScript** communities for excellent tooling
- **Open Source** contributors who make projects like this possible

---

**Made with ❤️ for home cooks who want to reduce food waste and discover amazing recipes.**
**Al-Dente and the contributors to this project are not responsible and do not take credit for the recipes created.**
