'use client';
import React from 'react';
import {
    Box,
    Typography,
    FormGroup,
    FormControlLabel,
    Checkbox
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import RecentlyViewedSidebar from '../RecentlyViewedSidebar';

const FilterContent = ({
    mobile = false,
    categories = [],
    selectedCategories = [],
    handleCategoryChange,
    priceRanges = [],
    selectedPriceRanges = [],
    handlePriceChange
}) => {
    const { t } = useTranslation();

    return (
        <Box sx={{
            p: mobile ? 3 : 0,
            border: mobile ? 'none' : 'none',
        }}>
            {mobile && (
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                    {t('filters.title', 'Filters')}
                </Typography>
            )}

            {/* Price Filter Block */}
            <Box sx={{
                mb: 3,
                p: 2,
                border: '1px solid #e0e0e0',
                borderRadius: 3,
                bgcolor: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
                <Typography fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'var(--secondary)' }}>
                    {t('filters.price_range', 'Price')}
                </Typography>
                <FormGroup>
                    {priceRanges.map((range) => (
                        <FormControlLabel
                            key={range.value}
                            control={
                                <Checkbox
                                    checked={selectedPriceRanges.includes(range.value)}
                                    onChange={() => handlePriceChange(range.value)}
                                    size="small"
                                    sx={{ color: 'var(--secondary)', '&.Mui-checked': { color: 'var(--primary)' } }}
                                />
                            }
                            label={<Typography variant="body2" fontWeight={500}>{range.label}</Typography>}
                        />
                    ))}
                </FormGroup>
            </Box>

            {/* Categories Filter Block - Scrollable */}
            <Box sx={{
                p: 2,
                border: '1px solid #e0e0e0',
                borderRadius: 3,
                bgcolor: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
                <Typography fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'var(--secondary)' }}>
                    {t('filters.categories', 'Categories')}
                </Typography>
                <Box sx={{
                    height: 300,
                    minHeight: 150,
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    resize: 'vertical',
                    pr: 1,
                    pb: 1, // Padding for resize handle
                    '&::-webkit-scrollbar': { width: '4px' },
                    '&::-webkit-scrollbar-thumb': { bgcolor: '#ddd', borderRadius: '4px' }
                }}>
                    <FormGroup>
                        {categories?.filter(cat => cat.name !== 'All').map((cat) => (
                            <FormControlLabel
                                key={cat._id}
                                control={
                                    <Checkbox
                                        checked={selectedCategories.includes(cat._id)}
                                        onChange={() => handleCategoryChange(cat._id)}
                                        size="small"
                                        sx={{ color: 'var(--secondary)', '&.Mui-checked': { color: 'var(--primary)' } }}
                                    />
                                }
                                label={<Typography variant="body2" fontWeight={500}>{cat.name}</Typography>}
                            />
                        ))}
                    </FormGroup>
                </Box>
            </Box>

            {/* Recently Viewed in Sidebar - Moved Outside and Below Categories */}
            <RecentlyViewedSidebar />

        </Box>
    );
};

export default FilterContent;
