// app/Register/page.tsx
import React from 'react';
import { Container } from '@mui/material';
import BreadCrum from '@/components/BreadCrum/BreadCrum';
import RegisterForm from './RegisterForm';

// ✅ Add SEO Metadata
export const metadata = {
  title: 'Create Account | Anne Creations HB',
  description:
    'Register your Anne Creations HB account to access beautiful embroidery designs, manage your profile, and download creative patterns easily.',
  keywords: [
    'Anne Creations HB',
    'register',
    'sign up',
    'create account',
    'embroidery designs',
    'digital embroidery patterns',
  ],
  openGraph: {
    title: 'Create Account | Anne Creations HB',
    description:
      'Join Anne Creations HB to explore creative embroidery designs and start your digital design journey today.',
    url: 'https://www.annecreationshb.com/Register',
    siteName: 'Anne Creations HB',
    images: [
      {
        url: 'https://www.annecreationshb.com/images/logo.png',
        width: 800,
        height: 600,
        alt: 'Anne Creations HB Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Create Account | Anne Creations HB',
    description:
      'Sign up with Anne Creations HB to access and download unique embroidery designs.',
    images: ['https://www.annecreationshb.com/images/logo.png'],
  },
  alternates: {
    canonical: 'https://www.annecreationshb.com/Register',
  },
};

const RegisterPage = () => {
  return (
    <>
      <BreadCrum
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Register', href: '/Register' },
        ]}
      />
      <Container maxWidth="md" sx={{ my: 10 }}>
        <RegisterForm />
      </Container>
    </>
  );
};

export default RegisterPage;
