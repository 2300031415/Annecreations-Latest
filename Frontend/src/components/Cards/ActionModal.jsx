'use client';

import React from 'react';
import {
  Dialog,
 
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import LoginForm from '@/app/Auth/Login/LoginForm';

const LoginModal = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose}>

        <Card
          sx={{
            width: '100%',
            boxShadow: '0px 0px 10px 0px #00000040',
            borderRadius: '12px',
          }}
        >
          <CardContent sx={{ px: { xs: 2, sm: 4 }, py: { xs: 3, sm: 3 } }}>
            <Typography
              variant="h1"
              sx={{
                textAlign: 'center',
                mb: 1,
                fontSize: { xs: '22px', sm: '24px' },
                fontWeight: 600,
                color: 'var(--secondary)',
              }}
            >
              Login
            </Typography>

            <Typography
              sx={{
                textAlign: 'center',
                mb: 3,
                fontSize: { xs: '14px', sm: '16px' },
                color: 'var(--secondary)',
              }}
            >
              Have an account? Log in with your email address
            </Typography>

            <LoginForm onSuccess={onClose} />
          </CardContent>
        </Card>
    
    </Dialog>
  );
};

export default LoginModal;
