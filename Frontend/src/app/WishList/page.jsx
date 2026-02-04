import Wishlist from './wishlistPage';

export const metadata = {
  title: 'Your Wishlist | Annecreatons',
  description:
    'View all your saved favorite products in one place. Manage your wishlist and shop your top picks easily at Annecreatons.',
  keywords: [
    'wishlist',
    'favorite products',
    'saved items',
    'shopping list',
    'Annecreatons',
  ],
  openGraph: {
    title: 'Your Wishlist | Annecreatons',
    description:
      'Access your saved wishlist items and purchase your favorite products easily on Annecreatons.',
    url: 'https://yourdomain.com/wishlist',
    siteName: 'Annecreatons',
    images: [
      {
        url: 'https://yourdomain.com/images/wishlist-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'Wishlist Page - Annecreatons',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your Wishlist | Annecreatons',
    description:
      'Browse and manage your saved wishlist items at Annecreatons — shop your favorites anytime.',
    images: ['https://yourdomain.com/images/wishlist-banner.jpg'],
  },
};


export default function Page() {
  return <Wishlist />;
}
