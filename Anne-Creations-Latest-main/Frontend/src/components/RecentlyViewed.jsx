'use client';
import React, { useEffect, useState } from 'react';
import { Container } from '@mui/material';
import ArrivalCard from '@/components/Cards/Card';
import { useProductStore } from '@/Store/productStore';

const RecentlyViewed = () => {
    const [products, setProducts] = useState([]);
    const { fetchProductsByIds } = useProductStore();

    useEffect(() => {
        const loadRecentlyViewed = async () => {
            try {
                const viewedIds = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
                if (viewedIds.length > 0) {
                    const data = await fetchProductsByIds(viewedIds);
                    setProducts(data);
                }
            } catch (e) {
                console.error("Error loading recently viewed:", e);
            }
        };

        loadRecentlyViewed();
    }, [fetchProductsByIds]);

    if (products.length === 0) {
        return null; // Don't show anything if empty
    }

    return (
        <Container className="my-10 py-8">
            <h3 className="text-center pb-2 text-2xl font-semibold text-[var(--secondary)] my-0 mb-10">
                Recently Viewed
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 md:gap-y-8 place-items-center">
                {products.map((item) => (
                    <ArrivalCard item={item} key={item._id} />
                ))}
            </div>
        </Container>
    );
};

export default RecentlyViewed;
