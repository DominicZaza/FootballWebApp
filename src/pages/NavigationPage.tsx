import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    AppBar,
    Box,
    FormControl,
    IconButton,
    InputLabel,
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

import type {SelectChangeEvent} from '@mui/material/Select';

import SportsFootballIcon from '@mui/icons-material/SportsFootball';
import Avatar from '@mui/material/Avatar';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import {onAuthStateChanged, signOut} from 'firebase/auth';
import {auth} from '../components/firebase.ts';
import {useZAppContext} from '../components/AppContextProvider.tsx';
import {useRestApi} from '../api/RestInvocations.ts';
import GameScoresPage from './GameScoresPage.tsx';
import MyPicksPage from './MyPicksPage.tsx';
import LeaderboardPage from './LeaderboardPage.tsx';
import WeeklyPicksPage from './WeeklyPicksPage.tsx';
import {zWebSocket} from '../hooks/useStompClient';


import TeamRankingsAdminPage from './admin/TeamRankingsAdminPage.jsx';
import ChangePasswordDialog from '../pages/ChangePasswordDialog';
import AccountDetailDialog from './AccountDetailDialog.tsx';
import type {WeekRollEvent} from "../types/ZEvents";

import WeeklyPickemsPage from './pickem/WeeklyPickemsPage.tsx';
import MyPickemsPage from './pickem/MyPickemsPage.tsx';
import LoadingSpinner from "../components/LoadingSpinner.tsx";


const NavigationPage = ({colorMode, toggleColorMode}: {
    colorMode: 'light' | 'dark';
    toggleColorMode: () => void;
}) => {
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
        setCurrentPeriod,
        setAccountBalance,
        accountBalance,
        isAdmin, setIsAdmin,
        setSeasons, setAuthUser
    } = useZAppContext();

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
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
        getCurrentSeasonRestCall,
        getCurrentPeriodRestCall,
        getMyAccountBalanceRestCall,
        getMyAccountDetailRestCall,
        getAllSeasonsRestCall,
    } = useRestApi();

    const {useStompSubscription} = zWebSocket();

    const handleAccountBalanceClick = async () => {
        setAccountDetailOpen(true);
        setAccountDetailLoading(true);
        getMyAccountDetailRestCall()
            .then(setAccountDetail)
            .catch(err => console.error("Fetch account detail error:", err))
            .finally(() => setAccountDetailLoading(false));
    };

    const [authInitialized, setAuthInitialized] = useState(false);

    useEffect(() => {
        return onAuthStateChanged(auth, user => {
            setAuthUser(user);
            setAuthInitialized(true);
        });

    }, []);


//load all data once authUser is available
    useEffect(() => {
        if (!authInitialized || !authUser) return;

        setLoading(true);

        Promise.all([
            getEntriesRestCall().then(setEntries),
            getCurrentWeekRestCall().then(setCurrentWeek),
            getCurrentSeasonRestCall().then(setCurrentSeason),
            getCurrentPeriodRestCall().then(setCurrentPeriod),
            getMyAccountBalanceRestCall().then(setAccountBalance),
            getAllSeasonsRestCall().then(setSeasons),
            getProfileRestCall().then(p => setIsAdmin(p.admin)),
        ])
            .catch( (e) => {alert(e);})
            .finally(() => setLoading(false));
    }, [authUser]);


    // After entries load, pick the first one
    useEffect(() => {
        if (entries.length > 0 && !selectedEntry) setSelectedEntry(entries[0]);
    }, [entries, selectedEntry]);


    // WebSocket message handler
    const handleWeekHasBeenRolledUpdate = useCallback((event: WeekRollEvent) => {
        if (!event) return;
        setCurrentWeek(event.week);
    }, []);

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
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


    const handleEntryChange = (event: SelectChangeEvent<string>) => {
        const entryId = event.target.value;
        const entry = entries.find(e => e.id == entryId);
        setSelectedEntry(entry ?? null);
    };


    //websocket subscriptions
    useStompSubscription('/topic/zevents/WeekRollUpdate', handleWeekHasBeenRolledUpdate);

    const poolTypeId = selectedEntry?.poolTypeId ;

    // Use tab IDs instead of numeric indices ... MUI explicitly supports false as a valid “no selection” value.
    const [currentTabId, setCurrentTabId] = useState<string | false>(false);


    const tabsForPoolType = useMemo(() => {
        if (!selectedEntry) return [];
        // Define per-pool tabs here. GameScoresPage is reused.
        const commonAdminTab = {
            id: 'adminTeamRankings',
            label: 'Team Rankings (Admin Only)',
            element: <TeamRankingsAdminPage/>,
            isVisible: () => isAdmin,
        };

        const sweepstakesTabs = [
            {id: 'allPicks', label: 'All Picks', element: <WeeklyPicksPage/>},
            {id: 'leaderboard', label: 'Leaderboard', element: <LeaderboardPage/>},
            {id: 'myPicks', label: 'My Picks', element: <MyPicksPage/>},
            {id: 'gameScores', label: 'Game Scores', element: <GameScoresPage/>},
            commonAdminTab,
        ];

        const pickemTabs = [
            {id: 'myPickem', label: 'My Pickem', element: <MyPickemsPage/>},
            {id: 'pickemWeekly', label: 'Weekly Pickem', element: <WeeklyPickemsPage/>},
            {id: 'pickemLeaderboard', label: 'Leaderboard', element: <GameScoresPage/>},
            {id: 'gameScores', label: 'Game Scores', element: <GameScoresPage/>},
            commonAdminTab,
        ];

        const byPoolTypeId: Record<number, any[]> = {
            1: sweepstakesTabs,
            2: pickemTabs,
        };
        const rawTabs = byPoolTypeId[poolTypeId ?? 1] ?? sweepstakesTabs;

        return rawTabs.filter(t => (t.isVisible ? t.isVisible() : true));
    }, [poolTypeId, isAdmin]);

    // Reset tab whenever pooltype changes (no need to preserve selection)
    useEffect(() => {
        setCurrentTabId(tabsForPoolType[0]?.id ?? '__none__');
    }, [poolTypeId, tabsForPoolType]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
        setCurrentTabId(newValue);
    };

    //This is a known MUI Tabs timing issue, and your diagnosis is correct:
    // for one render, the currentTabId still contains the old pool’s tab ("allPicks"), while the new pool’s tabs have already changed. MUI validates immediately and throws.
    // The fix is to never allow Tabs to render with an invalid value.
    // The fix is to never allow Tabs to render with an invalid value.
    const safeTabValue = useMemo(() => {
        if (!currentTabId) return false;

        return tabsForPoolType.some(t => t.id === currentTabId)
            ? currentTabId
            : false;
    }, [currentTabId, tabsForPoolType]);


    const activeTab = tabsForPoolType.find(t => t.id === currentTabId);

    const userInitial = useMemo(() => {
        if (!authUser?.email) return '?';
        return authUser.email.charAt(0).toUpperCase();
    }, [authUser]);


    if (loading) {
        return (
            <LoadingSpinner/>
        );
    }


    return (
        <Box
            sx={{display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden'}}
        >
            <AppBar position="sticky">
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
                        border: `2px solid ${(accountBalance ?? 0) < 0 ? 'red' : 'green'}`,
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
                            <Avatar
                                sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: 'primary.main',
                                    fontSize: 16,
                                }}
                            >
                                {userInitial}
                            </Avatar>
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

            <Box
                sx={{
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                    borderBottom: 1,
                    borderColor: 'divider',
                }}
            >

                <Tabs
                    value={safeTabValue}
                    onChange={handleTabChange}
                    variant="standard"
                    sx={{display: 'inline-flex', minWidth: 'max-content'}}
                >
                    {tabsForPoolType.map(t => (
                        <Tab key={t.id} value={t.id} label={t.label}/>
                    ))}
                </Tabs>
            </Box>

            <Box
                sx={{
                    flexGrow: 1,
                    minHeight: 0,          // 🔴 critical for flex layouts
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    scrollbarGutter: 'stable',
                    p: isMobile ? 1 : 3,
                }}
            >
                {activeTab?.element}
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

export default NavigationPage;
