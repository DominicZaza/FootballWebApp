import {useZAppContext} from '../components/AppContextProvider.tsx';
import {useRestApi} from '../api/RestInvocations.js';
import {ToggleButton, ToggleButtonGroup, IconButton} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import RepeatIcon from "@mui/icons-material/Repeat";
import ScheduleIcon from "@mui/icons-material/Schedule";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import StarIcon from "@mui/icons-material/Star";
import Tooltip from "@mui/material/Tooltip";
import {formatDate}  from '../utils/DateUtils'

import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
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
    TableRow
} from "@mui/material";
import SportsFootballIcon from "@mui/icons-material/SportsFootball";
import React, {useCallback, useEffect, useState} from "react";
import {TeamWinStreaksUpdatedEvent, GameScoreSavedEvent, TeamWinRecordsUpdatedEvent} from "../types/ZEvents";
import {GameScoreDTO, TeamWinRecordDTO, GameRankDTO, TeamWinStreakDTO} from "../types/ZTypes";
import {zWebSocket} from '../hooks/useStompClient';

// Cell renderer components
const TeamCellRenderer = ({name, status, logo, getBaseImageUrl, streak, record}) => {
    const logoUrl = getBaseImageUrl(logo);

    const color =
        status === "Win" ? "success" :
            status === "Loss" ? "error" :
                status === "Push" ? "warning" :
                    "default";
    return (
        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
            {logo && (
                <img
                    src={logoUrl}
                    alt={`${name} logo`}
                    style={{width: 24, height: 24, objectFit: 'contain'}}
                />
            )}
            <Chip label={name} color={color}
                  variant="outlined"   // ✅ changed from "outlined" to "filled"
                  size="small"/>
            {record && (
                <Chip label={record} color={color}
                      variant="outlined"   // ✅ changed from "outlined" to "filled"
                      size="small"/>
            )}
            {streak && (
                <Chip label={streak} color={color}
                      variant="outlined"   // ✅ changed from "outlined" to "filled"
                      size="small"/>
            )}

        </Box>
    );
};


const GameScoresPage = () => {

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState(null);
    const [selectedWeek, setSelectedWeek] = useState<number>(0);
    const [selectedSeasonId, setSelectedSeasonId] = useState<number>(0);
    const [gameScores, setGameScores] = useState<GameScoreDTO[]>([]);
    const [snapping, setSnapping] = useState<boolean>(false);
    const {isAdmin, isMobile,  currentWeek, currentSeason, seasons} = useZAppContext();
    const [teamWinStreaks, setTeamWinStreaks] = useState<TeamWinStreakDTO[]>([]);
    const [teamRecords, setTeamRecords] = useState<TeamWinRecordDTO[]>([]);
    const [showTeamRecords, setShowTeamRecords] = useState<boolean>(false);
    const [showTeamWinStreaks, setShowTeamWinStreaks] = useState<boolean>(false);
    const [showGameDate, setShowGameDate] = useState<boolean>(false);
    const [showRanks, setShowRanks] = useState<boolean>(false);
    const [gameRanks, setGameRanks] = useState<GameRankDTO[]>([]);

    const {
        getGameScoresRestCall,
        getBaseImageUrl,
        snapCompletedGameScoresRestCall,
        getTeamWinStreaksRestCall,
        getTeamRecordsRestCall,
        getGameRanksRestCall
    } = useRestApi();
    const {useStompSubscription} = zWebSocket();


    const handleToggleChange = (event, newValues) => {
        if (!newValues) return; // prevent all off state
        setShowTeamRecords(newValues.includes('records'));
        setShowTeamWinStreaks(newValues.includes('streaks'));
        setShowGameDate(newValues.includes('gamedate'));
        setShowRanks(newValues.includes('ranks'));
    };
    const handleReset = () => {
        // Reset dropdown selections
        setSelectedSeasonId(currentSeason);
        setSelectedWeek(currentWeek);

        // Reset toggles to false
        setShowTeamRecords(false);
        setShowTeamWinStreaks(false);
        setShowGameDate(false);
        setShowRanks(false);
    };


    // WebSocket message handler
    const handleGameScoredSavedEvent = useCallback((event: GameScoreSavedEvent) => {
        if (event) {
            const updatedScores = event.gameScores;
            // Update the row data with the new scores
            setGameScores(gameScore => {
                return gameScore.map(row => {
                    // Find if this game has an update
                    const updatedScore = updatedScores.find(score => score.gameDTO.id === row.gameDTO.id);

                    if (updatedScore) {
                        return {
                            ...row,
                            home_score: updatedScore.home_score,
                            away_score: updatedScore.away_score,
                            completed: updatedScore.completed
                        };
                    }
                    return row;
                });
            });
        }
    }, []);


    // WebSocket message handler
    const handleTeamWinStreakUpdateEvent = useCallback((event: TeamWinStreaksUpdatedEvent) => {
        if (event) {
            const updatedWinStreaks = event.teamWinStreaks;
            // Update the row data with the new scores
            setTeamWinStreaks(rowData => {
                return rowData.map(row => {
                    // Find if this game has an update
                    const updatedStreak = updatedWinStreaks.find(streak => streak.team_id === row.team_id);

                    if (updatedStreak) {
                        return {
                            ...row,
                            streakType: updatedStreak.streakType,
                            streakLength: updatedStreak.streakLength,
                        };
                    }
                    return row;
                });
            });
        }
    }, []);

    // WebSocket message handler
    const handleTeamWinRecordUpdateEvent = useCallback((event: TeamWinRecordsUpdatedEvent) => {
        if (event) {
            const updatedWinRecords = event.teamWinRecords;
            // Update the row data with the new scores
            setTeamRecords(rowData => {
                return rowData.map(row => {
                    // Find if this game has an update
                    const updatedRecord = updatedWinRecords.find(record => record.team_id === row.team_id);

                    if (updatedRecord) {
                        return {
                            ...row,
                            wins: updatedRecord.wins,
                            losses: updatedRecord.losses,
                            draws: updatedRecord.draws,
                        };
                    }
                    return row;
                });
            });
        }
    }, []);

    useStompSubscription('/topic/zevents/GameScoreUpdate', handleGameScoredSavedEvent);
    useStompSubscription('/topic/zevents/TeamWinStreakUpdate', handleTeamWinStreakUpdateEvent);
    useStompSubscription('/topic/zevents/TeamWinRecordUpdate', handleTeamWinRecordUpdateEvent);


    const spin = keyframes`
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    `;


    useEffect(() => {
        setSelectedSeasonId(currentSeason);
    }, [currentSeason]);

    // fetch game ranks
    useEffect(() => {
        if (currentWeek != 0)
            setSelectedWeek(currentWeek);
    }, [currentWeek]);

    // fetch game ranks
    useEffect(() => {
        if (showRanks && selectedSeasonId != 0 && selectedWeek != 0) {
            getGameRanksRestCall('americanfootball_nfl', selectedSeasonId, selectedWeek)
                .then(setGameRanks)
                .catch((err) => console.error("Error loading game ranks", err));
        }
    }, [selectedSeasonId, selectedWeek, showRanks]);

    // fetch game scores
    useEffect(() => {
        if (selectedSeasonId == 0 || selectedWeek == 0) return;
        setLoading(true);
        getGameScoresRestCall('americanfootball_nfl', selectedSeasonId, selectedWeek)
            .then(setGameScores)
            .catch((err) => console.error("Error loading game score", err))
            .finally(() => setLoading(false));
    }, [selectedSeasonId, selectedWeek]);


    // fetch team win streaks
    useEffect(() => {
        if (showTeamWinStreaks && selectedSeasonId != 0 && selectedWeek != 0) {
            getTeamWinStreaksRestCall('americanfootball_nfl', selectedSeasonId, selectedWeek)
                .then(setTeamWinStreaks)
                .catch((err) => console.error("Error loading game ranks", err));
        }
    }, [selectedSeasonId, selectedWeek, showTeamWinStreaks]);


    // fetch team win records
    useEffect(() => {
        if (showTeamRecords && selectedSeasonId != 0 && selectedWeek != 0) {
            getTeamRecordsRestCall('americanfootball_nfl', selectedSeasonId, selectedWeek)
                .then(setTeamRecords)
                .catch((err) => console.error("Error loading team records", err));
        }
    }, [selectedSeasonId, selectedWeek, showTeamRecords]);


    const getTeamStreakDisplay = (teamId: number) => {
        if (!teamWinStreaks?.length) return '';

        const streak = teamWinStreaks.find((s) => s.team_id === teamId);
        if (!streak) return '';

        return `${streak.streakType}${streak.streakLength}`;
    };

    const getTeamRecordDisplay = (teamId: number) => {
        if (!teamRecords?.length) return '';

        const teamRecord = teamRecords.find((s) => s.team_id === teamId);
        if (!teamRecord) return '';

        return `${teamRecord.wins}-${teamRecord.losses}-${teamRecord.draws}`;
    };

    // Helper function to determine if away team won
    const isAwayWinner = (data) => {
        return data.completed && data.away_score > data.home_score;
    };

    // Helper function to determine if home team won
    const isHomeWinner = (data) => {
        return data.completed && data.home_score > data.away_score;
    };


    const handleSeasonChange = (event) => {
        const season = seasons.find((s) => s.id === event.target.value);
        setSelectedSeasonId(season.id);
    };

    const handleWeekChange = (event) => {
        const week = event.target.value;
        setSelectedWeek(week);
    };

    const handleSnapGameScores = async () => {
        try {
            setSnapping(true);
            setError(null);
            await snapCompletedGameScoresRestCall(selectedSeasonId, selectedWeek);
            // Game scores will be refreshed from notification event
        } catch (err) {
            setError('Failed to snap game scores. ' + (err.message || 'Please try again.'));
        } finally {
            setSnapping(false);
        }
    };

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
                <Box sx={{display: 'flex', alignItems: 'center', mb: 3}}>
                    <SportsFootballIcon sx={{mr: 1}}/>
                    <h1>Game Scores</h1>
                </Box>

                <Box sx={{display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap'}}>

                    <Tooltip title="Reset to Current Season ">
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


                    {/* Season Selector */}
                    <FormControl sx={{minWidth: 150}}>
                        <InputLabel id="seasons-selector-label">
                            <u>S</u>eason
                        </InputLabel>
                        <Select
                            labelId="season-selector-label"
                            id="seasonSelector"
                            value={selectedSeasonId || ''}
                            label="Season"
                            accessKey="S"
                            onChange={handleSeasonChange}
                        >
                            {seasons.map((season) => (
                                <MenuItem key={season.id} value={season.id}>
                                    {season.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

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
                    <ToggleButtonGroup
                        value={[
                            ...(showTeamRecords ? ['records'] : []),
                            ...(showTeamWinStreaks ? ['streaks'] : []),
                            ...(showGameDate ? ['gamedate'] : []),
                            ...(showRanks ? ['gameranks'] : []),

                        ]}
                        onChange={handleToggleChange}
                        aria-label="Display options"
                        sx={{
                            height: 56,
                            borderRadius: 2,
                            ml: isAdmin ? 1 : 0,
                            boxShadow: 1,
                        }}
                    >
                        <Tooltip title={showTeamRecords ? "Hide Team Records" : "Show Team Records"}>
                            <ToggleButton
                                value="records"
                                aria-label="records"
                                sx={{
                                    px: 2,
                                    transition: 'all 0.2s ease',
                                    bgcolor: showTeamRecords ? 'primary.light' : 'transparent',
                                    '&:hover': {
                                        bgcolor: showTeamRecords ? 'primary.main' : 'action.hover',
                                    },
                                    '&.Mui-selected': {
                                        bgcolor: 'primary.light',
                                        color: 'primary.main',
                                        '&:hover': {bgcolor: 'primary.main', color: 'white'},
                                    },
                                }}
                            >
                                <EmojiEventsIcon color={showTeamRecords ? "primary" : "action"}/>
                            </ToggleButton>
                        </Tooltip>

                        <Tooltip title={showTeamWinStreaks ? "Hide Win Streaks" : "Show Win Streaks"} arrow={true}>
                            <ToggleButton
                                value="streaks"
                                aria-label="streaks"
                                sx={{
                                    px: 2,
                                    transition: 'all 0.2s ease',
                                    bgcolor: showTeamWinStreaks ? 'primary.light' : 'transparent',
                                    '&:hover': {
                                        bgcolor: showTeamWinStreaks ? 'primary.main' : 'action.hover',
                                    },
                                    '&.Mui-selected': {
                                        bgcolor: 'primary.light',
                                        color: 'primary.main',
                                        '&:hover': {bgcolor: 'primary.main', color: 'white'},
                                    },
                                }}
                            >
                                <RepeatIcon color={showTeamWinStreaks ? "primary" : "action"}/>
                            </ToggleButton>
                        </Tooltip>

                        <Tooltip title={showGameDate ? "Hide Game Date" : "Show Game Date"}>
                            <ToggleButton
                                value="gamedate"
                                aria-label="game date"
                                sx={{
                                    px: 2,
                                    transition: 'all 0.2s ease',
                                    bgcolor: showGameDate ? 'primary.light' : 'transparent',
                                    '&:hover': {
                                        bgcolor: showGameDate ? 'primary.main' : 'action.hover',
                                    },
                                    '&.Mui-selected': {
                                        bgcolor: 'primary.light',
                                        color: 'primary.main',
                                        '&:hover': {bgcolor: 'primary.main', color: 'white'},
                                    },
                                }}
                            >
                                <ScheduleIcon color={showGameDate ? "primary" : "action"}/>
                            </ToggleButton>
                        </Tooltip>
                        <Tooltip title={showRanks ? "Hide Game Ranks" : "Show Game Rank"}>
                            <ToggleButton
                                value="ranks"
                                selected={showRanks}
                                onChange={() => setShowRanks((prev) => !prev)}
                            >
                                <StarIcon sx={{mr: 1}}/>
                            </ToggleButton>
                        </Tooltip>
                    </ToggleButtonGroup>

                    {/* Snap Game Scores Button - Admin Only */}
                    {isAdmin && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSnapGameScores}
                            disabled={snapping || !selectedSeasonId || !selectedWeek}
                            sx={{height: 56}}
                        >
                            {snapping ? <CircularProgress size={24}/> : 'Snap Game Scores'}
                        </Button>
                    )}

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
                                <TableCell sx={{width: 'auto'}}>Away</TableCell>
                                <TableCell sx={{width: 'auto'}}>Home</TableCell>
                                <TableCell sx={{width: 'auto'}}>Score</TableCell>
                                {showGameDate && <TableCell>Game Date</TableCell>}
                                {showRanks && <TableCell>Game Rank</TableCell>}

                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {gameScores.map((gameScore, index) => (
                                <TableRow
                                    key={gameScore.gameDTO.id || index}
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: 'action.hover'
                                        }
                                    }}
                                >
                                    <TableCell>
                                        <TeamCellRenderer
                                            name={gameScore.gameDTO.away_team.name}
                                            logo={gameScore.gameDTO.away_team.logo}
                                            getBaseImageUrl={getBaseImageUrl}
                                            streak={!showTeamWinStreaks ? '' : getTeamStreakDisplay(gameScore.gameDTO.away_team.id)}
                                            record={!showTeamRecords ? '' : getTeamRecordDisplay(gameScore.gameDTO.away_team.id)}
                                            status={!gameScore.completed ? "incomplete" : isAwayWinner(gameScore) ? "Win" : isHomeWinner(gameScore) ? "Loss" : "Push"}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TeamCellRenderer
                                            name={gameScore.gameDTO.home_team.name}
                                            logo={gameScore.gameDTO.home_team.logo}
                                            getBaseImageUrl={getBaseImageUrl}
                                            streak={!showTeamWinStreaks ? '' : getTeamStreakDisplay(gameScore.gameDTO.home_team.id)}
                                            record={!showTeamRecords ? '' : getTeamRecordDisplay(gameScore.gameDTO.home_team.id)}
                                            status={!gameScore.completed ? "incomplete" : isHomeWinner(gameScore) ? "Win" : isAwayWinner(gameScore) ? "Loss" : "Push"}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        {!gameScore.completed ? '' : `${gameScore.away_score} - ${gameScore.home_score}`}
                                    </TableCell>

                                    {showGameDate && (
                                        <TableCell>
                                            {formatDate(gameScore.gameDTO.commence_time, isMobile)}
                                        </TableCell>
                                    )}
                                    {showRanks && (
                                        <TableCell>
                                            {(() => {
                                                const rank = gameRanks.find((r) => r.gameId === gameScore.gameDTO.id);
                                                if (!rank) return "";
                                                const colorMap = {
                                                    Difficult: "error",
                                                    Hard: "warning",
                                                    Medium: "info",
                                                    Easy: "success",
                                                };
                                                return (
                                                    <Chip
                                                        label={`${rank.rankType} (${rank.homeRank} vs ${rank.awayRank})`}
                                                        color={colorMap[rank.rankType]}
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
    );
}

export default GameScoresPage;