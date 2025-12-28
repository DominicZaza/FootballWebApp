import { Box, keyframes } from '@mui/material';
import SportsFootballIcon from '@mui/icons-material/SportsFootball';
import React from "react";

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

interface LoadingSpinnerProps {
    height?: string | number;
    backgroundColor?: string;
    fullPage?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
    height = '100dvh', 
    backgroundColor = 'transparent',
    fullPage = true
}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: fullPage ? '100dvh' : height,
                width: '100%',
                backgroundColor: backgroundColor,
                overflow: 'hidden', // Prevent scrollbars during animation
                position: fullPage ? 'fixed' : 'relative',
                top: 0,
                left: 0,
                zIndex: 9999,
            }}
        >
            <SportsFootballIcon
                sx={{
                    fontSize: 80,
                    color: '#1976d2',
                    animation: `${spin} 1s linear infinite`,
                }}
            />
        </Box>
    );
};

export default LoadingSpinner;
