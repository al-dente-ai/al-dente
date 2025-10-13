# Al Dente - Pantry Tracking & AI Recipe Generation API

A production-ready TypeScript Express REST API for pantry tracking and AI-powered recipe generation using OpenAI and Supabase.

## Features

- 🔐 **Secure Authentication**: JWT-based auth with email/password
- 📦 **Pantry Management**: Create, read, update, delete pantry items with search
- 🤖 **AI Food Recognition**: Upload food images for automatic item detection (OpenAI Vision)
- 👨‍🍳 **AI Recipe Generation**: Generate personalized recipes based on available ingredients
- 🖼️ **Image Storage**: Secure image upload and CDN via Supabase Storage
- 🔍 **Fuzzy Search**: PostgreSQL trigram-based search for pantry items
- 📄 **Pagination**: Efficient pagination for large datasets
- 🛡️ **Security**: Rate limiting, input validation, password hashing with Argon2
- 📝 **Comprehensive Logging**: Structured logging with Pino

## Tech Stack

- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with pg_trgm extension
- **Authentication**: JWT Bearer tokens
- **AI Provider**: OpenAI (Vision + Text + Image Generation)
- **Storage**: Supabase Storage
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting, Argon2
- **Logging**: Pino

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- OpenAI API key
- Supabase project with Storage bucket

### Installation

1. **Clone and install dependencies**:

   ```bash
   git clone <repository-url>
   cd al-dente
   npm install
   ```

2. **Environment Configuration**:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your values:

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

3. **Database Setup**:

   ```bash
   # Create database
   createdb al_dente

   # Run migrations
   npm run build
   npm run migrate
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## API Documentation

📚 **Interactive API Documentation**: Access the complete Swagger/OpenAPI documentation at `http://localhost:3000/api-docs`

The documentation includes:

- Complete endpoint specifications with request/response schemas
- Interactive API testing interface
- Authentication examples
- Real-time validation
- Comprehensive error codes and descriptions

For a quick overview of available endpoints, visit `http://localhost:3000/api`

## API Endpoints

### Authentication

#### POST /auth/signup

Create a new user account.

**Request**:

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response** (201):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /auth/login

Authenticate existing user.

**Request**:

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response** (200):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Pantry Items

All item endpoints require `Authorization: Bearer <token>` header.

#### GET /items

List pantry items with pagination and search.

**Query Parameters**:

- `page` (number, default: 1): Page number
- `pageSize` (number, default: 20, max: 100): Items per page
- `q` (string): Search term (fuzzy search on name and notes)
- `categories` (string): Comma-separated categories filter
- `sort` (enum: name|expiry, default: expiry): Sort field
- `order` (enum: asc|desc, default: asc): Sort order

**Example**: `GET /items?page=1&pageSize=10&q=tomato&categories=produce,dairy&sort=expiry&order=desc`

**Response** (200):

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Cherry Tomatoes",
      "amount": "1 container",
      "expiry": "2024-01-15",
      "categories": ["produce"],
      "notes": "Organic, from farmer's market",
      "image_url": "https://supabase-url/storage/...",
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-01T10:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 10,
  "total": 25,
  "totalPages": 3,
  "hasNext": true,
  "hasPrev": false
}
```

#### POST /items

Create a new pantry item.

**Request**:

```json
{
  "name": "Organic Eggs",
  "amount": "12 count",
  "expiry": "2024-01-20",
  "categories": ["dairy"],
  "notes": "Free-range, grade A",
  "image_url": "https://supabase-url/storage/..."
}
```

**Response** (201): Returns the created item object.

#### GET /items/:id

Get a specific pantry item.

**Response** (200): Returns the item object.

#### PUT /items/:id

Update a pantry item.

**Request**: Same as POST, but all fields are optional.

#### DELETE /items/:id

Delete a pantry item.

**Response** (204): No content.

### Food Scanning

#### POST /scan/upload

Upload and analyze a food image using AI.

**Request**: `multipart/form-data` with a `file` field

- Supported formats: PNG, JPEG, WebP
- Max size: 16MB

**Example using curl**:

```bash
curl -X POST http://localhost:3000/scan/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@food-image.jpg"
```

**Response** (200):

```json
{
  "image_url": "https://supabase-url/storage/user-id/uuid_filename.jpg",
  "prediction": {
    "name": "Cherry Tomatoes",
    "amount": "1 container",
    "expiry": "2024-01-15",
    "categories": ["produce"],
    "notes": "Fresh, vine-ripened",
    "confidence": 0.92
  }
}
```

### Recipes

#### POST /recipes/generate

Generate AI-powered recipes using available pantry items.

**Request**:

```json
{
  "meal_type": "dinner",
  "user_prompt": "Something healthy and quick to make",
  "count": 2,
  "generate_images": true
}
```

**Response** (201):

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "Mediterranean Tomato Pasta",
      "description": "A fresh and healthy pasta dish with cherry tomatoes",
      "meal_type": "dinner",
      "servings": 4,
      "prep_time_minutes": 20,
      "ingredients": [
        {
          "name": "Cherry tomatoes",
          "quantity": "1 container"
        },
        {
          "name": "Pasta",
          "quantity": "8 oz"
        }
      ],
      "steps": [
        "Boil water and cook pasta according to package instructions",
        "Heat olive oil in a large pan",
        "Add cherry tomatoes and cook until they start to burst"
      ],
      "uses_item_ids": ["tomato-item-uuid"],
      "image_url": "https://supabase-url/generated-recipe-image.png",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

#### GET /recipes

List user recipes with pagination.

**Query Parameters**:

- `page` (number, default: 1)
- `pageSize` (number, default: 20, max: 100)

#### GET /recipes/:id

Get a specific recipe.

#### DELETE /recipes/:id

Delete a recipe.

## Example Usage

### Complete workflow example:

1. **Sign up**:

   ```bash
   curl -X POST http://localhost:3000/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"chef@example.com","password":"securepass123"}'
   ```

2. **Scan food item**:

   ```bash
   curl -X POST http://localhost:3000/scan/upload \
     -H "Authorization: Bearer <token>" \
     -F "file=@tomatoes.jpg"
   ```

3. **Add item to pantry**:

   ```bash
   curl -X POST http://localhost:3000/items \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Cherry Tomatoes",
       "amount": "1 container",
       "expiry": "2024-01-15",
       "categories": ["produce"],
       "image_url": "https://supabase-url/storage/..."
     }'
   ```

4. **Generate recipes**:
   ```bash
   curl -X POST http://localhost:3000/recipes/generate \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "meal_type": "dinner",
       "user_prompt": "Italian cuisine",
       "count": 2
     }'
   ```

## Database Schema

The API uses PostgreSQL with the following main tables:

- **users**: User accounts with email/password
- **login_events**: Login attempt tracking
- **items**: Pantry items with categories, expiry, and fuzzy search indexes
- **recipes**: Generated and custom recipes with ingredients and steps

Required extensions:

- `uuid-ossp`: For UUID generation
- `pg_trgm`: For fuzzy text search

## Development

### Available Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build production bundle
- `npm run start`: Start production server
- `npm run migrate`: Run database migrations
- `npm run lint`: Run ESLint
- `npm test`: Run tests

### AI Integration Details

#### OpenAI Vision

- Uses `gpt-4o-mini` for cost-effective image analysis
- Structured JSON output with confidence scoring
- Conservative expiry date prediction

#### Recipe Generation

- Uses `gpt-4o-mini` for recipe creation
- Considers available pantry items and expiry dates
- Generates recipe images with DALL-E 3

#### Image Generation

- DALL-E 3 for professional food photography
- Images uploaded to Supabase for CDN delivery
- Fallback handling if image generation fails

## Production Deployment

### Environment Variables

Ensure all required environment variables are set:

- Database connection with SSL in production
- Strong JWT secret (32+ characters)
- OpenAI API key with sufficient credits
- Supabase service role key (not anon key)
- Configured CORS origin for your frontend

### Security Considerations

- Rate limiting configured for different endpoint types
- Password hashing with Argon2id
- JWT tokens expire after 7 days
- Input validation with Zod schemas
- SQL injection protection with parameterized queries
- File upload validation and size limits

### Monitoring

- Structured logging with Pino
- Health check endpoint at `/health`
- Database connectivity monitoring
- Request/response logging with redacted sensitive data

## License

MIT License - see LICENSE file for details.
