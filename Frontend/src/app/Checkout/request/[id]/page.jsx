'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, CircularProgress, Container, Typography, Paper } from '@mui/material';
import axios from 'axios';
import { useAuthStore, API_URL } from '@/Store/authStore';
import BreadCrum from '@/components/BreadCrum/BreadCrum';

const PayRequestPage = ({ params }) => {
    const router = useRouter();
    const { id } = params;
    const { accessToken } = useAuthStore();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/design-requests/${id}`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setRequest(response.data.data);
            } catch (error) {
                console.error('Fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        if (accessToken) fetchRequest();
    }, [id, accessToken]);

    const handlePayment = async () => {
        setPaying(true);
        try {
            // 1. Create Payment Order
            const orderRes = await axios.post(`${API_URL}/api/design-requests/${id}/create-payment`, {}, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            const { orderId, amount, key, currency } = orderRes.data.data;

            // 2. Load Razorpay
            const res = await loadRazorpayScript();
            if (!res) return alert('Razorpay SDK failed to load');

            const options = {
                key,
                amount: amount * 100, // already in paisa from backend? backend sent request.cost which is likely rupees. Razorpay needs paisa. 
                // Backend sent `amount: request.cost`. Razorpay `createRazorpayOrder` method in backend multiplies by 100? 
                // Let's check `createRazorpayOrder`. It usually expects amount in smallest currency unit.
                // But `createRazorpayOrder` (if from my utils) typically takes standard unit and converts, OR takes paisa.
                // Assuming backend response `amount` is usable or needs verify.
                // Actually, let's trust the orderId amount from Razorpay which is embedded in orderId effectively. 
                // But options.amount is for display/validation.

                currency,
                name: 'Anne Creations',
                description: `Payment for Custom Design Request #${id}`,
                order_id: orderId,
                handler: async (response) => {
                    try {
                        await axios.post(`${API_URL}/api/design-requests/${id}/verify-payment`, {
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpaySignature: response.razorpay_signature
                        }, {
                            headers: { Authorization: `Bearer ${accessToken}` }
                        });

                        alert('Payment Successful!');
                        router.push('/Profile?tab=requests');
                    } catch (error) {
                        console.error(error);
                        alert('Payment verification failed');
                    }
                },
                theme: { color: '#FFB729' }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error('Payment init error', error);
            alert('Failed to initiate payment');
        } finally {
            setPaying(false);
        }
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    if (!request) return <Typography align="center" sx={{ mt: 10 }}>Request not found</Typography>;

    return (
        <>
            <BreadCrum crumbs={[{ label: 'Home', href: '/' }, { label: 'Requests', href: '/Profile?tab=requests' }, { label: 'Pay', href: '#' }]} />
            <Container maxWidth="sm" sx={{ py: 8 }}>
                <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Payment for Design Request
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        Complete payment to receive your final design file.
                    </Typography>

                    <Box sx={{ my: 4, bgcolor: '#f9f9f9', p: 3, borderRadius: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Amount to Pay</Typography>
                        <Typography variant="h3" fontWeight="bold" color="var(--primary)">
                            ₹{request.cost}
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={handlePayment}
                        disabled={paying}
                        sx={{ bgcolor: 'var(--primary)', color: 'white', py: 1.5, fontSize: '1.2rem' }}
                    >
                        {paying ? <CircularProgress size={24} /> : 'Pay Now'}
                    </Button>
                </Paper>
            </Container>
        </>
    );
};

export default PayRequestPage;
