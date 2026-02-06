import HelpPage from './HelpPage'
export const metadata = {
  title: 'Help & Tutorials | Anne Creations HB',
  description:
    'Find help and video tutorials in multiple languages at Anne Creations HB. Learn how to download, use, and manage your embroidery designs easily.',
  keywords: [
    'help center',
    'embroidery tutorials',
    'Anne Creations HB',
    'how to download embroidery designs',
    'embroidery help videos',
    'machine embroidery guide',
  ],
  openGraph: {
    title: 'Help & Tutorials | Anne Creations HB',
    description:
      'Explore multilingual video tutorials and FAQs to guide you through using Anne Creations HB embroidery designs.',
    url: 'https://yourdomain.com/help',
    siteName: 'Anne Creations HB',
    images: [
      {
        url: 'https://yourdomain.com/images/help-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'Help & Tutorials - Anne Creations HB',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Help & Tutorials | Anne Creations HB',
    description:
      'Need help using your embroidery designs? Watch video tutorials and read FAQs at Anne Creations HB.',
    images: ['https://yourdomain.com/images/help-banner.jpg'],
  },
};
export default function Page() {
  return <HelpPage/>;
}
