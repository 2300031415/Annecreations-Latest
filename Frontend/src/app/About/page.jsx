import React from 'react'
import BreadCrum from '@/components/BreadCrum/BreadCrum'
import { Container } from '@mui/material'

// ✅ SEO Metadata for Next.js App Router
export const metadata = {
  title: 'About Us | Anne Creations HB',
  description:
    'Learn more about Anne Creations HB — a creative hub specializing in computer embroidery designs that bring elegance and innovation to fashion.',
  keywords: [
    'Anne Creations HB',
    'Embroidery Designs',
    'Computer Embroidery',
    'Fashion Embroidery',
    'Embroidery Boutique',
    'Machine Embroidery',
  ],
  openGraph: {
    title: 'About Us | Anne Creations HB',
    description:
      'Anne Creations HB offers premium computer embroidery designs that inspire creativity and support fashion businesses.',
    url: 'https://www.annecreationshb.com/About', // ← replace with your actual URL
    siteName: 'Anne Creations HB',
    // images: [
    //   {
    //     url: 'https:/www.annecreationshb.com/images/about-banner.jpg', // ← replace with your OG image
    //     width: 1200,
    //     height: 630,
    //     alt: 'Anne Creations HB Embroidery Designs',
    //   },
    // ],
    locale: 'en_IN',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.annecreationshb.com/About', // ← replace with your canonical URL
  },
}

const AboutPage = () => {
  return (
    <>
      <BreadCrum
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'About', href: '/about' },
        ]}
      />

      <Container className="my-20">
        <h1 className="text-2xl my-10 font-bold text-center font-poppins">
          About Us
        </h1>

        <p className="text-justify text-lg my-3">
          <strong>Anne Creations HB</strong> specializes in{' '}
          <strong>computer embroidery designs</strong> that add creativity and
          elegance to fashion. Our online platform offers a wide range of
          high-quality, ready-to-use designs, making embroidery simple, stylish,
          and accessible for everyone—from professionals to boutiques.
        </p>

        <h3 className="text-2xl font-bold my-2">Our Mission</h3>
        <p className="text-justify text-lg my-2">
          To provide affordable, creative, and easy-to-use embroidery designs
          that enhance every creation.
        </p>

        <h3 className="text-2xl font-bold my-2">Our Vision</h3>
        <p className="text-justify text-lg my-2">
          To be a trusted name in embroidery design, inspiring creativity and
          supporting the growth of boutiques and fashion businesses across
          India.
        </p>
      </Container>
    </>
  )
}

export default AboutPage
