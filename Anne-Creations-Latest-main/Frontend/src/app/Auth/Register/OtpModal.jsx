"use client";

import React, { useState } from "react";
import { Modal, Box, Typography, TextField, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/Store/authStore";

const commonStyles = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: "var(--primary)",
      borderWidth: "2px",
      borderRadius: "8px",
    },
    "&:hover fieldset": { borderColor: "var(--primary)" },
    "&.Mui-focused fieldset": { borderColor: "var(--primary)" },
  },
};

const OtpModal = ({ open, onClose, target, formData }) => {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { sendOtp, register } = useAuthStore();

  // 🔁 Resend OTP
  const handleResend = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await sendOtp(formData.phone);
      if (response?.success) {
        setMessage("OTP resent successfully!");
      } else {
        setMessage(response?.error || "Failed to resend OTP.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error resending OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Verify OTP & Register
  const handleVerifyAndRegister = async () => {
    if (!otp || otp.length !== 6) {
      setMessage("Please enter a valid 6-digit OTP.");
      return;
    }
    console.log(otp)
    setLoading(true);
    setMessage("");

    try {
      // Store OTP temporarily in formData
      const registrationData = { ...formData, otp };

      const result = await register(registrationData);

      if (result.success) {
        setMessage("🎉 Registration successful!");
        setTimeout(() => {
          onClose();
          router.push("/");
        }, 0);
      } else {
        setMessage(result.error || "OTP verification or registration failed.");
      }
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Something went wrong during verification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "#fff",
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          width: { xs: "90%", sm: "400px" },
        }}
      >
        <Typography
          variant="h6"
          textAlign="center"
          mb={2}
          color="var(--secondary)"
        >
          Verify {target === "email" ? "Email" : "Phone"} OTP
        </Typography>

        <TextField
          fullWidth
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          sx={commonStyles}
        />

        {message && (
          <Typography
            mt={1}
            textAlign="center"
            fontSize="14px"
            color={message.toLowerCase().includes("success") ? "green" : "error"}
          >
            {message}
          </Typography>
        )}

        <Box display="flex" justifyContent="center" mt={3} gap={2}>
          <Button
            variant="contained"
            onClick={handleVerifyAndRegister}
            disabled={loading}
            sx={{
              backgroundColor: "var(--primary)",
              color: "#fff",
              textTransform: "none",
              "&:hover": { backgroundColor: "var(--secondary)" },
            }}
          >
            {loading ? "Processing..." : "Verify & Register"}
          </Button>

          <Button
            variant="outlined"
            onClick={handleResend}
            disabled={loading}
            sx={{
              borderColor: "var(--primary)",
              color: "var(--primary)",
              textTransform: "none",
            }}
          >
            Resend
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default OtpModal;
