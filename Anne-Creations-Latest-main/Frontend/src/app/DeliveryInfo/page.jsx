import BreadCrum from '@/components/BreadCrum/BreadCrum';
import React from 'react';
import { Container } from '@mui/material';

// ✅ SEO Metadata
export const metadata = {
  title: 'Delivery Information | Anne Creations HB',
  description:
    'Learn how to download your purchased digital embroidery designs instantly. All products from Anne Creations HB are available for immediate access after purchase.',
  keywords: [
    'digital embroidery download',
    'embroidery file delivery',
    'instant download embroidery',
    'Anne Creations HB delivery information',
    'digital design access',
    'embroidery patterns online',
  ],
  openGraph: {
    title: 'Delivery Information | Anne Creations HB',
    description:
      'Instantly download your purchased embroidery designs anytime from your Anne Creations HB account. Learn more about our digital delivery process.',
    url: 'https://yourdomain.com/delivery_info',
    siteName: 'Anne Creations HB',
    images: [
      {
        url: 'https://yourdomain.com/images/delivery-info-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'Digital Embroidery Delivery - Anne Creations HB',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Delivery Information | Anne Creations HB',
    description:
      'Find out how to access and download your embroidery design files instantly from Anne Creations HB.',
    images: ['https://yourdomain.com/images/delivery-info-banner.jpg'],
  },
};

const deliveryInfoList = [
  {
    id: 1,
    data: 'All digital items once purchased are available for download at any time with no cost.',
  },
  {
    id: 2,
    data: 'Products can be downloaded to your personal computer or mobile device (click on the download icon on each item in the order details page).',
  },
  {
    id: 3,
    data: 'Digital products bought through the store can be viewed and downloaded from the My Orders section of your Anne Creations HB account.',
  },
];

const Page = () => {
  return (
    <>
      <BreadCrum
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Delivery Information', href: '/delivery_info' },
        ]}
      />

      <Container className="my-20">
        <h1 className="text-center my-10 text-3xl font-semibold text-[var(--secondary)]">
          Delivery Information
        </h1>

        {deliveryInfoList.map((item) => (
          <p className="text-justify my-5 text-lg" key={item.id}>
            {item.data}
          </p>
        ))}
      </Container>
    </>
  );
};

export default Page;
