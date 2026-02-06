import React from 'react';
import BreadCrum from '@/components/BreadCrum/BreadCrum';
import { Container } from '@mui/material';

export const metadata = {
  title: 'Privacy Policy | Anne Creations HB',
  description:
    'Read Anne Creations HB’s Privacy Policy to understand how we collect, use, and protect your personal information while using our embroidery design services.',
  keywords: [
    'privacy policy',
    'data protection',
    'personal information',
    'Anne Creations HB',
    'embroidery designs',
  ],
  authors: [{ name: 'Anne Creations HB' }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Privacy Policy | Anne Creations HB',
    description:
      'Learn how Anne Creations HB collects, uses, and safeguards your data to ensure your privacy and security.',
    url: 'https://www.annecreationshb.com/privacypolicy',
    siteName: 'Anne Creations HB',
    images: [
      {
        url: 'https://www.annecreationshb.com/images/privacy-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'Anne Creations HB Privacy Policy',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.annecreationshb.com/privacypolicy',
  },
};

const PrivacyPolicyPage = () => {
  return (
    <>
      <BreadCrum
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Privacy & Policy', href: '/privacypolicy' },
        ]}
      />

      <Container className="my-20">
        <h1 className="text-3xl font-semibold text-center my-12 text-[var(--secondary)]">
          Privacy & Policy
        </h1>

        {/* 1. Information We Collect */}
        <h2 className="text-2xl font-semibold my-4">1. Information We Collect</h2>
        <p className="my-2">When you use our website, we may collect:</p>
        <ul className="list-disc list-inside ml-4 my-2">
          <li><strong>Personal Information:</strong> such as your name, email address, billing details, and payment information.</li>
          <li><strong>Non-Personal Information:</strong> such as browser type, device information, and website usage data for improving our services.</li>
        </ul>

        {/* 2. How We Use Your Information */}
        <h2 className="text-2xl font-semibold my-4">2. How We Use Your Information</h2>
        <ul className="list-disc list-inside ml-4 my-2">
          <li>Process and deliver your embroidery design purchases.</li>
          <li>Send order confirmations, download links, and updates.</li>
          <li>Provide customer support and respond to inquiries.</li>
          <li>Improve our website, services, and user experience.</li>
        </ul>

        {/* 3. Data Security */}
        <h2 className="text-2xl font-semibold my-4">3. Data Security</h2>
        <ul className="list-disc list-inside ml-4 my-2">
          <li>We use industry-standard security measures to protect your personal and payment information.</li>
          <li>Sensitive payment details are processed securely through trusted third-party payment gateways.</li>
          <li>We do not store or have access to your full credit/debit card information.</li>
        </ul>

        {/* 4. Sharing of Information */}
        <h2 className="text-2xl font-semibold my-4">4. Sharing of Information</h2>
        <ul className="list-disc list-inside ml-4 my-2">
          <li>We do not sell, trade, or rent your personal information to third parties.</li>
          <li>Information may be shared with trusted service providers (such as payment processors) solely for order fulfillment and website operation.</li>
          <li>We may disclose information if required by law or to protect our rights and prevent fraud.</li>
        </ul>

        {/* 5. Cookies */}
        <h2 className="text-2xl font-semibold my-4">5. Cookies</h2>
        <p className="my-2">
          Our website may use cookies to enhance your browsing experience, analyze site traffic, and improve functionality. You can manage or disable cookies through your browser settings.
        </p>

        {/* 6. Third-Party Links */}
        <h2 className="text-2xl font-semibold my-4">6. Third-Party Links</h2>
        <p className="my-2">
          Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of those websites.
        </p>

        {/* 7. Changes to This Policy */}
        <h2 className="text-2xl font-semibold my-4">7. Changes to This Policy</h2>
        <p className="my-2">
          We may update this Privacy Policy from time to time. Updates will be posted on this page, and continued use of our website implies acceptance of the changes.
        </p>

        {/* 8. Contact Us */}
        <h2 className="text-2xl font-semibold my-4">8. Contact Us</h2>
        <p className="my-2">
          If you have any questions about this Privacy Policy or how your information is handled, please contact us: <br />
          <a
            href="mailto:support@annecreationshb.com"
            className="flex items-center my-3 text-blue-600 hover:underline"
          >
            📧 support@annecreationshb.com
          </a>
        </p>
      </Container>
    </>
  );
};

export default PrivacyPolicyPage;
