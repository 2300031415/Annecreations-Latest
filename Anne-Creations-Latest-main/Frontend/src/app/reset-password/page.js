import ResetPasswordPage from './FrogotPasswordPage';

export const metadata = {
  title: 'Reset Your Password | Annecreations',
  description:
    'Forgot your password? Easily reset your Annecreations account credentials securely and regain access.',
  keywords: [
    'reset password',
    'forgot password',
    'account recovery',
    'Annecreations login',
  ],
  openGraph: {
    title: 'Reset Your Password | Annecreations',
    description:
      'Use this page to securely reset your Annecreations account password.',
    url: 'https://yourdomain.com/reset-password',
    siteName: 'Annecreations',
    images: [
      {
        url: 'https://yourdomain.com/images/reset-password-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'Reset Password - Annecreations',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reset Your Password | Annecreations',
    description:
      'Quickly reset your password to regain access to your Annecreations account.',
    images: ['https://yourdomain.com/images/reset-password-banner.jpg'],
  },
};

// ✅ Add JSON-LD structured data for SEO

export default function Page() {
  return <ResetPasswordPage />;
}
