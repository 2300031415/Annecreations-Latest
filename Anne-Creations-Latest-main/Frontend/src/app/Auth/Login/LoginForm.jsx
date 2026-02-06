'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Link,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import PropTypes from 'prop-types';
import { useAuthStore } from '@/Store/authStore';
import { useRouter } from 'next/navigation';

export const fieldStyles = {
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: 'var(--primary)',
      borderWidth: '2px',
      borderRadius: '8px',
    },
    '&:hover fieldset': {
      borderColor: 'var(--primary)',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'var(--primary)',
    },
  },
  '& .MuiInputBase-input': {
    paddingTop: 1,
    paddingBottom: 1,
    height: 'auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  '& input::placeholder': {
    color: '#999',
    opacity: 1,
  },
};

const LoginForm = ({ redirectOnSuccess = false, onSuccess }) => {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: false, password: false });
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: false }));
    clearError();
    setSuccessMessage('');
  };

  const validateForm = () => {
    const emailEmpty = formData.email.trim() === '';
    const passwordEmpty = formData.password.trim() === '';
    const passwordTooShort = formData.password.trim().length > 0 && formData.password.trim().length < 6;

    setErrors({
      email: emailEmpty,
      password: passwordEmpty || passwordTooShort
    });
    return !(emailEmpty || passwordEmpty || passwordTooShort);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const { success } = await login(formData.email.trim(), formData.password.trim());

    if (success) {
      setSuccessMessage('Login successful!');
      setFormData({ email: '', password: '' });
      setErrors({ email: false, password: false });

      if (redirectOnSuccess) {
        router.push('/');
      } else {
        if (onSuccess) onSuccess();
        setTimeout(() => setSuccessMessage(''), 0);
      }
    } else {
      const errMsg = error?.toLowerCase() || '';
      setErrors({
        email: errMsg.includes('email'),
        password: errMsg.includes('password'),
      });
    }
  };

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit}
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {error && (
        <Alert severity="error" sx={{ width: '100%', maxWidth: '330px', mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ width: '100%', maxWidth: '330px', mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Box sx={{ width: '100%', maxWidth: '330px', mb: 3 }}>
        <Typography
          component="label"
          htmlFor="email"
          sx={{
            fontWeight: 900,
            fontSize: '14px',
            mb: 1,
            display: 'block',
            color: 'var(--secondary)',
          }}
        >
          Email <span style={{ color: 'red' }}>*</span>
        </Typography>
        <TextField
          id="email"
          name="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          helperText={errors.email ? 'Email is required' : ''}
          sx={fieldStyles}
          fullWidth
        />
      </Box>

      <Box sx={{ width: '100%', maxWidth: '330px', mb: 2 }}>
        <Typography
          component="label"
          htmlFor="password"
          sx={{
            fontWeight: 900,
            fontSize: '14px',
            mb: 1,
            display: 'block',
            color: 'var(--secondary)',
          }}
        >
          Password <span style={{ color: 'red' }}>*</span>
        </Typography>
        <TextField
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          helperText={errors.password ? (formData.password.trim().length > 0 && formData.password.trim().length < 6 ? 'Password must be at least 6 characters' : 'Password is required') : ''}
          sx={fieldStyles}
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ textAlign: 'right', width: '100%', maxWidth: '330px', mb: 2 }}>
        <Link href="/Auth/forgotpassword" sx={{ fontSize: '14px' }}>
          <span className="gradient-text">Forgot password?</span>
        </Link>
      </Box>

      <Button
        type="submit"
        disabled={isLoading}
        sx={{
          backgroundColor: 'var(--primary)',
          borderRadius: '8px',
          border: '2px solid var(--primary)',
          px: { xs: 4, sm: 6 },
          mt: 2,
          width: '40%',
          color: '#fff',
          fontWeight: 600,
          fontSize: { xs: '14px', sm: '16px' },
          textTransform: 'none',
          '&:hover': {
            backgroundColor: '#ffffff',
            color: 'var(--secondary)',
          },
        }}
      >
        {isLoading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Login'}
      </Button>

      <Typography sx={{ textAlign: 'center', fontSize: { xs: '14px', sm: '15px' }, mt: 2 }}>
        Don&apos;t have an account?{' '}
        <Link href="/Auth/Register" underline="hover" color="var(--primary)">
          Register
        </Link>
      </Typography>
    </Box>
  );
};
LoginForm.propTypes = {
  redirectOnSuccess: PropTypes.bool,
};
export default LoginForm;
