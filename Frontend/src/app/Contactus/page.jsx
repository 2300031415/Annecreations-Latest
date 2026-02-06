import ContactUsPage from './contactPage';

export const metadata = {
  title: 'Contact Us | Annecreatons',
  description:
    'Get in touch with Annecreatons. We’re here to help with product inquiries, orders, or customer support.',
  keywords: [
    'contact us',
    'customer support',
    'help center',
    'ecommerce support',
    'Annecreatons contact',
  ],
  openGraph: {
    title: 'Contact Us | Annecreatons',
    description:
      'Have questions? Reach out to our friendly support team at Annecreatons for assistance.',
    url: 'https://yourdomain.com/contact',
    siteName: 'Annecreatons',
    images: [
      {
        url: 'https://yourdomain.com/images/contact-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'Contact Us - Annecreatons',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Us | Annecreatons',
    description:
      'Get in touch with our team for any support or product-related queries.',
    images: ['https://yourdomain.com/images/contact-banner.jpg'],
  },
};

// ✅ Add Structured Data for SEO (JSON-LD)

export default function Page() {
  return <ContactUsPage />;
}
