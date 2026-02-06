// components/OtpInput.jsx
"use client";
import React, { useRef, useEffect } from 'react';
import { Box, TextField } from '@mui/material';

const OtpInput = ({ otp, setOtp, error }) => {
  const inputsRef = useRef([]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < otp.length - 1) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const commonStyles = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: 'var(--primary)', borderWidth: '2px', borderRadius: '8px' },
      '&:hover fieldset': { borderColor: 'var(--primary)' },
      '&.Mui-focused fieldset': { borderColor: 'var(--primary)' },
    },
    '& .MuiInputLabel-root': { color: '#311807' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#311807' },
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
      {otp.map((digit, index) => (
        <TextField
          key={index}
          inputRef={(el) => (inputsRef.current[index] = el)}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          inputProps={{
            maxLength: 1,
            style: { textAlign: 'center', fontSize: '24px', width: '26px', height: '26px' },
          }}
          sx={commonStyles}
          error={error && digit === ''}
        />
      ))}
    </Box>
  );
};

export default OtpInput;
