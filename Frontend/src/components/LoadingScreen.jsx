import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2
      }}
    >
      <CircularProgress size={60} sx={{ color: 'var(--primary)' }} />
      <Typography variant="h6" color="var(--secondary)">
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingScreen;