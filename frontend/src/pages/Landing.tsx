import { Link } from 'react-router-dom';
import { Logo } from '../components/ui';
import { useIsAuthenticated } from '../store';

export default function Landing() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="px-6 py-4">
        <nav className="mx-auto flex max-w-6xl items-center justify-between">
          <Logo size={28} variant="mono" />
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Link
                to="/app"
                className="btn btn-primary"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn btn-secondary"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="btn btn-primary"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <h1 className="mb-6 text-5xl font-bold text-gray-900">
            Smart Pantry Management &
            <span className="text-blue-600"> AI Recipe Generation</span>
          </h1>
          <p className="mb-8 text-xl text-gray-600">
            Track your pantry items with AI-powered image recognition and generate personalized recipes based on what you have available.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/signup"
              className="btn btn-primary text-lg px-8 py-3"
            >
              Get Started
            </Link>
            <Link
              to="#how-it-works"
              className="btn btn-secondary text-lg px-8 py-3"
            >
              How It Works
            </Link>
          </div>
        </div>

        {/* How It Works */}
        <section id="how-it-works" className="mt-24">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            How It Works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="card text-center">
              <div className="mb-4 text-4xl">📸</div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">1. Scan</h3>
              <p className="text-gray-600">
                Upload photos of your food items and let AI automatically identify and categorize them.
              </p>
            </div>
            <div className="card text-center">
              <div className="mb-4 text-4xl">📦</div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">2. Track</h3>
              <p className="text-gray-600">
                Manage your pantry inventory with expiry dates, categories, and smart search features.
              </p>
            </div>
            <div className="card text-center">
              <div className="mb-4 text-4xl">👨‍🍳</div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">3. Cook</h3>
              <p className="text-gray-600">
                Generate personalized recipes based on your available ingredients with AI assistance.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mt-24">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Features
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="card">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">AI Food Recognition</h3>
              <p className="text-gray-600">
                Advanced computer vision to identify food items from photos.
              </p>
            </div>
            <div className="card">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Smart Expiry Tracking</h3>
              <p className="text-gray-600">
                Never waste food again with intelligent expiry date monitoring.
              </p>
            </div>
            <div className="card">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Recipe Generation</h3>
              <p className="text-gray-600">
                AI-powered recipe suggestions based on your pantry contents.
              </p>
            </div>
            <div className="card">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Search & Filter</h3>
              <p className="text-gray-600">
                Powerful search and filtering to find exactly what you need.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-gray-600">
          <p>&copy; 2024 Al Dente. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
