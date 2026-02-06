'use client';

import React, { useEffect, useState } from 'react';
import { TextField, Button, Box, Alert } from '@mui/material';
import { useAuthStore } from '@/Store/authStore';

const MyProfile = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const { updateProfile, getProfile, isLoading } = useAuthStore();

  // ✅ Fetch user profile on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await getProfile();

        if (data) {
          setFormData({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            mobile: data.mobile || '',
          });
        }
      } catch (err) {
        setSnackbar({
          open: true,
          message:
            err?.response?.data?.message ||
            err.message ||
            'Failed to load user data.',
          severity: 'error',
        });
      }
    };

    fetchUser();
  }, [getProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const result = await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        mobile: formData.mobile,
      });

      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Profile updated successfully!',
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: result.error || 'Failed to update profile.',
          severity: 'error',
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          err?.response?.data?.message ||
          err.message ||
          'Failed to update profile.',
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
      '&:hover fieldset': {
        borderColor: 'var(--primary)',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'var(--primary)',
      },
    },
  };

  return (
    <Box className="rounded-xl ml-5 border-2 border-[var(--primary)]">
      <h6 className="border-b-2 border-[var(--primary)] text-2xl p-4">
        My Profile
      </h6>

      {snackbar.open && (
        <Box className="px-4 pt-4 flex justify-center">
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            variant="outlined"
            sx={{ width: '50%' }}
          >
            {snackbar.message}
          </Alert>
        </Box>
      )}

     <form
  className="w-full sm:w-[80%] md:w-[70%] lg:w-[60%] xl:w-[50%] mx-auto py-5"
  onSubmit={handleSubmit}
>
  {/* First Name */}
  <Box>
    <label
      htmlFor="firstName"
      className="text-sm text-[var(--secondary)] font-medium"
    >
      First Name <span className="text-red-500">*</span>
    </label>
    <TextField
      id="firstName"
      name="firstName"
      value={formData.firstName}
      onChange={handleChange}
      fullWidth
      size="small"
      sx={inputStyle}
    />
  </Box>

  {/* Last Name */}
  <Box>
    <label
      htmlFor="lastName"
      className="text-sm text-[var(--secondary)] font-medium"
    >
      Last Name <span className="text-red-500">*</span>
    </label>
    <TextField
      id="lastName"
      name="lastName"
      value={formData.lastName}
      onChange={handleChange}
      fullWidth
      size="small"
      sx={inputStyle}
    />
  </Box>

  {/* Email (read-only) */}
  <Box>
    <label
      htmlFor="email"
      className="text-sm text-[var(--secondary)] font-medium"
    >
      Email :
    </label>
    <TextField
      id="email"
      name="email"
      value={formData.email}
      fullWidth
      size="small"
      sx={inputStyle}
      disabled
    />
  </Box>

  {/* Mobile Number */}
  <Box>
    <label
      htmlFor="mobile"
      className="text-sm text-[var(--secondary)] font-medium"
    >
      Mobile Number :
    </label>
    <TextField
      id="mobile"
      name="mobile"
      value={formData.mobile}
      onChange={handleChange}
      fullWidth
      size="small"
      sx={inputStyle}
      disabled
    />
  </Box>

  {/* Submit Button */}
  <Box display="flex" justifyContent="center" mt={2}>
    <Button
      type="submit"
      variant="contained"
      disabled={isLoading}
      sx={{
        backgroundColor: 'var(--primary)',
        color: '#fff',
        borderRadius: '8px',
        px: 4,
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '14px',
        '&:hover': {
          backgroundColor: '#fff',
          color: 'var(--secondary)',
          border: '1px solid var(--primary)',
        },
      }}
    >
      {isLoading ? 'Updating...' : 'Update Profile'}
    </Button>
  </Box>
</form>

    </Box>
  );
};

export default MyProfile;
