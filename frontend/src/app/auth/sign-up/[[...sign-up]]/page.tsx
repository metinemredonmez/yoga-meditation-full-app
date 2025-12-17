import { Metadata } from 'next';
import SignUpViewPage from '@/features/auth/components/sign-up-view';

export const metadata: Metadata = {
  title: 'Sign Up | Yoga Admin',
  description: 'Create your Yoga Admin account.'
};

export default function Page() {
  return <SignUpViewPage />;
}
