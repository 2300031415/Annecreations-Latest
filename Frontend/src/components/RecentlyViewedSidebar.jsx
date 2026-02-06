'use client';
import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useProductStore } from '@/Store/productStore';
import Link from 'next/link';
import { API_URL } from '@/Store/authStore';

const RecentlyViewedSidebar = () => {
    const [products, setProducts] = useState([]);
    const { fetchProductsByIds } = useProductStore();

    useEffect(() => {
        const loadRecentlyViewed = async () => {
            try {
                // Get IDs from local storage (max 5)
                const viewedIds = JSON.parse(localStorage.getItem('recentlyViewed') || '[]').slice(0, 5);
                if (viewedIds.length > 0) {
                    const data = await fetchProductsByIds(viewedIds);
                    setProducts(data);
                }
            } catch (e) {
                console.error("Error loading recently viewed sidebar:", e);
            }
        };

        loadRecentlyViewed();
    }, [fetchProductsByIds]);

    if (!products || products.length === 0) {
        return null;
    }

    return (
        <Box sx={{ mt: 4, mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'var(--secondary)', px: 1, fontSize: '1rem' }}>
                🕑 Recently Viewed
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {products.map((item) => (
                    <Link href={`/product/${item.productModel}`} key={item._id} className="no-underline group">
                        <Box sx={{
                            display: 'flex',
                            gap: 2,
                            p: 1,
                            borderRadius: 2,
                            transition: 'background-color 0.2s',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                        }}>
                            {/* Image */}
                            <Box sx={{
                                width: 50,
                                height: 50,
                                borderRadius: 1,
                                overflow: 'hidden',
                                flexShrink: 0,
                                border: '1px solid #eee'
                            }}>
                                <img
                                    src={`${API_URL}/${item.image}`}
                                    alt={item.productModel}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </Box>

                            {/* Details */}
                            <Box sx={{ minWidth: 0 }}>
                                <Typography
                                    variant="body2"
                                    fontWeight={600}
                                    noWrap
                                    sx={{ color: 'var(--secondary)', mb: 0.5 }}
                                >
                                    {item.productModel}
                                </Typography>
                                {item.options?.[0]?.price && (
                                    <Typography variant="caption" color="var(--primary)" fontWeight={700}>
                                        ₹{item.options[0].price}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Link>
                ))}
            </Box>
        </Box>
    );
};

export default RecentlyViewedSidebar;
