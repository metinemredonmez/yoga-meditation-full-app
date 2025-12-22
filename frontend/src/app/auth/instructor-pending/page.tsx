'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { YogaLogo } from '@/components/yoga-logo';
import { IconClock, IconCheck, IconX, IconRefresh, IconMail } from '@tabler/icons-react';
import Link from 'next/link';

type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

function InstructorPendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ApplicationStatus>('PENDING');
  const [isChecking, setIsChecking] = useState(false);

  // Check status from URL params or API
  useEffect(() => {
    const urlStatus = searchParams.get('status');
    if (urlStatus === 'approved') {
      setStatus('APPROVED');
    } else if (urlStatus === 'rejected') {
      setStatus('REJECTED');
    }
  }, [searchParams]);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    // In a real implementation, this would call an API to check the application status
    // For now, we just simulate a check
    setTimeout(() => {
      setIsChecking(false);
    }, 1500);
  };

  const renderPendingContent = () => (
    <>
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 mx-auto mb-6">
        <IconClock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
      </div>
      <CardTitle className="text-2xl text-center">Basvurunuz Inceleniyor</CardTitle>
      <CardDescription className="text-center mt-2 max-w-md mx-auto">
        Egitmen basvurunuz ekibimiz tarafindan incelenmektedir.
        Bu islem genellikle 1-3 is gunu icerisinde tamamlanir.
      </CardDescription>
    </>
  );

  const renderApprovedContent = () => (
    <>
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-6">
        <IconCheck className="w-10 h-10 text-green-600 dark:text-green-400" />
      </div>
      <CardTitle className="text-2xl text-center text-green-600">Basvurunuz Onaylandi!</CardTitle>
      <CardDescription className="text-center mt-2 max-w-md mx-auto">
        Tebrikler! Egitmen hesabiniz onaylandi.
        Artik giris yaparak icerik olusturmaya baslayabilirsiniz.
      </CardDescription>
    </>
  );

  const renderRejectedContent = () => (
    <>
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-6">
        <IconX className="w-10 h-10 text-red-600 dark:text-red-400" />
      </div>
      <CardTitle className="text-2xl text-center text-red-600">Basvurunuz Reddedildi</CardTitle>
      <CardDescription className="text-center mt-2 max-w-md mx-auto">
        Maalesef basvurunuz bu asamada onaylanamamistir.
        Detayli bilgi icin bizimle iletisime gecebilirsiniz.
      </CardDescription>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      {/* Logo */}
      <Link href="/" className="mb-8">
        <YogaLogo className="h-12 w-12 text-amber-600" />
      </Link>

      <Card className="w-full max-w-lg">
        <CardHeader className="pb-4">
          {status === 'PENDING' && renderPendingContent()}
          {status === 'APPROVED' && renderApprovedContent()}
          {status === 'REJECTED' && renderRejectedContent()}
        </CardHeader>

        <CardContent className="space-y-6">
          {status === 'PENDING' && (
            <>
              {/* Status Info */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Ne bekliyoruz?
                </h4>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• Profilinizin ve deneyim bilgilerinizin incelenmesi</li>
                  <li>• Sertifikalarinizin dogrulanmasi</li>
                  <li>• Yoga egitmenlik yetkinliginin degerlendirilmesi</li>
                </ul>
              </div>

              {/* Check Status Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCheckStatus}
                disabled={isChecking}
              >
                {isChecking ? (
                  <>
                    <IconRefresh className="h-4 w-4 mr-2 animate-spin" />
                    Kontrol Ediliyor...
                  </>
                ) : (
                  <>
                    <IconRefresh className="h-4 w-4 mr-2" />
                    Basvuru Durumunu Kontrol Et
                  </>
                )}
              </Button>

              {/* Contact Info */}
              <div className="text-center text-sm text-muted-foreground">
                <p>Sorulariniz mi var?</p>
                <a
                  href="mailto:destek@yogaapp.com"
                  className="inline-flex items-center text-primary hover:underline mt-1"
                >
                  <IconMail className="h-4 w-4 mr-1" />
                  destek@yogaapp.com
                </a>
              </div>
            </>
          )}

          {status === 'APPROVED' && (
            <Button
              className="w-full"
              onClick={() => router.push('/auth/sign-in')}
            >
              Giris Yap
            </Button>
          )}

          {status === 'REJECTED' && (
            <>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                  Ne yapabilirsiniz?
                </h4>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  <li>• Eksik bilgilerinizi tamamlayarak tekrar basvurabilirsiniz</li>
                  <li>• Ek sertifika veya deneyim belgeleri ekleyebilirsiniz</li>
                  <li>• Detayli bilgi icin bizimle iletisime gecebilirsiniz</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push('/auth/sign-up')}
                >
                  Tekrar Basvur
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  asChild
                >
                  <a href="mailto:destek@yogaapp.com">
                    Iletisime Gec
                  </a>
                </Button>
              </div>
            </>
          )}

          {/* Back to Sign In Link */}
          <div className="text-center pt-4 border-t">
            <Link
              href="/auth/sign-in"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Giris sayfasina don
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Timeline indicator for pending */}
      {status === 'PENDING' && (
        <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Basvuru Alindi</span>
          </div>
          <div className="w-8 h-px bg-muted-foreground/30" />
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <span>Inceleniyor</span>
          </div>
          <div className="w-8 h-px bg-muted-foreground/30" />
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            <span>Sonuc</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InstructorPendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <InstructorPendingContent />
    </Suspense>
  );
}
