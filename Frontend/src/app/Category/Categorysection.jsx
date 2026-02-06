'use client';

import React, { useEffect, useState } from 'react';
import 'keen-slider/keen-slider.min.css';
import Link from 'next/link';

import { useKeenSlider } from 'keen-slider/react';

import CategoryCard from '@/components/categoryCard/CategeroyCard';
import CategoryCardSkeleton from '@/components/categoryCard/Loading';
import useCategory from '@/hook/useCategory';

const CategorySection = () => {
  const [mounted, setMounted] = useState(false);

  const { categories, isCategoriesLoading, error } = useCategory();

  useEffect(() => {
    setMounted(true);
  }, []);


  const [sliderRef, instanceRef] = useKeenSlider({
    loop: true,
    mode: 'snap',
    slides: {
      perView: 5,
      spacing: 16,
    },
    breakpoints: {
      '(max-width: 1280px)': { slides: { perView: 4, spacing: 14 } },
      '(max-width: 1024px)': { slides: { perView: 3, spacing: 12 } },
      '(max-width: 768px)': { slides: { perView: 2, spacing: 10 } },
      '(max-width: 480px)': { slides: { perView: 1, spacing: 8 } },
    },
    created(slider) {
      // Auto-play logic
      let timeout;
      let mouseOver = false;
      function clearNextTimeout() {
        clearTimeout(timeout);
      }
      function nextTimeout() {
        clearTimeout(timeout);
        if (mouseOver) return;
        timeout = setTimeout(() => {
          slider.next();
        }, 3000);
      }
      slider.container.addEventListener("mouseover", () => {
        mouseOver = true;
        clearNextTimeout();
      });
      slider.container.addEventListener("mouseout", () => {
        mouseOver = false;
        nextTimeout();
      });
      nextTimeout();
      slider.on("animationEnded", nextTimeout);
      slider.on("updated", nextTimeout);
      slider.on("destroyed", clearNextTimeout);
    },
  });

  return (
    <>
      <p className="text-center text-md md:mt-10 mb-2 font-bold">
        <span className="gradient-text"></span>
      </p>
      <h2 className="text-2xl font-bold md:mb-10 text-[var(--secondary)] text-center">
        Shop by Category
      </h2>

      <div className="relative mb-3 md:mb-10 px-4 sm:px-6 md:px-8">
        {mounted && !isCategoriesLoading && categories.length > 0 ? (
          <>
            <div ref={sliderRef} className="keen-slider">
              {categories.map((item) => (
                <div
                  key={item._id}
                  className="keen-slider__slide flex justify-center"
                >
                  <CategoryCard item={item} />
                </div>
              ))}
            </div>

            {/* Arrows */}
            <button
              onClick={() => instanceRef.current?.prev()}
              aria-label="Previous"
              className="absolute top-1/3 left-0 md:-left-6 -translate-y-1/2 z-10 text-[var(--secondary)] px-3.5 pb-1 text-2xl bg-[var(--primary)] rounded-full cursor-pointer"
            >
              ‹
            </button>
            <button
              onClick={() => instanceRef.current?.next()}
              aria-label="Next"
              className="absolute top-1/3 right-0 md:-right-4 -translate-y-1/2 z-10 text-[var(--secondary)] px-3.5 pb-1 text-2xl bg-[var(--primary)] rounded-full cursor-pointer"
            >
              ›
            </button>
          </>
        ) : (
          <div className="flex justify-center gap-6">
            <CategoryCardSkeleton shape="circle" count={5} />
          </div>
        )}
      </div>

      <div className="text-center md:mb-10">
        <Link
          href="/Category"
          className="inline-block text-lg font-semibold px-8 py-2 rounded-md border-2 border-[var(--primary)] text-[var(--secondary)] hover:bg-[var(--primary)] hover:text-white transition duration-200"
        >
          All Categories
        </Link>
      </div>
    </>
  );
};

export default CategorySection;
