'use client'
import React, { useState, useEffect } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Button,
  useMediaQuery
} from "@mui/material";
import { useSnackbar } from "notistack";
import CartItemRow from "../Cart/CartItemRow";
import { fieldStyles } from "../Auth/Login/LoginForm";

const OrderSummary = ({
  CheckoutData,
  applyCoupon,
  loading,
  coupon,
  applyCouponError,
  checkoutMessage,
  orderId,
  autoCouponData,
  autoApplyCoupon,
  manualCouponApplied,
  removeCoupon,
  couponDetails
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [autoCouponMessage, setAutoCouponMessage] = useState("");

  const products = CheckoutData?.products || [];
  const totalAmount = CheckoutData?.totalAmount || 0;
  const isMobile = useMediaQuery('(max-width:640px)');

  // ✅ Sync local state with store state for manual coupons
  useEffect(() => {
    if (manualCouponApplied && couponDetails?.coupon) {
      setCouponApplied(true);
      setAppliedCoupon(couponDetails.coupon.code);
    } else if (!manualCouponApplied) {
      setCouponApplied(false);
      setAppliedCoupon("");
    }
  }, [manualCouponApplied, couponDetails]);

  // ✅ Auto apply coupon once when component mounts and orderId is available
  // Only call if there's no existing coupon data from checkout status
  useEffect(() => {
    if (orderId && !manualCouponApplied && !couponDetails && !autoCouponData) {
      autoApplyCoupon(orderId);
    }
  }, [orderId, manualCouponApplied, couponDetails, autoCouponData]);

  // ✅ Handle auto coupon data and messages
  useEffect(() => {
    if (autoCouponData) {
      // Check if auto coupon was successfully applied
      if (autoCouponData.applied) {
        const message = autoCouponData.coupon?.reason || `Coupon "${autoCouponData.coupon?.code}" applied! You saved ₹${autoCouponData.calculation?.discountAmount}`;
        setAutoCouponMessage(message);
      } else if (autoCouponData.reason) {
        // Coupon not applied, show reason (e.g., "Add ₹30.00 more...")
        setAutoCouponMessage(autoCouponData.reason);
      }
    } else {
      setAutoCouponMessage("");
    }
  }, [autoCouponData, manualCouponApplied]);

  // ✅ Use totals directly from CheckoutData if available, otherwise calculate
  const displayTotals = CheckoutData?.subtotal !== undefined
    ? {
        subtotal: CheckoutData.subtotal,
        discount: CheckoutData.discount || 0,
        total: CheckoutData.orderTotal || CheckoutData.total || totalAmount,
      }
    : (() => {
        // Fallback calculation logic for backward compatibility
  const autoDiscount =
    autoCouponData?.calculation?.discountAmount && !manualCouponApplied
      ? autoCouponData.calculation.discountAmount
      : 0;

        return couponApplied && coupon
      ? {
          subtotal: coupon.originalAmount || coupon.originalTotal || totalAmount,
          discount: coupon.discountAmount || 0,
          total: coupon.finalAmount || coupon.finalTotal || totalAmount,
        }
      : {
          subtotal: totalAmount,
          discount: autoDiscount,
          total: totalAmount - autoDiscount,
        };
      })();

  // ✅ Handle manual coupon apply
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      const response = await applyCoupon({ orderId, couponCode });

      // For manual applyCoupon, success response contains coupon and calculation
      if (response?.coupon && response?.calculation) {
        // Success - no snackbar needed, status will show in UI
        setCouponApplied(true);
        setAppliedCoupon(couponCode);
        setCouponCode("");
      }
    } catch (error) {
      // Manual applyCoupon throws error for validation failures
      // Use snackbar for errors so it doesn't override existing warning messages
      const errorMessage = error?.response?.data?.message || applyCouponError || "Failed to apply coupon";
      enqueueSnackbar(errorMessage, { variant: "error" });
      setCouponApplied(false);
      setAppliedCoupon("");
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setAppliedCoupon("");
    setCouponCode("");
    removeCoupon();
  };

  // ✅ Auto remove coupon after 30 minutes
  useEffect(() => {
    if (couponApplied) {
      const timer = setTimeout(() => handleRemoveCoupon(), 30 * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [couponApplied]);

  return (
    <div className={`flex flex-col ${isMobile ? "gap-4" : "lg:flex-row lg:gap-4"}`}>
      {/* CART ITEMS */}
      <div className="w-full overflow-x-auto">
        {!isMobile ? (
          <TableContainer
            sx={{
              borderRadius: 2,
              overflowX: "auto",
              border: "2px solid var(--primary)",
              maxWidth: "100%",
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ borderBottom: "2px solid var(--primary)" }}>
                  {["Design Image", "Design Code", "Price"].map((heading) => (
                    <TableCell
                      key={heading}
                      sx={{
                        color: "#311807",
                        fontWeight: "bold",
                        fontSize: 16,
                        borderBottom: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {heading}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                      Your cart is empty.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((item, idx) => (
                    <CartItemRow key={item.product?._id || idx} item={item} checkout />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box className="flex flex-col gap-4">
            {products.length === 0 ? (
              <Typography textAlign="center" py={4}>
                Your cart is empty.
              </Typography>
            ) : (
              products.map((item, idx) => (
                <CartItemRow key={item.product?._id || idx} item={item} checkout />
              ))
            )}
          </Box>
        )}
      </div>

      {/* ORDER SUMMARY */}
      <div className={`${isMobile ? "w-full mt-4" : "w-full md:w-5/12 md:sticky md:top-4"}`}>
        <div className="border-2 rounded-xl border-[var(--primary)] p-4 bg-white shadow-md">
          {/* Coupon Input */}
          <Box sx={{ width: "100%", mb: 2 }}>
            <Typography
              component="label"
              htmlFor="couponCode"
              sx={{ fontSize: isMobile ? 12 : 14, mb: 1, display: "block", color: "var(--secondary)" }}
            >
              Coupon Code
            </Typography>

            <div className={`flex ${isMobile ? "flex-col gap-2" : "flex-row gap-4"}`}>
              <TextField
                id="couponCode"
                name="couponCode"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                sx={fieldStyles}
                fullWidth
                required
                // disabled={couponApplied}
              />
              <Button
                variant="contained"
                onClick={handleApplyCoupon}
                disabled={loading}
                sx={{
                  backgroundColor: 'var(--primary)',
                  color: '#311807',
                  fontWeight: 700,
                  px: 4,
                  borderRadius: 3,
                  '&:hover': { backgroundColor: '#FFD966' },
                  mt: isMobile ? 1 : 0
                }}
              >
                {loading ? "Applying..." : "Apply"}
              </Button>
            </div>

            {/* ✅ Coupon reason or message */}
            {couponDetails?.coupon?.reason && (
              <Typography sx={{ mt: 1, fontSize: 14, color: "red" }}>
                {couponDetails.coupon.reason}
              </Typography>
            )}

            {/* Checkout status message */}
            {checkoutMessage && (
              <Typography
                sx={{
                  mt: 1,
                  fontSize: 14,
                  color: checkoutMessage.includes("saved")
                    ? "green"
                    : checkoutMessage.includes("Add")
                    ? "#FFB729"
                    : "orange",
                  fontWeight: checkoutMessage.includes("saved") ? "bold" : "normal"
                }}
              >
                {checkoutMessage}
              </Typography>
            )}

            {/* Auto coupon message */}
            {autoCouponMessage && !checkoutMessage && (
              <Typography
                sx={{
                  mt: 1,
                  fontSize: 14,
                  color: autoCouponMessage.includes("saved")
                    ? "green"
                    : autoCouponMessage.includes("Add")
                    ? "#FFB729"
                    : "orange",
                  fontWeight: autoCouponMessage.includes("saved") ? "bold" : "normal"
                }}
              >
                {autoCouponMessage}
              </Typography>
            )}

          </Box>

          {/* ✅ Manual Coupon Details */}
          


          {/* Totals */}
          <ul className="space-y-2 mt-4">
            <li className="flex text-md justify-between">
              <span>Subtotal</span>
              <span className="font-medium">₹{displayTotals.subtotal}</span>
            </li>
            <li className="flex text-md justify-between">
              <span>Discount</span>
              <span className="font-medium text-green-600">-₹{displayTotals.discount}</span>
            </li>
            <li className="flex text-xl justify-between border-t-2 pt-2 border-[var(--primary)] mt-6 font-bold">
              <span className="gradient-text">Total</span>
              <span className="gradient-text">₹{displayTotals.total}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
