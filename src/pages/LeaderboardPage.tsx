import {useZAppContext} from '../components/AppContextProvider';
import {useRestApi} from '../api/RestInvocations.js';
import {formatDate} from '../utils/DateUtils'
import {
    Alert,
    Box, Chip,
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
    TableRow, ToggleButton, ToggleButtonGroup, Typography
} from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import SportsFootballIcon from "@mui/icons-material/SportsFootball";
import React, {useEffect, useState} from "react";
import {zWebSocket} from '../hooks/useStompClient';
import {LeaderBoardDTO} from "../types/ZTypes";
import ArrowDropUp from "@mui/icons-material/ArrowDropUp";
import ArrowDropDown from "@mui/icons-material/ArrowDropDown";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import RepeatIcon from "@mui/icons-material/Repeat";
import ScheduleIcon from "@mui/icons-material/Schedule";
import StarIcon from "@mui/icons-material/Star";

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
    const [showEntryRank, setShowEntryRank] = useState<boolean>(false);

    const {
        getLeaderboardByPoolInstanceAndWeek,
        getBaseImageUrl
    } = useRestApi();


    const {useStompSubscription} = zWebSocket();


    const handleWeekChange = (event) => {
        const week = event.target.value;
        setSelectedWeek(week);
    };

    const handleToggleChange = (event, newValues) => {
        if (!newValues) return;

        const prefs = {
            showRecord: newValues.includes('records'),
            showStreak: newValues.includes('streaks'),
            showNextGame: newValues.includes('nextgame'),
            showRanks: newValues.includes('ranks'),
            showEntryRank: newValues.includes('entryRank'),
        };

        setShowRecord(prefs.showRecord);
        setShowStreak(prefs.showStreak);
        setShowNextGame(prefs.showNextGame);
        setShowRanks(prefs.showRanks);
        setShowEntryRank(prefs.showEntryRank);

        // 🟦 persist to browser
        localStorage.setItem("leaderboardTogglePrefs", JSON.stringify(prefs));
    };

    useEffect(() => {
        const saved = localStorage.getItem("leaderboardTogglePrefs");
        if (saved) {
            const prefs = JSON.parse(saved);
            setShowRecord(prefs.showRecord);
            setShowStreak(prefs.showStreak);
            setShowNextGame(prefs.showNextGame);
            setShowRanks(prefs.showRanks);
            setShowEntryRank(prefs.showEntryRank);

        }
    }, []);

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
            </Box>)
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
    const ToggleButtonRenderer = ({ showToggle, toggleName, toggleKey, Icon }) => {
        return (
            <Tooltip title={showToggle ? `Hide ${toggleName}` : `Show ${toggleName}`}>
                <ToggleButton
                    value={toggleKey}
                    aria-label={toggleKey}
                    sx={(theme) => ({
                        px: 2,
                        py: 1,
                        minWidth: 48,
                        position: 'relative',
                        overflow: 'visible',
                        borderRadius: 1.5,
                        transition: 'all 0.16s ease',

                        '&:hover': {
                            bgcolor: 'action.hover'
                        },

                        // 🔵 Selected state — only show the ribbon, not background
                        '&.Mui-selected, &.Mui-selected:hover': {
                            bgcolor: 'transparent',   // <-- keep transparent
                            color: 'inherit',         // <-- don't change icon/text color

                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: 0,
                                height: 0,
                                borderTop: `20px solid ${theme.palette.primary.main}`,
                                borderLeft: '20px solid transparent',
                                zIndex: 5,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                            },

                            '& > svg': {
                                zIndex: 10,
                                position: 'relative'
                            },
                        },
                    })}
                >
                    <Icon color={showToggle ? "primary" : "action"} />
                </ToggleButton>
            </Tooltip>
        );
    };

    const NextGameCellRenderer = ({awayName, awayLogoUrl, homeName, homeLogoUrl}) => {
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

                    <ToggleButtonGroup
                        value={[
                            ...(showRecord ? ['records'] : []),
                            ...(showStreak ? ['streaks'] : []),
                            ...(showNextGame ? ['nextgame'] : []),
                            ...(showRanks ? ['ranks'] : []),
                            ...(showEntryRank ? ['entryRank'] : []),

                        ]}
                        onChange={handleToggleChange}
                        aria-label="Display options"
                        sx={{height: 56,borderRadius: 2,ml: isAdmin ? 1 : 0,boxShadow: 1,}}
                    >
                        <ToggleButtonRenderer showToggle={showEntryRank} toggleName="Entry Rank" toggleKey="entryRank" Icon={StarIcon}/>
                        <ToggleButtonRenderer showToggle={showRecord} toggleName="Entry Win Record" toggleKey="records" Icon={EmojiEventsIcon}/>
                        <ToggleButtonRenderer showToggle={showStreak} toggleName="Win Streak" toggleKey="streaks" Icon={RepeatIcon}/>
                        <ToggleButtonRenderer showToggle={showNextGame} toggleName="Next Game" toggleKey="nextgame" Icon={ScheduleIcon}/>
                        <ToggleButtonRenderer showToggle={showRanks} toggleName="Next Game Rank" toggleKey="ranks" Icon={StarIcon}/>
                    </ToggleButtonGroup>


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
                                {showEntryRank && <TableCell sx={{minWidth: 60}}>Rank</TableCell>}
                                {showRecord && <TableCell sx={{width: 'auto'}}>W-L-T-P</TableCell>}
                                {showStreak && <TableCell sx={{width: 'auto'}}>Streak</TableCell>}
                                {showNextGame && <TableCell align={"center"}>Next Game</TableCell>}
                                {showNextGame && <TableCell align={"center"}>Game Date</TableCell>}
                                {showRanks && <TableCell>Game Rank</TableCell>}

                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {leaderRecords.map((leaderRecord, index) => (
                                <TableRow
                                    key={leaderRecord.entryId || index}
                                    sx={{ // for zero total entries, make them slightly transparent
                                        opacity: leaderRecord.total === 0 ? 0.4 : 1,
                                        '& td': leaderRecord.total === 0 ? {
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
                                    <TableCell>
                                        {leaderRecord.total}
                                    </TableCell>
                                    {showEntryRank && (
                                    <TableCell align="left">
                                        {renderRankAndDelta(leaderRecord.rank, leaderRecord.rankLastWeek)}
                                    </TableCell>
                                    )}
                                    {showRecord && (
                                        <TableCell>
                                            {leaderRecord.wins}-{leaderRecord.losses}-{leaderRecord.ties}-{leaderRecord.penalties}
                                        </TableCell>
                                    )}
                                    {showStreak && (
                                        <TableCell>
                                            {leaderRecord.current_streak_type}-{leaderRecord.current_streak}
                                        </TableCell>
                                    )}
                                    {showNextGame && (
                                        <TableCell>
                                            {leaderRecord.total !== 0 ? (
                                                <NextGameCellRenderer
                                                    awayName={leaderRecord.away_team}
                                                    awayLogoUrl={getBaseImageUrl(leaderRecord.away_logo)}
                                                    homeName={leaderRecord.home_team}
                                                    homeLogoUrl={getBaseImageUrl(leaderRecord.home_logo)}
                                                />
                                            ) : (
                                                ""   // empty cell
                                            )}
                                        </TableCell>
                                    )}
                                    {showNextGame && (
                                        <TableCell>
                                            {leaderRecord.total !== 0
                                                ? formatDate(leaderRecord.commence_time, isMobile)
                                                : ""}
                                        </TableCell>
                                    )}
                                    {showRanks && leaderRecord.total != 0 && (
                                        <TableCell>
                                            {(() => {
                                                const colorMap = {
                                                    Difficult: "error",
                                                    Hard: "warning",
                                                    Medium: "info",
                                                    Easy: "success",
                                                };
                                                return (
                                                    <Chip
                                                        label={`${leaderRecord.rankType} (${leaderRecord.home_rank} vs ${leaderRecord.away_rank})`}
                                                        color={colorMap[leaderRecord.rankType]}
                                                        variant="filled"
                                                        size="small"
                                                    />
                                                );
                                            })()}
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