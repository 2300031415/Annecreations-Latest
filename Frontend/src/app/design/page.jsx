import React, { Suspense } from 'react';
import DesignPage from './DesignPage';

// ✅ 1. Dynamic SEO metadata
export async function generateMetadata({ searchParams }) {
   const params = await searchParams; // 👈 await it first
  const category = params?.category || 'All Designs';
  const formattedName =
    category.charAt(0).toUpperCase() + category.slice(1);
 

  return {
    title: `${formattedName} | Design Catalog`,
    description: `Explore our ${formattedName} designs in the latest catalog.`,
    keywords: [formattedName, 'designs', 'catalog', 'fashion', 'style'],
    openGraph: {
      title: `${formattedName} | Design Catalog`,
      description: `Explore creative ${formattedName} designs.`,
      url: `https://annecreationshb.com/design?category=${encodeURIComponent(category)}`,
      siteName: 'Anne Creations',
      images: [
        {
          url: `https://annecreationshb.com/og-images/${category.toLowerCase()}.jpg`,
          width: 1200,
          height: 630,
          alt: `${formattedName} designs`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    alternates: {
      canonical: `https://annecreationshb.com/design?category=${encodeURIComponent(category)}`,
    },
  };
}

// ✅ 2. Page Component (with Suspense)
export default function Page() {
  return (
    <Suspense fallback={<div className="text-center my-10">Loading...</div>}>
      <DesignPage />
    </Suspense>
  );
}
