'use client';
import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, Button } from '@mui/material';
import { useProductStore } from '@/Store/productStore';
import ArrivalCard from '@/components/Cards/Card';
import ArrivalCardSkeleton from '@/components/Cards/LoadingCard';
import Link from 'next/link';

export default function HistoryPage() {
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

    return (
        <Container maxWidth="xl" sx={{ py: 8 }}>
            <Box sx={{ mb: 6, textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold" sx={{ color: 'var(--secondary)', mb: 2 }}>
                    Your Browsing History
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Designs you've recently viewed
                </Typography>
            </Box>

            {loading ? (
                <ArrivalCardSkeleton count={4} />
            ) : products.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        You haven't viewed any designs recently.
                    </Typography>
                    <Link href="/Category">
                        <Button variant="contained" sx={{ bgcolor: 'var(--primary)', color: 'white' }}>
                            Browse Designs
                        </Button>
                    </Link>
                </Box>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map((item) => (
                        <ArrivalCard item={item} key={item._id} showQuickView />
                    ))}
                </div>
            )}
        </Container>
    );
}
