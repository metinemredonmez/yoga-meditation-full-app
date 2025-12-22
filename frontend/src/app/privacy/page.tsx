import { Metadata } from 'next';
import Link from 'next/link';
import { YogaLogo } from '@/components/yoga-logo';
import { IconArrowLeft } from '@tabler/icons-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Yoga Admin',
  description: 'Privacy Policy for Yoga Admin platform.'
};

export default function PrivacyPage() {
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
        <h1 className='text-3xl font-bold mb-8'>Privacy Policy</h1>

        <div className='prose prose-slate dark:prose-invert max-w-none space-y-6'>
          <p className='text-muted-foreground'>
            Last updated: December 21, 2025
          </p>

          <section>
            <h2 className='text-xl font-semibold mt-8 mb-4'>1. Introduction</h2>
            <p>
              At Yoga Admin, we take your privacy seriously. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our platform. Please read this
              policy carefully to understand our practices regarding your personal data.
            </p>
          </section>

          <section>
            <h2 className='text-xl font-semibold mt-8 mb-4'>2. Information We Collect</h2>

            <h3 className='text-lg font-medium mt-6 mb-3'>2.1 Personal Information</h3>
            <p>We may collect the following personal information:</p>
            <ul className='list-disc pl-6 mt-2 space-y-1'>
              <li>Name and email address</li>
              <li>Phone number</li>
              <li>Profile picture</li>
              <li>Billing and payment information</li>
              <li>Account preferences and settings</li>
            </ul>

            <h3 className='text-lg font-medium mt-6 mb-3'>2.2 Usage Data</h3>
            <p>We automatically collect certain information when you use our platform:</p>
            <ul className='list-disc pl-6 mt-2 space-y-1'>
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Pages visited and time spent</li>
              <li>Actions taken within the platform</li>
              <li>Error logs and performance data</li>
            </ul>

            <h3 className='text-lg font-medium mt-6 mb-3'>2.3 Health and Wellness Data</h3>
            <p>If you use our wellness features, we may collect:</p>
            <ul className='list-disc pl-6 mt-2 space-y-1'>
              <li>Meditation and practice history</li>
              <li>Mood entries and journal data</li>
              <li>Sleep tracking information</li>
              <li>Goals and progress data</li>
            </ul>
          </section>

          <section>
            <h2 className='text-xl font-semibold mt-8 mb-4'>3. How We Use Your Information</h2>
            <p>We use the collected information for:</p>
            <ul className='list-disc pl-6 mt-2 space-y-1'>
              <li>Providing and maintaining our services</li>
              <li>Processing payments and subscriptions</li>
              <li>Personalizing your experience</li>
              <li>Sending important notifications and updates</li>
              <li>Improving our platform and developing new features</li>
              <li>Analyzing usage patterns and trends</li>
              <li>Preventing fraud and ensuring security</li>
              <li>Complying with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className='text-xl font-semibold mt-8 mb-4'>4. Information Sharing</h2>
            <p>We may share your information with:</p>
            <ul className='list-disc pl-6 mt-2 space-y-1'>
              <li><strong>Service Providers:</strong> Third parties who help us operate our platform</li>
              <li><strong>Payment Processors:</strong> To process your transactions securely</li>
              <li><strong>Analytics Partners:</strong> To help us understand platform usage</li>
              <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
            </ul>
            <p className='mt-4'>
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className='text-xl font-semibold mt-8 mb-4'>5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal
              information, including:
            </p>
            <ul className='list-disc pl-6 mt-2 space-y-1'>
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and assessments</li>
              <li>Access controls and authentication</li>
              <li>Employee training on data protection</li>
            </ul>
          </section>

          <section>
            <h2 className='text-xl font-semibold mt-8 mb-4'>6. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services and
              fulfill the purposes described in this policy. When you delete your account, we will delete
              or anonymize your data within 30 days, unless retention is required by law.
            </p>
          </section>

          <section>
            <h2 className='text-xl font-semibold mt-8 mb-4'>7. Your Rights</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <ul className='list-disc pl-6 mt-2 space-y-1'>
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Erasure:</strong> Request deletion of your data</li>
              <li><strong>Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Restriction:</strong> Limit how we process your data</li>
              <li><strong>Objection:</strong> Object to certain processing activities</li>
            </ul>
            <p className='mt-4'>
              To exercise these rights, please contact us at privacy@yogaadmin.com.
            </p>
          </section>

          <section>
            <h2 className='text-xl font-semibold mt-8 mb-4'>8. Cookies and Tracking</h2>
            <p>
              We use cookies and similar tracking technologies to enhance your experience. You can control
              cookie preferences through your browser settings. For more information, see our Cookie Policy.
            </p>
          </section>

          <section>
            <h2 className='text-xl font-semibold mt-8 mb-4'>9. Children&apos;s Privacy</h2>
            <p>
              Our platform is not intended for children under 16. We do not knowingly collect personal
              information from children. If you believe we have collected information from a child,
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className='text-xl font-semibold mt-8 mb-4'>10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own.
              We ensure appropriate safeguards are in place to protect your data during such transfers.
            </p>
          </section>

          <section>
            <h2 className='text-xl font-semibold mt-8 mb-4'>11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant
              changes via email or through the platform. Your continued use of the platform after changes
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className='text-xl font-semibold mt-8 mb-4'>12. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <p className='mt-2'>
              <strong>Email:</strong> privacy@yogaadmin.com<br />
              <strong>Data Protection Officer:</strong> dpo@yogaadmin.com<br />
              <strong>Address:</strong> Istanbul, Turkey
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className='mt-12 pt-8 border-t flex gap-4 text-sm text-muted-foreground'>
          <Link href='/terms' className='hover:text-primary'>Terms of Service</Link>
          <span>|</span>
          <Link href='/auth/sign-in' className='hover:text-primary'>Sign In</Link>
          <span>|</span>
          <Link href='/auth/sign-up' className='hover:text-primary'>Sign Up</Link>
        </div>
      </main>
    </div>
  );
}
