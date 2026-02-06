'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const SortMenu = ({ activeType, onTypeChange }) => {
    const { t } = useTranslation();
    const options = [
        { label: t('tabs.all'), value: 'all' },
        { label: t('tabs.todays_deals'), value: 'todays-deals' },
        { label: t('tabs.new_releases'), value: 'new' },
        { label: t('tabs.best_selling'), value: 'best-selling' },
        { label: t('tabs.most_bought'), value: 'most-bought' },
    ];

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: { xs: 2, md: 4 },
                my: 3,
                borderBottom: '1px solid #eee',
                pb: 1
            }}
        >
            {options.map((option) => (
                <Typography
                    key={option.value}
                    onClick={() => onTypeChange(option.value)}
                    sx={{
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: { xs: '0.9rem', md: '1.1rem' },
                        color: activeType === option.value ? 'var(--primary)' : 'var(--secondary)',
                        position: 'relative',
                        pb: 1,
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: '100%',
                            height: '3px',
                            bgcolor: 'var(--primary)',
                            transform: activeType === option.value ? 'scaleX(1)' : 'scaleX(0)',
                            transition: 'transform 0.3s ease',
                        },
                        '&:hover': {
                            color: 'var(--primary)',
                        }
                    }}
                >
                    {option.label}
                </Typography>
            ))}
        </Box>
    );
};

export default SortMenu;
