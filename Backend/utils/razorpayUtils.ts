import Razorpay from 'razorpay';

import { generateSignature } from './signatureUtils';

// Validate Razorpay environment variables
const validateRazorpayConfig = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.warn('⚠️  Razorpay configuration missing. Payment features will be disabled.');
    console.warn('   Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file');
    return null;
  }

  return { key_id: keyId, key_secret: keySecret };
};

// Initialize Razorpay instance only if configuration is available
const razorpayConfig = validateRazorpayConfig();
const razorpay = razorpayConfig ? new Razorpay(razorpayConfig) : null;

/**
 * Create a Razorpay order
 */
export const createRazorpayOrder = async (
  amount: number,
  currency: string = 'INR',
  receipt?: string
) => {
  if (!razorpay) {
    throw new Error(
      'Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.'
    );
  }

  try {
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1, // Auto capture payment
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.log('second', error);
    throw new Error(
      `Failed to create Razorpay order: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Verify payment signature
 */
export const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  if (!razorpayConfig) {
    console.warn('Razorpay is not configured. Payment signature verification failed.');
    return false;
  }

  try {
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = generateSignature(text, razorpayConfig.key_secret);

    return generatedSignature === signature;
  } catch {
    return false;
  }
};

/**
 * Get payment details from Razorpay
 */
export const getPaymentDetails = async (paymentId: string) => {
  if (!razorpay) {
    throw new Error(
      'Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.'
    );
  }

  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    throw new Error(
      `Failed to fetch payment details: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Refund payment
 */
export const refundPayment = async (paymentId: string, amount: number) => {
  if (!razorpay) {
    throw new Error(
      'Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.'
    );
  }

  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount * 100, // Convert to paise
    });
    return refund;
  } catch (error) {
    throw new Error(
      `Failed to refund payment: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Get refund details
 */
export const getRefundDetails = async (paymentId: string, refundId: string) => {
  if (!razorpay) {
    throw new Error(
      'Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.'
    );
  }

  try {
    const refund = await razorpay.payments.fetchRefund(paymentId, refundId);
    return refund;
  } catch (error) {
    throw new Error(
      `Failed to fetch refund details: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Format amount for display (convert from paise to rupees)
 */
export const formatAmount = (amountInPaise: number): number => {
  return amountInPaise / 100;
};

/**
 * Format amount for Razorpay (convert from rupees to paise)
 */
export const formatAmountForRazorpay = (amountInRupees: number): number => {
  return Math.round(amountInRupees * 100);
};

/**
 * Verify webhook signature
 */
export const verifyWebhookSignature = (
  webhookBody: string,
  webhookSignature: string,
  webhookSecret: string
): boolean => {
  try {
    const expectedSignature = generateSignature(webhookBody, webhookSecret);

    return expectedSignature === webhookSignature;
  } catch {
    return false;
  }
};

/**
 * Check if Razorpay is properly configured
 */
export const isRazorpayConfigured = (): boolean => {
  return razorpay !== null;
};

export default razorpay;
