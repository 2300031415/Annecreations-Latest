'use client';

import React from 'react';
import { Skeleton, Box, Card, CardContent, CardMedia } from '@mui/material';

const ArrivalSkeletonList = ({ count = 6, columns = 'grid-cols-4' }) => {
  // Reusable skeleton card component
  const SkeletonCard = () => (
    <Card
      sx={{
        width: '100%',
        maxWidth: 280,
        boxShadow: 3,
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Image Skeleton */}
      <CardMedia>
        <Skeleton
          variant="rectangular"
          width="100%"
          height={240}
          animation="wave"
          sx={{
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          }}
        />
      </CardMedia>

      {/* Content Skeleton */}
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Skeleton variant="text" width="60%" height={28} />
          <Skeleton variant="text" width="25%" height={28} />
        </Box>

        <Skeleton variant="text" width="80%" height={22} />
      </CardContent>
    </Card>
  );

  return (
    <div className={`grid gap-6 w-full ${columns}`}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
};

export default ArrivalSkeletonList;
