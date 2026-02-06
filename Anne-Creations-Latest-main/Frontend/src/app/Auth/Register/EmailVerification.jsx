'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
} from '@mui/material';
import { MdEmail, MdCheckCircle } from 'react-icons/md';
import Link from 'next/link';

const EmailVerification = () => {
  return (
    <Card
      sx={{
        px: { xs: 3, sm: 4 },
        py: { xs: 4, sm: 5 },
        boxShadow: '0px 0px 10px 0px #00000020',
        borderRadius: '12px',
        textAlign: 'center',
        maxWidth: '500px',
        mx: 'auto',
      }}
    >
      <CardContent>
        {/* Success Icon */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <MdCheckCircle size={40} color="#fff" />
          </Box>
        </Box>

        {/* Main Title */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '24px', md: '28px' },
            mb: 2,
            color: 'var(--secondary)',
          }}
        >
          Registration Successful!
        </Typography>

        {/* Email Icon */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <MdEmail size={60} color="var(--primary)" />
        </Box>

        {/* Information Alert */}
        <Alert
          severity="info"
          sx={{
            mb: 4,
            textAlign: 'left',
            '& .MuiAlert-message': {
              width: '100%',
            },
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
            Email Verification Required
          </Typography>
          <Typography variant="body2">
            We have sent a verification link to your email address. Please check your inbox and click on the verification link to activate your account.
          </Typography>
        </Alert>

        {/* Instructions */}
        <Box sx={{ mb: 4, textAlign: 'left' }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 2,
              color: 'var(--secondary)',
              textAlign: 'center',
            }}
          >
            Next Steps:
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              1. Check your email inbox (and spam folder)
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              2. Click on the verification link in the email
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              3. Your account will be activated
            </Typography>
            <Typography variant="body2">
              4. Return here to login with your credentials
            </Typography>
          </Box>
        </Box>

        {/* Login Button */}
        <Box sx={{ mb: 3 }}>
          <Link href="/Auth/Login" style={{ textDecoration: 'none' }}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: 'var(--primary)',
                border: '2px solid var(--primary)',
                color: '#fff',
                px: { xs: 4, sm: 6 },
                py: 1.5,
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: { xs: '14px', sm: '16px' },
                textTransform: 'none',
                width: { xs: '100%', sm: 'auto' },
                '&:hover': {
                  backgroundColor: '#fff',
                  color: 'var(--secondary)',
                },
              }}
            >
              Go to Login Page
            </Button>
          </Link>
        </Box>

        {/* Support Contact */}
        <Typography
          variant="body2"
          sx={{
            color: '#999',
            fontSize: '12px',
          }}
        >
          Need help? Contact our support team
        </Typography>
      </CardContent>
    </Card>
  );
};

export default EmailVerification;
