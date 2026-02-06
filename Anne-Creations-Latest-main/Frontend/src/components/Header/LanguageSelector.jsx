'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Menu, MenuItem, Button } from '@mui/material';
import { MdLanguage, MdCheck, MdKeyboardArrowDown } from 'react-icons/md';
import { styled } from '@mui/material/styles';

const SelectorWrapper = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #e0e0e0',
    borderRadius: '50px', // Pill shape
    padding: '8px 16px', // Increased padding to match nav items
    cursor: 'pointer',
    backgroundColor: 'var(--card-bg)',
    minWidth: 100,
    justifyContent: 'space-between',
    transition: 'all 0.3s ease',
    '&:hover': {
        borderColor: 'var(--primary)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
}));

const languages = [
    { code: 'en', label: 'English' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'hi', label: 'हिंदी' },
];

const LanguageSelector = () => {
    const { i18n } = useTranslation();
    const [anchorEl, setAnchorEl] = useState(null);
    const [currentLang, setCurrentLang] = useState(languages[0]);
    const open = Boolean(anchorEl);

    // Load language from localStorage on mount
    useEffect(() => {
        const savedLang = localStorage.getItem('selectedLanguage');
        if (savedLang && languages.find(l => l.code === savedLang)) {
            i18n.changeLanguage(savedLang);
        }
    }, []);

    // Sync local state with i18n language
    useEffect(() => {
        const code = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
        const lang = languages.find(l => l.code === code) || languages[0];
        setCurrentLang(lang);
    }, [i18n.language, i18n.resolvedLanguage]);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLanguageChange = async (lng) => {
        // Save to localStorage for persistence
        localStorage.setItem('selectedLanguage', lng);
        await i18n.changeLanguage(lng);
        handleClose();
    };

    return (
        <Box sx={{ minWidth: 120, display: 'flex', alignItems: 'center' }}>
            <SelectorWrapper onClick={handleClick} style={{ minWidth: '130px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MdLanguage size={20} style={{ color: 'var(--secondary)' }} />
                    <Typography sx={{
                        fontSize: '1rem', // Match Home link size
                        fontWeight: 600,    // Match Home link thickness
                        color: 'var(--secondary)',
                        lineHeight: 1,
                        whiteSpace: 'nowrap'
                    }}>
                        {currentLang.label}
                    </Typography>
                </Box>
                <MdKeyboardArrowDown size={20} style={{ color: 'var(--secondary)' }} />
            </SelectorWrapper>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        mt: 1,
                        boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
                        borderRadius: 2,
                        minWidth: 120,
                        zIndex: 9999,
                    },
                }}
            >
                {languages.map((lang) => {
                    const isSelected = currentLang.code === lang.code;
                    return (
                        <MenuItem
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                py: 1,
                                px: 2,
                                '&:hover': {
                                    backgroundColor: 'rgba(var(--secondary-rgb), 0.08)',
                                },
                            }}
                        >
                            <Typography sx={{
                                fontSize: '0.875rem',
                                fontWeight: isSelected ? 700 : 400,
                                color: 'var(--secondary)'
                            }}>
                                {lang.label}
                            </Typography>
                            {isSelected && (
                                <MdCheck size={18} color="var(--secondary)" />
                            )}
                        </MenuItem>
                    );
                })}
            </Menu>
        </Box>
    );
};

export default LanguageSelector;
