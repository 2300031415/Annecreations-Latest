'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Container, Typography, Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import { MdClose } from 'react-icons/md';
import Image from 'next/image';
import axioClient from '@/lib/axiosClient';
import { API_URL } from '@/Store/authStore';
import BreadCrum from '@/components/BreadCrum/BreadCrum';

const ComparePage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchComparisonData = async () => {
            const idsParam = searchParams.get('ids');
            if (!idsParam) {
                setError('No products selected for comparison.');
                setLoading(false);
                return;
            }

            const ids = idsParam.split(',');
            if (ids.length < 2) {
                setError('Select at least 2 products to compare.');
                setLoading(false);
                return;
            }

            try {
                const response = await axioClient.post('/api/products/compare', { ids });
                setProducts(response.data);
            } catch (err) {
                console.error('Error fetching comparison data:', err);
                setError('Failed to load comparison data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchComparisonData();
    }, [searchParams]);

    const handleRemove = (id) => {
        const updatedProducts = products.filter((p) => p._id !== id);
        if (updatedProducts.length < 2) {
            router.push('/WishList'); // Redirect back if less than 2 items
        } else {
            setProducts(updatedProducts);
            // Update URL without reloading
            const newIds = updatedProducts.map((p) => p._id).join(',');
            const newUrl = `/compare?ids=${newIds}`;
            window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
        }
    };

    if (loading) {
        return (
            <Container sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress color="warning" />
            </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ py: 10, textAlign: 'center' }}>
                <Typography variant="h6" color="error" gutterBottom>
                    {error}
                </Typography>
                <Button variant="contained" onClick={() => router.push('/WishList')} sx={{ mt: 2, bgcolor: 'var(--primary)', color: 'var(--secondary)' }}>
                    Back to Wishlist
                </Button>
            </Container>
        );
    }

    // Define fields to compare based on schema
    const comparisonFields = [
        { label: 'Image', key: 'image', type: 'image' },
        { label: 'Product Model', key: 'productModel' },
        { label: 'Price', key: 'price', type: 'price' },
        { label: 'Category', key: 'categories' },
        { label: 'SKU', key: 'sku' },
        { label: 'Stitches', key: 'stitches' },
        { label: 'Dimensions', key: 'dimensions' },
        { label: 'Colors / Needles', key: 'colourNeedles' },
        { label: 'Rating', key: 'averageRating', type: 'rating' },
        { label: 'Description', key: 'description', type: 'long-text' },
    ];

    return (
        <>
            <BreadCrum
                crumbs={[
                    { label: 'Home', href: '/' },
                    { label: 'Wishlist', href: '/WishList' },
                    { label: 'Compare', href: '#' },
                ]}
            />
            <Container sx={{ py: 5 }}>
                <Typography variant="h4" component="h1" align="center" gutterBottom sx={{ fontWeight: 'bold', color: 'var(--secondary)', mb: 4 }}>
                    Compare Products
                </Typography>

                <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'var(--secondary)' }}>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '20%' }}>Feature</TableCell>
                                {products.map((product) => (
                                    <TableCell key={product._id} align="center" sx={{ color: 'white', fontWeight: 'bold', minWidth: 200, position: 'relative' }}>
                                        {product.productModel}
                                        <IconButton
                                            size="small"
                                            onClick={() => handleRemove(product._id)}
                                            sx={{ position: 'absolute', top: 8, right: 8, color: 'white', bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' } }}
                                        >
                                            <MdClose fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {comparisonFields.map((field) => (
                                <TableRow key={field.key} hover>
                                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', color: 'var(--secondary)', bgcolor: '#f9f9f9' }}>
                                        {field.label}
                                    </TableCell>
                                    {products.map((product) => (
                                        <TableCell key={product._id} align="center">
                                            {field.type === 'image' ? (
                                                <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto' }}>
                                                    {product.image ? (
                                                        <Image
                                                            src={`${API_URL}/${product.image}`}
                                                            alt={product.productModel}
                                                            fill
                                                            style={{ objectFit: 'contain', borderRadius: '8px' }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded text-xs">No Image</div>
                                                    )}
                                                </div>
                                            ) : field.type === 'price' ? (
                                                <Typography fontWeight="bold" color="var(--primary)">
                                                    ₹{Number(product.price)?.toFixed(2)}
                                                </Typography>
                                            ) : field.type === 'rating' ? (
                                                <Typography>
                                                    {product.averageRating > 0 ? `★ ${product.averageRating}` : 'No ratings'}
                                                </Typography>
                                            ) : field.type === 'long-text' ? (
                                                <Typography variant="body2" sx={{ maxWidth: 300, margin: '0 auto', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {product[field.key] || '—'}
                                                </Typography>
                                            ) : (
                                                <Typography variant="body2">
                                                    {product[field.key] || '—'}
                                                </Typography>
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                            {/* Add to Cart / View Details Row */}
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f9f9f9' }}>Action</TableCell>
                                {products.map((product) => (
                                    <TableCell key={product._id} align="center">
                                        <Button
                                            variant="outlined"
                                            onClick={() => router.push(`/product/${product.productModel}`)}
                                            sx={{ borderColor: 'var(--primary)', color: 'var(--secondary)', '&:hover': { bgcolor: 'var(--primary)', color: 'white', borderColor: 'var(--primary)' } }}
                                        >
                                            View Details
                                        </Button>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
        </>
    );
};

export default ComparePage;
