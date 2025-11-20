import {useZAppContext} from '../components/AppContextProvider';
import {useRestApi} from '../api/RestInvocations.js';
import {ToggleButton, ToggleButtonGroup, IconButton} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import RepeatIcon from "@mui/icons-material/Repeat";
import ScheduleIcon from "@mui/icons-material/Schedule";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import StarIcon from "@mui/icons-material/Star";
import ScoreIcon from "@mui/icons-material/Score";
import Tooltip from "@mui/material/Tooltip";
import pickAnimationStyles from "./pick-animations";
import {
    Alert,
    Box,
    Chip,
    keyframes,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from "@mui/material";
import SportsFootballIcon from "@mui/icons-material/SportsFootball";
import React, {useCallback, useEffect, useState} from "react";
import {zWebSocket} from '../hooks/useStompClient';

import {
    EntryTotalUpdatedEvent,
    GameScoreSavedEvent,
    PickStatusUpdatedEvent,
    TeamWinStreaksUpdatedEvent
} from "../types/ZEvents";
import {
    TeamWinRecordDTO,
    AssignedGameDTO,
    GameRankDTO,
    TeamWinStreakDTO,
    GameScoreDTO,
    PickDTO,
    ApplicationSettingsDTO, TotalDTO
} from "../types/ZTypes";

const MyGamesPage = () => {

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState(null);
    const [assignedGames, setAssignedGames] = useState<AssignedGameDTO[]>([]);
    const {isAdmin, isMobile,  selectedEntry, currentWeek, currentSeason} = useZAppContext();
    const [teamWinStreaks, setTeamWinStreaks] = useState<TeamWinStreakDTO[]>([]);
    const [gameScores, setGameScores] = useState<GameScoreDTO[]>([]);
    const [picks, setPicks] = useState<PickDTO[]>([]);
    const [showGameScores, setShowGameScores] = useState<boolean>(false);
    const [teamRecords, setTeamRecords] = useState<TeamWinRecordDTO[]>([]);
    const [totals, setTotals] = useState<TotalDTO[]>([]);
    const [showTeamRecords, setShowTeamRecords] = useState<boolean>(false);
    const [showTeamWinStreaks, setShowTeamWinStreaks] = useState<boolean>(false);
    const [showGameDate, setShowGameDate] = useState<boolean>(false);
    const [showRanks, setShowRanks] = useState<boolean>(true);
    const [gameRanks, setGameRanks] = useState<GameRankDTO[]>([]);

    const {
        getAssignedGamesRestCall,
        getGameScoresByGamesRestCall,
        getBaseImageUrl,
        getGameRanksByGamesRestCall,
        getPicksByEntryAndSeasonRestCall,
        getEntryTotalsByEntryRestCall
    } = useRestApi();


    const { useStompSubscription} = zWebSocket();

    const getPickIcon = (status: String) => {
        let color = "white";
        let animation: { animation: string };
        let imageToShow: string;
        switch (status) {
            case "Win":
                color = "green";
                animation = pickAnimationStyles.win;
                imageToShow = '✔';
                break;
            case "Loss":
                color = "red";
                animation = pickAnimationStyles.loss;
                imageToShow = '✘';
                break;
            case "Push":
                color = "gold";
                animation = pickAnimationStyles.push;
                imageToShow = '●';
                break;
            default:
                break;

        }
        return (
            <span
                style={{
                    color: color,
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    //...animation,
                }}
            >
                    {imageToShow}
                </span>
        );

    };

// Cell renderer components
    const TeamCellRenderer = ({teamName, status, logoUrl, streak, record, isUserPick}) => {

        const color =
            status === "Win" ? "success" :
                status === "Loss" ? "error" :
                    status === "Push" ? "warning" :
                        "default";
        return (
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                <img
                    src={logoUrl}
                    alt={`${teamName} logo`}
                    style={{width: 24, height: 24, objectFit: 'contain'}}
                />
                <Chip label={teamName} color={color} variant="outlined" size="small"/>
                {isUserPick && getPickIcon(status)}
                {record && (<Chip label={record} color={color} variant="outlined" size="small"/>)}
                {streak && (<Chip label={streak} color={color} variant="outlined" size="small"/>)}
            </Box>
        );
    };


    const handleToggleChange = (event, newValues) => {
        if (!newValues) return; // prevent all off state
        setShowTeamRecords(newValues.includes('records'));
        setShowGameScores(newValues.includes('scores'));
        setShowTeamWinStreaks(newValues.includes('streaks'));
        setShowGameDate(newValues.includes('gamedate'));
        setShowRanks(newValues.includes('ranks'));
    };
    const handleReset = () => {
        // Reset toggles to false
        setShowTeamRecords(false);
        setShowGameScores(false);
        setShowTeamWinStreaks(false);
        setShowGameDate(false);
        setShowRanks(true);
    };


    // WebSocket message handler
    const handleGameScoreSavedEvent = useCallback((event: GameScoreSavedEvent) => {
        if (event) {
            const updatedScores = event.gameScores;
            // Update the row data with the new scores
            setAssignedGames(assignedGames => {
                return assignedGames.map(row => {
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
    const handlePickStatusUpdatedEvent = useCallback((event: PickStatusUpdatedEvent) => {
        if (event) {
            const updatedRecords = event.pickRecords;
            // Update the row data with the updated picks
            setPicks(previousPicks => {
                return previousPicks.map(row => {
                    // Find if this pick has an update
                    const updatedPick = updatedRecords.find(pick => pick.id === row.id);

                    if (updatedPick) {
                        return {
                            ...row,
                            status: updatedPick.status,
                            stamp: updatedPick.stamp
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
    const handleEntryTotalUpdatedEvent = useCallback((event: EntryTotalUpdatedEvent) => {
        if (!event || !selectedEntry) return;

        const updatedRecords = event.totalsUpdated;

        setTotals(prevTotals => {
            // 1. Put prevTotals into a map
            const map = new Map(prevTotals.map(t => [t.id, t]));

            // 2. Merge updated records into the map (replace/insert)
            for (const rec of updatedRecords) {
                if (rec.entry_id === selectedEntry.id) {
                    map.set(rec.id, rec);
                }
            }

            // 3. Return the merged list
            return Array.from(map.values());
        });
    }, [selectedEntry]);


    //websocket subscriptions
    useStompSubscription( '/topic/zevents/GameScoreUpdate', handleGameScoreSavedEvent);
    useStompSubscription( '/topic/zevents/TeamWinStreakUpdate', handleTeamWinStreakUpdateEvent);
    useStompSubscription( '/topic/zevents/PickStatusUpdate', handlePickStatusUpdatedEvent);
    useStompSubscription( '/topic/zevents/EntryTotalUpdate', handleEntryTotalUpdatedEvent);
    useStompSubscription('/topic/zevents/#', msg => {
        console.log("WS catch-all:", msg);
    });
    const spin = keyframes`
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    `;


    //dependency on selectedEntry
    useEffect(() => {
        if (!selectedEntry || !selectedEntry.id) return;
        try {
            setLoading(true);
            setError(null);
            getAssignedGamesRestCall(selectedEntry.id)
                .then(setAssignedGames)
                .catch((err) => {
                    console.error('Error fetching assigned games :', err);
                    setError('Failed to load game data. Please try again.');
                });
        } finally {
            setLoading(false);
        }
    }, [selectedEntry]);


    // dependency on assignedGames
    useEffect(() => {
        if (assignedGames && assignedGames.length > 0) {
            const listOfGames = assignedGames.map(assignedGame => assignedGame.gameDTO.id);
            getGameScoresByGamesRestCall(listOfGames)
                .then(setGameScores)
                .catch((err) => console.error("Error loading game scores", err));

            getEntryTotalsByEntryRestCall(selectedEntry.id)
                .then(setTotals)
                .catch((err) => console.error("Error loading totals", err));
        }
    }, [assignedGames]);

    //  dependency on selectedEntry and currentSeason
    useEffect(() => {
        if (selectedEntry && currentSeason != 0)
            getPicksByEntryAndSeasonRestCall(selectedEntry.id, currentSeason)
                .then(setPicks)
                .catch((err) => console.error("Error loading picks", err));
    }, [selectedEntry, currentSeason]);

    /* //TODO win streaks are not working
        //fetch win streaks
        useEffect(() => {
            if (rowData && rowData.length > 0) {
                const listOfGames = rowData.map(game => game.gameDTO.id);
                getTeamWinStreaksByEntryIdRestCall(selectedEntry.id)
                    .then(setTeamWinStreaks)
                    .catch((err) => console.error("Error loading game streaks", err));
            }
        }, [rowData]);
    */


    /* /* //TODO team records at the week time are not working
        //fetch team records
        useEffect(() => {
            if (rowData && rowData.length > 0) {
                const listOfGames = rowData.map(game => game.gameDTO.id);
                getTeamRecordsByGamesRestCall(listOfGames)
                    .then(setTeamRecords)
                    .catch((err) => console.error("Error loading team records", err));
            }
        }, [rowData]);

    */

//fetch game ranks
    useEffect(() => {
        if (assignedGames && assignedGames.length > 0) {
            const listOfGames = assignedGames.map(game => game.gameDTO.id);
            getGameRanksByGamesRestCall(listOfGames)
                .then(setGameRanks)
                .catch((err) => console.error("Error loading game ranks", err));
        }
    }, [assignedGames]);


    const isUserPick = (assignedGame: AssignedGameDTO, teamId: number): boolean => {
        if (!picks?.length) return false;

        const pickDTO = picks.find((pick) => pick.assignment_id === assignedGame.id);
        if (!pickDTO) return false

        return pickDTO.pick == teamId;
    };

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

    const getBetDisplay = (assignedGameId: number) => {
        const pickDTO = picks.find((pick) => pick.assignment_id === assignedGameId);
        if (!pickDTO) return ''
        let color: string;
        let fontSize = "1.5rem";
        let fontWeight = "bold"
        let animation: { animation: string };
        switch (pickDTO.status) {
            case "Won":
                color = "green";
                animation = pickAnimationStyles.win;
                break;
            case "Lost":
                color = "red";
                animation = pickAnimationStyles.loss;
                break;
            case "Push":
                color = "gold";
                animation = pickAnimationStyles.push;
                break;
            case "Penalty":
                color = "orange";
                animation = pickAnimationStyles.push;
                break;
            default:
                color = "white";
                animation = pickAnimationStyles.default;
        }
        return (
            <span style={{color: color, fontSize: fontSize, fontWeight: fontWeight, }}>
                {pickDTO.wager}
            </span>
        );
    };

    const getTotalDisplay = (week: number) => {
        const totalDTO = totals.find(total => total.week === week);
        if (!totalDTO) return ''
        let color: string;
        let fontSize = "1.5rem";
        let fontWeight = "bold"
        return (
            <span style={{color: color, fontSize: fontSize, fontWeight: fontWeight}}>
                {totalDTO.total}
            </span>
        );
    };
    const getBetStatusDisplay = (assignedGameId: number) => {
        const pickDTO = picks.find((pick) => pick.assignment_id === assignedGameId);
        if (!pickDTO) return ''
        let color: string = "default";
        switch (pickDTO.status) {
            case "Won":
                color = "success";
                break;
            case "Lost":
                color = "error";
                break;
            case "Push":
                color = "warning";
                break;
            case "Penalty":
                color = "info";
                break;
        }
        return (
            <Chip label={pickDTO.status} color={color} variant="filled" size="small"/>
        );
    };

    const getGameScoreDisplay = (gameId: number) => {
        if (!gameScores?.length) return '';
        const gameScoreRecord = gameScores.find((s) => s.gameDTO.id === gameId);
        if (!gameScoreRecord || !gameScoreRecord.completed) return '';
        return `${gameScoreRecord.away_score} - ${gameScoreRecord.home_score}`;
    };
// Helper function to determine if away team won
    const isAwayWinner = (data: GameScoreDTO) => {
        return data.completed && data.away_score > data.home_score;
    };

// Helper function to determine if home team won
    const isHomeWinner = (data: GameScoreDTO) => {
        return data.completed && data.home_score > data.away_score;
    };

// Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);

        // Mobile users get a shorter, more compact format
        const options = isMobile
            ? {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }
            : {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            };

        return date.toLocaleString('en-US', options);
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

    return (
        <div>
            <Box sx={{p: 3}}>
                <Box sx={{display: 'flex', alignItems: 'center', mb: 3}}>
                    <SportsFootballIcon sx={{mr: 1}}/>
                    <h1>Current Week: {currentWeek !=0  && currentWeek}</h1>
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


                    <ToggleButtonGroup
                        value={[
                            ...(showTeamRecords ? ['records'] : []),
                            ...(showTeamWinStreaks ? ['streaks'] : []),
                            ...(showGameDate ? ['gamedate'] : []),
                            ...(showRanks ? ['ranks'] : []),
                            ...(showGameScores ? ['scores'] : []),

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
                        <Tooltip title={showGameScores ? "Hide Game Scores" : "Show Game Scores"}>
                            <ToggleButton
                                value="scores"
                                selected={showGameScores}
                                sx={{
                                    px: 2,
                                    transition: 'all 0.2s ease',
                                    bgcolor: showGameScores ? 'primary.light' : 'transparent',
                                    '&:hover': {
                                        bgcolor: showGameScores ? 'primary.main' : 'action.hover',
                                    },
                                    '&.Mui-selected': {
                                        bgcolor: 'primary.light',
                                        color: 'primary.main',
                                        '&:hover': {bgcolor: 'primary.main', color: 'white'},
                                    },
                                }}
                            >
                                <ScoreIcon sx={{mr: 1}}/>
                            </ToggleButton>
                        </Tooltip>
                        <Tooltip title={showRanks ? "Hide Game Ranks" : "Show Game Rank"}>
                            <ToggleButton
                                value="ranks"
                                selected={showRanks}
                                sx={{
                                    px: 2,
                                    transition: 'all 0.2s ease',
                                    bgcolor: showRanks ? 'primary.light' : 'transparent',
                                    '&:hover': {
                                        bgcolor: showRanks ? 'primary.main' : 'action.hover',
                                    },
                                    '&.Mui-selected': {
                                        bgcolor: 'primary.light',
                                        color: 'primary.main',
                                        '&:hover': {bgcolor: 'primary.main', color: 'white'},
                                    },
                                }}
                            >
                                <StarIcon sx={{mr: 1}}/>
                            </ToggleButton>
                        </Tooltip>
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
                                <TableCell sx={{width: 'auto'}}>Week</TableCell>
                                <TableCell sx={{width: 'auto'}}>Away</TableCell>
                                <TableCell sx={{width: 'auto'}}>Home</TableCell>
                                {showGameScores && <TableCell>Score</TableCell>}
                                {showGameDate && <TableCell>Game Date</TableCell>}
                                {showRanks && <TableCell>Game Rank</TableCell>}
                                <TableCell sx={{width: 'auto'}}>Bet</TableCell>
                                <TableCell sx={{width: 'auto'}}>Status</TableCell>
                                <TableCell sx={{width: 'auto'}}>Total</TableCell>
                                <TableCell sx={{width: 'auto'}}>Rank</TableCell>
                                <TableCell sx={{width: 'auto'}}>Streak</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {assignedGames.map((assignedGame, index) => (
                                <TableRow
                                    key={assignedGame.gameDTO.week || index}
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: 'action.hover'
                                        }
                                    }}
                                >
                                    <TableCell align="center">
                                        {assignedGame.gameDTO.week}
                                    </TableCell>

                                    <TableCell>
                                        {(() => {
                                            const gameScoreRecord = gameScores.find((s) => s.gameDTO.id === assignedGame.gameDTO.id);
                                            let status = "incomplete";
                                            if (gameScoreRecord?.completed) {
                                                if (isAwayWinner(gameScoreRecord)) status = "Win";
                                                else if (isHomeWinner(gameScoreRecord)) status = "Loss";
                                                else status = "Push";
                                            }
                                            return (
                                                <TeamCellRenderer
                                                    teamName={assignedGame.gameDTO.away_team.name}
                                                    logoUrl={getBaseImageUrl(assignedGame.gameDTO.away_team.logo)}
                                                    isUserPick={isUserPick(assignedGame, assignedGame.gameDTO.away_team.id)}
                                                    streak={!showTeamWinStreaks ? '' : getTeamStreakDisplay(assignedGame.gameDTO.away_team.id)}
                                                    record={!showTeamRecords ? '' : getTeamRecordDisplay(assignedGame.gameDTO.away_team.id)}
                                                    status={status}
                                                />
                                            );
                                        })()}
                                    </TableCell>
                                    <TableCell>
                                        {(() => {
                                            const gameScoreRecord = gameScores.find((s) => s.gameDTO.id === assignedGame.gameDTO.id);
                                            let status = "incomplete";
                                            if (gameScoreRecord?.completed) {
                                                if (isHomeWinner(gameScoreRecord)) status = "Win";
                                                else if (isAwayWinner(gameScoreRecord)) status = "Loss";
                                                else status = "Push";
                                            }
                                            return (
                                                <TeamCellRenderer
                                                    teamName={assignedGame.gameDTO.home_team.name}
                                                    logoUrl={getBaseImageUrl(assignedGame.gameDTO.home_team.logo)}
                                                    isUserPick={isUserPick(assignedGame, assignedGame.gameDTO.home_team.id)}
                                                    streak={!showTeamWinStreaks ? '' : getTeamStreakDisplay(assignedGame.gameDTO.home_team.id)}
                                                    record={!showTeamRecords ? '' : getTeamRecordDisplay(assignedGame.gameDTO.home_team.id)}
                                                    status={status}
                                                />
                                            );
                                        })()}
                                    </TableCell>
                                    {showGameScores && (
                                        <TableCell align="center">
                                            {getGameScoreDisplay(assignedGame.gameDTO.id)}
                                        </TableCell>
                                    )}
                                    {showGameDate && (
                                        <TableCell>
                                            {formatDate(assignedGame.gameDTO.commence_time)}
                                        </TableCell>
                                    )}
                                    {showRanks && (
                                        <TableCell>
                                            {(() => {
                                                const rank = gameRanks.find((r) => r.gameId === assignedGame.gameDTO.id);
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

                                    <TableCell align="center">
                                        {getBetDisplay(assignedGame.id)}
                                    </TableCell>
                                    <TableCell align="center">
                                        {getBetStatusDisplay(assignedGame.id)}
                                    </TableCell>
                                    <TableCell align="center">
                                        {getTotalDisplay(assignedGame.gameDTO.week)}
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

export default MyGamesPage;