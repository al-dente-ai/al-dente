import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth, useIsAuthenticated, toast } from '../../store';
import { SignupSchema, type SignupFormData, VerifyPhoneSchema, type VerifyPhoneFormData } from '../../lib/validators';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Header from '../../components/layout/Header';
import api from '../../lib/api';

export default function Signup() {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const { signup, isLoading, error, clearError } = useAuth();
  
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(SignupSchema),
  });

  const {
    register: registerVerify,
    handleSubmit: handleSubmitVerify,
    formState: { errors: verifyErrors },
    setValue: setVerifyValue,
  } = useForm<VerifyPhoneFormData>({
    resolver: zodResolver(VerifyPhoneSchema),
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
        phoneNumber: data.phoneNumber,
      });
      
      // Store phone number and show verification modal
      setPhoneNumber(data.phoneNumber);
      setVerifyValue('phoneNumber', data.phoneNumber);
      setShowVerificationModal(true);
      
      toast.success('Account created! Please verify your phone number.');
    } catch (error) {
      // Error is handled by the store
    }
  };

  const onVerifySubmit = async (data: VerifyPhoneFormData) => {
    setVerificationLoading(true);
    try {
      await api.post('/auth/verify-phone', {
        phoneNumber: data.phoneNumber,
        code: data.code,
      });
      
      setShowVerificationModal(false);
      navigate('/app', { replace: true });
      toast.success('Phone verified! Welcome to Al Dente!');
    } catch (error: any) {
      toast.error(error?.message || 'Verification failed. Please try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    try {
      await api.post('/auth/send-verification-code', {
        phoneNumber,
        purpose: 'signup',
      });
      toast.success('Verification code sent!');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 to-white">
      <Header />
      <div className="flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-neutral-800">
              Create your account
            </h2>
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
            />

            <Input
              label="Phone Number"
              type="tel"
              autoComplete="tel"
              placeholder="(555) 123-4567"
              {...register('phoneNumber')}
              error={errors.phoneNumber?.message}
              helperText="US/Canada numbers only. Required for account verification and password recovery."
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

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
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

      {/* Phone Verification Modal */}
      <Modal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        title="Verify Your Phone Number"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            We've sent a 6-digit verification code to <strong>{phoneNumber}</strong>. 
            Please enter it below to complete your registration.
          </p>

          <form onSubmit={handleSubmitVerify(onVerifySubmit)} className="space-y-4">
            <Input
              label="Verification Code"
              type="text"
              placeholder="123456"
              maxLength={6}
              {...registerVerify('code')}
              error={verifyErrors.code?.message}
              autoComplete="one-time-code"
            />

            <input type="hidden" {...registerVerify('phoneNumber')} />

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                isLoading={verificationLoading}
                disabled={verificationLoading}
              >
                Verify
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleResendCode}
                isLoading={resendLoading}
                disabled={resendLoading}
              >
                Resend Code
              </Button>
            </div>
          </form>

          <p className="text-xs text-neutral-500 text-center">
            The code will expire in 10 minutes.
          </p>
        </div>
      </Modal>
    </div>
  );
}
