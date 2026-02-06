'use client';
import React from 'react';
import CategoryCard from '@/components/categoryCard/CategeroyCard';
import BreadCrum from '@/components/BreadCrum/BreadCrum';
import { Container } from '@mui/material';
import useCategory from '@/hook/useCategory';
import Loading from '@/components/categoryCard/Loading';
import { useTranslation } from 'react-i18next';

const Page = () => {
  const { t } = useTranslation();
  const { categories, isCategoriesLoading, error } = useCategory();

  let content;

  if (isCategoriesLoading) {
    content = (
      <div className="flex justify-center">
        <Loading count={10} />
      </div>
    );
  } else if (error) {
    content = <p className="text-center text-red-600">{error}</p>;
  } else if (categories.length > 0) {
    content = (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {categories.map((item) => (
          <div key={item._id} className="flex justify-center items-center">
            <CategoryCard item={item} />
          </div>
        ))}
      </div>
    );
  } else {
    content = <p className="text-center">No categories found.</p>;
  }

  return (
    <>
      <BreadCrum
        crumbs={[
          { label: t('nav.home', 'Home'), href: '/' },
          { label: t('nav.our_designs', 'Our Designs'), href: '/Category' },
        ]}
      />

      <Container className="px-0 my-5" sx={{ px: '0 !important' }}>
        <h1 className="text-center text-2xl my-10 font-bold text-[#311807]">
          {t('home.shop_by_category', 'Shop By Categories')}
        </h1>

        {content}


      </Container>
    </>
  );
};

export default Page;
