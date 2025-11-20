import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import ScreenRotationIcon from '@mui/icons-material/ScreenRotation';

const LandscapeWarning = () => {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isPortrait = window.innerHeight > window.innerWidth;
      
      //setShowWarning(isMobile && isPortrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!showWarning) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          textAlign: 'center',
          maxWidth: '90%',
        }}
      >
        <ScreenRotationIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Please Rotate Your Device
        </Typography>
        <Typography variant="body1">
          This application works best in landscape mode.
        </Typography>
      </Paper>
    </Box>
  );
};

export default LandscapeWarning;
