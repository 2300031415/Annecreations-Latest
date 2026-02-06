import TermsAndConditions from './Terms_conitions';

export const metadata = {
  title: 'Terms & Conditions | Anne Creations HB',
  description:
    'Read the official Terms & Conditions for using and purchasing digital embroidery designs from Anne Creations HB. Understand your rights, usage, and refund policies.',
  keywords: [
    'terms and conditions',
    'embroidery designs policy',
    'digital products terms',
    'Anne Creations HB',
    'usage rights',
  ],
  openGraph: {
    title: 'Terms & Conditions | Anne Creations HB',
    description:
      'Understand the policies, usage rights, and terms for purchasing digital embroidery designs from Anne Creations HB.',
    url: 'https://yourdomain.com/terms-and-conditions',
    siteName: 'Anne Creations HB',
    images: [
      {
        url: 'https://yourdomain.com/images/terms-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'Terms & Conditions - Anne Creations HB',
      },
    ],
    locale: 'en_US',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms & Conditions | Anne Creations HB',
    description:
      'Review the official Terms & Conditions for digital embroidery design purchases from Anne Creations HB.',
    images: ['https://yourdomain.com/images/terms-banner.jpg'],
  },
};


export default function Page() {
  return <TermsAndConditions />;
}
