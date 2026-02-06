import ProfilePage from './ProfilePage';

export const metadata = {
  title: 'My Account | Annecreatons',
  description:
    'Access and manage your profile, orders, and personal information securely in Annecreatons.',
  keywords: [
    'my account',
    'profile',
    'user dashboard',
    'order history',
    'account settings',
    'Annecreatons profile',
  ],
  openGraph: {
    title: 'My Account | Annecreatons',
    description:
      'Manage your orders, profile details, and saved addresses in Annecreatons.',
    url: 'https://yourdomain.com/profile',
    siteName: 'Annecreatons',
    images: [
      {
        url: 'https://yourdomain.com/images/profile-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'My Account - Annecreatons',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Account | Annecreatons',
    description:
      'Securely manage your account, profile, and orders on Annecreatons.',
    images: ['https://yourdomain.com/images/profile-banner.jpg'],
  },
};

// ✅ Add JSON-LD Structured Data for SEO

export default function Page() {
  return <ProfilePage />;
}
