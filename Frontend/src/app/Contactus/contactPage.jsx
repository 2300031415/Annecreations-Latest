'use client';

import React, { useState, useEffect } from 'react';
import {
  Typography,
  TextField,
  Button,
  Container,
  useMediaQuery,
  useTheme,
  Card,
  Box,
} from '@mui/material';
import BreadCrum from '@/components/BreadCrum/BreadCrum';
import { useContactStore } from '@/Store/contactStore';
import { useSnackbar } from 'notistack';
import { useAuthStore } from '@/Store/authStore';

const ContactUsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { contactUs, loading } = useContactStore();
  const { enqueueSnackbar } = useSnackbar();
  const { user, accessToken } = useAuthStore(); // ✅ include accessToken

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    message: '',
  });

  const [errors, setErrors] = useState({});

  // ✅ Auto-fill form if user is authenticated
  useEffect(() => {
    if (accessToken && user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        mobileNumber: user.mobile || '',
      }));
    }
  }, [accessToken, user]);

  // Validation rules
  const validate = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Enter a valid 10-digit mobile number';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error while typing
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const res = await contactUs(formData);
      enqueueSnackbar('✅ Message sent successfully!', { variant: 'success' });
      console.log('Form Submitted:', res);

      // Reset form (except prefilled user details if logged in)
      setFormData({
        firstName: accessToken && user?.firstName ? user.firstName : '',
        lastName: accessToken && user?.lastName ? user.lastName : '',
        email: accessToken && user?.email ? user.email : '',
        mobileNumber: accessToken && user?.mobile ? user.mobile : '',
        message: '',
      });
    } catch (err) {
      enqueueSnackbar('❌ Failed to send message', { variant: 'error' });
    }
  };

  const inputStyle = {
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
    },
  };

  return (
    <>
      <BreadCrum
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Contact Us', href: '/contact' },
        ]}
      />

      <Container maxWidth="md" className="my-20">
        <Card
          sx={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            padding: 5,
            borderRadius: '16px',
            my: 10,
          }}
        >
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <h1 className="text-center text-3xl pb-7 font-semibold">
              Leave your message
            </h1>

            {/* First & Last Name */}
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4`}>
              <Box width="100%">
                <Typography fontWeight={600} fontSize={14} mb={0.5}>
                  First Name <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TextField
                  name="firstName"
                  fullWidth
                  value={formData.firstName}
                  onChange={handleChange}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  sx={inputStyle}
                />
              </Box>

              <Box width="100%">
                <Typography fontWeight={600} fontSize={14} mb={0.5}>
                  Last Name <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TextField
                  name="lastName"
                  fullWidth
                  value={formData.lastName}
                  onChange={handleChange}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  sx={inputStyle}
                />
              </Box>
            </div>

            {/* Email & Mobile */}
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4`}>
              <Box width="100%">
                <Typography fontWeight={600} fontSize={14} mb={0.5}>
                  Email <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TextField
                  name="email"
                  fullWidth
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  sx={inputStyle}
                />
              </Box>

              <Box width="100%">
                <Typography fontWeight={600} fontSize={14} mb={0.5}>
                  Mobile Number <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TextField
                  name="mobileNumber"
                  fullWidth
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  error={!!errors.mobileNumber}
                  helperText={errors.mobileNumber}
                  sx={inputStyle}
                />
              </Box>
            </div>

            {/* Message */}
            <Box>
              <Typography fontWeight={600} fontSize={14} mb={0.5}>
                Message <span style={{ color: 'red' }}>*</span>
              </Typography>
              <TextField
                name="message"
                fullWidth
                multiline
                rows={4}
                value={formData.message}
                onChange={handleChange}
                error={!!errors.message}
                helperText={errors.message}
                sx={inputStyle}
              />
            </Box>

            {/* Submit */}
            <div className="flex justify-center mt-8">
              <Button
                type="submit"
                disabled={loading}
                sx={{
                  borderColor: 'var(--primary)',
                  backgroundColor: 'var(--primary)',
                  color: 'var(--secondary) !important',
                  border: '2px solid var(--primary)',
                  fontWeight: 600,
                  px: { xs: 4, sm: 6 },
                  borderRadius: '8px',
                  textTransform: 'none',
                  width: '30%',
                  fontSize: { xs: '14px', sm: '16px' },
                  '&:hover': {
                    backgroundColor: 'white',
                    color: 'var(--secondary)',
                  },
                }}
              >
                {loading ? 'Sending...' : 'Submit'}
              </Button>
            </div>
          </form>
        </Card>
      </Container>
    </>
  );
};

export default ContactUsPage;
