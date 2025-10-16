import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '../../store';
import { 
  RequestPasswordResetSchema, 
  ResetPasswordSchema,
  type RequestPasswordResetFormData,
  type ResetPasswordFormData 
} from '../../lib/validators';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Header from '../../components/layout/Header';
import api from '../../lib/api';

export default function PasswordReset() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register: registerRequest,
    handleSubmit: handleSubmitRequest,
    formState: { errors: requestErrors },
  } = useForm<RequestPasswordResetFormData>({
    resolver: zodResolver(RequestPasswordResetSchema),
  });

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: resetErrors },
    setValue,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordSchema),
  });

  const onRequestSubmit = async (data: RequestPasswordResetFormData) => {
    setIsLoading(true);
    try {
      await api.post('/auth/request-password-reset', { email: data.email });
      
      setEmail(data.email);
      setStep('reset');
      toast.success('If an account exists with this email and has a verified phone, a code has been sent.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to request password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', {
        phoneNumber: data.phoneNumber,
        code: data.code,
        newPassword: data.newPassword,
      });
      
      toast.success('Password reset successfully! You can now log in with your new password.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!phoneNumber) {
      toast.error('Please enter your phone number first.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/send-verification-code', {
        phoneNumber,
        purpose: 'password_reset',
      });
      toast.success('Verification code sent!');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send code.');
    } finally {
      setIsLoading(false);
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
              {step === 'request' ? 'Reset your password' : 'Enter verification code'}
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              {step === 'request' ? (
                <>
                  Remember your password?{' '}
                  <Link to="/login" className="font-medium text-primary-500 hover:text-primary-600">
                    Sign in
                  </Link>
                </>
              ) : (
                'Enter the code sent to your phone and your new password'
              )}
            </p>
          </div>

          <Card>
            {step === 'request' ? (
              <form onSubmit={handleSubmitRequest(onRequestSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm text-neutral-600">
                    Enter your email address and we'll send a verification code to your registered phone number.
                  </p>
                </div>

                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  {...registerRequest('email')}
                  error={requestErrors.email?.message}
                />

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending code...' : 'Send verification code'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmitReset(onResetSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm text-neutral-600">
                    A verification code has been sent to your phone number. Enter it below along with your new password.
                  </p>
                </div>

                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="(555) 123-4567"
                  autoComplete="tel"
                  {...registerReset('phoneNumber')}
                  error={resetErrors.phoneNumber?.message}
                  helperText="US/Canada numbers only"
                  onChange={(e) => {
                    registerReset('phoneNumber').onChange(e);
                    setPhoneNumber(e.target.value);
                  }}
                />

                <Input
                  label="Verification Code"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  {...registerReset('code')}
                  error={resetErrors.code?.message}
                  autoComplete="one-time-code"
                />

                <Input
                  label="New Password"
                  type="password"
                  autoComplete="new-password"
                  {...registerReset('newPassword')}
                  error={resetErrors.newPassword?.message}
                  helperText="Must be at least 8 characters long."
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  autoComplete="new-password"
                  {...registerReset('confirmPassword')}
                  error={resetErrors.confirmPassword?.message}
                />

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1"
                    isLoading={isLoading}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Resetting...' : 'Reset password'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleResendCode}
                    disabled={isLoading || !phoneNumber}
                  >
                    Resend Code
                  </Button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setStep('request')}
                    className="text-sm text-neutral-600 hover:text-neutral-800"
                  >
                    ← Use a different email
                  </button>
                </div>
              </form>
            )}
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

