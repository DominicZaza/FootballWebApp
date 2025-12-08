import {useZAppContext} from '../components/AppContextProvider';
import {useRestApi} from '../api/RestInvocations.js';
import {formatDate} from '../utils/DateUtils'
import { ToggleOptionsGroup, ToggleOption } from "../utils/ToggleOptionsGroup";
import {MatchupRenderer} from '../utils/MatchupRenderer'
import {PickStatusRenderer} from '../utils/PickStatusRenderer'
import {WagerRenderer} from '../utils/WagerRenderer'
import {GameCategoryRenderer} from '../utils/GameCategoryRenderer'

const toggleOptions: ToggleOption[] = [
    { key: "entryRecord", label: "Win Record", icon: EmojiEventsIcon },
    { key: "streak", label: "Win Streak", icon: RepeatIcon },
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
import React, {useEffect, useState} from "react";
import {zWebSocket} from '../hooks/useStompClient';
import {WeeklyPicksPageDTO} from "../types/ZTypes";
import ArrowDropUp from "@mui/icons-material/ArrowDropUp";
import ArrowDropDown from "@mui/icons-material/ArrowDropDown";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import RepeatIcon from "@mui/icons-material/Repeat";
import ScheduleIcon from "@mui/icons-material/Schedule";
import StarIcon from "@mui/icons-material/Star";

const WeeklyPicksPage = () => {

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState(null);
    const {isAdmin, isMobile, userProfile, selectedEntry, currentSeason, currentWeek} = useZAppContext();
    const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek || 1);
    const [weeklyPicksRecords, setWeeklyPicksRecords] = useState<WeeklyPicksPageDTO[]>([]);

    //Toggle preferences
    const [visibleToggles, setVisibleToggles] = useState<string[]>([]);

    const {
        getWeeklyPicksByPoolInstanceAndWeekRestCall,
        getTeamLogoUrl
    } = useRestApi();


    const {useStompSubscription} = zWebSocket();


    const handleWeekChange = (event) => {
        const week = event.target.value;
        setSelectedWeek(week);
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
        getWeeklyPicksByPoolInstanceAndWeekRestCall(selectedEntry.pool_instance_id, selectedWeek)
            .then(setWeeklyPicksRecords)
            .catch((err) => {
                console.error('Error fetching weekly picks data :', err);
                setError('Failed to load weekly pics data. Please try again.');
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
                    id="WeeklyPicksPage"
                    options={toggleOptions}
                    onChange={(keys) => setVisibleToggles(keys)}
                />


                {error && (
                    <Alert severity="error" sx={{mb: 2}} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <TableContainer component={Paper}>
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
                                <TableCell>Status</TableCell>
                                <TableCell>Wager</TableCell>
                                <TableCell>Balance</TableCell>
                                <TableCell>Matchup</TableCell>
                                {visibleToggles.includes("streak") && <TableCell>W-L-T-P</TableCell>}
                                {visibleToggles.includes("streak") && <TableCell>Streak</TableCell>}
                                {visibleToggles.includes("gameDate") && <TableCell>Game Date</TableCell>}
                                {visibleToggles.includes("gameCategory") && <TableCell>Game Category</TableCell>}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {weeklyPicksRecords.map((weeklyPicksPageDTO, i) => (
                                <TableRow
                                    key={weeklyPicksPageDTO.entryId || i}
                                    sx={{ // for zero total entries, make them slightly transparent
                                        opacity: weeklyPicksPageDTO.current_balance === 0 ? 0.4 : 1,
                                        '& td': weeklyPicksPageDTO.current_balance === 0 ? {
                                            fontStyle: 'italic'
                                        } : {},
                                        transition: 'opacity 0.2s ease',
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                            opacity: 1
                                        }
                                    }}
                                >
                                    <TableCell>{i + 1}</TableCell>
                                    <TableCell>{weeklyPicksPageDTO.entryName}</TableCell>
                                    <TableCell> <PickStatusRenderer pickStatus={weeklyPicksPageDTO.pickStatus}/>
                                    </TableCell>
                                    <TableCell> <WagerRenderer wager={weeklyPicksPageDTO.wager}
                                                               pickStatus={weeklyPicksPageDTO.pickStatus}/> </TableCell>
                                    <TableCell>{weeklyPicksPageDTO.current_balance}</TableCell>
                                    <TableCell>
                                        <MatchupRenderer
                                            awayName={weeklyPicksPageDTO.away_team}
                                            away_ext_id={weeklyPicksPageDTO.away_ext_id}
                                            homeName={weeklyPicksPageDTO.home_team}
                                            home_ext_id={weeklyPicksPageDTO.home_ext_id}
                                            pick={weeklyPicksPageDTO.pick}
                                            pickStatus={weeklyPicksPageDTO.pickStatus}
                                        />
                                    </TableCell>

                                    {visibleToggles.includes("entryRecord") && (
                                        <TableCell>{weeklyPicksPageDTO.wins}-{weeklyPicksPageDTO.losses}-{weeklyPicksPageDTO.ties}-{weeklyPicksPageDTO.penalties}</TableCell>
                                    )}

                                    {visibleToggles.includes("streak") && (
                                        <TableCell>{weeklyPicksPageDTO.current_streak_type}-{weeklyPicksPageDTO.current_streak}</TableCell>
                                    )}

                                    {visibleToggles.includes("gameDate") && (
                                        <TableCell>{formatDate(weeklyPicksPageDTO.commence_time, isMobile)}</TableCell>)}
                                    {visibleToggles.includes("gameCategory") && (
                                        <TableCell> <GameCategoryRenderer rankType={weeklyPicksPageDTO.rankType}
                                                                          homeRank={weeklyPicksPageDTO.home_rank}
                                                                          awayRank={weeklyPicksPageDTO.away_rank}/>
                                        </TableCell>)}

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

export default WeeklyPicksPage;