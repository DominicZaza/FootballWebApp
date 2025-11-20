import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import {AppProvider} from './AppContextProvider.tsx';
import LoginPage from '../pages/LoginPage';
import MainPage from '../pages/MainPage.tsx';
import LandscapeWarning from '../pages/LandscapeWarningDialog';
import SportsFootballIcon from '@mui/icons-material/SportsFootball';
import { Box, keyframes } from '@mui/material';
import { NotificationsPanel } from './NotificationsPanel.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [colorMode, setColorMode] = useState('dark');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const theme = createTheme({
    palette: {
      mode: colorMode,
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
  });

  const toggleColorMode = () => {
    setColorMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const spin = keyframes`
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  `;

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: colorMode === 'dark' ? '#121212' : '#ffffff',
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
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LandscapeWarning />
      <AppProvider>
        <NotificationsPanel />
        <Router>
          <Routes>
            <Route
              path="/login"
              element={user ? <Navigate to="/" /> : <LoginPage />}
            />
            <Route
              path="/"
              element={
                user ? (
                  <MainPage
                    colorMode={colorMode}
                    toggleColorMode={toggleColorMode}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </Routes>
        </Router>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
