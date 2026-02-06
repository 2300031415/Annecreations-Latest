'use client';
import React from 'react';
import { Box, Typography } from '@mui/material';
import { MdBrush, MdHistory } from 'react-icons/md';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const CustomDesignOptions = () => {
    const { t } = useTranslation();

    return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, color: 'var(--secondary)' }}>
                {t('custom_design.title', 'Custom Design Services')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 6, color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
                {t('custom_design.subtitle', 'Bring your creative ideas to life. Request a new custom design or track the status of your existing requests.')}
            </Typography>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* New Request Option */}
                <Link href="/my-style-requests" className="group">
                    <Box sx={{
                        p: 4,
                        height: '100%',
                        bgcolor: 'white',
                        borderRadius: 4,
                        border: '1px solid #eee',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                            borderColor: 'var(--primary)',
                        }
                    }}>
                        <Box sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            bgcolor: 'rgba(233, 177, 96, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 3,
                            color: 'var(--primary)',
                            transition: 'all 0.3s ease',
                            '.group-hover &': {
                                bgcolor: 'var(--primary)',
                                color: 'white'
                            }
                        }}>
                            <MdBrush size={40} />
                        </Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
                            {t('custom_design.new_request', 'New Design Request')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t('custom_design.new_request_desc', 'Submit a new idea, upload reference images, and get a quote for your custom embroidery design.')}
                        </Typography>
                    </Box>
                </Link>

                {/* View Requests Option */}
                <Link href="/Profile?tab=requests" className="group">
                    <Box sx={{
                        p: 4,
                        height: '100%',
                        bgcolor: 'white',
                        borderRadius: 4,
                        border: '1px solid #eee',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                            borderColor: 'var(--primary)',
                        }
                    }}>
                        <Box sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            bgcolor: 'rgba(49, 24, 7, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 3,
                            color: 'var(--secondary)',
                            transition: 'all 0.3s ease',
                            '.group-hover &': {
                                bgcolor: 'var(--secondary)',
                                color: 'white'
                            }
                        }}>
                            <MdHistory size={40} />
                        </Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
                            {t('custom_design.view_requests', 'View My Requests')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t('custom_design.view_requests_desc', 'Check the status of your submitted requests, view quotes, and download completed designs.')}
                        </Typography>
                    </Box>
                </Link>
            </div>
        </Box>
    );
};

export default CustomDesignOptions;
