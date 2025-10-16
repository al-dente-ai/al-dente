import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth, useIsAuthenticated, toast } from '../../store';
import { SignupSchema, type SignupFormData } from '../../lib/validators';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Header from '../../components/layout/Header';

export default function Signup() {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const { signup, isLoading, error, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(SignupSchema),
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data: SignupFormData) => {
    try {
      await signup({
        email: data.email,
        password: data.password,
      });
      navigate('/app', { replace: true });
      toast.success('Welcome to Al Dente! Your account has been created.');
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 to-white">
      <Header />
      <div className="flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-neutral-800">Create your account</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Or{' '}
              <Link to="/login" className="font-medium text-primary-500 hover:text-primary-600">
                sign in to your existing account
              </Link>
            </p>
          </div>

          <Card>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                {...register('email')}
                error={errors.email?.message}
                helperText="We'll use this to send you login information."
              />

              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
                error={errors.password?.message}
                helperText="Must be at least 8 characters long."
              />

              <Input
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
              />

              <Button type="submit" className="w-full" isLoading={isLoading} disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <div className="mt-6 text-xs text-neutral-500 text-center">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-primary-500 hover:text-primary-600">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary-500 hover:text-primary-600">
                Privacy Policy
              </a>
              .
            </div>
          </Card>

          <div className="mt-8 text-center">
            <Link to="/" className="text-sm text-neutral-600 hover:text-neutral-800">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
