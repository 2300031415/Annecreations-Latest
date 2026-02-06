'use client';
import { Container, Box, CircularProgress } from '@mui/material';
import { Suspense } from 'react';
import ForgotPassword from './ForgotPassword';

export default function ResetPasswordPage() {
  return (
    <Container>
      <Suspense
        fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        }
      >
        <ForgotPassword />
      </Suspense>
    </Container>
  );
}
