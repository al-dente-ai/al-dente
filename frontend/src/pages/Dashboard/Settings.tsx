import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChangePhoneSchema, type ChangePhoneFormData } from '../../lib/validators';
import { toast } from '../../store';
import api from '../../lib/api';
import type { User } from '../../lib/types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [changingPhone, setChangingPhone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<ChangePhoneFormData>({
    resolver: zodResolver(ChangePhoneSchema),
  });

  // Load user profile
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<User>('/auth/me');
      setUser(data);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPhoneChange = async () => {
    if (!newPhoneNumber) {
      toast.error('Please enter a phone number');
      return;
    }

    try {
      setSendingCode(true);
      await api.post('/auth/send-verification-code', {
        phoneNumber: newPhoneNumber,
        purpose: 'phone_change',
      });
      
      setValue('newPhoneNumber', newPhoneNumber);
      setShowPhoneModal(true);
      toast.success('Verification code sent to your new phone number!');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send verification code');
    } finally {
      setSendingCode(false);
    }
  };

  const onSubmitPhoneChange = async (data: ChangePhoneFormData) => {
    try {
      setChangingPhone(true);
      await api.post('/auth/change-phone', data);
      
      setShowPhoneModal(false);
      setNewPhoneNumber('');
      reset();
      
      // Reload user profile to show updated phone
      await loadUserProfile();
      
      toast.success('Phone number updated successfully!');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to change phone number');
    } finally {
      setChangingPhone(false);
    }
  };

  const handleResendCode = async () => {
    if (!newPhoneNumber) return;

    try {
      setSendingCode(true);
      await api.post('/auth/send-verification-code', {
        phoneNumber: newPhoneNumber,
        purpose: 'phone_change',
      });
      toast.success('Verification code resent!');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to resend code');
    } finally {
      setSendingCode(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-800">Settings</h1>
        <p className="text-neutral-600 mt-2">Manage your account settings and preferences</p>
      </div>

      {/* Account Information */}
      <Card>
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">Account Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Email Address
              </label>
              <div className="text-neutral-900 bg-neutral-50 px-4 py-2 rounded-lg border border-neutral-200">
                {user?.email}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Your email address cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Account Created
              </label>
              <div className="text-neutral-900 bg-neutral-50 px-4 py-2 rounded-lg border border-neutral-200">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }) : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Phone Number Management */}
      <Card>
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">Phone Number</h2>
            <p className="text-sm text-neutral-600">
              Your phone number is used for account verification and password recovery.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Current Phone Number
              </label>
              <div className="text-neutral-900 bg-neutral-50 px-4 py-2 rounded-lg border border-neutral-200 flex items-center justify-between">
                <span>{user?.phoneNumber || 'Not set'}</span>
                {user?.phoneVerified && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Verified
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                New Phone Number
              </label>
              <div className="flex gap-3">
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleRequestPhoneChange}
                  isLoading={sendingCode}
                  disabled={sendingCode || !newPhoneNumber}
                >
                  Send Code
                </Button>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Enter a US or Canada phone number (10 digits) to receive a verification code
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Phone Verification Modal */}
      <Modal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        title="Verify New Phone Number"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            We've sent a 6-digit verification code to <strong>{newPhoneNumber}</strong>. 
            Please enter it below to confirm your new phone number.
          </p>

          <form onSubmit={handleSubmit(onSubmitPhoneChange)} className="space-y-4">
            <input type="hidden" {...register('newPhoneNumber')} />

            <Input
              label="Verification Code"
              type="text"
              placeholder="123456"
              maxLength={6}
              {...register('code')}
              error={errors.code?.message}
              autoComplete="one-time-code"
            />

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                isLoading={changingPhone}
                disabled={changingPhone}
              >
                Verify & Update
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleResendCode}
                isLoading={sendingCode}
                disabled={sendingCode}
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

