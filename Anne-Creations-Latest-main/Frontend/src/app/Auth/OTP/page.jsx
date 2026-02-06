// app/Auth/OTP/OtpForm.jsx
"use client";
import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
} from '@mui/material';
import BreadCrum from '@/components/BreadCrum/BreadCrum';
import OtpInput from './OtpInput'; // make sure the import path is correct

const OtpForm = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.some((digit) => digit === '')) {
      setError(true);
      return;
    }
    setSubmitted(true);
    setError(false);
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    console.log('Resend OTP');
    setResendTimer(30);
  };

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  return (
    <>
      <BreadCrum
        crumbs={[
          { label: 'Forgot Password', href: '/Auth/forgotpassword' },
          { label: 'OTP', href: '/Auth/OTP' },
        ]}
      />
      <Container maxWidth="sm" className="my-20">
        <Card sx={{ boxShadow: '0px 0px 10px 0px #00000040', borderRadius: '12px' }}>
          <CardContent>
            <Typography
              variant="h1"
              align="center"
              fontSize="24px"
              sx={{ fontWeight: 'bold', mb: 4, fontFamily: 'Poppins' }}
            >
              Enter OTP Code
            </Typography>

            <form onSubmit={handleSubmit}>
              <OtpInput otp={otp} setOtp={setOtp} error={error} />

              {error && (
                <Typography sx={{ color: 'error.main', fontSize: '13px', textAlign: 'center', mb: 1 }}>
                  Please enter all 4 digits of the OTP
                </Typography>
              )}

              {submitted && (
                <Typography sx={{ color: 'green', fontSize: '14px', textAlign: 'center', mb: 1 }}>
                  OTP Verified Successfully!
                </Typography>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Button
                  onClick={handleResend}
                  disabled={resendTimer > 0}
                  sx={{ textTransform: 'none', color: 'var(--secondary)', fontSize: 14 }}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Link'}
                </Button>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    backgroundColor: 'var(--primary)',
                    borderRadius: '8px',
                    px: 6,
                    color: '#fff',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: '#e6a81f' },
                  }}
                >
                  Verify OTP
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </>
  );
};

export default OtpForm;
