import React, {useState, useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {ThemeProvider, createTheme} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {onAuthStateChanged} from 'firebase/auth';
import {auth} from './firebase.ts';
import {AppProvider} from './AppContextProvider.tsx';
import LoginPage from '../pages/LoginPage';
import NavigationPage from '../pages/NavigationPage.tsx';
import LandscapeWarning from '../pages/LandscapeWarningDialog';
import {NotificationProvider} from "./NotificationProvider";
import LoadingSpinner from "./LoadingSpinner.tsx";

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


    if (loading) {
        return (
            <LoadingSpinner
                backgroundColor={colorMode === 'dark' ? '#121212' : '#ffffff'}
                fullPage={true}
            />
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <LandscapeWarning/>
            <AppProvider>
                <NotificationProvider>
                    <Router>
                        <Routes>
                            <Route
                                path="/login"
                                element={user ? <Navigate to="/"/> : <LoginPage/>}
                            />
                            <Route
                                path="/"
                                element={
                                    user ? (
                                        <NavigationPage
                                            colorMode={colorMode}
                                            toggleColorMode={toggleColorMode}
                                        />
                                    ) : (
                                        <Navigate to="/login"/>
                                    )
                                }
                            />
                        </Routes>
                    </Router>
                </NotificationProvider>
            </AppProvider>
        </ThemeProvider>
    );
}

export default App;
