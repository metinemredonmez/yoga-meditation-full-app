import { Metadata } from 'next';
import SignInViewPage from '@/features/auth/components/sign-in-view';

export const metadata: Metadata = {
  title: 'Sign In | Yoga Admin',
  description: 'Sign in to your Yoga Admin dashboard.'
};

export default function Page() {
  return <SignInViewPage />;
}
