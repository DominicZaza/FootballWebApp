import React, {useEffect, useState} from 'react';
import {
    AppBar,
    Box,
    FormControl,
    IconButton,
    InputLabel, keyframes,
    Menu,
    MenuItem,
    MenuItem as MenuItemComponent,
    Select,
    Tab,
    Tabs,
    Toolbar,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import SportsFootballIcon from '@mui/icons-material/SportsFootball';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import {signOut} from 'firebase/auth';
import {auth} from '../components/firebase.js';
import {useZAppContext} from '../components/AppContextProvider.tsx';
import {useRestApi} from '../api/RestInvocations.ts';
import GameScoresPage from './GameScoresPage.tsx';
import MyGamesPage from './MyGamesPage.tsx';
import LeaderboardPage from './LeaderboardPage.tsx';


import TeamRankingsAdminPage from './admin/TeamRankingsAdminPage.jsx';
import ChangePasswordDialog from '../pages/ChangePasswordDialog';
import AccountDetailDialog from './AccountDetailDialog.jsx';

const MainPage = ({colorMode, toggleColorMode}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const {
        entries,
        selectedEntry,
        setSelectedEntry,
        setEntries,
        authUser,
        setCurrentWeek,
        setCurrentSeason,
        setAccountBalance,
        accountBalance,
        isAdmin, setIsAdmin,
        setSeasons
    } = useZAppContext();

    const [anchorEl, setAnchorEl] = useState(null);
    const [currentTab, setCurrentTab] = useState(0);
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const [accountDetailOpen, setAccountDetailOpen] = useState(false);
    const [accountDetail, setAccountDetail] = useState(null);
    const [accountDetailLoading, setAccountDetailLoading] = useState(false);
    const [loading, setLoading] = useState(false);

    const {
        getProfileRestCall,
        getEntriesRestCall,
        logoutRestCall,
        getCurrentWeekRestCall,
        getMyAccountBalanceRestCall,
        getMyAccountDetailRestCall,
        getAllSeasonsRestCall
    } = useRestApi();


    const handleAccountBalanceClick = async () => {
        setAccountDetailOpen(true);
        setAccountDetailLoading(true);
        getMyAccountDetailRestCall()
            .then(setAccountDetail)
            .catch(err => console.error("Fetch account detail error:", err))
            .finally(() => setAccountDetailLoading(false));
    };

    // Load entries whenever the user profile changes
    useEffect(() => {
        if (!authUser) return;
        setLoading(true);
        getEntriesRestCall()
            .then(setEntries)
            .catch(err => console.error("Fetch entries error:", err))
            .finally(() => setLoading(false));
    }, [authUser]);

    // After entries load, pick the first one
    useEffect(() => {
        if (entries.length > 0 && !selectedEntry) setSelectedEntry(entries[0]);
    }, [entries, selectedEntry]);

    // Set admin status whenever the user profile changes
    useEffect(() => {
        if (!authUser) return;
        getProfileRestCall()
            .then(userProfile => setIsAdmin(userProfile.admin))
            .catch(err => console.error("Fetch profile error:", err))
            .finally(() => setLoading(false));

    }, [authUser]);


    // Load Current week and season
    useEffect(() => {
        if (!authUser) return;
        setLoading(true);
        getCurrentWeekRestCall()
            .then(currentWeekAndSeason => {
                setCurrentWeek(currentWeekAndSeason.week);
                setCurrentSeason(currentWeekAndSeason.season);
            })
            .catch(err => console.error("Fetch current week and season error:", err))
            .finally(() => setLoading(false));
    }, [authUser]);

    //dependency on authUser
    useEffect(() => {
        if (!authUser) return;
        getAllSeasonsRestCall()
            .then((data) => {
                setSeasons(data);
            })
            .catch((err) => console.error("Error fetching all seasons", err));
    }, [authUser]);

    // Load account balance
    useEffect(() => {
        if (!authUser) return;
        setLoading(true);
        getMyAccountBalanceRestCall()
            .then(setAccountBalance)
            .catch(err => console.error("Fetch account balance error:", err))
            .finally(() => setLoading(false));
    }, [authUser]);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        try {
            await logoutRestCall();
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
        }
        handleMenuClose();
    };

    const handleChangePassword = () => {
        setChangePasswordOpen(true);
        handleMenuClose();
    };

    const handleEntryChange = (event) => {
        const entry = entries.find((e) => e.id === event.target.value);
        setSelectedEntry(entry);
    };

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
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
        <Box sx={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
            <AppBar position="static">
                <Toolbar sx={{flexWrap: isMobile ? 'wrap' : 'nowrap'}}>
                    {/* Logo */}
                    <SportsFootballIcon sx={{mr: 2, fontSize: 40}}/>

                    {/* Entry Selector */}
                    <FormControl sx={{minWidth: 150, mr: 2, mt: isMobile ? 1 : 0}}>
                        <InputLabel id="entry-selector-label" sx={{color: 'white'}}>
                            Entry
                        </InputLabel>
                        <Select
                            labelId="entry-selector-label"
                            id="entrySelector"
                            value={selectedEntry?.id || ''}
                            label="Entry"
                            onChange={handleEntryChange}
                            sx={{color: 'white', '.MuiOutlinedInput-notchedOutline': {borderColor: 'white'}}}
                        >
                            {entries.map((entry) => (
                                <MenuItem key={entry.id} value={entry.id}>
                                    {entry.entry_name + ' [' + entry.season + ' - ' + entry.poolName + ' - $' + entry.denomination + ']'}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box sx={{flexGrow: 1}}/>

                    {/* Color Mode Toggle */}
                    <IconButton sx={{ml: 1}} onClick={toggleColorMode} color="inherit">
                        {colorMode === 'dark' ? <Brightness7Icon/> : <Brightness4Icon/>}
                    </IconButton>

                    {/* Account Balance Button */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        ml: 2,
                        px: 2,
                        py: 0.5,
                        border: `2px solid ${accountBalance < 0 ? 'red' : 'green'}`,
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': {
                            opacity: 0.8,
                            backgroundColor: 'action.hover'
                        }
                    }}
                         onClick={handleAccountBalanceClick}
                    >
                        <AccountBalanceWalletIcon sx={{mr: 1}}/>
                        <Typography variant="body1" sx={{fontWeight: 'bold'}}>
                            ${accountBalance !== null ? accountBalance.toFixed(0) : '0'}
                        </Typography>
                    </Box>

                    {/* User Menu */}
                    <Box sx={{display: 'flex', alignItems: 'center', ml: 2}}>
                        <Typography variant="body1" sx={{mr: 1, display: {xs: 'none', sm: 'block'}}}>
                            {authUser ? authUser.email : "Not logged in"}
                        </Typography>
                        <IconButton
                            size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleMenuOpen}
                            color="inherit"
                        >
                            <AccountCircle/>

                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                        >
                            <MenuItemComponent onClick={handleChangePassword}>
                                Change Password
                            </MenuItemComponent>
                            <MenuItemComponent onClick={handleLogout}>Logout</MenuItemComponent>
                        </Menu>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Navigation Tabs */}
            <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                <Tabs value={currentTab} onChange={handleTabChange} aria-label="navigation tabs">
                    <Tab label="Leaderboard"/>
                    <Tab label="My Games"/>
                    <Tab label="Game Scores"/>
                    {isAdmin && <Tab label="Team Rankings (Admin Only)"/>}
                </Tabs>
            </Box>

            {/* Main Content */}
            <Box sx={{flexGrow: 1, overflow: 'auto', p: isMobile ? 1 : 3}}>
                {currentTab === 0 && <LeaderboardPage/>}
                {currentTab === 1 && <MyGamesPage/>}
                {currentTab === 2 && <GameScoresPage/>}
                {currentTab === 3 && isAdmin && <TeamRankingsAdminPage/>}
            </Box>

            {/* Change Password Dialog */}
            <ChangePasswordDialog
                open={changePasswordOpen}
                onClose={() => setChangePasswordOpen(false)}
                user={authUser}
            />

            {/* Account Detail Dialog */}
            <AccountDetailDialog
                open={accountDetailOpen}
                onClose={() => setAccountDetailOpen(false)}
                accountDetail={accountDetail}
                loading={accountDetailLoading}
            />
        </Box>
    );
};

export default MainPage;
