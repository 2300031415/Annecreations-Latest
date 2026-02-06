'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

import Banner_img1 from '../../../public/assets/Banner_images/website-banner-1.jpg';
import axioClient from "@/lib/axiosClient"
import Banner_img2 from '../../../public/assets/Banner_images/web-banner-2.jpg';

const Carousel = dynamic(
  () => import('react-responsive-carousel').then((mod) => mod.Carousel),
  { ssr: false }
);
import { useTranslation } from 'react-i18next';

const Banner = () => {
  const { t } = useTranslation();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchBanners = async () => {
      try {
        const res = await axioClient.get(`/api/banners`);
        if (isMounted) {
          setBanners(res.data || []);
        }
      } catch (err) {
        console.error('❌ Error fetching banners:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBanners();

    return () => {
      isMounted = false; // cleanup function
    };
  }, []);

  // ✅ fallback banner if API empty or failed
  const list =
    banners.length > 0
      ? banners
      : [{ id: 1, image: Banner_img1, alt: 'Banner image 1' },
      { id: 2, image: Banner_img2, alt: 'Banner image 2' }];

  // ✅ Optional: show loader while fetching
  if (loading) {
    return (
      <div className="w-full flex items-center justify-center h-[400px] bg-[var(--card-bg)]">
        <p className="text-[var(--muted-text)] text-lg">{t('common.loading_banners', 'Loading banners...')}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Carousel
        showThumbs={false}
        showStatus={false}
        infiniteLoop
        autoPlay
        interval={2000}
        transitionTime={600}
        swipeable
        emulateTouch
        stopOnHover
        showIndicators={true}
      >
        {list.map((item) => (
          <div key={item.id} className="relative w-full">
            <Image
              src={item.image?.url || item.image || Banner_img1}
              alt={item.alt || 'Banner'}
              width={1920}
              height={600}
              className="object-cover w-full h-auto"
              priority
            />
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default Banner;
