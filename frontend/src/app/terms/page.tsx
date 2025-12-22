import { Metadata } from 'next';
import Link from 'next/link';
import { YogaLogo } from '@/components/yoga-logo';
import { IconArrowLeft } from '@tabler/icons-react';

export const metadata: Metadata = {
  title: 'Terms of Service | Yoga Admin',
  description: 'Terms of Service for Yoga Admin platform.'
};

export default function TermsPage() {
  return (
    <div className='fixed inset-0 bg-background overflow-y-auto z-50'>
      {/* Header */}
      <header className='sticky top-0 border-b bg-background z-10'>
        <div className='container mx-auto px-4 py-4 flex items-center justify-between'>
          <Link href='/' className='flex items-center gap-2'>
            <YogaLogo className='h-8 w-8 text-amber-600' />
            <span className='font-semibold text-lg'>Yoga Admin</span>
          </Link>
          <Link
            href='/auth/sign-in'
            className='text-sm text-muted-foreground hover:text-primary flex items-center gap-1'
          >
            <IconArrowLeft className='h-4 w-4' />
            Back to Sign In
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className='container mx-auto px-4 py-12 max-w-4xl'>
        <h1 className='text-3xl font-bold mb-8'>Terms of Service</h1>

        <div className='prose prose-slate dark:prose-invert max-w-none space-y-6'>
          <p className='text-muted-foreground'>
            Last updated: December 21, 2025
          </p>

          <section>
            <h2 className='text-xl font-semibold mt-8 mb-4'>1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Yoga Admin platform, you accept and agree to be bound by the terms
              and provision of this agreement. If you do not agree to abide by these terms, please do not
              use this service.
            </p>
          </section>

          <section>
            <h2 className='text-xl font-semibold mt-8 mb-4'>2. Description of Service</h2>
            <p>
              Yoga Admin provides a comprehensive platform for yoga studios and wellness centers to manage
              their classes, instructors, students, and content. Our services include but are not limited to:
            </p>
            <ul className='list-disc pl-6 mt-2 space-y-1'>
              <li>Class scheduling and booking management</li>
              <li>Instructor and student management</li>
              <li>Content management (meditations, breathwork, podcasts)</li>
              <li>Payment processing and subscription management</li>
              <li>Analytics and reporting</li>
            </ul>
          </section>

          <section>
            <h2 className='text-xl font-semibold mt-8 mb-4'>3. User Accounts</h2>
            <p>
              To access certain features of the platform, you must register for an account. You agree to:
            </p>
            <ul className='list-disc pl-6 mt-2 space-y-1'>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className='text-xl font-semibold mt-8 mb-4'>4. Acceptable Use</h2>
            <p>
              You agree not to use the platform to:
            </p>
            <ul className='list-disc pl-6 mt-2 space-y-1'>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Upload malicious code or content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with the proper functioning of the platform</li>
            </ul>
          </section>

          <section>
            <h2 className='text-xl font-semibold mt-8 mb-4'>5. Intellectual Property</h2>
            <p>
              All content and materials available on the platform, including but not limited to text,
              graphics, logos, and software, are the property of Yoga Admin or its licensors and are
              protected by intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className='text-xl font-semibold mt-8 mb-4'>6. Payment Terms</h2>
            <p>
              If you subscribe to paid services, you agree to pay all applicable fees. Subscription fees
              are billed in advance and are non-refundable unless otherwise specified. We reserve the
              right to change our pricing with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className='text-xl font-semibold mt-8 mb-4'>7. Termination</h2>
            <p>
              We may terminate or suspend your account at any time for violations of these terms. You may
              also terminate your account at any time by contacting our support team. Upon termination,
              your right to use the platform will immediately cease.
            </p>
          </section>

          <section>
            <h2 className='text-xl font-semibold mt-8 mb-4'>8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Yoga Admin shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages resulting from your use of or
              inability to use the platform.
            </p>
          </section>

          <section>
            <h2 className='text-xl font-semibold mt-8 mb-4'>9. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of significant
              changes via email or through the platform. Continued use of the platform after changes
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className='text-xl font-semibold mt-8 mb-4'>10. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className='mt-2'>
              <strong>Email:</strong> legal@yogaadmin.com<br />
              <strong>Address:</strong> Istanbul, Turkey
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className='mt-12 pt-8 border-t flex gap-4 text-sm text-muted-foreground'>
          <Link href='/privacy' className='hover:text-primary'>Privacy Policy</Link>
          <span>|</span>
          <Link href='/auth/sign-in' className='hover:text-primary'>Sign In</Link>
          <span>|</span>
          <Link href='/auth/sign-up' className='hover:text-primary'>Sign Up</Link>
        </div>
      </main>
    </div>
  );
}
