'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Rating,
    Button,
    TextField,
    Avatar,
    Divider,
    Paper,
    LinearProgress,
    IconButton,
    Collapse,
    Alert,
    CircularProgress,
} from '@mui/material';
import { MdSend, MdRateReview, MdClose } from 'react-icons/md';
import { useProductStore } from '@/Store/productStore';
import { useAuthStore } from '@/Store/authStore';
import LoginModal from '@/components/Cards/ActionModal';

const ReviewSection = ({ productId }) => {
    const { reviews, reviewStats, isReviewsLoading, fetchReviewsByProductId, submitReview } = useProductStore();
    const { isAuthenticated } = useAuthStore();

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (productId) {
            fetchReviewsByProductId(productId);
        }
    }, [productId, fetchReviewsByProductId]);

    // Auto-open form after login if user was trying to write a review
    useEffect(() => {
        if (isAuthenticated && loginModalOpen) {
            setLoginModalOpen(false);
            setShowForm(true);
        }
    }, [isAuthenticated, loginModalOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            setLoginModalOpen(true);
            return;
        }

        if (!comment.trim()) {
            setMessage({ type: 'error', text: 'Please enter a comment' });
            return;
        }

        setIsSubmitting(true);
        const result = await submitReview({ productId, rating, comment });
        setIsSubmitting(false);

        if (result.success) {
            setMessage({ type: 'success', text: 'Review submitted successfully!' });
            setComment('');
            setRating(5);
            setShowForm(false);
        } else {
            setMessage({ type: 'error', text: result.message });
        }
    };

    // Calculate rating breakdown
    const breakdown = [5, 4, 3, 2, 1].map(star => {
        const count = reviews.filter(r => Math.round(r.rating) === star).length;
        const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
        return { star, count, percentage };
    });

    return (
        <Box sx={{ mt: 8, mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 6 }}>
                <MdRateReview color="var(--secondary)" /> Customer Reviews
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 6, mb: 6 }}>
                {/* Summary Section */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        flex: 1,
                        bgcolor: 'rgba(var(--primary-rgb), 0.03)',
                        borderRadius: 4,
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center'
                    }}
                >
                    <Typography variant="h2" fontWeight="bold" color="var(--primary)" sx={{ mb: 1 }}>
                        {reviewStats.averageRating || 0}
                    </Typography>
                    <Rating
                        value={reviewStats.averageRating || 0}
                        readOnly
                        precision={0.5}
                        size="large"
                        sx={{
                            '& .MuiRating-iconFilled': { color: 'var(--secondary)' },
                            '& .MuiRating-iconEmpty': { color: 'transparent', stroke: 'var(--secondary)', strokeWidth: '1px' },
                        }}
                    />
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 2, fontWeight: 500 }}>
                        Based on {reviewStats.totalReviews || 0} reviews
                    </Typography>
                </Paper>

                {/* Breakdown Section */}
                <Box sx={{ flex: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {breakdown.map((item) => (
                        <Box key={item.star} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                            <Typography variant="body2" fontWeight={600} sx={{ minWidth: 60 }}>{item.star} Stars</Typography>
                            <Box sx={{ flex: 1 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={item.percentage}
                                    sx={{
                                        height: 10,
                                        borderRadius: 5,
                                        bgcolor: 'rgba(0,0,0,0.05)',
                                        '& .MuiLinearProgress-bar': { bgcolor: 'var(--secondary)' }
                                    }}
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40, textAlign: 'right' }}>
                                {item.count}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Action Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
                {!showForm && (
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<MdRateReview />}
                        onClick={() => {
                            if (isAuthenticated) {
                                setShowForm(true);
                            } else {
                                setLoginModalOpen(true);
                            }
                        }}
                        sx={{
                            px: 4,
                            py: 1.5,
                            bgcolor: 'var(--primary)',
                            color: 'white',
                            fontWeight: 'bold',
                            borderRadius: '30px',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                            '&:hover': { bgcolor: 'var(--secondary)', color: 'var(--primary)', transform: 'translateY(-2px)' },
                            transition: 'all 0.3s ease'
                        }}
                    >
                        Write a Review
                    </Button>
                )}
            </Box>

            <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />

            {/* Review Form */}
            <Collapse in={showForm}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        mb: 6,
                        bgcolor: 'white',
                        borderRadius: 4,
                        border: '2px solid var(--secondary)',
                        boxShadow: '0 15px 35px rgba(0,0,0,0.05)',
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" fontWeight="bold">Share your experience</Typography>
                        <IconButton onClick={() => setShowForm(false)} size="small" sx={{ bgcolor: 'rgba(0,0,0,0.05)' }}>
                            <MdClose />
                        </IconButton>
                    </Box>

                    <form onSubmit={handleSubmit}>
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Your Rating</Typography>
                            <Rating
                                value={rating}
                                onChange={(event, newValue) => setRating(newValue)}
                                size="large"
                                sx={{
                                    color: 'var(--secondary)',
                                    '& .MuiRating-iconEmpty': { color: 'transparent', stroke: 'var(--secondary)', strokeWidth: '1px' },
                                }}
                            />
                        </Box>
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Your Comment</Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                placeholder="What did you like or dislike? How was the quality of the design?"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                variant="outlined"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 3,
                                        '& fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
                                        '&:hover fieldset': { borderColor: 'var(--secondary)' },
                                        '&.Mui-focused fieldset': { borderColor: 'var(--secondary)' },
                                    }
                                }}
                            />
                        </Box>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isSubmitting}
                            endIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <MdSend />}
                            sx={{
                                px: 6,
                                py: 1.5,
                                bgcolor: 'var(--primary)',
                                color: 'white',
                                fontWeight: 'bold',
                                borderRadius: '30px',
                                '&:hover': { bgcolor: 'var(--secondary)', color: 'var(--primary)' }
                            }}
                        >
                            {isSubmitting ? 'Submitting...' : 'Post Review'}
                        </Button>
                    </form>
                </Paper>
            </Collapse>

            {message.text && (
                <Alert
                    severity={message.type}
                    onClose={() => setMessage({ type: '', text: '' })}
                    sx={{ mb: 4, borderRadius: 2 }}
                >
                    {message.text}
                </Alert>
            )}

            {/* Reviews List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {isReviewsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress color="inherit" />
                    </Box>
                ) : reviews.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 4 }}>
                        <Typography color="text.secondary" variant="h6">No reviews yet.</Typography>
                        <Typography color="text.secondary">Be the first to share your thoughts!</Typography>
                    </Box>
                ) : (
                    reviews.map((review) => (
                        <Paper
                            key={review._id}
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                bgcolor: 'transparent',
                                borderBottom: '1px solid rgba(0,0,0,0.05)',
                                '&:last-child': { borderBottom: 'none' }
                            }}
                        >
                            <Box sx={{ display: 'flex', gap: 3 }}>
                                <Avatar sx={{
                                    bgcolor: 'var(--primary)',
                                    color: 'white',
                                    width: 50,
                                    height: 50,
                                    fontWeight: 'bold',
                                    fontSize: '1.2rem'
                                }}>
                                    {review.user?.firstName?.charAt(0) || 'U'}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {review.user?.firstName} {review.user?.lastName}
                                            </Typography>
                                            <Rating
                                                value={review.rating}
                                                readOnly
                                                size="small"
                                                sx={{
                                                    color: 'var(--secondary)',
                                                    '& .MuiRating-iconEmpty': { color: 'transparent', stroke: 'var(--secondary)', strokeWidth: '1px' },
                                                }}
                                            />
                                        </Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.6 }}>
                                        {review.comment}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    ))
                )}
            </Box>
        </Box>
    );
};

export default ReviewSection;
