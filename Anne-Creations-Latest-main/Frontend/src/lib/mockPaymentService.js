
// Mock Payment Data for Razorpay (Replace with actual backend call)
export const createPaymentInfoMock = async (orderId) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
        orderNumber: `ORD-${Date.now()}`,
        amount: 50000, // 500.00 INR in paise
        currency: 'INR',
        paymentRequired: true,
        razorpayOrderId: `order_mock_${Date.now()}`,
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerContact: '9999999999'
    };
};

// Mock Verify Payment
export const verifyPaymentMock = async (payload) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
};
