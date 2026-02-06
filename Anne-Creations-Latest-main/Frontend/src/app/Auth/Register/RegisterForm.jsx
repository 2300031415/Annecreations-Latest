"use client";

import React, { useState } from "react";
import {
  Box,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Card,
  CardContent,
} from "@mui/material";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/Store/authStore";
import OtpModal from "./OtpModal";

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
  "& .MuiInputBase-input": {
    paddingTop: "10px",
    paddingBottom: "10px",
  },
};

const renderLabel = (text, name) => (
  <Typography
    component="label"
    htmlFor={name}
    sx={{
      fontWeight: 600,
      fontSize: "14px",
      mb: 1,
      display: "block",
      color: "var(--secondary)",
    }}
  >
    {text} <span style={{ color: "red" }}>*</span>
  </Typography>
);

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  const [errors, setErrors] = useState({});
  const [apiMessage, setApiMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpTarget, setOtpTarget] = useState("");

  const router = useRouter();
  const { sendOtp, isLoading } = useAuthStore();

  // -------------------- FORM HANDLERS --------------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: false }));
    setApiMessage("");
  };

  const validateForm = () => {
    const newErrors = {
      firstName: !formData.firstName.trim(),
      lastName: !formData.lastName.trim(),
      email: !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email),
      phone: !/^\d{10,15}$/.test(formData.phone),
      password: formData.password.trim().length < 6,
      confirmPassword: formData.confirmPassword !== formData.password,
      termsAccepted: !formData.termsAccepted,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).includes(true);
  };

  // -------------------- OTP SEND HANDLER --------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setApiMessage("Please check all fields before submitting.");
      return;
    }

    try {
      // ✅ Send OTP to mobile first
      const otpResponse = await sendOtp(formData.phone);

      if (otpResponse?.success) {
        setApiMessage("OTP sent successfully! Please verify.");
        setOtpTarget("phone");
        setOtpModalOpen(true); // ✅ open OTP modal
      } else {
        setApiMessage(otpResponse?.error || "Failed to send OTP.");
      }
    } catch (error) {
      console.error("OTP error:", error);
      setApiMessage("Failed to send OTP. Please try again.");
    }
  };

  return (
    <>
      {/* OTP Modal */}
      <OtpModal
        open={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        target={otpTarget}
        formData={formData} // ✅ pass formData for final registration
      />

      {/* Register Card */}
      <Card
        sx={{
          px: { xs: 0, sm: 4, md: 6 },
          py: { xs: 0, sm: 5 },
          boxShadow: "0px 0px 10px 0px #00000020",
          borderRadius: "12px",
        }}
      >
        <CardContent>
          <Typography
            textAlign="center"
            fontWeight={700}
            fontSize={{ xs: "20px", md: "24px" }}
            mb={4}
            color="var(--secondary)"
          >
            Create a new account
          </Typography>

          {apiMessage && (
            <Typography
              textAlign="center"
              color={apiMessage.toLowerCase().includes("success") ? "green" : "error"}
              mb={2}
            >
              {apiMessage}
            </Typography>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            {/* First & Last Name */}
            <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={2}>
              <Box flex={1}>
                {renderLabel("First Name", "firstName")}
                <TextField
                  name="firstName"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  fullWidth
                  error={!!errors.firstName}
                  helperText={errors.firstName && "First name is required"}
                  sx={commonStyles}
                />
              </Box>
              <Box flex={1}>
                {renderLabel("Last Name", "lastName")}
                <TextField
                  name="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  fullWidth
                  error={!!errors.lastName}
                  helperText={errors.lastName && "Last name is required"}
                  sx={commonStyles}
                />
              </Box>
            </Box>

            {/* Email & Phone */}
            <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={2}>
              <Box flex={1}>
                {renderLabel("Email", "email")}
                <TextField
                  name="email"
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email && "Enter a valid email address"}
                  sx={commonStyles}
                />
              </Box>
              <Box flex={1}>
                {renderLabel("Phone Number", "phone")}
                <TextField
                  name="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  fullWidth
                  error={!!errors.phone}
                  helperText={errors.phone && "Phone must be 10–15 digits"}
                  sx={commonStyles}
                />
              </Box>
            </Box>

            {/* Passwords */}
            <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={2}>
              <Box flex={1}>
                {renderLabel("Password", "password")}
                <TextField
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  fullWidth
                  error={!!errors.password}
                  helperText={errors.password && "Minimum 6 characters"}
                  sx={commonStyles}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword((p) => !p)}>
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box flex={1}>
                {renderLabel("Confirm Password", "confirmPassword")}
                <TextField
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  fullWidth
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword && "Passwords do not match"}
                  sx={commonStyles}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirmPassword((p) => !p)}>
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>

            {/* Terms */}
            <Box mt={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                    sx={{
                      color: "var(--primary)",
                      "&.Mui-checked": { color: "var(--primary)" },
                    }}
                  />
                }
                label={
                  <Typography fontSize="14px" color="var(--secondary)">
                    I agree to the{" "}
                    <Link
                      href="/terms_conditions"
                      className="text-transparent bg-clip-text bg-[linear-gradient(to_left,_#996E19_30%,_var(--primary))] underline"
                    >
                      Terms & Conditions
                    </Link>
                  </Typography>
                }
              />
              {errors.termsAccepted && (
                <Typography color="error" fontSize="13px" mt={0.5}>
                  You must accept the terms
                </Typography>
              )}
            </Box>

            {/* Submit */}
            <Box display="flex" justifyContent="center" mt={4}>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                sx={{
                  backgroundColor: "var(--primary)",
                  color: "#fff",
                  px: { xs: 4, sm: 6 },
                  width: { xs: "100%", sm: "40%" },
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: { xs: "14px", sm: "16px" },
                  textTransform: "none",
                }}
              >
                {isLoading ? "Processing..." : "Register"}
              </Button>
            </Box>

            <Typography textAlign="center" mt={3} fontSize="14px">
              Already have an account?{" "}
              <Link href="/Auth/Login" className="underline gradient-text">
                Login
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </>
  );
};

export default RegisterForm;
