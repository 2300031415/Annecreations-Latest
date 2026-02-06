'use client';

import React, { useState } from 'react';
import { Alert, Box, Button, TextField, InputAdornment, IconButton } from '@mui/material';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { useAuthStore } from '@/Store/authStore';
import { useSearchParams, useRouter } from 'next/navigation';

const ForgotPassword = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const { resetPassword, isResetPasswordLoading } = useAuthStore();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: false }));
  };

  const inputStyle = {
    mt: 1,
    mb: 2,
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
  };

  const isValidPassword = () => {
    const passwordTooShort = formData.newPassword.trim().length > 0 && formData.newPassword.trim().length < 6;
    const passwordsMatch = formData.newPassword === formData.confirmPassword;
    const bothFilled = formData.newPassword !== '' && formData.confirmPassword !== '';
    
    return bothFilled && !passwordTooShort && passwordsMatch;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password length
    const passwordTooShort = formData.newPassword.trim().length > 0 && formData.newPassword.trim().length < 6;
    const passwordsMatch = formData.newPassword === formData.confirmPassword;
    
    if (passwordTooShort) {
      setSnackbar({
        open: true,
        message: 'Password must be at least 6 characters long.',
        severity: 'error',
      });
      return;
    }

    if (!passwordsMatch) {
      setSnackbar({
        open: true,
        message: 'New password and Confirm Password mismatch.',
        severity: 'error',
      });
      return;
    }

    const response = await resetPassword({
      email,
      token,
      password: formData.newPassword,
      confirmPassword: formData.confirmPassword,
    });

    if (response.success) {
      setSnackbar({
        open: true,
        message: 'Password updated successfully!',
        severity: 'success',
      });
      setTimeout(() => router.push('/Auth/Login'), 1500);
    } else {
      setSnackbar({
        open: true,
        message: response.error || 'Failed to update password.',
        severity: 'error',
      });
    }
  };

  return (
    <Box className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 bg-gray-50">
      <Box className="w-full sm:w-[80%] md:w-[60%] lg:w-[40%] bg-white rounded-lg shadow-md p-6 md:p-10">
        <h6 className="border-b-2 border-[var(--primary)] text-xl md:text-2xl lg:text-3xl pb-3 mb-5 text-center">
          Reset Password
        </h6>

        {snackbar.open && (
          <Box className="pb-4 flex justify-center">
            <Alert
              severity={snackbar.severity}
              onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
              variant="outlined"
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Box>
        )}

        <form className="w-full" onSubmit={handleSubmit}>
          {/* New Password */}
          <Box>
            <label
              htmlFor="newPassword"
              className="text-sm md:text-base text-[var(--secondary)] font-medium"
            >
              New Password <span className="text-red-500">*</span>
            </label>
            <TextField
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter New password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              fullWidth
              required
              size="small"
              error={formData.newPassword.trim().length > 0 && formData.newPassword.trim().length < 6}
              helperText={formData.newPassword.trim().length > 0 && formData.newPassword.trim().length < 6 ? 'Password must be at least 6 characters' : ''}
              sx={inputStyle}
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

          {/* Confirm Password */}
          <Box>
            <label
              htmlFor="confirmPassword"
              className="text-sm md:text-base text-[var(--secondary)] font-medium"
            >
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <TextField
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Enter Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              fullWidth
              required
              size="small"
              error={formData.confirmPassword.trim().length > 0 && formData.newPassword !== formData.confirmPassword}
              helperText={formData.confirmPassword.trim().length > 0 && formData.newPassword !== formData.confirmPassword ? 'Passwords must match' : ''}
              sx={inputStyle}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Button */}
          <Box display="flex" justifyContent="center" mt={3}>
            <Button
              type="submit"
              variant="contained"
              disabled={isResetPasswordLoading}
              sx={{
                backgroundColor: 'var(--primary)',
                color: '#fff',
                borderRadius: '8px',
                px: { xs: 3, md: 4 },
                py: { xs: 1, md: 1.5 },
                textTransform: 'none',
                fontWeight: 600,
                fontSize: { xs: '13px', md: '14px' },
                '&:hover': {
                  backgroundColor: '#fff',
                  color: 'var(--secondary)',
                  border: '1px solid var(--primary)',
                },
              }}
            >
              {isResetPasswordLoading ? 'Updating...' : 'Reset Password'}
            </Button>
          </Box>
        </form>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
