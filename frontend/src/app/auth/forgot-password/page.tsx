import { Metadata } from 'next';
import ForgotPasswordView from '@/features/auth/components/forgot-password-view';

export const metadata: Metadata = {
  title: 'Forgot Password | Yoga Admin',
  description: 'Reset your Yoga Admin password.'
};

export default function Page() {
  return <ForgotPasswordView />;
}
