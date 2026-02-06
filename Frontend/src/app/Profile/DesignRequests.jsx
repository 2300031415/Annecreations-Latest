'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    CircularProgress
} from '@mui/material';
import { MdVisibility, MdCloudDownload, MdAdd } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuthStore, API_URL } from '@/Store/authStore';
import Image from 'next/image';

const DesignRequests = () => {
    const router = useRouter();
    const { accessToken } = useAuthStore();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/design-requests`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setRequests(response.data.data || []);
            } catch (error) {
                console.error('Failed to fetch requests', error);
            } finally {
                setLoading(false);
            }
        };

        if (accessToken) {
            fetchRequests();
        }
    }, [accessToken]);

    const handleDownload = async (id) => {
        try {
            // Open in new tab which will trigger download
            window.open(`${API_URL}/api/design-requests/${id}/download?token=${accessToken}`, '_blank');
        } catch (error) {
            console.error('Download failed', error);
        }
    };

    const statusColors = {
        pending: 'warning',
        reviewed: 'info',
        paid: 'success',
        completed: 'success',
        rejected: 'error'
    };

    if (loading) return <CircularProgress />;

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h5" fontWeight="bold">My Design Requests</Typography>
                <Button
                    variant="contained"
                    startIcon={<MdAdd />}
                    onClick={() => router.push('/my-style-requests')}
                    sx={{
                        bgcolor: 'var(--primary)',
                        color: 'white',
                        '&:hover': { bgcolor: 'var(--secondary)' }
                    }}
                >
                    New Request
                </Button>
            </Box>

            {requests.length === 0 ? (
                <Typography color="text.secondary" align="center">No design requests found.</Typography>
            ) : (
                <Grid container spacing={3}>
                    {requests.map((req) => (
                        <Grid item xs={12} sm={6} md={4} key={req._id}>
                            <Card sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                            }}>
                                <Box sx={{ position: 'relative', height: 160, width: '100%', bgcolor: '#f5f5f5' }}>
                                    {req.images?.[0] ? (
                                        <Image
                                            src={`${API_URL}/${req.images[0]}`}
                                            alt="Design Request"
                                            fill
                                            style={{ objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                            <Typography variant="body2" color="text.secondary">No Image</Typography>
                                        </Box>
                                    )}
                                    <Chip
                                        label={req.status}
                                        color={statusColors[req.status] || 'default'}
                                        size="small"
                                        sx={{ position: 'absolute', top: 8, right: 8 }}
                                    />
                                </Box>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        {new Date(req.createdAt).toLocaleDateString()}
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
                                        {req.cost > 0 ? `₹${req.cost}` : 'Cost: Pending'}
                                    </Typography>
                                </CardContent>
                                <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'space-between' }}>
                                    <IconButton
                                        onClick={() => { setSelectedRequest(req); setOpenDialog(true); }}
                                        color="primary"
                                    >
                                        <MdVisibility />
                                    </IconButton>

                                    {(req.status === 'completed' || req.status === 'paid') && (
                                        <IconButton
                                            onClick={() => handleDownload(req._id)}
                                            color="success"
                                        >
                                            <MdCloudDownload />
                                        </IconButton>
                                    )}

                                    {req.status === 'reviewed' && req.paymentStatus !== 'paid' && (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            color="primary"
                                            onClick={() => router.push(`/checkout/request/${req._id}`)} // Assuming checkout flow
                                        >
                                            Pay Now
                                        </Button>
                                    )}
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Details Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Request Details</DialogTitle>
                <DialogContent dividers>
                    {selectedRequest && (
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">Description:</Typography>
                            <Typography variant="body1" paragraph>{selectedRequest.description}</Typography>

                            <Typography variant="subtitle2" color="text.secondary">Colors:</Typography>
                            <Typography variant="body1" paragraph>{selectedRequest.colors || 'N/A'}</Typography>

                            <Typography variant="subtitle2" color="text.secondary">Admin Comments:</Typography>
                            <Typography variant="body1" sx={{ fontStyle: 'italic', bgcolor: '#f9f9f9', p: 1, borderRadius: 1 }}>
                                {selectedRequest.adminComments || 'No comments yet.'}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DesignRequests;
