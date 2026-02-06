'use client';
import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { FaWallet, FaPlus } from 'react-icons/fa';
import useWalletStore from '@/Store/walletStore';
import { useSnackbar } from 'notistack';

const Wallet = () => {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const { balance, currency, transactions, isLoading, fetchWallet, initiateAddFunds, verifyAddFunds } = useWalletStore();

    const [openAddMoney, setOpenAddMoney] = useState(false);
    const [amount, setAmount] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchWallet();
        // Load Razorpay script dynamically if not present
        if (!document.getElementById('razorpay-script')) {
            const script = document.createElement('script');
            script.id = 'razorpay-script';
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);
        }
    }, [fetchWallet]);

    const handleAddMoney = async () => {
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            enqueueSnackbar('Please enter a valid amount', { variant: 'error' });
            return;
        }

        setIsAdding(true);

        // 1. Initiate Payment (Get Order ID)
        const initResult = await initiateAddFunds(Number(amount));

        if (!initResult.success) {
            enqueueSnackbar(initResult.message, { variant: 'error' });
            setIsAdding(false);
            return;
        }

        const { key, orderId, amount: amountInPaise, currency: orderCurrency } = initResult.data;

        // 2. Open Razorpay Modal
        const options = {
            key: key,
            amount: amountInPaise,
            currency: orderCurrency,
            name: "Anne Creations",
            description: "Wallet Top-up",
            order_id: orderId,
            handler: async function (response) {
                // 3. Verify Payment
                const paymentData = {
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                    amount: Number(amount) // Send original amount for logic if needed
                };

                const verifyResult = await verifyAddFunds(paymentData);

                if (verifyResult.success) {
                    enqueueSnackbar(verifyResult.message, { variant: 'success' });
                    setOpenAddMoney(false);
                    setAmount('');
                } else {
                    enqueueSnackbar(verifyResult.message, { variant: 'error' });
                }
                setIsAdding(false);
            },
            prefill: {
                name: "Customer Name", //Ideally get from Auth Store
                contact: ""            //Ideally get from Auth Store
            },
            theme: {
                color: "#1e1e1e"
            },
            modal: {
                ondismiss: function () {
                    setIsAdding(false);
                    enqueueSnackbar('Payment cancelled', { variant: 'info' });
                }
            }
        };

        const rzp1 = new window.Razorpay(options);
        rzp1.on('payment.failed', function (response) {
            enqueueSnackbar(response.error.description || 'Payment Failed', { variant: 'error' });
            setIsAdding(false);
        });

        rzp1.open();
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, width: '100%' }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FaWallet /> {t('wallet.title', 'My Wallet')}
                </Typography>

                <Button
                    variant="contained"
                    startIcon={<FaPlus />}
                    onClick={() => setOpenAddMoney(true)}
                    sx={{
                        bgcolor: 'white',
                        color: 'var(--secondary)',
                        borderRadius: '20px',
                        border: '2px solid var(--secondary)',
                        fontWeight: 'bold',
                        '&:hover': { bgcolor: 'var(--secondary)', color: 'white' }
                    }}
                >
                    {t('wallet.add_money', 'Add Money')}
                </Button>
            </Box>

            {/* Balance Card */}
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    mb: 4,
                    background: 'linear-gradient(135deg, #1e1e1e 0%, #3e2723 100%)', // Dark premium brown/black gradient
                    borderRadius: 4,
                    color: '#ffd700', // Gold text
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography variant="subtitle1" sx={{ opacity: 0.8, color: '#fff', mb: 1, letterSpacing: 1 }}>
                        {t('wallet.available_balance', 'AVAILABLE BALANCE')}
                    </Typography>
                    <Typography variant="h2" sx={{ fontWeight: 'bold', textShadow: '0px 2px 4px rgba(0,0,0,0.3)' }}>
                        {currency} {balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                </Box>
                {/* Decorative circle */}
                <Box sx={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255, 215, 0, 0.1)'
                }} />
            </Paper>

            {/* Transactions History */}
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: 'var(--secondary)' }}>
                {t('wallet.history', 'Transaction History')}
            </Typography>

            {isLoading && transactions.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress sx={{ color: 'var(--secondary)' }} />
                </Box>
            ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', borderRadius: 2 }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f9f9f9' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Amount</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.length > 0 ? (
                                transactions.map((tx) => (
                                    <TableRow key={tx._id} hover>
                                        <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>{tx.description}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={tx.type}
                                                size="small"
                                                sx={{
                                                    bgcolor: tx.type === 'CREDIT' ? '#e6f4ea' : '#fce8e6',
                                                    color: tx.type === 'CREDIT' ? '#1e4620' : '#c5221f',
                                                    fontWeight: 'bold'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'right', fontWeight: 'bold', color: tx.type === 'CREDIT' ? 'green' : 'red' }}>
                                            {tx.type === 'CREDIT' ? '+' : '-'} {currency} {tx.amount}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>
                                            <Chip label={tx.status} size="small" variant="outlined" color={tx.status === 'COMPLETED' ? 'success' : 'warning'} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                        {t('wallet.no_transactions', 'No transactions found.')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Add Money Dialog */}
            <Dialog open={openAddMoney} onClose={() => setOpenAddMoney(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold', color: 'var(--secondary)' }}>{t('wallet.add_money', 'Add Money to Wallet')}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>Enter the amount you wish to add to your wallet.</Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Amount (INR)"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        InputProps={{
                            startAdornment: <Box component="span" sx={{ mr: 1, color: 'text.secondary' }}>₹</Box>,
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenAddMoney(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
                    <Button
                        onClick={handleAddMoney}
                        variant="contained"
                        disabled={isAdding}
                        sx={{
                            bgcolor: 'white',
                            color: 'var(--secondary)',
                            border: '2px solid var(--secondary)',
                            borderRadius: '20px',
                            fontWeight: 'bold',
                            '&:hover': { bgcolor: 'var(--secondary)', color: 'white' }
                        }}
                    >
                        {isAdding ? <CircularProgress size={24} sx={{ color: 'var(--secondary)' }} /> : 'Add Money'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Wallet;
