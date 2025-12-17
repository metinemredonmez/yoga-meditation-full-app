import Link from 'next/link';
import UserAuthForm from './user-auth-form';
import { YogaLogo } from '@/components/yoga-logo';

export default function SignInViewPage() {
  return (
    <div className='relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      {/* Left side - Branding */}
      <div className='relative hidden h-full flex-col p-10 text-white lg:flex'>
        {/* Gradient background */}
        <div className='absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700' />

        {/* Decorative pattern */}
        <div className='absolute inset-0 opacity-10'>
          <svg className='h-full w-full' xmlns='http://www.w3.org/2000/svg'>
            <defs>
              <pattern id='yoga-pattern' x='0' y='0' width='60' height='60' patternUnits='userSpaceOnUse'>
                <circle cx='30' cy='30' r='20' fill='none' stroke='white' strokeWidth='1' />
                <circle cx='30' cy='30' r='10' fill='none' stroke='white' strokeWidth='1' />
                <circle cx='30' cy='30' r='3' fill='white' />
              </pattern>
            </defs>
            <rect width='100%' height='100%' fill='url(#yoga-pattern)' />
          </svg>
        </div>

        {/* Logo */}
        <div className='relative z-20 flex items-center text-lg font-medium'>
          <YogaLogo className='h-10 w-10 text-white' />
        </div>

        {/* Center content */}
        <div className='relative z-20 my-auto flex flex-col items-center text-center'>
          <div className='mb-8'>
            <YogaLogo className='h-24 w-24 text-white/90' showText={false} />
          </div>
          <h2 className='text-3xl font-bold mb-4'>Welcome to Yoga Admin</h2>
          <p className='text-white/80 max-w-sm'>
            Manage your yoga platform with ease. Track users, content, subscriptions, and more from one central dashboard.
          </p>
        </div>

        {/* Bottom quote */}
        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2 border-l-2 border-white/30 pl-4'>
            <p className='text-lg italic text-white/90'>
              &quot;Yoga is the journey of the self, through the self, to the self.&quot;
            </p>
            <footer className='text-sm text-white/60'>- The Bhagavad Gita</footer>
          </blockquote>
        </div>
      </div>

      {/* Right side - Form */}
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          {/* Mobile logo */}
          <div className='lg:hidden mb-4'>
            <YogaLogo className='h-12 w-12 text-violet-600' />
          </div>

          <div className='flex flex-col space-y-2 text-center'>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Welcome back
            </h1>
            <p className='text-sm text-muted-foreground'>
              Enter your credentials to sign in to your account
            </p>
          </div>
          <div className='w-full'>
            <UserAuthForm type='login' />
          </div>
          <p className='text-muted-foreground px-8 text-center text-sm'>
            By clicking continue, you agree to our{' '}
            <Link
              href='/terms'
              className='hover:text-primary underline underline-offset-4'
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href='/privacy'
              className='hover:text-primary underline underline-offset-4'
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
