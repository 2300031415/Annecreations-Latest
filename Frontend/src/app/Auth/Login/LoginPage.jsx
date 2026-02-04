"use client";

import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  CircularProgress,
} from "@mui/material";
import { Suspense } from "react";
import BreadCrum from "@/components/BreadCrum/BreadCrum";
import LoginForm from "./LoginForm";
import { useAuthStore } from "@/Store/authStore";
import { useSearchParams, useRouter } from "next/navigation";
import LoadingScreen from "@/components/LoadingScreen";
import { useEffect, useState } from "react";

// Component that uses searchParams
const LoginPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const { handleAdminLoginAsCustomer } = useAuthStore();
  const isAdmin = searchParams.get("origin") === "admin";

  useEffect(() => {
    const token = searchParams.get("token");

    if (token && isAdmin) {
      setIsAdminLogin(true);
      handleAdminLoginAsCustomer(token)
        .then(({ success }) => {
          if (success) {
            router.push("/Profile?tab=orders"); // Redirect to home after successful login
          }
        })
        .catch((err) => {
          console.error("Admin login error:", err);
          setIsAdminLogin(false);
        });
    }
  }, [searchParams, handleAdminLoginAsCustomer, router, isAdmin]);

  if (isAdmin) {
    return <LoadingScreen message="Logging in as customer..." />;
  }

  return (
    <>
      <BreadCrum
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Login", href: "/Login" },
        ]}
      />

      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2, sm: 3 },
        }}
        className="my-20"
      >
        <Card
          sx={{
            width: "100%",
            boxShadow: "0px 0px 10px 0px #00000040",
            borderRadius: "12px",
          }}
        >
          <CardContent sx={{ px: { xs: 2, sm: 4 }, py: { xs: 3, sm: 3 } }}>
            <Typography
              variant="h1"
              sx={{
                textAlign: "center",
                mb: 1,
                fontSize: { xs: "22px", sm: "24px" },
                fontWeight: 600,
                color: "var(--secondary)",
              }}
            >
              Login
            </Typography>

            <Typography
              sx={{
                textAlign: "center",
                mb: 3,
                fontSize: { xs: "14px", sm: "16px" },
                color: "var(--secondary)",
              }}
            >
              Have an account? Log in with your email address
            </Typography>
            <LoginForm redirectOnSuccess />
          </CardContent>
        </Card>
      </Container>
    </>
  );
};

// Main page component with Suspense boundary
const LoginPage = () => {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
};

export default LoginPage;
