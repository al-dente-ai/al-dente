import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth, useIsAuthenticated, toast } from '../../store';
import { VerifyPhoneSchema, type VerifyPhoneFormData } from '../../lib/validators';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Header from '../../components/layout/Header';
import api from '../../lib/api';

export default function VerifyPhone() {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const { user, phoneVerified, setPhoneVerified, fetchUser } = useAuth();
  
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<VerifyPhoneFormData>({
    resolver: zodResolver(VerifyPhoneSchema),
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    // Fetch user data to get phone number
    fetchUser();
  }, [isAuthenticated, navigate, fetchUser]);

  // Redirect if phone is already verified
  useEffect(() => {
    if (phoneVerified === true) {
      navigate('/app', { replace: true });
    }
  }, [phoneVerified, navigate]);

  // Set phone number from user data
  useEffect(() => {
    if (user?.phoneNumber) {
      setValue('phoneNumber', user.phoneNumber);
    }
  }, [user, setValue]);

  // Handle resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const onVerifySubmit = async (data: VerifyPhoneFormData) => {
    setVerificationLoading(true);
    try {
      await api.post('/auth/verify-phone', {
        phoneNumber: data.phoneNumber,
        code: data.code,
      });
      
      // Update phone verification status
      setPhoneVerified(true);
      
      toast.success('Phone verified! Welcome to Al Dente!');
      navigate('/app', { replace: true });
    } catch (error: any) {
      toast.error(error?.message || 'Verification failed. Please try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!user?.phoneNumber) {
      toast.error('Phone number not found. Please log in again.');
      return;
    }

    setResendLoading(true);
    try {
      await api.post('/auth/send-verification-code', {
        phoneNumber: user.phoneNumber,
        purpose: 'signup',
      });
      toast.success('Verification code sent!');
      setResendCooldown(60); // 60 second cooldown
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const maskedPhone = user?.phoneNumber
    ? user.phoneNumber.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 (***) ***-$4')
    : '***-***-****';

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 to-white">
      <Header />
      <div className="flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-neutral-800">Verify Your Phone Number</h2>
            <p className="mt-2 text-sm text-neutral-600">
              We've sent a 6-digit verification code to{' '}
              <strong className="text-neutral-800">{maskedPhone}</strong>
            </p>
          </div>

          <Card>
            <form onSubmit={handleSubmit(onVerifySubmit)} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Important:</strong> You must verify your phone number to access Al Dente.
                  This helps us keep your account secure and enables password recovery.
                </p>
              </div>

              <Input
                label="Verification Code"
                type="text"
                placeholder="123456"
                maxLength={6}
                autoComplete="one-time-code"
                {...register('code')}
                error={errors.code?.message}
                helperText="Enter the 6-digit code sent to your phone"
              />

              <input type="hidden" {...register('phoneNumber')} />

              <Button
                type="submit"
                className="w-full"
                isLoading={verificationLoading}
                disabled={verificationLoading}
              >
                {verificationLoading ? 'Verifying...' : 'Verify Phone Number'}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleResendCode}
                  isLoading={resendLoading}
                  disabled={resendLoading || resendCooldown > 0}
                  className="w-full"
                >
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : resendLoading
                    ? 'Sending...'
                    : 'Resend Code'}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-xs text-neutral-500 text-center space-y-2">
              <p>The verification code will expire in 10 minutes.</p>
              <p>
                Didn't receive the code? Check your phone's message inbox and ensure you have cell
                service.
              </p>
            </div>
          </Card>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                useAuth.getState().logout();
                navigate('/login');
              }}
              className="text-sm text-neutral-600 hover:text-neutral-800"
            >
              ← Sign out and try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

