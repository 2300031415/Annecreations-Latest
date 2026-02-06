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
import Image from 'next/image';
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

      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #FFEFD5 0%, #FFFFFF 50%, #FFE4B5 100%)',
          minHeight: '100vh',
          py: 10,
          '@keyframes slowRotate': {
            from: { transform: 'rotate(0deg)' },
            to: { transform: 'rotate(360deg)' }
          }
        }}
      >
        {/* Dynamic Colorful Background Accents */}
        <Box sx={{ position: 'absolute', top: '-10%', left: '10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(255,183,41,0.3) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(60px)', zIndex: 0 }} />
        <Box sx={{ position: 'absolute', bottom: '5%', right: '5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(233,177,96,0.3) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(60px)', zIndex: 0 }} />
        <Box sx={{ position: 'absolute', top: '40', right: '30%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(49,24,7,0.1) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(40px)', zIndex: 0 }} />

        {/* Decorative Mandalas */}
        <Box sx={{ position: 'absolute', top: -100, left: -100, opacity: 0.6, pointerEvents: 'none', mixBlendMode: 'multiply', filter: 'saturate(1.8) contrast(1.1)', animation: 'slowRotate 60s linear infinite' }}>
          <Image src="/assets/decor/01.png" alt="decor" width={450} height={450} priority />
        </Box>
        <Box sx={{ position: 'absolute', top: '10%', right: -150, opacity: 0.5, pointerEvents: 'none', mixBlendMode: 'multiply', filter: 'saturate(1.5)', animation: 'slowRotate 80s linear infinite reverse' }}>
          <Image src="/assets/decor/02.png" alt="decor" width={550} height={550} />
        </Box>
        <Box sx={{ position: 'absolute', bottom: '20%', left: -150, opacity: 0.45, pointerEvents: 'none', mixBlendMode: 'multiply', filter: 'saturate(1.4)', animation: 'slowRotate 100s linear infinite' }}>
          <Image src="/assets/decor/03.png" alt="decor" width={500} height={500} />
        </Box>
        <Box sx={{ position: 'absolute', bottom: -50, right: -50, opacity: 0.65, pointerEvents: 'none', mixBlendMode: 'multiply', filter: 'saturate(2) brightness(1.1)', animation: 'slowRotate 70s linear infinite reverse' }}>
          <Image src="/assets/decor/04.png" alt="decor" width={400} height={400} />
        </Box>

        {/* Repeating patterns */}
        <Box sx={{ position: 'absolute', top: '40%', left: '80%', opacity: 0.35, transform: 'scale(0.8) rotate(30deg)', pointerEvents: 'none', mixBlendMode: 'multiply', filter: 'saturate(1.5)' }}>
          <Image src="/assets/decor/01.png" alt="decor" width={300} height={300} />
        </Box>
        <Box sx={{ position: 'absolute', top: '70%', left: '5%', opacity: 0.3, transform: 'scale(0.7) rotate(-45deg)', pointerEvents: 'none', mixBlendMode: 'multiply', filter: 'saturate(1.6)' }}>
          <Image src="/assets/decor/04.png" alt="decor" width={300} height={300} />
        </Box>
        <Box sx={{ position: 'absolute', top: '5%', left: '40%', opacity: 0.2, transform: 'scale(0.5) rotate(90deg)', pointerEvents: 'none', mixBlendMode: 'multiply' }}>
          <Image src="/assets/decor/03.png" alt="decor" width={200} height={200} />
        </Box>
        <Box sx={{ position: 'absolute', top: '25%', left: '15%', opacity: 0.3, transform: 'scale(0.6) rotate(-30deg)', pointerEvents: 'none', mixBlendMode: 'multiply' }}>
          <Image src="/assets/decor/04.png" alt="decor" width={250} height={250} />
        </Box>
        <Box sx={{ position: 'absolute', top: '60%', right: '10%', opacity: 0.25, transform: 'scale(0.7) rotate(60deg)', pointerEvents: 'none', mixBlendMode: 'multiply' }}>
          <Image src="/assets/decor/02.png" alt="decor" width={300} height={300} />
        </Box>
        <Box sx={{ position: 'absolute', top: '80%', left: '40%', opacity: 0.2, transform: 'scale(0.4) rotate(120deg)', pointerEvents: 'none', mixBlendMode: 'multiply' }}>
          <Image src="/assets/decor/01.png" alt="decor" width={250} height={250} />
        </Box>
        <Box sx={{ position: 'absolute', top: '15%', left: '60%', opacity: 0.15, transform: 'scale(0.5) rotate(-15deg)', pointerEvents: 'none', mixBlendMode: 'multiply' }}>
          <Image src="/assets/decor/03.png" alt="decor" width={200} height={200} />
        </Box>
        <Box sx={{ position: 'absolute', top: '35%', left: '0%', opacity: 0.2, transform: 'scale(0.8) rotate(75deg)', pointerEvents: 'none', mixBlendMode: 'multiply' }}>
          <Image src="/assets/decor/02.png" alt="decor" width={350} height={350} />
        </Box>
        <Box sx={{ position: 'absolute', top: '50%', left: '20%', opacity: 0.15, transform: 'scale(0.6) rotate(-20deg)', pointerEvents: 'none', mixBlendMode: 'multiply', filter: 'blur(1px)' }}>
          <Image src="/assets/decor/01.png" alt="decor" width={200} height={200} />
        </Box>
        <Box sx={{ position: 'absolute', bottom: '15%', right: '40%', opacity: 0.2, transform: 'scale(0.5) rotate(10deg)', pointerEvents: 'none', mixBlendMode: 'multiply' }}>
          <Image src="/assets/decor/04.png" alt="decor" width={250} height={250} />
        </Box>

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Card
            sx={{
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              padding: 5,
              borderRadius: '16px',
              my: 5,
              backdropFilter: 'blur(10px)',
              bgcolor: 'rgba(255,255,255,0.95)'
            }}
          >
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              <h1 className="text-center text-3xl pb-7 font-semibold" style={{ color: 'var(--secondary)' }}>
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
                    borderColor: 'var(--secondary)',
                    backgroundColor: 'var(--secondary)',
                    color: 'white !important',
                    border: '2px solid var(--secondary)',
                    fontWeight: 600,
                    px: { xs: 4, sm: 6 },
                    borderRadius: '8px',
                    textTransform: 'none',
                    width: '30%',
                    fontSize: { xs: '14px', sm: '16px' },
                    '&:hover': {
                      backgroundColor: 'white',
                      color: 'var(--secondary) !important',
                    },
                  }}
                >
                  {loading ? 'Sending...' : 'Submit'}
                </Button>
              </div>
            </form>
          </Card>
        </Container>
      </Box>
    </>
  );
};

export default ContactUsPage;
