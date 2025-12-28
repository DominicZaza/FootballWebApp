import {useZAppContext} from '../components/AppContextProvider';
import {useRestApi} from '../api/RestInvocations.js';
import {formatDate} from '../utils/DateUtils'
import { ToggleOptionsGroup } from "../utils/ToggleOptionsGroup";
import type {  ToggleOption } from "../utils/ToggleOptionsGroup";
import {MatchupRenderer} from '../utils/MatchupRenderer'
import {PickStatusRenderer} from '../utils/PickStatusRenderer'
import {WagerRenderer} from '../utils/WagerRenderer'
import {GameCategoryRenderer} from '../utils/GameCategoryRenderer'
import LoadingSpinner from "../components/LoadingSpinner.tsx";

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
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from "@mui/material";
import {useEffect, useState} from "react";
import type {WeeklyPicksDTO} from "../types/ZTypes";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import RepeatIcon from "@mui/icons-material/Repeat";
import ScheduleIcon from "@mui/icons-material/Schedule";
import StarIcon from "@mui/icons-material/Star";

const WeeklyPicksPage = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string|null>(null);
    const { isMobile,  selectedEntry,  currentWeek} = useZAppContext();
    const [selectedWeek, setSelectedWeek] = useState<number|null>(null);


    const [weeklyPicksRecords, setWeeklyPicksRecords] = useState<WeeklyPicksDTO[]>([]);

    //Toggle preferences
    const [visibleToggles, setVisibleToggles] = useState<string[]>([]);

    const {
        getWeeklyPicksByPoolInstanceAndWeekRestCall,
    } = useRestApi();


    const handleWeekChange = (event) => {
        const week = event.target.value;
        setSelectedWeek(week);
    };



    useEffect(() => {
        if (currentWeek && selectedEntry) {
            const week = Math.min(currentWeek, selectedEntry.maxWeeks);
            setSelectedWeek(week);
        }
    }, [currentWeek, selectedEntry]);


    //dependency on selectedEntry and selectedWeek
    useEffect(() => {
        if (!selectedEntry || !selectedEntry.id || selectedWeek == null) return;
        setLoading(true);
        setError(null);
        getWeeklyPicksByPoolInstanceAndWeekRestCall(selectedEntry.pool_instance_id, selectedWeek)
            .then(data =>{ setWeeklyPicksRecords(data.weeklyPicks)})
            .catch((err) => {
                console.error('Error fetching weekly picks data :', err);
                setError('Failed to load weekly pick data. Please try again.');
            })
            .finally(() => setLoading(false));
    }, [selectedEntry, selectedWeek]);


    if (loading) {
        return <LoadingSpinner />;
    }


    // Generate week options
    const weekOptions = [];
    const maxWeeks= selectedEntry?selectedEntry.maxWeeks:0;
    for (let week = 1; week <= maxWeeks; week++) {
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
                                {visibleToggles.includes("entryRecord") && <TableCell>W-L-T-P</TableCell>}
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
                                            sport={weeklyPicksPageDTO.sport}
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