import CheckoutPage from "./Checoukoutpage"
export const metadata = {
  title: 'Secure Checkout | Anne Creations HB',
  description:
    'Complete your embroidery design purchase securely with Anne Creations HB. Safe checkout process powered by Razorpay. Instant access to digital downloads after payment.',
  keywords: [
    'embroidery checkout',
    'secure payment embroidery designs',
    'digital download purchase',
    'Anne Creations HB checkout',
    'Razorpay checkout',
    'machine embroidery files',
  ],
  openGraph: {
    title: 'Secure Checkout | Anne Creations HB',
    description:
      'Finish your purchase securely with Anne Creations HB. Pay safely using Razorpay and get instant access to your embroidery design downloads.',
    url: 'https://yourdomain.com/checkout',
    siteName: 'Anne Creations HB',
    images: [
      {
        url: 'https://yourdomain.com/images/checkout-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'Secure Checkout - Anne Creations HB',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Secure Checkout | Anne Creations HB',
    description:
      'Complete your embroidery purchase securely with Anne Creations HB. Safe payments, instant digital downloads.',
    images: ['https://yourdomain.com/images/checkout-banner.jpg'],
  },
};
export default function Page() {
  return <CheckoutPage/>;
}
