'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { login, signup } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { IconUser, IconYoga, IconArrowLeft } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

// Login Schema
const loginSchema = z.object({
  email: z.string().email('Gecerli bir e-posta adresi girin'),
  password: z.string().min(6, 'Sifre en az 6 karakter olmali'),
});

// Base fields for signup (without refinement)
const baseSignupFields = {
  firstName: z.string().min(2, 'Ad en az 2 karakter olmali'),
  lastName: z.string().min(2, 'Soyad en az 2 karakter olmali'),
  email: z.string().email('Gecerli bir e-posta adresi girin'),
  password: z.string().min(6, 'Sifre en az 6 karakter olmali'),
  confirmPassword: z.string(),
};

// Base Signup Schema (for students)
const baseSignupSchema = z.object(baseSignupFields).refine((data) => data.password === data.confirmPassword, {
  message: "Sifreler eslesmiyor",
  path: ['confirmPassword'],
});

// Instructor Additional Schema
const instructorSignupSchema = z.object({
  ...baseSignupFields,
  phone: z.string().min(10, 'Gecerli bir telefon numarasi girin'),
  experience: z.string().min(10, 'Deneyiminizi en az 10 karakter ile aciklayin'),
  certifications: z.string().optional(),
  specializations: z.string().optional(),
  bio: z.string().min(20, 'Kendinizi en az 20 karakter ile tanitin'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Sifreler eslesmiyor",
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof baseSignupSchema>;
type InstructorSignupFormData = z.infer<typeof instructorSignupSchema>;

interface UserAuthFormProps {
  type?: 'login' | 'signup';
}

type AccountType = 'student' | 'instructor' | null;

export default function UserAuthForm({ type = 'login' }: UserAuthFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>(null);

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Student Signup form
  const studentForm = useForm<SignupFormData>({
    resolver: zodResolver(baseSignupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Instructor Signup form
  const instructorForm = useForm<InstructorSignupFormData>({
    resolver: zodResolver(instructorSignupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      experience: '',
      certifications: '',
      specializations: '',
      bio: '',
    },
  });

  async function onLoginSubmit(data: LoginFormData) {
    setIsLoading(true);
    try {
      const result = await login({ email: data.email, password: data.password });

      // Check if OTP verification is required (APPROVED instructor)
      // Backend now returns requiresOtpVerification instead of token
      if (result.requiresOtpVerification) {
        // Redirect to OTP verification page with necessary params
        const params = new URLSearchParams({
          userId: result.userId,
          phone: result.phoneNumber || '',
          expiresAt: result.expiresAt || '',
        });
        router.push(`/auth/verify-otp?${params.toString()}`);
        return;
      }

      toast.success('Giris basarili!');

      // Redirect based on user role
      // Backend returns { users: {...} } - note the 's' at the end
      const userRole = result?.users?.role || result?.user?.role || result?.role;

      if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        router.push('/dashboard/overview');
      } else if (userRole === 'TEACHER') {
        router.push('/instructor');
      } else {
        router.push('/student');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; pendingApproval?: boolean; rejected?: boolean } } };
      const errorMessage = err.response?.data?.message || 'Giris basarisiz. Bilgilerinizi kontrol edin.';

      // Handle instructor pending or rejected status
      if (err.response?.data?.pendingApproval) {
        router.push('/auth/instructor-pending');
        return;
      }
      if (err.response?.data?.rejected) {
        router.push('/auth/instructor-pending?status=rejected');
        return;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  async function onStudentSignupSubmit(data: SignupFormData) {
    setIsLoading(true);
    try {
      await signup({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'STUDENT',
      });
      toast.success('Hesabiniz olusturuldu!');
      router.push('/student');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || 'Kayit basarisiz. Tekrar deneyin.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  async function onInstructorSignupSubmit(data: InstructorSignupFormData) {
    setIsLoading(true);
    try {
      await signup({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'TEACHER',
        phoneNumber: data.phone,
        bio: data.bio,
        experience: data.experience,
        certifications: data.certifications,
        specializations: data.specializations,
      });
      toast.success('Egitmen basvurunuz alindi! Hesabiniz onaylandiktan sonra giris yapabilirsiniz.');
      router.push('/auth/sign-in?instructor-pending=true');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || 'Kayit basarisiz. Tekrar deneyin.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  // Account Type Selection
  if (type === 'signup' && accountType === null) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium">Hesap Turunuzu Secin</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Nasil bir hesap olusturmak istiyorsunuz?
          </p>
        </div>

        <div className="grid gap-4">
          {/* Student Option */}
          <button
            onClick={() => setAccountType('student')}
            className={cn(
              "relative flex flex-col items-center p-6 border-2 rounded-lg transition-all",
              "hover:border-primary hover:bg-primary/5",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            )}
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
              <IconUser className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="text-lg font-semibold">Kullanici</h4>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Yoga dersleri izlemek, meditasyon yapmak ve kisisel gelisiminizi takip etmek icin
            </p>
            <span className="mt-4 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
              Hemen basla
            </span>
          </button>

          {/* Instructor Option */}
          <button
            onClick={() => setAccountType('instructor')}
            className={cn(
              "relative flex flex-col items-center p-6 border-2 rounded-lg transition-all",
              "hover:border-primary hover:bg-primary/5",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            )}
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
              <IconYoga className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h4 className="text-lg font-semibold">Egitmen</h4>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Yoga dersleri vermek, icerik olusturmak ve ogrencilerinizi yonetmek icin
            </p>
            <span className="mt-4 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full">
              Basvuru gerekli
            </span>
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Zaten hesabiniz var mi?{' '}
          <Link href="/auth/sign-in" className="text-primary underline-offset-4 hover:underline">
            Giris yap
          </Link>
        </p>
      </div>
    );
  }

  // Student Signup Form
  if (type === 'signup' && accountType === 'student') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setAccountType(null)}
          className="flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <IconArrowLeft className="w-4 h-4 mr-1" />
          Geri don
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30">
            <IconUser className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium">Kullanici Hesabi</h3>
            <p className="text-xs text-muted-foreground">Hemen baslamak icin kayit olun</p>
          </div>
        </div>

        <form onSubmit={studentForm.handleSubmit(onStudentSignupSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Ad</Label>
              <Input
                id="firstName"
                placeholder="Adiniz"
                disabled={isLoading}
                {...studentForm.register('firstName')}
              />
              {studentForm.formState.errors.firstName && (
                <p className="text-sm text-destructive">{studentForm.formState.errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Soyad</Label>
              <Input
                id="lastName"
                placeholder="Soyadiniz"
                disabled={isLoading}
                {...studentForm.register('lastName')}
              />
              {studentForm.formState.errors.lastName && (
                <p className="text-sm text-destructive">{studentForm.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@email.com"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              {...studentForm.register('email')}
            />
            {studentForm.formState.errors.email && (
              <p className="text-sm text-destructive">{studentForm.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Sifre</Label>
            <Input
              id="password"
              type="password"
              placeholder="Sifrenizi olusturun"
              autoComplete="new-password"
              disabled={isLoading}
              {...studentForm.register('password')}
            />
            {studentForm.formState.errors.password && (
              <p className="text-sm text-destructive">{studentForm.formState.errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Sifre Tekrar</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Sifrenizi tekrar girin"
              autoComplete="new-password"
              disabled={isLoading}
              {...studentForm.register('confirmPassword')}
            />
            {studentForm.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">{studentForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Hesap Olustur
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Zaten hesabiniz var mi?{' '}
          <Link href="/auth/sign-in" className="text-primary underline-offset-4 hover:underline">
            Giris yap
          </Link>
        </p>
      </div>
    );
  }

  // Instructor Signup Form
  if (type === 'signup' && accountType === 'instructor') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setAccountType(null)}
          className="flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <IconArrowLeft className="w-4 h-4 mr-1" />
          Geri don
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30">
            <IconYoga className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-medium">Egitmen Basvurusu</h3>
            <p className="text-xs text-muted-foreground">Basvurunuz incelendikten sonra aktif olacak</p>
          </div>
        </div>

        <form onSubmit={instructorForm.handleSubmit(onInstructorSignupSubmit)} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Ad *</Label>
              <Input
                id="firstName"
                placeholder="Adiniz"
                disabled={isLoading}
                {...instructorForm.register('firstName')}
              />
              {instructorForm.formState.errors.firstName && (
                <p className="text-sm text-destructive">{instructorForm.formState.errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Soyad *</Label>
              <Input
                id="lastName"
                placeholder="Soyadiniz"
                disabled={isLoading}
                {...instructorForm.register('lastName')}
              />
              {instructorForm.formState.errors.lastName && (
                <p className="text-sm text-destructive">{instructorForm.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-posta *</Label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@email.com"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              {...instructorForm.register('email')}
            />
            {instructorForm.formState.errors.email && (
              <p className="text-sm text-destructive">{instructorForm.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="05XX XXX XX XX"
              disabled={isLoading}
              {...instructorForm.register('phone')}
            />
            {instructorForm.formState.errors.phone && (
              <p className="text-sm text-destructive">{instructorForm.formState.errors.phone.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Sifre *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sifreniz"
                autoComplete="new-password"
                disabled={isLoading}
                {...instructorForm.register('password')}
              />
              {instructorForm.formState.errors.password && (
                <p className="text-sm text-destructive">{instructorForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Sifre Tekrar *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Tekrar"
                autoComplete="new-password"
                disabled={isLoading}
                {...instructorForm.register('confirmPassword')}
              />
              {instructorForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{instructorForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Professional Info */}
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium mb-3">Profesyonel Bilgiler</h4>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Deneyim *</Label>
                <Textarea
                  id="experience"
                  placeholder="Yoga egitmenligindeki deneyiminizi anlatın (yil, stüdyo, vs.)"
                  disabled={isLoading}
                  rows={3}
                  {...instructorForm.register('experience')}
                />
                {instructorForm.formState.errors.experience && (
                  <p className="text-sm text-destructive">{instructorForm.formState.errors.experience.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="certifications">Sertifikalar</Label>
                <Input
                  id="certifications"
                  placeholder="RYT-200, RYT-500, vs. (virgülle ayirin)"
                  disabled={isLoading}
                  {...instructorForm.register('certifications')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specializations">Uzmanlik Alanlari</Label>
                <Input
                  id="specializations"
                  placeholder="Hatha, Vinyasa, Yin, vs. (virgülle ayirin)"
                  disabled={isLoading}
                  {...instructorForm.register('specializations')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Hakkinda *</Label>
                <Textarea
                  id="bio"
                  placeholder="Kendinizi tanitin, yoga yolculugunuzu paylasın..."
                  disabled={isLoading}
                  rows={4}
                  {...instructorForm.register('bio')}
                />
                {instructorForm.formState.errors.bio && (
                  <p className="text-sm text-destructive">{instructorForm.formState.errors.bio.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
            <p className="text-amber-800 dark:text-amber-200">
              <strong>Not:</strong> Egitmen basvurunuz ekibimiz tarafindan incelenecektir.
              Onaylandiktan sonra size e-posta ile bilgi verilecektir.
            </p>
          </div>

          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Basvuru Gonder
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Zaten hesabiniz var mi?{' '}
          <Link href="/auth/sign-in" className="text-primary underline-offset-4 hover:underline">
            Giris yap
          </Link>
        </p>
      </div>
    );
  }

  // Login form (default)
  return (
    <div className="space-y-6">
      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-posta</Label>
          <Input
            id="email"
            type="email"
            placeholder="ornek@email.com"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            disabled={isLoading}
            {...loginForm.register('email')}
          />
          {loginForm.formState.errors.email && (
            <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Sifre</Label>
          <Input
            id="password"
            type="password"
            placeholder="Sifrenizi girin"
            autoComplete="current-password"
            disabled={isLoading}
            {...loginForm.register('password')}
          />
          {loginForm.formState.errors.password && (
            <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
          )}
        </div>
        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          Giris Yap
        </Button>
      </form>
      <div className="flex items-center justify-between text-sm">
        <Link href="/auth/forgot-password" className="text-muted-foreground hover:text-primary">
          Sifremi unuttum
        </Link>
        <Link href="/auth/sign-up" className="text-primary underline-offset-4 hover:underline">
          Hesap olustur
        </Link>
      </div>
    </div>
  );
}
