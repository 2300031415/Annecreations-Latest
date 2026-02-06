'use client';

import React, { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Paper,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { MdCloudUpload, MdSend } from 'react-icons/md';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useAuthStore, API_URL } from '@/Store/authStore';
import { useRouter } from 'next/navigation';
import BreadCrum from '@/components/BreadCrum/BreadCrum';

const NewStyleRequest = () => {
    const router = useRouter();
    const { accessToken, isAuthenticated } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [selectedImages, setSelectedImages] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);

    const { register, handleSubmit, formState: { errors } } = useForm();

    const handleImageChange = (event) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            if (files.length + selectedImages.length > 5) {
                alert('You can only upload up to 5 images');
                return;
            }

            setSelectedImages([...selectedImages, ...files]);

            // Create previews
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviewUrls([...previewUrls, ...newPreviews]);
        }
    };

    const onSubmit = async (data) => {
        if (!isAuthenticated) {
            router.push('/Auth/Login?redirect=/my-style-requests');
            return;
        }

        if (selectedImages.length === 0) {
            setSubmitError('Please upload at least one image.');
            return;
        }

        setLoading(true);
        setSubmitError(null);

        try {
            // Combine extra fields into description
            const combinedDescription = `
**Size:** ${data.size}
**Format:** ${data.format}
**Fabric:** ${data.fabric}
**Placement:** ${data.placement}

**Description:**
${data.description}
            `.trim();

            const formData = new FormData();
            formData.append('description', combinedDescription);
            formData.append('colors', data.colors);

            selectedImages.forEach(image => {
                formData.append('images', image);
            });

            await axios.post(`${API_URL}/api/design-requests`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${accessToken}`
                }
            });

            // Redirect to Requests List
            router.push('/Profile?tab=requests');
        } catch (error) {
            console.error('Submission failed', error);
            setSubmitError(error.response?.data?.message || 'Failed to submit request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <BreadCrum
                crumbs={[
                    { label: 'Home', href: '/' },
                    { label: 'New Custom Design Request', href: '/my-style-requests' },
                ]}
            />
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: '1px solid #eee' }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography variant="h4" fontWeight="bold" gutterBottom color="var(--secondary)">
                            Custom Design Request
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Upload your reference images and tell us what you need. We'll review your request and provide a quote.
                        </Typography>
                    </Box>

                    {submitError && (
                        <Alert severity="error" sx={{ mb: 3 }}>{submitError}</Alert>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)}>

                        {/* Image Upload Section */}
                        <Box
                            sx={{
                                border: '2px dashed #ccc',
                                borderRadius: 2,
                                p: 4,
                                textAlign: 'center',
                                mb: 4,
                                cursor: 'pointer',
                                bgcolor: '#fafafa',
                                transition: 'all 0.3s',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                '&:hover': { borderColor: 'var(--primary)', bgcolor: '#fff' }
                            }}
                            component="label"
                        >
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                hidden
                                onChange={handleImageChange}
                            />
                            <MdCloudUpload size={48} color="#ccc" style={{ marginBottom: 16 }} />
                            <Typography variant="h6" fontWeight="bold">Click to upload images</Typography>
                            <Typography variant="body2" color="text.secondary">Support JPG, PNG (Max 5 images)</Typography>
                        </Box>

                        {/* Image Previews */}
                        {previewUrls.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
                                {previewUrls.map((url, index) => (
                                    <Box
                                        key={index}
                                        component="img"
                                        src={url}
                                        sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 2, border: '1px solid #ddd' }}
                                    />
                                ))}
                            </Box>
                        )}

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
                            <FormControl fullWidth error={!!errors.size}>
                                <InputLabel id="size-label">Size</InputLabel>
                                <Select
                                    labelId="size-label"
                                    id="size-select"
                                    label="Size"
                                    defaultValue=""
                                    {...register('size', { required: 'Size is required' })}
                                >
                                    <MenuItem value="4x4">4x4 inch</MenuItem>
                                    <MenuItem value="5x7">5x7 inch</MenuItem>
                                    <MenuItem value="6x10">6x10 inch</MenuItem>
                                    <MenuItem value="8x8">8x8 inch</MenuItem>
                                    <MenuItem value="Other">Other</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth error={!!errors.format}>
                                <InputLabel id="format-label">Format</InputLabel>
                                <Select
                                    labelId="format-label"
                                    id="format-select"
                                    label="Format"
                                    defaultValue=""
                                    {...register('format', { required: 'Format is required' })}
                                >
                                    <MenuItem value="PES">PES (Brother/Babylock)</MenuItem>
                                    <MenuItem value="DST">DST (Tajima)</MenuItem>
                                    <MenuItem value="JEF">JEF (Janome)</MenuItem>
                                    <MenuItem value="XXX">XXX (Singer)</MenuItem>
                                    <MenuItem value="EXP">EXP (Melco/Bernina)</MenuItem>
                                    <MenuItem value="Other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
                            <FormControl fullWidth error={!!errors.fabric}>
                                <InputLabel id="fabric-label">Fabric Type</InputLabel>
                                <Select
                                    labelId="fabric-label"
                                    id="fabric-select"
                                    label="Fabric Type"
                                    defaultValue=""
                                    {...register('fabric', { required: 'Fabric type is required' })}
                                >
                                    <MenuItem value="Cotton">Cotton</MenuItem>
                                    <MenuItem value="Polyester">Polyester</MenuItem>
                                    <MenuItem value="Denim">Denim</MenuItem>
                                    <MenuItem value="Knits">Knits / Stretchy</MenuItem>
                                    <MenuItem value="Canvas">Canvas</MenuItem>
                                    <MenuItem value="Other">Other</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth error={!!errors.placement}>
                                <InputLabel id="placement-label">Placement</InputLabel>
                                <Select
                                    labelId="placement-label"
                                    id="placement-select"
                                    label="Placement"
                                    defaultValue=""
                                    {...register('placement', { required: 'Placement is required' })}
                                >
                                    <MenuItem value="Left Chest">Left Chest</MenuItem>
                                    <MenuItem value="Center Chest">Center Chest</MenuItem>
                                    <MenuItem value="Full Back">Full Back</MenuItem>
                                    <MenuItem value="Cap">Cap / Hat</MenuItem>
                                    <MenuItem value="Sleeve">Sleeve</MenuItem>
                                    <MenuItem value="Other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <TextField
                            label="Preferred Colors"
                            fullWidth
                            variant="outlined"
                            sx={{ mb: 3 }}
                            placeholder="e.g., Red, Gold, Navy Blue"
                            {...register('colors', { required: 'Please specify preferred colors' })}
                            error={!!errors.colors}
                            helperText={errors.colors?.message}
                        />

                        <TextField
                            label="Description & Requirements"
                            fullWidth
                            multiline
                            rows={4}
                            variant="outlined"
                            sx={{ mb: 4 }}
                            placeholder="Describe your design idea, placement, size, or any specific details..."
                            {...register('description', { required: 'Please provide a description' })}
                            error={!!errors.description}
                            helperText={errors.description?.message}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            fullWidth
                            disabled={loading}
                            startIcon={!loading && <MdSend />}
                            sx={{
                                py: 1.5,
                                bgcolor: 'var(--primary)',
                                color: 'white',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                '&:hover': { bgcolor: 'var(--secondary)' }
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit Request'}
                        </Button>

                    </form>
                </Paper>
            </Container>
        </>
    );
};

export default NewStyleRequest;
