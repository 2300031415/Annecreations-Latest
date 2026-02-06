// app/forgotpassword/page.tsx
'use client';
import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  Container,
  Typography,
} from '@mui/material';
import BreadCrum from '@/components/BreadCrum/BreadCrum';
import { useAuthStore } from '@/Store/authStore';
import { useRouter } from 'next/navigation';



const EmailSender = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(false);
  const [sent, setSent] = useState(false);
  const [apiError, setApiError] = useState('');
  const { forgotPassword } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const commonStyles = {
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
      paddingTop: '10px',
      paddingBottom: '10px',
    },
  };

  const handleSend = async () => {
    if (!email.trim()) {
      setError(true);
      setApiError('Email is required');
      setSent(false);
      return;
    }

    setLoading(true);
    setError(false);
    setApiError('');
    setSent(false);

    try {
      const response = await forgotPassword(email.trim());
      if (response.success) {
        setSent(true);
        setError(false);
        setApiError('');
      } else {
        setError(true);
        setSent(false);
        setApiError(response.error || 'Something went wrong');
      }
    } catch (err) {
      setError(true);
      setSent(false);
      setApiError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <BreadCrum
        crumbs={[
          { label: 'Login', href: '/Auth/Login' },
          { label: 'Forgot Password', href: '/forgotpassword' },
        ]}
      />

      <Container maxWidth="sm" className="my-20">
        <Card
          sx={{
            boxShadow: '0px 0px 10px 0px #00000040',
            borderRadius: '12px',
            py: 3,
          }}
        >
          <CardContent>
            <Typography
              variant="h1"
              fontSize="24px"
              className="text-center text-[var(--secondary)] font-semibold mb-4"
            >
              Reset Password
            </Typography>

            <Typography className="text-center text-[var(--secondary)] my-5 font-semibold">
              Enter your email address to receive a password reset link.
            </Typography>

            <Box className="px-8 md:px-20 my-10">
              <Typography
                component="label"
                htmlFor="email"
                sx={{ fontWeight: 600, fontSize: '14px', mb: 1, display: 'block' }}
              >
                Your Email <span style={{ color: 'red' }}>*</span>
              </Typography>
              <TextField
                id="email"
                placeholder="Enter your email"
                variant="outlined"
                fullWidth
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(false);
                  setSent(false);
                  setApiError('');
                }}
                error={error}
                helperText={error && !apiError ? 'Email is required' : ''}
                sx={commonStyles}
                InputLabelProps={{ shrink: false }}
                disabled={loading}
              />
            </Box>

            <Box className="flex justify-center">
              <Button
                variant="contained"
                sx={{
                  backgroundColor: 'var(--primary)',
                  borderRadius: '8px',
                  border: '1px solid var(--primary)',
                  px: 4,
                  color: 'var(--secondary)',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: 'white', color: 'var(--secondary)' },
                }}
                disabled={loading}
                onClick={handleSend}
              >
                {loading ? 'Sending...' : 'Send Email'}
              </Button>
            </Box>

            {sent && (
              <Typography sx={{ color: 'green', fontSize: '14px' }} className="text-center mt-4">
                Email sent successfully! Please check your inbox.
              </Typography>
            )}

            {apiError && (
              <Typography sx={{ color: 'red', fontSize: '14px' }} className="text-center mt-2">
                {apiError}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Container>
    </>
  );
};

export default EmailSender;
