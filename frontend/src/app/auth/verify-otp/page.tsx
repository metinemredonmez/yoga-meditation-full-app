'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { YogaLogo } from '@/components/yoga-logo';
import { IconShieldCheck, IconRefresh, IconArrowLeft } from '@tabler/icons-react';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { toast } from 'sonner';
import { verifyLoginOtp, resendLoginOtp } from '@/lib/api';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const userId = searchParams.get('userId');
  const maskedPhone = searchParams.get('phone');
  const expiresAt = searchParams.get('expiresAt');

  // Countdown timer for expiry
  useEffect(() => {
    if (expiresAt) {
      const updateCountdown = () => {
        const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
        setCountdown(remaining);
      };
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [expiresAt]);

  // Redirect if no userId
  useEffect(() => {
    if (!userId) {
      router.push('/auth/sign-in');
    }
  }, [userId, router]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace - go to previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      setOtp(pastedData.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');

    if (code.length !== 6) {
      toast.error('Lutfen 6 haneli kodu girin');
      return;
    }

    if (!userId) {
      toast.error('Gecersiz oturum, lutfen tekrar giris yapin');
      router.push('/auth/sign-in');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyLoginOtp({ userId, code });
      toast.success('Giris basarili!');

      // Redirect based on user role
      const userRole = result?.user?.role;
      if (userRole === 'TEACHER') {
        router.push('/instructor');
      } else if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        router.push('/dashboard/overview');
      } else {
        router.push('/student');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; remainingAttempts?: number } } };
      const errorMessage = err.response?.data?.message || 'Dogrulama basarisiz. Kodu kontrol edin.';
      const remaining = err.response?.data?.remainingAttempts;

      if (remaining !== undefined) {
        toast.error(`${errorMessage} (${remaining} deneme hakki kaldi)`);
      } else {
        toast.error(errorMessage);
      }

      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!userId) return;

    setIsResending(true);
    try {
      const result = await resendLoginOtp(userId);
      toast.success('Yeni kod gonderildi!');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

      // Update countdown with new expiry
      if (result.expiresAt) {
        const remaining = Math.floor((new Date(result.expiresAt).getTime() - Date.now()) / 1000);
        setCountdown(remaining);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || 'Kod gonderilemedi. Lutfen tekrar deneyin.';
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Gradient Blurred Background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-violet-900/80 via-purple-800/70 to-indigo-900/80 backdrop-blur-xl"
        aria-hidden="true"
      />
      {/* Extra blur overlay */}
      <div
        className="absolute inset-0 backdrop-blur-2xl bg-black/20"
        aria-hidden="true"
      />

      {/* OTP Card - Centered */}
      <Card className="relative z-10 w-full max-w-md mx-4 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mx-auto mb-4">
            <IconShieldCheck className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl">Telefon Dogrulamasi</CardTitle>
          <CardDescription className="mt-2">
            {maskedPhone ? (
              <>
                <span className="font-medium text-foreground">{maskedPhone}</span>
                <span> numarasina gonderilen 6 haneli kodu girin</span>
              </>
            ) : (
              'Telefonunuza gonderilen 6 haneli kodu girin'
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input */}
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-14 text-center text-2xl font-semibold"
                  disabled={isLoading}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {/* Countdown Timer */}
            {countdown > 0 && (
              <div className="text-center text-sm text-muted-foreground">
                Kod {formatCountdown(countdown)} icerisinde gecerli
              </div>
            )}

            {countdown === 0 && expiresAt && (
              <div className="text-center text-sm text-destructive">
                Kodun suresi doldu. Lutfen yeni kod isteyin.
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || otp.join('').length !== 6}
            >
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Dogrulaniyor...
                </>
              ) : (
                'Dogrula ve Giris Yap'
              )}
            </Button>

            {/* Resend Button */}
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResend}
                disabled={isResending}
                className="text-muted-foreground hover:text-primary"
              >
                {isResending ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Gonderiliyor...
                  </>
                ) : (
                  <>
                    <IconRefresh className="mr-2 h-4 w-4" />
                    Kodu Tekrar Gonder
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Back to Sign In */}
          <div className="mt-6 pt-6 border-t text-center">
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
            >
              <IconArrowLeft className="mr-1 h-4 w-4" />
              Giris sayfasina don
            </Link>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}
