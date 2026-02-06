'use client';
import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useProductStore } from '@/Store/productStore';
import ArrivalCard from '@/components/Cards/Card';
import ArrivalCardSkeleton from '@/components/Cards/LoadingCard';

const RecentlyViewed = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { fetchProductsByIds } = useProductStore();

    useEffect(() => {
        const loadRecentlyViewed = async () => {
            try {
                // Get all IDs from local storage (or limit to say 20)
                const viewedIds = JSON.parse(localStorage.getItem('recentlyViewed') || '[]').slice(0, 20);

                if (viewedIds.length > 0) {
                    const data = await fetchProductsByIds(viewedIds);
                    setProducts(data);
                }
            } catch (e) {
                console.error("Error loading recently viewed history:", e);
            } finally {
                setLoading(false);
            }
        };

        loadRecentlyViewed();
    }, [fetchProductsByIds]);

    if (loading) {
        return <ArrivalCardSkeleton count={4} />;
    }

    if (products.length === 0) {
        return (
            <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    You haven't viewed any designs yet.
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 4, color: 'var(--secondary)' }}>
                Recently Viewed Designs
            </Typography>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((item) => (
                    <ArrivalCard item={item} key={item._id} showQuickView />
                ))}
            </div>
        </Box>
    );
};

export default RecentlyViewed;
