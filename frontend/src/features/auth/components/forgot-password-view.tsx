'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { forgotPassword } from '@/lib/api';
import { toast } from 'sonner';
import { IconArrowLeft, IconMail } from '@tabler/icons-react';
import { YogaLogo } from '@/components/yoga-logo';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordView() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    setIsLoading(true);
    try {
      await forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      toast.success('Password reset email sent!');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || 'Failed to send reset email. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      {/* Left side - Branding */}
      <div className='relative hidden h-full flex-col p-10 text-white lg:flex'>
        {/* Gradient background */}
        <div className='absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500' />

        {/* Decorative pattern */}
        <div className='absolute inset-0 opacity-10'>
          <svg className='h-full w-full' xmlns='http://www.w3.org/2000/svg'>
            <defs>
              <pattern id='yoga-pattern-forgot' x='0' y='0' width='50' height='50' patternUnits='userSpaceOnUse'>
                <circle cx='25' cy='25' r='20' fill='none' stroke='white' strokeWidth='1' />
                <circle cx='25' cy='25' r='8' fill='none' stroke='white' strokeWidth='1' />
              </pattern>
            </defs>
            <rect width='100%' height='100%' fill='url(#yoga-pattern-forgot)' />
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
          <h2 className='text-3xl font-bold mb-4'>Forgot Password?</h2>
          <p className='text-white/80 max-w-sm'>
            Don&apos;t worry, it happens to the best of us. We&apos;ll help you get back into your account.
          </p>
        </div>

        {/* Bottom quote */}
        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2 border-l-2 border-white/30 pl-4'>
            <p className='text-lg italic text-white/90'>
              &quot;In the midst of difficulty lies opportunity.&quot;
            </p>
            <footer className='text-sm text-white/60'>- Albert Einstein</footer>
          </blockquote>
        </div>
      </div>
      {/* Right side - Form */}
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          {/* Mobile logo */}
          <div className='lg:hidden mb-4'>
            <YogaLogo className='h-12 w-12 text-amber-600' />
          </div>

          {isSubmitted ? (
            // Success state
            <div className='flex flex-col items-center space-y-4 text-center'>
              <div className='rounded-full bg-green-100 p-3 dark:bg-green-900'>
                <IconMail className='h-8 w-8 text-green-600 dark:text-green-400' />
              </div>
              <h1 className='text-2xl font-semibold tracking-tight'>
                Check your email
              </h1>
              <p className='text-sm text-muted-foreground max-w-sm'>
                We&apos;ve sent a password reset link to{' '}
                <span className='font-medium text-foreground'>{submittedEmail}</span>
              </p>
              <p className='text-xs text-muted-foreground'>
                Didn&apos;t receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className='text-primary underline-offset-4 hover:underline'
                >
                  try again
                </button>
              </p>
              <Link href='/auth/sign-in'>
                <Button variant='outline' className='mt-4'>
                  <IconArrowLeft className='mr-2 h-4 w-4' />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            // Form state
            <>
              <div className='flex flex-col space-y-2 text-center'>
                <h1 className='text-2xl font-semibold tracking-tight'>
                  Forgot your password?
                </h1>
                <p className='text-sm text-muted-foreground'>
                  Enter your email address and we&apos;ll send you a link to reset your password
                </p>
              </div>
              <div className='w-full'>
                <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                      id='email'
                      type='email'
                      placeholder='name@example.com'
                      autoCapitalize='none'
                      autoComplete='email'
                      autoCorrect='off'
                      disabled={isLoading}
                      {...form.register('email')}
                    />
                    {form.formState.errors.email && (
                      <p className='text-sm text-destructive'>{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  <Button className='w-full' type='submit' disabled={isLoading}>
                    {isLoading && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
                    Send Reset Link
                  </Button>
                </form>
              </div>
              <Link href='/auth/sign-in' className='text-sm text-muted-foreground hover:text-primary'>
                <IconArrowLeft className='mr-1 inline h-4 w-4' />
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
