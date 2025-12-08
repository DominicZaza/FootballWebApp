import {useZAppContext} from '../components/AppContextProvider';
import {getTeamLogoUrl, useRestApi} from '../api/RestInvocations.js';
import {formatDate} from '../utils/DateUtils'
import { ToggleOptionsGroup, ToggleOption } from "../utils/ToggleOptionsGroup";

const toggleOptions: ToggleOption[] = [
    { key: "entryRanking", label: "Entry Ranking", icon: StarIcon },
    { key: "entryRecord", label: "Win Record", icon: EmojiEventsIcon },
    { key: "streak", label: "Win Streak", icon: RepeatIcon },
    { key: "nextGame", label: "Next Game", icon: StarIcon },
    { key: "gameDate", label: "Game Date", icon: ScheduleIcon },
    { key: "gameCategory", label: "Game Category", icon: StarIcon },
];

import {
    Alert,
    Box,
    FormControl,
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
    TableRow, ToggleButtonGroup, Typography
} from "@mui/material";
import SportsFootballIcon from "@mui/icons-material/SportsFootball";
import React, {useCallback, useEffect, useState} from "react";
import {zWebSocket} from '../hooks/useStompClient';
import {LeaderBoardDTO} from "../types/ZTypes";
import ArrowDropUp from "@mui/icons-material/ArrowDropUp";
import ArrowDropDown from "@mui/icons-material/ArrowDropDown";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import RepeatIcon from "@mui/icons-material/Repeat";
import ScheduleIcon from "@mui/icons-material/Schedule";
import StarIcon from "@mui/icons-material/Star";
import {LeaderboardUpdateEvent} from "../types/ZEvents";
import {GameCategoryRenderer} from '../utils/GameCategoryRenderer'


const LeaderboardPage = () => {

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState(null);
    const {isAdmin, isMobile, userProfile, selectedEntry, currentSeason, currentWeek} = useZAppContext();
    const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek);
    const [leaderRecords, setLeaderRecords] = useState<LeaderBoardDTO[]>([]);
    //Toggle preferences
    const [visibleToggles, setVisibleToggles] = useState<string[]>([]);

    const {
        getLeaderboardByPoolInstanceAndWeek,
        getTeamLogoUrl
    } = useRestApi();


    const {useStompSubscription} = zWebSocket();


    const handleWeekChange = (event) => {
        const week = event.target.value;
        setSelectedWeek(week);
    };


    // WebSocket message handler
    const handleLeaderboardUpdate = useCallback((event: LeaderboardUpdateEvent) => {
        if (!event || !selectedEntry) return;
        if (event.week != selectedWeek) return;
        if (event.poolInstanceId != selectedEntry.pool_instance_id) return;
        if (event.season != currentSeason) return;
        const updatedRecords = event.leaderBoards;
        setLeaderRecords(updatedRecords);
    }, [selectedEntry]);


    //websocket subscriptions
    useStompSubscription('/topic/zevents/LeaderboardUpdate', handleLeaderboardUpdate);


    const renderRankAndDelta = (rank: number, rankLastWeek: number) => {
        const delta = rank - rankLastWeek;
        if (delta === 0) {
            return <Typography variant="body2">{rank}</Typography>;
        }

        const isImprovement = delta < 0;
        const absDelta = Math.abs(delta);

        if (selectedWeek === 1) return ( // don't show delta for the first week
            <Box sx={{display: 'inline-flex', alignItems: 'center', gap: 0.5}}>
                {rank}
            </Box>)
        else
            return (
                <Box sx={{display: 'inline-flex', alignItems: 'center', gap: 0.5}}>
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

    const NextGameCellRenderer = ({awayName, awayLogoUrl, homeName, homeLogoUrl}) => {
        return (
            <Box sx={{display: "inline-flex", alignItems: "center", gap: 1}}>
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
    for (let week = 1; week <= currentWeek; week++) {
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


                <ToggleOptionsGroup
                    id="Leaderboard"             // unique per page
                    options={toggleOptions}
                    onChange={(keys) => setVisibleToggles(keys)}
                />


                {error && (
                    <Alert severity="error" sx={{mb: 2}} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <TableContainer component={Paper} >
                    <Table
                        stickyHeader
                        size="small"
                        sx={{
                            tableLayout: "auto",
                            "& th, & td": {
                                whiteSpace: "nowrap",
                                maxWidth: "max-content",
                                width: "auto",
                                textAlign: "center",
                            },
                        }}
                    >
                        <TableHead>
                            <TableRow>
                                <TableCell></TableCell>
                                <TableCell>Entry</TableCell>
                                <TableCell>Total</TableCell>
                                {visibleToggles.includes("entryRanking") && <TableCell>Ranking</TableCell>}
                                {visibleToggles.includes("entryRecord") && <TableCell>W-L-T-P</TableCell>}
                                {visibleToggles.includes("streak") && <TableCell>Streak</TableCell>}
                                {visibleToggles.includes("nextGame") && <TableCell align={"center"}>Next Game</TableCell>}
                                {visibleToggles.includes("gameDate") && <TableCell align={"center"}>Game Date</TableCell>}
                                {visibleToggles.includes("gameCategory") && <TableCell>Game Category</TableCell>}

                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {leaderRecords.map((leaderRecord, index) => (
                                <TableRow
                                    key={leaderRecord.entryId || index}
                                    sx={{ // for zero total entries, make them slightly transparent
                                        opacity: leaderRecord.current_balance === 0 ? 0.4 : 1,
                                        '& td': leaderRecord.current_balance === 0 ? {
                                            fontStyle: 'italic'
                                        } : {},
                                        transition: 'opacity 0.2s ease',
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                            opacity: 1
                                        }
                                    }}
                                >
                                    <TableCell align="left">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell>
                                        {leaderRecord.entryName}
                                    </TableCell>
                                    {(() => {

                                        let prefix = "";

                                        if (leaderRecord.game_is_pending) {
                                            prefix = "*";
                                        }

                                        return (
                                            <TableCell>
                                                {prefix}{leaderRecord.current_balance}{prefix}
                                            </TableCell>
                                        );
                                    })()}
                                    {visibleToggles.includes("entryRanking") && (
                                        <TableCell>
                                            {renderRankAndDelta(leaderRecord.rank, leaderRecord.rankLastWeek)}
                                        </TableCell>
                                    )}
                                    {visibleToggles.includes("entryRecord") && (
                                        <TableCell>
                                            {leaderRecord.wins}-{leaderRecord.losses}-{leaderRecord.ties}-{leaderRecord.penalties}
                                        </TableCell>
                                    )}
                                    {visibleToggles.includes("streak") && (
                                        <TableCell>
                                            {leaderRecord.current_streak_type}-{leaderRecord.current_streak}
                                        </TableCell>
                                    )}
                                    {visibleToggles.includes("nextGame") && (
                                        <TableCell>
                                            {leaderRecord.current_balance !== 0 ? (
                                                <NextGameCellRenderer
                                                    awayName={leaderRecord.away_team}
                                                    awayLogoUrl={getTeamLogoUrl(leaderRecord.away_ext_id,leaderRecord.sport)}
                                                    homeName={leaderRecord.home_team}
                                                    homeLogoUrl={getTeamLogoUrl(leaderRecord.home_ext_id,leaderRecord.sport)}
                                                />
                                            ) : (
                                                ""   // empty cell
                                            )}
                                        </TableCell>
                                    )}
                                    {visibleToggles.includes("gameDate") && (
                                        <TableCell>
                                            {leaderRecord.current_balance !== 0
                                                ? formatDate(leaderRecord.commence_time, isMobile)
                                                : ""}
                                        </TableCell>
                                    )}
                                    {visibleToggles.includes("gameCategory") && leaderRecord.current_balance != 0 && (
                                        <TableCell> <GameCategoryRenderer rankType={leaderRecord.rankType}
                                                                          homeRank={leaderRecord.home_rank}
                                                                          awayRank={leaderRecord.away_rank}/>
                                        </TableCell>
                                    )}

                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </div>
    )
        ;
}

export default LeaderboardPage;