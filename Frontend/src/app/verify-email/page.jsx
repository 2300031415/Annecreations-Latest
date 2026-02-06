'use client';

import React, { useEffect, Suspense } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { useAuthStore } from '@/Store/verify-email';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const VerifyEmailContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const {
    isVerifying,
    verifyMessage,
    verifyEmail,
    isResending,
    resendMessage,
    resendVerification,
  } = useAuthStore();

  // Auto-trigger verification on page load
  useEffect(() => {
    if (token && email) {
      verifyEmail(email, token).then((success) => {
        if (success) setTimeout(() => router.push('/Auth/Login'), 3000);
      });
    }
  }, [token, email]);

  const handleResend = () => {
    resendVerification(email);
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="80vh"
      gap={2}
      textAlign="center"
      px={2}
    >
      <Typography variant="h5" fontWeight={600} color="var(--secondary)">
        Email Verification
      </Typography>

      {/* Show verification message */}
      {verifyMessage && (
        <Typography
          color={verifyMessage.includes('✅') ? 'green' : 'error'}
          fontSize="16px"
        >
          {verifyMessage}
        </Typography>
      )}

      {/* Retry verification button if failed */}
      {/* Retry verification button if failed */}
{verifyMessage && verifyMessage.includes('❌') && (
  <Button
    variant="contained"
    onClick={() => verifyEmail(email, token)}
    disabled={isVerifying}
    sx={{
      backgroundColor: 'var(--primary)',
      border: '2px solid var(--primary)',
      color: '#fff',
      px: 4,
      borderRadius: '8px',
      fontWeight: 600,
      textTransform: 'none',
      '&:hover': { backgroundColor: '#fff', color: 'var(--secondary)' },
    }}
  >
    {isVerifying ? 'Verifying...' : 'Retry Verification'}
  </Button>
)}


      {/* Resend verification email */}
      <Button
        variant="outlined"
        onClick={handleResend}
        disabled={isResending}
        sx={{
          borderColor: 'var(--primary)',
          color: 'var(--primary)',
          px: 4,
          borderRadius: '8px',
          fontWeight: 600,
          textTransform: 'none',
          '&:hover': { backgroundColor: 'var(--primary)', color: '#fff' },
        }}
      >
        {isResending ? 'Resending...' : 'Resend Verification Email'}
      </Button>

      {/* Show resend message */}
      {resendMessage && (
        <Typography
          color={resendMessage.includes('✅') ? 'green' : 'error'}
          fontSize="16px"
        >
          {resendMessage}
        </Typography>
      )}

      <Link href="/Auth/Login" className="mt-4 underline">
        Go to Login
      </Link>
    </Box>
  );
};

const VerifyEmailPage = () => {
  return (
    <Suspense 
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
};

export default VerifyEmailPage;
