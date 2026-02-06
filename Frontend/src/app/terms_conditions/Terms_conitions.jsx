import React from 'react';
import { Container, Typography, Box, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { MdCheckCircle } from 'react-icons/md';

const termsContent = [
  {
    title: 'Digital Products',
    points: [
      'All products sold on our website are digital embroidery designs available for download after purchase.',
      'No physical items will be shipped.',
    ],
  },
  {
    title: 'Usage Rights',
    points: [
      'Purchased designs are for personal and commercial use in creating embroidery on garments, textiles, and related products.',
      'You may not resell, share, distribute, or claim ownership of our digital files.',
      'Designs must not be modified for resale or uploaded to any online marketplace as digital files.',
    ],
  },
  {
    title: 'Pricing & Payments',
    points: [
      'All prices listed on our website are in the applicable currency and subject to change without notice.',
      'Payments must be completed in full before download access is granted.',
    ],
  },
  {
    title: 'Returns & Cancellations',
    points: [
      'Due to the digital nature of our products, all sales are final. No refunds, cancellations, or exchanges are offered.',
      'Customers are advised to review product details and formats carefully before purchase.',
    ],
  },
];

const TermsAndConditions = () => {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 6 }}>
        Terms & Conditions
      </Typography>
      <p className='my-10'>Welcome to <strong>Anne Creations HB</strong> . By accessing or using our website and purchasing our embroidery designs, you agree to comply with the following Terms & Conditions. Please read them carefully.</p>
     {termsContent.map((section, index) => (
        <div key={index} className="mb-10">
          <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
          <ul className="list-none p-0 m-0">
            {section.points.map((point, i) => (
              <li key={i} className="flex items-start mb-2">
                <MdCheckCircle className="text-green-500 mr-2 mt-1" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Container>
  );
};

export default TermsAndConditions;
