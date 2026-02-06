import React, { useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useCheckoutStore } from "@/Store/checkoutStore";
import { API_URL } from "@/Store/authStore";

const CheckoutStatus = ({ orderId }) => {
  const { checkoutStatus, fetchCheckoutStatus, loading, error } =
    useCheckoutStore();

  useEffect(() => {
    if (!orderId) return;

    let isMounted = true; // Prevent state updates after unmount

    const getStatus = async () => {
      try {
       await fetchCheckoutStatus(orderId);
        if (!isMounted) return; // Stop if component unmounted
      } catch (err) {
        console.error("Failed to fetch checkout status:", err);
      }
    };

    getStatus();

    return () => {
      isMounted = false;
    };
  }, [orderId, fetchCheckoutStatus]); // Correct dependency

  if (loading) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box mt={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!checkoutStatus?.data) {
    return (
      <Box mt={4} textAlign="center">
        <Typography>No checkout status available.</Typography>
      </Box>
    );
  }

  const { orderStatus, totalAmount, paymentMethod, paymentCode, products } =
    checkoutStatus.data;

  return (
    <Box mt={4} className="checkout-status">
      <Typography variant="h5" gutterBottom>
        Order Status: {orderStatus}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Payment Method: {paymentMethod} ({paymentCode})
      </Typography>
      <Typography variant="body1" gutterBottom>
        Total Amount: ₹{totalAmount}
      </Typography>

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              {["Image", "Design Code", "Description", "Unit Price"].map(
                (heading) => (
                  <TableCell key={heading} sx={{ fontWeight: "bold" }}>
                    {heading}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((item, idx) => (
              <TableRow key={item.product?._id || idx}>
                <TableCell>
                  <img
                    src={`${API_URL}/${item.product.image}`}
                    alt={item.product.description}
                    style={{ width: 80, height: 80, objectFit: "cover" }}
                  />
                </TableCell>
                <TableCell>{item.product.productModel}</TableCell>
                <TableCell>{item.product.description}</TableCell>
                <TableCell>
                  ₹{item.options?.reduce((sum, o) => sum + o.price, 0) || 0}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CheckoutStatus;
