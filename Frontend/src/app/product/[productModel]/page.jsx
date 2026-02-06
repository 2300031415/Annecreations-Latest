import { notFound } from 'next/navigation';
import BreadCrum from '@/components/BreadCrum/BreadCrum';
import PageClient from './pageClient';

// 🔹 Helper: Fetch public (non-auth) product data
async function fetchProductById(productModel) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${productModel}`, {
      cache: 'force-cache',
      next: { revalidate: 3600 }, // Revalidate every hour for SEO
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ProductPage({ params }) {
  const { productModel } = await params; // ✅ Await params

  const productDetail = await fetchProductById(productModel);
  if (!productDetail) notFound();

  return (
    <>
      <BreadCrum
        crumbs={[
          { label: 'Home', href: '/' },
          { label: productDetail.productModel },
        ]}
      />
      <PageClient productDetail={productDetail} /> {/* ✅ Pass data down */}
    </>
  );
}

// ✅ SEO Metadata
export async function generateMetadata({ params }) {
  const { productModel } = await params; // ✅ Await params
  const productDetail = await fetchProductById(productModel);

  if (!productDetail) {
    return {
      title: 'Product Not Found | Anne Creation',
      description: 'The requested product could not be found.',
    };
  }

  const seo = productDetail.seo || {};
  const title = `${seo.metaTitle} | Annecreations` || productDetail.productModel;
  const description = seo.metaDescription || '';
  const keywords = seo.metaKeyword || '';

  const imageUrl = productDetail.image?.startsWith('http')
    ? productDetail.image
    : `${process.env.NEXT_PUBLIC_API_URL}/${productDetail.image}`;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/product/${productDetail.productModel}`,
      images: [{ url: imageUrl, alt: productDetail.productModel }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}
