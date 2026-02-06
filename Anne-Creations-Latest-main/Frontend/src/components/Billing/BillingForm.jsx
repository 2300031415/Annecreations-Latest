'use client';
import React, { useState, useEffect } from 'react';
import {
  Accordion, AccordionSummary, AccordionDetails,
  Typography, Box, TextField, Button,
  FormControl, Dialog, DialogTitle, DialogContent,
  List, ListItem, ListItemText, IconButton
} from '@mui/material';
import { MdExpandMore, MdClose } from "react-icons/md";

const commonStyles = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "var(--primary)", borderWidth: "2px", borderRadius: "8px" },
    "&:hover fieldset": { borderColor: "var(--primary)" },
    "&.Mui-focused fieldset": { borderColor: "var(--primary)" },
  },
  "& label.Mui-focused": { color: "var(--secondary)" },
};

const BillingForm = ({
  editAddress,
  form,
  setForm,
  handleBillingSubmit,
  loading,
  countries,
  zones,
  fetchZones
}) => {
  const [expanded, setExpanded] = useState(false);
  const [errors, setErrors] = useState({});
  const [modalOpen, setModalOpen] = useState({ country: false, zone: false });
  const [search, setSearch] = useState({ country: '', zone: '' });

  const selectedCountry = countries.find(c => c._id === form.country) || null;
  const selectedZone = zones.find(z => z._id === form.zone) || null;

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(search.country.toLowerCase())
  );

  const filteredZones = zones.filter(z =>
    z.name.toLowerCase().includes(search.zone.toLowerCase())
  );

  useEffect(() => {
    if (editAddress) {
      setExpanded(true);
      setForm(editAddress);
    }
  }, [editAddress, setForm]);

  const validateField = (name, value) => {
    switch (name) {
      case 'firstName':
      case 'lastName':
      case 'addressLine1':
      case 'city':
      case 'postcode':
      case 'country':
      case 'zone':
        if (!value || value.trim() === '') return 'This field is required';
        break;
      default:
        return '';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;

    setForm((prev) => ({ ...prev, [name]: fieldValue }));

    const errorMessage = validateField(name, fieldValue);
    setErrors((prev) => ({ ...prev, [name]: errorMessage }));

    if (name === "country") {
      setForm((prev) => ({ ...prev, zone: "" }));
      fetchZones(value);
      setErrors((prev) => ({ ...prev, zone: 'This field is required' }));
    }
  };

  const handleSelect = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value._id }));
    setErrors((prev) => ({ ...prev, [name]: '' }));

    if (name === "country") {
      setForm((prev) => ({ ...prev, zone: '' }));
      fetchZones(value._id);
      setErrors((prev) => ({ ...prev, zone: 'This field is required' }));
    }

    setModalOpen((prev) => ({ ...prev, [name]: false }));
    setSearch((prev) => ({ ...prev, [name]: '' }));
  };

  const isFormValid = () => {
    const newErrors = {};
    Object.keys(form).forEach((key) => {
      const errorMessage = validateField(key, form[key]);
      if (errorMessage) newErrors[key] = errorMessage;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid()) return;
    handleBillingSubmit(form);
  };

  const closeIconStyles = {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    cursor: 'pointer',
    color: '#555'
  };

  return (
    <>
      {/* Country Modal */}
      <Dialog open={modalOpen.country} onClose={() => setModalOpen(prev => ({ ...prev, country: false }))} fullWidth>
        <Box sx={{ position: 'relative', p: 2 }}>
          <IconButton onClick={() => setModalOpen(prev => ({ ...prev, country: false }))} sx={closeIconStyles}>
            <MdClose size={24} />
          </IconButton>
          <DialogTitle>Select Country</DialogTitle>
          <TextField
            fullWidth
            placeholder="Search country..."
            value={search.country}
            onChange={(e) => setSearch(prev => ({ ...prev, country: e.target.value }))}
            sx={{ my: 1 }}
          />
          <DialogContent dividers>
            <List>
              {filteredCountries.map((country) => (
                <ListItem button key={country._id} onClick={() => handleSelect('country', country)}>
                  <ListItemText primary={country.name} />
                </ListItem>
              ))}
              {filteredCountries.length === 0 && (
                <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>No countries found.</Typography>
              )}
            </List>
          </DialogContent>
        </Box>
      </Dialog>

      {/* Zone Modal */}
      <Dialog open={modalOpen.zone} onClose={() => setModalOpen(prev => ({ ...prev, zone: false }))} fullWidth>
        <Box sx={{ position: 'relative', p: 2 }}>
          <IconButton onClick={() => setModalOpen(prev => ({ ...prev, zone: false }))} sx={closeIconStyles}>
            <MdClose size={24} />
          </IconButton>
          <DialogTitle>Select State / Zone</DialogTitle>
          <TextField
            fullWidth
            placeholder="Search state / zone..."
            value={search.zone}
            onChange={(e) => setSearch(prev => ({ ...prev, zone: e.target.value }))}
            sx={{ my: 1 }}
          />
          <DialogContent dividers>
            <List>
              {filteredZones.map((zone) => (
                <ListItem button key={zone._id} onClick={() => handleSelect('zone', zone)}>
                  <ListItemText primary={zone.name} />
                </ListItem>
              ))}
              {filteredZones.length === 0 && (
                <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>No zones found.</Typography>
              )}
            </List>
          </DialogContent>
        </Box>
      </Dialog>

      {/* Accordion Form */}
      <Accordion expanded={expanded} onChange={() => setExpanded((prev) => !prev)}>
        <AccordionSummary expandIcon={<MdExpandMore size={24} />}>
          <Typography variant="h6">
            {editAddress ? "Edit Billing Address" : "Add New Billing Address"}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2 }}>
            {/* Name */}
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              <TextField
                label="First Name"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                fullWidth
                sx={commonStyles}
                error={!!errors.firstName}
                helperText={errors.firstName}
                required
              />
              <TextField
                label="Last Name"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                fullWidth
                sx={commonStyles}
                error={!!errors.lastName}
                helperText={errors.lastName}
                required
              />
            </Box>

            {/* Address */}
            <TextField
              label="Address Line 1"
              name="addressLine1"
              value={form.addressLine1}
              onChange={handleChange}
              fullWidth
              sx={commonStyles}
              error={!!errors.addressLine1}
              helperText={errors.addressLine1}
              required
            />
            <TextField
              label="Address Line 2"
              name="addressLine2"
              value={form.addressLine2}
              onChange={handleChange}
              fullWidth
              sx={commonStyles}
            />

            {/* City / Postcode */}
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              <TextField
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
                fullWidth
                sx={commonStyles}
                error={!!errors.city}
                helperText={errors.city}
                required
              />
              <TextField
                label="Postcode"
                name="postcode"
                value={form.postcode}
                onChange={handleChange}
                fullWidth
                sx={commonStyles}
                error={!!errors.postcode}
                helperText={errors.postcode}
                required
              />
            </Box>

            {/* Country / Zone */}
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              <TextField
                label="Country"
                value={selectedCountry?.name || ''}
                onClick={() => setModalOpen(prev => ({ ...prev, country: true }))}
                placeholder="Select country"
                InputProps={{ readOnly: true }}
                fullWidth
                sx={commonStyles}
                error={!!errors.country}
                helperText={errors.country}
                required
              />
              <TextField
                label="State / Zone"
                value={selectedZone?.name || ''}
                onClick={() => setModalOpen(prev => ({ ...prev, zone: true }))}
                placeholder="Select state / zone"
                InputProps={{ readOnly: true }}
                fullWidth
                sx={commonStyles}
                error={!!errors.zone}
                helperText={errors.zone}
                required
              />
            </Box>

            {/* Preferred Checkbox */}
            <FormControl>
              <label>
                <input
                  type="checkbox"
                  name="preferedBillingAddress"
                  checked={form.preferedBillingAddress}
                  onChange={handleChange}
                />{" "}
                Set as Preferred Billing Address
              </label>
            </FormControl>

            {/* Submit Button */}
            <Button
              type="submit"
              sx={{
                backgroundColor: 'var(--primary)',
                borderRadius: '8px',
                border: '2px solid var(--primary)',
                px: 4,
                py: 1.5,
                mt: 2,
                width: { xs: '100%', sm: '40%', md: '25%' },
                color: '#fff',
                fontWeight: 600,
                fontSize: { xs: '14px', sm: '14px' },
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#ffffff',
                  color: 'var(--secondary)',
                },
              }}
              disabled={loading}
            >
              {loading ? "Saving..." : editAddress ? "Update Address" : "Save Address"}
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>
    </>
  );
};

export default BillingForm;
