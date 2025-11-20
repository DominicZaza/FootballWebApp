import {useZAppContext} from '../components/AppContextProvider';
import {useRestApi} from '../api/RestInvocations.js';
import {formatDate}  from '../utils/DateUtils'
import {
    Alert,
    Box,
    Chip,
    FormControl,
    IconButton,
    InputLabel,
    keyframes,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow, Typography
} from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import Tooltip from "@mui/material/Tooltip";
import SportsFootballIcon from "@mui/icons-material/SportsFootball";
import React, {useEffect, useState} from "react";
import {zWebSocket} from '../hooks/useStompClient';
import {LeaderBoardDTO} from "../types/ZTypes";
import ArrowDropUp from "@mui/icons-material/ArrowDropUp";
import ArrowDropDown from "@mui/icons-material/ArrowDropDown";

const LeaderboardPage = () => {
    const [selectedWeek, setSelectedWeek] = useState<number>(0);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState(null);
    const {isAdmin, isMobile, userProfile, selectedEntry, currentSeason, currentWeek} = useZAppContext();
    const [leaderRecords, setLeaderRecords] = useState<LeaderBoardDTO[]>([]);
    const [showNextGame, setShowNextGame] = useState<boolean>(false);
    const [showRecord, setShowRecord] = useState<boolean>(false);
    const [showStreak, setShowStreak] = useState<boolean>(false);
    const [showRanks, setShowRanks] = useState<boolean>(false);

    const {
        getLeaderboardByPoolInstanceAndWeek,
        getBaseImageUrl
    } = useRestApi();


    const {useStompSubscription} = zWebSocket();


    const handleWeekChange = (event) => {
        const week = event.target.value;
        setSelectedWeek(week);
    };

    const handleReset = () => {
        setSelectedWeek(currentWeek);
    };


    const renderRankAndDelta = (rank: number, rankLastWeek: number) => {
        const delta = rank - rankLastWeek;
        if (delta === 0) {
            return <Typography variant="body2">{rank}</Typography>;
        }

        const isImprovement = delta < 0;
        const absDelta = Math.abs(delta);

        if (selectedWeek === 1) return ( // don't show delta for the first week
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'left', gap: 0.5}}>
                {rank}
            </Box>  )
        else
        return (
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'left', gap: 0.5}}>
                {rank}
                {isImprovement ? (
                    <ArrowDropUp sx={{color: 'success.main', fontSize: 18}}/>
                ) : (
                    <ArrowDropDown sx={{color: 'error.main', fontSize: 18}}/>
                )}
                    <Typography
                        variant="body2" sx={{color: isImprovement ? 'success.main' : 'error.main', fontWeight: 'bold'}}>
                        {absDelta}
                    </Typography>
            </Box>
        );
    };
    const NextGameCellRenderer = ({awayName,  awayLogoUrl, homeName, homeLogoUrl,gameTime}) => {
        return (
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                {awayLogoUrl && (
                    <img
                        src={awayLogoUrl}
                        alt={`${awayName} logo`}
                        style={{width: 24, height: 24, objectFit: 'contain'}}
                    />
                )}
                {awayName}
                {' '}
                @
                {homeLogoUrl && (
                    <img
                        src={homeLogoUrl}
                        alt={`${homeName} logo`}
                        style={{width: 24, height: 24, objectFit: 'contain'}}
                    />
                )}
                {homeName}
                {' '}
               {formatDate(gameTime)}
            </Box>
        );
    };


    const spin = keyframes`
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    `;

    // fetch game ranks
    useEffect(() => {
        if (currentWeek != 0)
            setSelectedWeek(currentWeek);
    }, [currentWeek]);


    //dependency on selectedEntry and currentWeek
    useEffect(() => {
        if (!selectedEntry || !selectedEntry.id || currentWeek == 0) return;
        setLoading(true);
        setError(null);
        getLeaderboardByPoolInstanceAndWeek(selectedEntry.pool_instance_id, selectedWeek)
            .then(setLeaderRecords)
            .catch((err) => {
                console.error('Error fetching leaderboard data :', err);
                setError('Failed to load leaderboard data. Please try again.');
            })
            .finally(() => setLoading(false));
    }, [selectedEntry, selectedWeek]);


    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
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

    // Generate week options
    const weekOptions = [];
    for (let week = 1; week <= 18; week++) {
        weekOptions.push(
            <MenuItem key={week} value={week}>
                Week {week}
            </MenuItem>
        );
    }

    return (
        <div>
            <Box sx={{p: 3}}>

                {/* Week Selector */}
                <FormControl sx={{minWidth: 150}}>
                    <InputLabel id="week-selector-label">
                        <u>W</u>eek
                    </InputLabel>
                    <Select
                        labelId="week-selector-label"
                        id="weekSelector"
                        value={selectedWeek || ''}
                        label="Week"
                        accessKey="W"
                        onChange={handleWeekChange}
                    >
                        {weekOptions}
                    </Select>
                </FormControl>

                <Box sx={{display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap'}}>

                    <Tooltip title="Reset to Current Week ">
                        <IconButton
                            color="primary"
                            onClick={handleReset}
                            sx={{
                                height: 56,
                                width: 56,
                                borderRadius: 2,
                                boxShadow: 1,
                                mr: 1,
                                bgcolor: "action.hover",
                                '&:hover': {bgcolor: 'primary.main', color: 'white'},
                            }}
                        >
                            <RestartAltIcon/>
                        </IconButton>
                    </Tooltip>


                </Box>

                {error && (
                    <Alert severity="error" sx={{mb: 2}} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <TableContainer component={Paper} sx={{maxHeight: 1200}}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{minWidth: 10}}></TableCell>
                                <TableCell sx={{width: 'auto'}}>Entry</TableCell>
                                <TableCell sx={{width: 'auto'}}>Total</TableCell>
                                <TableCell sx={{minWidth: 60}}>Rank</TableCell>
                                <TableCell sx={{width: 'auto'}}>W-L-T-P</TableCell>
                                <TableCell sx={{width: 'auto'}}>Streak</TableCell>
                                <TableCell sx={{width: 'auto'}}>Next Game</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {leaderRecords.map((leaderRecord, index) => (
                                <TableRow
                                    key={leaderRecord.entryId || index}
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: 'action.hover'
                                        }
                                    }}
                                >
                                    <TableCell align="left">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell>
                                        {leaderRecord.entryName}
                                    </TableCell>
                                    <TableCell>
                                        {leaderRecord.total}
                                    </TableCell>
                                    <TableCell align="left">
                                        {renderRankAndDelta(leaderRecord.rank, leaderRecord.rankLastWeek)}
                                    </TableCell>
                                    <TableCell>
                                        {leaderRecord.wins}-{leaderRecord.losses}-{leaderRecord.ties}-{leaderRecord.penalties}
                                    </TableCell>
                                    <TableCell>
                                        {leaderRecord.current_streak_type}-{leaderRecord.current_streak}
                                    </TableCell>
                                    <TableCell>
                                        <NextGameCellRenderer
                                            awayName={leaderRecord.away_team}
                                            awayLogoUrl={getBaseImageUrl(leaderRecord.away_logo)}
                                            homeName={leaderRecord.home_team}
                                            homeLogoUrl={getBaseImageUrl(leaderRecord.home_logo)}
                                            gameTime={ formatDate(leaderRecord.commence_time,isMobile)}
                                        />
                                    </TableCell>

                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </div>
    );
}

export default LeaderboardPage;