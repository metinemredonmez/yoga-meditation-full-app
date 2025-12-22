'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { IconPhone, IconShieldCheck, IconRefresh, IconLock } from '@tabler/icons-react';
import { toast } from 'sonner';
import { sendPhoneVerification, verifyPhone } from '@/lib/api';

export default function InstructorVerifyPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const requiresVerification = sessionStorage.getItem('requiresPhoneVerification');
      const phone = sessionStorage.getItem('verificationPhone');

      if (requiresVerification !== 'true' || !phone) {
        router.push('/');
        return;
      }

      setIsAuthorized(true);
      setPhoneNumber(phone);
      handleSendOtp();
    }
  }, [router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOtp = async () => {
    setIsSending(true);
    try {
      await sendPhoneVerification();
      setOtpSent(true);
      setCountdown(60);
      toast.success('Dogrulama kodu gonderildi');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; error?: string; retryAfter?: number } } };
      const retryAfter = err.response?.data?.retryAfter;
      if (retryAfter) {
        setCountdown(retryAfter);
        setOtpSent(true);
      }
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Kod gonderilemedi');
    } finally {
      setIsSending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Handle paste
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otpCode];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtpCode(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();

      if (newOtp.every(d => d !== '')) {
        handleVerify(newOtp.join(''));
      }
      return;
    }

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(d => d !== '') && newOtp.length === 6) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const otpToVerify = code || otpCode.join('');
    if (otpToVerify.length !== 6) {
      toast.error('Lutfen 6 haneli kodu girin');
      return;
    }

    setIsLoading(true);
    try {
      await verifyPhone({ code: otpToVerify });

      sessionStorage.removeItem('requiresPhoneVerification');
      sessionStorage.removeItem('verificationPhone');

      toast.success('Telefon dogrulandi!');
      router.push('/instructor');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Dogrulama basarisiz');
      setOtpCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground animate-pulse">Yukleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full animate-pulse opacity-50" />
              <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full">
                <IconShieldCheck className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Telefon Dogrulama</h1>
            <p className="text-white/60">
              Guvenliginiz icin telefonunuzu dogrulayin
            </p>
          </div>

          {/* Phone number display */}
          <div className="flex items-center justify-center gap-3 bg-white/5 backdrop-blur rounded-2xl p-4 mb-8 border border-white/10">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-full">
              <IconPhone className="h-5 w-5 text-cyan-400" />
            </div>
            <span className="font-mono text-xl text-white tracking-wider">{phoneNumber}</span>
          </div>

          {/* OTP Input */}
          {otpSent && (
            <div className="space-y-6 mb-8">
              <div className="flex items-center justify-center gap-2 text-white/60">
                <IconLock className="w-4 h-4" />
                <span className="text-sm">6 Haneli Dogrulama Kodu</span>
              </div>

              <div className="flex justify-center gap-2 sm:gap-3">
                {otpCode.map((digit, index) => (
                  <div key={index} className="relative">
                    <input
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      className={`
                        w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-bold
                        bg-white/10 backdrop-blur border-2 rounded-xl
                        text-white placeholder-white/30
                        transition-all duration-300 ease-out
                        focus:outline-none focus:ring-0
                        ${focusedIndex === index
                          ? 'border-cyan-400 shadow-lg shadow-cyan-500/30 scale-105'
                          : digit
                            ? 'border-purple-400/50'
                            : 'border-white/20'
                        }
                        ${isLoading ? 'opacity-50' : ''}
                      `}
                      disabled={isLoading}
                      autoFocus={index === 0}
                    />
                    {/* Animated underline */}
                    <div className={`
                      absolute bottom-1 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full
                      transition-all duration-300
                      ${focusedIndex === index ? 'w-8' : 'w-0'}
                    `} />
                  </div>
                ))}
              </div>

              {/* Progress indicator when loading */}
              {isLoading && (
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <div className="relative w-5 h-5">
                      <div className="absolute inset-0 border-2 border-cyan-400/20 rounded-full" />
                      <div className="absolute inset-0 border-2 border-transparent border-t-cyan-400 rounded-full animate-spin" />
                    </div>
                    <span className="text-sm animate-pulse">Dogrulaniyor...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            {otpSent ? (
              <>
                <Button
                  className="w-full h-14 text-lg font-semibold rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white border-0 shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02]"
                  onClick={() => handleVerify()}
                  disabled={isLoading || otpCode.some(d => d === '')}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Icons.spinner className="h-5 w-5 animate-spin" />
                      <span>Dogrulaniyor...</span>
                    </div>
                  ) : (
                    'Dogrula'
                  )}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full h-12 text-base rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
                  onClick={() => handleSendOtp()}
                  disabled={countdown > 0 || isSending}
                >
                  {isSending ? (
                    <div className="flex items-center gap-2">
                      <Icons.spinner className="h-4 w-4 animate-spin" />
                      <span>Gonderiliyor...</span>
                    </div>
                  ) : countdown > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="relative w-6 h-6">
                        <svg className="w-6 h-6 transform -rotate-90">
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            className="text-white/20"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            strokeDasharray={62.83}
                            strokeDashoffset={62.83 * (1 - countdown / 60)}
                            className="text-cyan-400 transition-all duration-1000"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                          {countdown}
                        </span>
                      </div>
                      <span>Tekrar gonder</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <IconRefresh className="h-4 w-4" />
                      <span>Tekrar kod gonder</span>
                    </div>
                  )}
                </Button>
              </>
            ) : (
              <Button
                className="w-full h-14 text-lg font-semibold rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white border-0 shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30"
                onClick={() => handleSendOtp()}
                disabled={isSending}
              >
                {isSending ? (
                  <div className="flex items-center gap-2">
                    <Icons.spinner className="h-5 w-5 animate-spin" />
                    <span>Kod Gonderiliyor...</span>
                  </div>
                ) : (
                  'Dogrulama Kodu Gonder'
                )}
              </Button>
            )}
          </div>

          {/* Footer text */}
          <p className="text-xs text-center text-white/40 mt-6">
            SMS ile gonderilen 6 haneli kodu girerek hesabinizi dogrulayin.
            <br />
            Kod 5 dakika icerisinde gecerlidir.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
