'use client';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Collapse,
  ListItemIcon,
  IconButton,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/Store/authStore';
import Logo from './Logo';
import { useTranslation } from 'react-i18next';
import {
  MdExpandMore,
  MdChevronRight,
  MdCategory,
  MdHome,
  MdInfo,
  MdContactSupport,
  MdHelp,
  MdClose,
  MdPalette,
  MdPerson,
  MdCloudDownload,
  MdLogout,
  MdLogin,
  MdPersonAdd,
  MdFavorite,
  MdBrush,
  MdHistory,
} from 'react-icons/md';
import { FaFacebook, FaInstagram, FaWhatsapp, FaYoutube } from 'react-icons/fa';

const MobileDrawer = ({ onClose }) => {
  const { t } = useTranslation();
  const router = useRouter();
  // Categories Closed by Default as requested
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const { user, accessToken, logout, setAccessToken } = useAuthStore();
  const isAuthenticated = Boolean(accessToken);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token && !accessToken) {
      setAccessToken(token);
    }
    setMounted(true);
  }, [accessToken, setAccessToken]);

  const mainNav = [
    { id: 'home', name: t('nav.home', 'Home'), link: '/', icon: <MdHome /> },
    { id: 'custom_design', name: t('nav.custom_design', 'Custom Design'), link: '/my-style-requests', icon: <MdBrush /> },
    { id: 'our_designs', name: t('nav.our_designs', 'Our Designs'), link: '/Category', icon: <MdPalette /> },
    { id: 'wishlist', name: t('profile.wishlist', 'Wishlist'), link: '/WishList', icon: <MdFavorite /> },
  ];

  const categoryTabLinks = [
    { id: 'all', name: t('tabs.all', 'All Designs'), link: '/?tab=all' },
    { id: 'deals', name: t('tabs.todays_deals', "Today's Deals"), link: '/?tab=deals' },
    { id: 'new', name: t('tabs.new_releases', 'New Arrivals'), link: '/?tab=new' },
    { id: 'best', name: t('tabs.best_selling', 'Best Sellers'), link: '/?tab=best' },
    { id: 'sale', name: t('tabs.on_sale', 'On Sale'), link: '/?tab=sale' },
    { id: 'free', name: t('tabs.free_designs', 'Free Designs'), link: '/?tab=free' },
  ];

  const bottomNav = [
    { id: 'about', name: t('nav.about_us', 'About Us'), link: '/About', icon: <MdInfo /> },
    { id: 'contact', name: t('nav.contact_us', 'Contact Us'), link: '/Contactus', icon: <MdContactSupport /> },
    { id: 'help', name: t('nav.help', 'Help'), link: '/Help', icon: <MdHelp /> },
  ];

  const handleNavigate = (path) => {
    router.push(path);
    if (onClose) onClose();
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    if (onClose) onClose();
  };

  if (!mounted) return null;

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
        bgcolor: 'var(--card-bg)',
      }}
    >
      {/* 1. Header with Close Button and Logo */}
      <Box sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <IconButton onClick={onClose} sx={{ color: 'var(--secondary)' }}>
          <MdClose />
        </IconButton>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', pr: 5 }}>
          <Logo />
        </Box>
      </Box>

      {/* 2. Greeting Section */}
      <Box sx={{
        p: 3,
        bgcolor: 'rgba(49, 24, 7, 0.03)',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'var(--secondary)', mb: 0.5 }}>
          👋 {t('sidebar.hello', 'Hello')}, {isAuthenticated ? user?.lastName || 'User' : 'Guest'}!
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('sidebar.welcome', 'Welcome back to Anne Creations')}
        </Typography>
      </Box>

      {/* 3. Navigation Links */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <List sx={{ p: 0 }}>
          {mainNav.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton onClick={() => handleNavigate(item.link)} sx={{ py: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 40, color: 'var(--secondary)' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.name} primaryTypographyProps={{ fontWeight: 600 }} />
              </ListItemButton>
            </ListItem>
          ))}

          {/* Categories Dropdown Section */}
          <ListItem disablePadding>
            <ListItemButton onClick={() => setCategoriesOpen(!categoriesOpen)} sx={{ py: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 40, color: 'var(--secondary)' }}><MdCategory /></ListItemIcon>
              <ListItemText primary={t('nav.categories', 'Categories')} primaryTypographyProps={{ fontWeight: 600 }} />
              {categoriesOpen ? <MdExpandMore /> : <MdChevronRight />}
            </ListItemButton>
          </ListItem>

          <Collapse in={categoriesOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ bgcolor: 'rgba(0,0,0,0.01)' }}>
              {categoryTabLinks.map((item) => (
                <ListItemButton
                  key={item.id}
                  sx={{ pl: 7, py: 1 }}
                  onClick={() => handleNavigate(item.link)}
                >
                  <ListItemText
                    primary={item.name}
                    primaryTypographyProps={{ fontSize: '0.9rem', color: 'text.secondary' }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Collapse>

          {bottomNav.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton onClick={() => handleNavigate(item.link)} sx={{ py: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 40, color: 'var(--secondary)' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.name} primaryTypographyProps={{ fontWeight: 600 }} />
              </ListItemButton>
            </ListItem>
          ))}

          {/* Recently Viewed Link */}
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleNavigate('/history')} sx={{ py: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 40, color: 'var(--secondary)' }}><MdHistory /></ListItemIcon>
              <ListItemText primary={t('nav.recently_viewed', 'Recently Viewed')} primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      {/* Removed Fixed Recently Viewed Box */}

      <Divider />

      {/* 4. Auth/Bottom Section */}
      <Box sx={{ p: 2, bgcolor: '#fff' }}>
        {isAuthenticated ? (
          <List disablePadding>
            <ListItemButton
              sx={{ borderRadius: 2, mb: 0.5 }}
              onClick={() => handleNavigate('/Profile?tab=profile')}
            >
              <ListItemIcon sx={{ minWidth: 35, color: 'var(--secondary)' }}><MdPerson /></ListItemIcon>
              <ListItemText primary={t('profile.my_profile', 'My Profile')} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
            </ListItemButton>

            <ListItemButton
              sx={{ borderRadius: 2, mb: 0.5 }}
              onClick={() => handleNavigate('/Profile?tab=downloads')}
            >
              <ListItemIcon sx={{ minWidth: 35, color: 'var(--secondary)' }}><MdCloudDownload /></ListItemIcon>
              <ListItemText primary={t('profile.downloads', 'Downloads')} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
            </ListItemButton>

            <ListItemButton
              sx={{ borderRadius: 2, color: 'error.main' }}
              onClick={handleLogout}
            >
              <ListItemIcon sx={{ minWidth: 35, color: 'error.main' }}><MdLogout /></ListItemIcon>
              <ListItemText primary={t('auth.logout', 'Logout')} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
            </ListItemButton>
          </List>
        ) : (
          <List disablePadding>
            <ListItemButton
              sx={{ borderRadius: 2, mb: 0.5 }}
              onClick={() => handleNavigate('/Auth/Login')}
            >
              <ListItemIcon sx={{ minWidth: 35, color: 'var(--secondary)' }}><MdLogin /></ListItemIcon>
              <ListItemText primary={t('auth.login', 'Login')} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
            </ListItemButton>
            <ListItemButton
              sx={{ borderRadius: 2 }}
              onClick={() => handleNavigate('/Auth/Register')}
            >
              <ListItemIcon sx={{ minWidth: 35, color: 'var(--secondary)' }}><MdPersonAdd /></ListItemIcon>
              <ListItemText primary={t('auth.register', 'Register')} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
            </ListItemButton>
          </List>
        )}
      </Box>

      {/* 5. Social Media Footer */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', gap: 3, bgcolor: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
        <a href="https://www.facebook.com/AnneCreations.HB" target="_blank" rel="noopener noreferrer" className="text-[var(--secondary)] hover:text-[var(--primary)] transition-colors">
          <FaFacebook size={24} />
        </a>
        <a href="https://www.instagram.com/annecreations.hb" target="_blank" rel="noopener noreferrer" className="text-[var(--secondary)] hover:text-[var(--primary)] transition-colors">
          <FaInstagram size={24} />
        </a>
        <a href="https://wa.me/919951916767" target="_blank" rel="noopener noreferrer" className="text-[var(--secondary)] hover:text-[var(--primary)] transition-colors">
          <FaWhatsapp size={24} />
        </a>
        <a href="https://www.youtube.com/@annecreationHB" target="_blank" rel="noopener noreferrer" className="text-[var(--secondary)] hover:text-[var(--primary)] transition-colors">
          <FaYoutube size={24} />
        </a>
      </Box>
    </Box>
  );
};

export default MobileDrawer;
