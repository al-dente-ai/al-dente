# Al Dente Frontend

A modern React frontend for the Al Dente pantry management and AI recipe generation application.

## Features

- 🔐 **Authentication**: JWT-based login/signup
- 📦 **Pantry Management**: CRUD operations for food items with search and filtering
- 📸 **AI Food Scanning**: Upload images for automatic food recognition
- 👨‍🍳 **AI Recipe Generation**: Generate recipes based on available ingredients
- 📱 **Responsive Design**: Mobile-first design with desktop enhancements
- 🎨 **Modern UI**: Tailwind CSS with consistent design system

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Zustand** for state management
- **Tailwind CSS** for styling
- **React Hook Form** with Zod validation
- **Axios** for API requests

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running on `http://localhost:3000`

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your backend API URL:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:3001`

### Build for Production

```bash
npm run build
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Architecture

### State Management

The app uses Zustand for state management with the following stores:

- **Auth Store** (`store/auth.ts`) - Authentication state and actions
- **Items Store** (`store/items.ts`) - Pantry inventory management
- **Scan Store** (`store/scan.ts`) - Image scanning functionality
- **Recipes Store** (`store/recipes.ts`) - Recipe generation and management
- **UI Store** (`store/ui.ts`) - Toast notifications and modal state

### API Integration

All API calls go through the configured Axios instance (`lib/api.ts`) with:
- Automatic JWT token attachment
- 401 error handling (auto-logout)
- Error normalization

### Components

- **UI Components** (`components/ui/`) - Reusable design system components
- **Layout Components** (`components/layout/`) - Navigation and page layouts
- **Pages** (`pages/`) - Route-specific page components

### Key Features

#### Authentication
- JWT token stored in localStorage with `app:` namespace
- Auto-redirect on 401 responses
- Persistent login state

#### Pantry Management
- CRUD operations with optimistic updates
- Advanced search with fuzzy matching
- Category filtering and sorting
- Expiry date tracking with visual indicators

#### AI Food Scanning
- Drag & drop file upload
- Real-time image analysis with OpenAI Vision
- Preview and confirm before adding to inventory

#### Recipe Generation
- AI-powered recipe generation based on available ingredients
- Customizable parameters (meal type, dietary preferences)
- Recipe image generation with DALL-E
- Links recipes to pantry items

## Contributing

1. Follow the existing code patterns
2. Use TypeScript strictly
3. Write responsive, accessible components
4. Test thoroughly before submitting PRs

## License

MIT License