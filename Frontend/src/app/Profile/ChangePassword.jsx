'use client';

import React, { useState } from 'react';
import { TextField, Button, Box, Alert, InputAdornment, IconButton } from '@mui/material';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { useAuthStore } from '@/Store/authStore';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { changePassword, isLoading } = useAuthStore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword.length < 6) {
      setSnackbar({
        open: true,
        message: "New password must be at least 6 characters long.",
        severity: 'error',
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setSnackbar({
        open: true,
        message: "New password and confirm password do not match.",
        severity: 'error',
      });
      return;
    }

    try {
      const result = await changePassword(
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword
      );

      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Password updated successfully!',
          severity: 'success',
        });
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setSnackbar({
          open: true,
          message: result.error || 'Failed to update password.',
          severity: 'error',
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.message || 'Failed to update password.',
        severity: 'error',
      });
    }
  };

  const inputStyle = {
    mt: 1,
    mb: 1,
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: 'var(--primary)',
        borderWidth: '2px',
        borderRadius: '8px',
      },
      '&:hover fieldset': { borderColor: 'var(--primary)' },
      '&.Mui-focused fieldset': { borderColor: 'var(--primary)' },
    },
  };

  return (
    <Box className="rounded-xl ml-0 md:ml-5 border-2 border-[var(--primary)] w-full">
      <h6 className="border-b-2 border-[var(--primary)] text-xl md:text-2xl p-4 text-center md:text-left">
        Change Password
      </h6>

      {snackbar.open && (
        <Box className="px-4 pt-4 flex justify-center">
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            variant="outlined"
            sx={{ width: '100%', maxWidth: '600px' }}
          >
            {snackbar.message}
          </Alert>
        </Box>
      )}

      <form
        className="w-[90%] sm:w-[80%] md:w-[60%] lg:w-[50%] mx-auto py-5"
        onSubmit={handleSubmit}
      >
        <Box>
          <label htmlFor="currentPassword" className="text-sm text-[var(--secondary)] font-medium">
            Current Password <span className="text-red-500">*</span>
          </label>
          <TextField
            id="currentPassword"
            name="currentPassword"
            type={showCurrentPassword ? 'text' : 'password'}
            placeholder="Enter Current password"
            value={formData.currentPassword}
            onChange={handleChange}
            fullWidth
            size="small"
            required
            sx={inputStyle}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle current password visibility"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    edge="end"
                  >
                    {showCurrentPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box>
          <label htmlFor="newPassword" className="text-sm text-[var(--secondary)] font-medium">
            New Password <span className="text-red-500">*</span>
          </label>
          <TextField
            id="newPassword"
            name="newPassword"
            type={showNewPassword ? 'text' : 'password'}
            placeholder="Enter New password"
            value={formData.newPassword}
            onChange={handleChange}
            fullWidth
            size="small"
            required
            sx={inputStyle}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle new password visibility"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                  >
                    {showNewPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box>
          <label htmlFor="confirmPassword" className="text-sm text-[var(--secondary)] font-medium">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <TextField
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm New password"
            value={formData.confirmPassword}
            onChange={handleChange}
            fullWidth
            size="small"
            required
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

        <Box display="flex" justifyContent="center" mt={2}>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            sx={{
              backgroundColor: 'var(--primary)',
              color: '#fff',
              borderRadius: '8px',
              px: { xs: 3, md: 4 },
              py: { xs: 1.2, md: 1.5 },
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
            {isLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default ChangePassword;
