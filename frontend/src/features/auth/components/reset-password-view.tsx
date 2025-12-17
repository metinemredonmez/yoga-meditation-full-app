'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { resetPassword } from '@/lib/api';
import { toast } from 'sonner';
import { IconArrowLeft, IconCheck } from '@tabler/icons-react';
import { YogaLogo } from '@/components/yoga-logo';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: ResetPasswordFormData) {
    if (!token) {
      toast.error('Invalid reset link. Please request a new one.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, data.password);
      setIsSuccess(true);
      toast.success('Password reset successfully!');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || 'Failed to reset password. The link may have expired.';
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
        <div className='absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700' />

        {/* Decorative pattern */}
        <div className='absolute inset-0 opacity-10'>
          <svg className='h-full w-full' xmlns='http://www.w3.org/2000/svg'>
            <defs>
              <pattern id='yoga-pattern-reset' x='0' y='0' width='40' height='40' patternUnits='userSpaceOnUse'>
                <rect x='10' y='10' width='20' height='20' fill='none' stroke='white' strokeWidth='1' rx='4' />
              </pattern>
            </defs>
            <rect width='100%' height='100%' fill='url(#yoga-pattern-reset)' />
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
          <h2 className='text-3xl font-bold mb-4'>Reset Password</h2>
          <p className='text-white/80 max-w-sm'>
            Create a strong password to keep your account secure.
          </p>
        </div>

        {/* Bottom quote */}
        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2 border-l-2 border-white/30 pl-4'>
            <p className='text-lg italic text-white/90'>
              &quot;The secret of change is to focus all your energy not on fighting the old, but on building the new.&quot;
            </p>
            <footer className='text-sm text-white/60'>- Socrates</footer>
          </blockquote>
        </div>
      </div>

      {/* Right side - Form */}
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          {/* Mobile logo */}
          <div className='lg:hidden mb-4'>
            <YogaLogo className='h-12 w-12 text-blue-600' />
          </div>

          {!token ? (
            // Invalid token state
            <div className='flex flex-col items-center space-y-4 text-center'>
              <div className='rounded-full bg-red-100 p-3 dark:bg-red-900'>
                <Icons.warning className='h-8 w-8 text-red-600 dark:text-red-400' />
              </div>
              <h1 className='text-2xl font-semibold tracking-tight'>
                Invalid Reset Link
              </h1>
              <p className='text-sm text-muted-foreground max-w-sm'>
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Link href='/auth/forgot-password'>
                <Button className='mt-4'>
                  Request New Link
                </Button>
              </Link>
            </div>
          ) : isSuccess ? (
            // Success state
            <div className='flex flex-col items-center space-y-4 text-center'>
              <div className='rounded-full bg-green-100 p-3 dark:bg-green-900'>
                <IconCheck className='h-8 w-8 text-green-600 dark:text-green-400' />
              </div>
              <h1 className='text-2xl font-semibold tracking-tight'>
                Password Reset Complete
              </h1>
              <p className='text-sm text-muted-foreground max-w-sm'>
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <Link href='/auth/sign-in'>
                <Button className='mt-4'>
                  Sign In
                </Button>
              </Link>
            </div>
          ) : (
            // Form state
            <>
              <div className='flex flex-col space-y-2 text-center'>
                <h1 className='text-2xl font-semibold tracking-tight'>
                  Reset your password
                </h1>
                <p className='text-sm text-muted-foreground'>
                  Enter your new password below
                </p>
              </div>
              <div className='w-full'>
                <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='password'>New Password</Label>
                    <Input
                      id='password'
                      type='password'
                      placeholder='Enter new password'
                      autoComplete='new-password'
                      disabled={isLoading}
                      {...form.register('password')}
                    />
                    {form.formState.errors.password && (
                      <p className='text-sm text-destructive'>{form.formState.errors.password.message}</p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='confirmPassword'>Confirm Password</Label>
                    <Input
                      id='confirmPassword'
                      type='password'
                      placeholder='Confirm new password'
                      autoComplete='new-password'
                      disabled={isLoading}
                      {...form.register('confirmPassword')}
                    />
                    {form.formState.errors.confirmPassword && (
                      <p className='text-sm text-destructive'>{form.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                  <Button className='w-full' type='submit' disabled={isLoading}>
                    {isLoading && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
                    Reset Password
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
