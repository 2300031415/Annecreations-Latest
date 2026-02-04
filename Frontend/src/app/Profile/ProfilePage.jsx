'use client';
import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import AccountTabs from './AccountsTab';

export default function ProfilePage() {
  return (
    <Suspense 
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      }
    >
      <AccountTabs />
    </Suspense>
  );
}
