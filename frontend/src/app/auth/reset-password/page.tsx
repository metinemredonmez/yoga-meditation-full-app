import { Metadata } from 'next';
import ResetPasswordView from '@/features/auth/components/reset-password-view';

export const metadata: Metadata = {
  title: 'Reset Password | Yoga Admin',
  description: 'Set your new password.'
};

export default function Page() {
  return <ResetPasswordView />;
}
