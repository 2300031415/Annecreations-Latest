'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, IconButton, Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { MdClose } from 'react-icons/md';
import LoginForm from '@/app/Auth/Login/LoginForm';
import { useAuthStore } from '@/Store/authStore';

const LoginPopup = () => {
    const [open, setOpen] = useState(false);
    const { isAuthenticated } = useAuthStore();
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        // If user is already logged in or has seen the popup, do nothing
        if (isAuthenticated) return;

        const hasSeenPopup = localStorage.getItem('hasSeenLoginPopup');
        if (hasSeenPopup) return;

        // Timer Trigger (15 seconds)
        const timer = setTimeout(() => {
            triggerPopup();
        }, 15000);

        // Scroll Trigger (50% of page height)
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;

            if (scrollPosition + windowHeight >= documentHeight * 0.5) {
                triggerPopup();
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isAuthenticated]);

    const triggerPopup = () => {
        // Double check before showing
        if (localStorage.getItem('hasSeenLoginPopup')) return;

        setOpen(true);
        localStorage.setItem('hasSeenLoginPopup', 'true');

        // Remove scroll listener once triggered
        window.removeEventListener('scroll', () => { });
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleLoginSuccess = () => {
        setOpen(false);
        // Auth store should handle state update
    };

    if (isAuthenticated) return null;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullScreen={fullScreen}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: fullScreen ? 0 : 3,
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }
            }}
        >
            <Box sx={{ position: 'relative', bgcolor: 'background.paper' }}>
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                        zIndex: 1,
                    }}
                >
                    <MdClose />
                </IconButton>

                <DialogContent sx={{ p: 0 }}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        pt: 6,
                        pb: 4,
                        px: { xs: 2, sm: 4 }
                    }}>
                        <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom color="var(--primary)">
                            Login
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4, maxWidth: '80%' }}>
                            Have an account? Log in with your email address
                        </Typography>

                        <Box sx={{ width: '100%' }}>
                            <LoginForm onSuccess={handleLoginSuccess} />
                        </Box>
                    </Box>
                </DialogContent>
            </Box>
        </Dialog>
    );
};

export default LoginPopup;
