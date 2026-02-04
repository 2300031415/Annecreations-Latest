'use client';
import React from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Tooltip,
  Box,
} from '@mui/material';
import {
  FaRegUser,
  FaRegHeart,
  FaSignOutAlt,
  FaClipboardList,
  FaDownload,
} from 'react-icons/fa';
import { BsCart3 } from 'react-icons/bs';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/Store/authStore';
import useWishlistStore from '@/Store/wishlistStore';
import useCartStore from '@/Store/cartStore';
import { useTranslation } from 'react-i18next';

const ProfileMenu = ({ anchorEl, handleClick, handleClose }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, accessToken, logout } = useAuthStore();
  const isAuthenticated = Boolean(accessToken);

  const wishlistItems = useWishlistStore((state) => state.wishlist);
  const cartItems = useCartStore((state) => state.cart);

  const navigation = [
    {
      label: t('profile.my_profile', 'My Profile'),
      path: '/Profile?tab=profile',
      icon: <FaRegUser size={16} />,
    },
    {
      label: t('profile.order_history', 'Order History'),
      path: '/Profile?tab=orders',
      icon: <FaClipboardList size={16} />,
    },
    {
      label: t('profile.downloads', 'Downloads'),
      path: '/Profile?tab=downloads',
      icon: <FaDownload size={16} />,
    },
  ];

  const guestMenu = [
    { label: t('auth.login', 'Login'), path: '/Auth/Login' },
    { label: t('auth.register', 'Register'), path: '/Auth/Register' },
  ];

  const handleNavigate = (path) => {
    router.push(path);
    handleClose();
  };

  const onLogout = () => {
    logout();
    router.push('/');
    handleClose();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {/* 2. Wishlist Icon ❤️ */}
      <Tooltip title={t('profile.wishlist', 'Wishlist')}>
        <IconButton
          onClick={() => router.push('/WishList')}
          sx={{ color: 'var(--secondary)' }}
        >
          <Badge badgeContent={wishlistItems.length} color="error">
            <FaRegHeart />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* 3. Cart Icon 🛒 */}
      <Tooltip title={t('profile.cart', 'Cart')}>
        <IconButton
          onClick={() => router.push('/Cart')}
          sx={{ color: 'var(--secondary)' }}
        >
          <Badge badgeContent={cartItems.length} color="warning">
            <BsCart3 />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* 4. Profile Icon 👤 */}
      <Tooltip title={t('profile.title', 'Account')}>
        <IconButton
          onClick={handleClick}
          sx={{
            color: 'var(--secondary)',
            bgcolor: anchorEl ? 'rgba(0,0,0,0.05)' : 'transparent',
          }}
        >
          <FaRegUser />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 220,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            borderRadius: 2,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {isAuthenticated ? (
          <>
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #eee', mb: 1 }}>
              <ListItemText
                primary={user?.lastName || 'User'}
                primaryTypographyProps={{ fontWeight: 'bold', fontSize: '1rem' }}
                secondary={user?.email}
              />
            </Box>
            {navigation.map((item) => (
              <MenuItem key={item.path} onClick={() => handleNavigate(item.path)}>
                <ListItemIcon sx={{ minWidth: 35 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </MenuItem>
            ))}
            <MenuItem onClick={onLogout} sx={{ color: 'error.main' }}>
              <ListItemIcon sx={{ minWidth: 35, color: 'error.main' }}>
                <FaSignOutAlt size={16} />
              </ListItemIcon>
              <ListItemText primary={t('auth.logout', 'Logout')} />
            </MenuItem>
          </>
        ) : (
          guestMenu.map((item) => (
            <MenuItem key={item.path} onClick={() => handleNavigate(item.path)}>
              <ListItemText primary={item.label} />
            </MenuItem>
          ))
        )}
      </Menu>
    </Box>
  );
};

export default ProfileMenu;
