import React from 'react';
import BreadCrum from '@/components/BreadCrum/BreadCrum';
import { Container, Typography } from '@mui/material';

export const metadata = {
  title: 'Return & Cancellation Policy | Anne Creations HB',
  description:
    'Read Anne Creations HB’s Return and Cancellation Policy. All embroidery designs are digital downloads and non-refundable. Learn more about our support and product terms.',
  keywords: [
    'return policy',
    'cancellation policy',
    'refund policy',
    'digital downloads',
    'embroidery designs',
    'Anne Creations HB',
  ],
  openGraph: {
    title: 'Return & Cancellation Policy | Anne Creations HB',
    description:
      'Anne Creations HB’s return and cancellation policy for digital embroidery downloads — understand our no-refund policy and customer support terms.',
    url: 'https://yourdomain.com/return',
    siteName: 'Anne Creations HB',
    images: [
      {
        url: 'https://yourdomain.com/images/return-policy-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'Return and Cancellation Policy - Anne Creations HB',
      },
    ],
    locale: 'en_US',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Return & Cancellation Policy | Anne Creations HB',
    description:
      'Review Anne Creations HB’s Return & Cancellation Policy for digital embroidery downloads.',
    images: ['https://yourdomain.com/images/return-policy-banner.jpg'],
  },
};

const returnPolicyList = [
  {
    id: 1,
    title: 'Digital Products',
    data: 'All embroidery designs sold on our platform are digital downloads. Once purchased, they are considered delivered and cannot be returned, refunded, or exchanged.',
  },
  {
    id: 2,
    title: 'No Refunds/Exchanges',
    data: 'As our products are intangible and instantly accessible, we do not offer refunds, cancellations, or exchanges under any circumstances.',
  },
  {
    id: 3,
    title: 'Incorrect Purchase',
    data: 'We request customers to carefully review product descriptions, formats, and details before making a purchase to avoid errors.',
  },
  {
    id: 4,
    title: 'Customer Support',
    data: 'If you face any issues with downloading or accessing your purchased files, our support team will be happy to assist in resolving technical difficulties.',
  },
];

const Page = () => {
  return (
    <>
      <BreadCrum
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Return Policy', href: '/return' },
        ]}
      />
      <Container className="my-20">
        <h1 className="my-10 text-center text-3xl font-semibold text-[var(--secondary)]">
          Returns and Cancellations
        </h1>

        <Typography className="text-justify text-lg mb-6">
          At <strong>Anne Creations HB</strong>, we value our customers and strive to deliver the
          best digital embroidery designs. However, due to the nature of our products, please note
          the following:
        </Typography>

        {returnPolicyList.map((item) => (
          <div key={item.id} className="my-3">
            <h4 className="text-xl font-bold">{item.title}</h4>
            <Typography className="text-justify text-lg">{item.data}</Typography>
          </div>
        ))}
      </Container>
    </>
  );
};

export default Page;
