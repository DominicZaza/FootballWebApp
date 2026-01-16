import {useZAppContext} from '../components/AppContextProvider.tsx';
import {getTeamLogoUrl, useRestApi} from '../api/RestInvocations.ts';
import {ToggleButtonGroup, Tooltip, Typography} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import RepeatIcon from "@mui/icons-material/Repeat";
import ScheduleIcon from "@mui/icons-material/Schedule";
import StarIcon from "@mui/icons-material/Star";
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import {formatDate} from '../utils/DateUtils'
import {ToggleButtonRenderer} from '../utils/ToggleButtonRenderer';
import {GameCategoryRenderer} from '../utils/GameCategoryRenderer'
import HeaderWithTooltip from '../components/HeaderWithTooltip'
import {useNotify} from "../components/NotificationProvider";
import '../styles/GameScoresPage.css';

import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
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
import SportsFootballIcon from "@mui/icons-material/SportsFootball";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import type {GameScoreSavedEvent} from "../types/ZEvents";
import type {GameScorePageDTO} from "../types/ZTypes";
import {zWebSocket} from '../hooks/useStompClient';
import LoadingSpinner from "../components/LoadingSpinner.tsx";


const TeamCellRenderer = ({
                              name, ext_id,
                              status,
                              streak,
                              record,
                              onClickTeam,
                              homeTeamSpread,
                              sport
                          }) => {
    const logoUrl = getTeamLogoUrl(ext_id, sport)

    const dotColor =
        status === "Win" ? "rgba(76, 175, 80, 0.35)" :
            status === "Loss" ? "rgba(244, 67, 54, 0.35)" :
                status === "Push" ? "rgba(255, 193, 7, 0.45)" :
                    "rgba(0,0,0,0.25)";


    return (
        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
            {ext_id && <img loading="lazy" src={logoUrl} style={{width: 24, height: 24}}/>}

            {name && (
                <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: dotColor,
                        }}
                    />
                    <Typography
                        variant="body2"
                        sx={{
                            cursor: onClickTeam ? 'pointer' : 'default',
                        }}
                        onClick={onClickTeam}
                    >
                        {name} {homeTeamSpread}
                    </Typography>
                </Box>
            )}

            {record && <Chip label={record} size="small"/>}
            {streak && <Chip label={streak} size="small"/>}
        </Box>
    );
};


function launchESPNTeamSchedule(selectedSport: string, team_abbrev: string, season: string) {
    const espnSport = selectedSport === "americanfootball_nfl" ? "nfl" : "college-football";
    const url = "https://www.espn.com/" + espnSport + "/team/schedule/_/name/" + team_abbrev + "/season/" + season;
    window.open(url, "_blank", "noopener,noreferrer");
}

function launchESPNGameRecap(selectedSport: string, espnGameId: string) {
    const espnSport = selectedSport === "americanfootball_nfl" ? "nfl" : "college-football";
    const url = "https://www.espn.com/" + espnSport + "/game/_/gameId/" + espnGameId;
    window.open(url, "_blank", "noopener,noreferrer");
}

const ScoreCellRenderer = ({game}) => {
    if (!game.completed) return <></>;
    return <Typography variant="body2"
                       sx={{
                           cursor: 'pointer',
                       }}
                       onClick={() => launchESPNGameRecap(game.sport, game.espn_game_id)}
    >{game.away_score} - {game.home_score}</Typography>;
};

const GameScoresPage = () => {

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState(null);
    const [gameScorePageDTOs, setGameScorePageDTOs] = useState<GameScorePageDTO[] >([]);
    const [snappingScores, setSnappingScores] = useState<boolean>(false);
    const [snappingOdds, setSnappingOdds] = useState<boolean>(false);
    const [snappingPlayoffGames, setSnappingPlayoffGames] = useState<boolean>(false);
    const [snappingGameDateTimes, setSnappingGameDateTimes] = useState<boolean>(false);
    const [rollingWeek, setRollingWeek] = useState<boolean>(false);
    const {adminMode, isMobile, currentWeek, currentSeason, seasons} = useZAppContext();
    //toggle states
    const [showTeamRecords, setShowTeamRecords] = useState<boolean>(false);
    const [showTeamWinStreaks, setShowTeamWinStreaks] = useState<boolean>(false);
    const [showGameDate, setShowGameDate] = useState<boolean>(false);
    const [showGameCategory, setShowGameCategory] = useState<boolean>(false);
    const [showGameOdds, setShowGameOdds] = useState<boolean>(false);


    const [snapScoresMessage, setSnapScoresMessage] = useState('');
    const [snapOddsMessage, setSnapOddsMessage] = useState('');
    const [showSnapScoreTooltip, setShowSnapScoreTooltip] = useState(false);
    const [showSnapOddsTooltip, setShowSnapOddsTooltip] = useState(false);
    const [showSnapPlayoffGamesTooltip, setShowSnapPlayoffGamesTooltip] = useState(false);
    const [showUpdatingGameDateTimesTooltip, setShowUpdatingGameDateTimesTooltip] = useState(false);
    const [showRollingWeekTooltip, setShowRollingWeekTooltip] = useState(false);
    const [rollingWeekReturnMessage, setRollingWeekReturnMessage] = useState('');
    const [playoffGamesRestCallReturnMessage, setPlayoffGamesRestCallReturnMessage] = useState('');
    const [updateGameTimesRestCallReturnMessage, setUpdateGameTimesRestCallReturnMessage] = useState('');
    const {notify} = useNotify();

    const [selectedSeasonId, setSelectedSeasonId] = useState<number>(currentSeason);
    const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek);
    const [maxAvailableWeek, setMaxAvailableWeek] = useState<number>(null);
    const [showAllNFLGames, setShowAllNFLGames] = useState<boolean>(true);
    const [showAllNCAAFGames, setShowAllNCAAFGames] = useState<boolean>(true);
    const [showAllPrimetimeGames, setShowAllPrimetimeGames] = useState<boolean>(true);

    const {
        getGameScoresByWeekRestCall,
        getMaxWeekSeasonRestCall,
        snapCompletedGameScoresRestCall,
        snapCompletedGameOddsRestCall,
        rollWeekRestCall,
        createPlayoffGamesForSportRestCall,
        togglePrimetimeRestCall,
        toggleExceptionRestCall,
        updateGameDateTimesRestCall
    } = useRestApi();
    const {useStompSubscription} = zWebSocket();


    const handleTogglePrimetime = async (sport: string,gameId: number, currentValue: boolean) => {
        if (!adminMode) return;
        if (sport != "americanfootball_nfl") return;

        try {
            // optimistic UI update
            setGameScorePageDTOs(prev =>
                prev.map(g =>
                    g.game_id === gameId
                        ? {...g, primetime: !currentValue}
                        : g
                )
            );

            await togglePrimetimeRestCall(gameId, !currentValue);

            notify("Primetime Updated", "Game primetime status updated", "success");
        } catch (err) {
            // rollback on failure
            setGameScorePageDTOs(prev =>
                prev.map(g =>
                    g.game_id === gameId
                        ? {...g, primetime: currentValue}
                        : g
                )
            );

            notify(
                "Update Failed",
                err.message || "Failed to update primetime status",
                "error"
            );
        }
    };
    const handleToggleException = async (sport: string,gameId: number, currentValue: boolean) => {
        if (!adminMode) return;
        if (sport != "americanfootball_nfl") return;

        try {
            // optimistic UI update
            setGameScorePageDTOs(prev =>
                prev.map(g =>
                    g.game_id === gameId
                        ? {...g, exception: !currentValue}
                        : g
                )
            );

            await toggleExceptionRestCall(gameId, !currentValue);

            notify("Exception Updated", "Game exception status updated", "success");
        } catch (err) {
            // rollback on failure
            setGameScorePageDTOs(prev =>
                prev.map(g =>
                    g.game_id === gameId
                        ? {...g, exception: currentValue}
                        : g
                )
            );

            notify(
                "Update Failed",
                err.message || "Failed to update exception status",
                "error"
            );
        }
    };

    const handleDataViewToggleChange = (event, newValues) => {
        if (!newValues) return; // prevent all off state

        const prefs = {
            teamRecordsToggle: newValues.includes('teamRecordsToggle'),
            streaksToggle: newValues.includes('streaksToggle'),
            gameDateToggle: newValues.includes('gameDateToggle'),
            gameCategoryToggle: newValues.includes('gameCategoryToggle'),
            gameOddsToggle: newValues.includes('gameOddsToggle'),
        };
        setShowTeamRecords(prefs.teamRecordsToggle);
        setShowTeamWinStreaks(prefs.streaksToggle);
        setShowGameDate(prefs.gameDateToggle);
        setShowGameCategory(prefs.gameCategoryToggle);
        setShowGameOdds(prefs.gameOddsToggle);

        // 🟦 persist to browser
        localStorage.setItem("GameScoresDataViewTogglePrefs", JSON.stringify(prefs));
    };
    useEffect(() => {
        const saved = localStorage.getItem("GameScoresDataViewTogglePrefs");
        if (saved) {
            const prefs = JSON.parse(saved);
            setShowTeamRecords(prefs.teamRecordsToggle);
            setShowTeamWinStreaks(prefs.streaksToggle);
            setShowGameDate(prefs.gameDateToggle);
            setShowGameCategory(prefs.gameCategoryToggle);
            setShowGameOdds(prefs.gameOddsToggle);
        }
    }, []);
    const handleGameViewToggleChange = (event, newValues) => {
        if (!newValues) return; // prevent all off state

        const prefs = {
            allNFLGamesToggle: newValues.includes('allNFLGamesToggle'),
            allNCAAFGamesToggle: newValues.includes('allNCAAFGamesToggle'),
            allPrimetimeGamesToggle: newValues.includes('allPrimetimeGamesToggle'),

        };

        setShowAllNFLGames(prefs.allNFLGamesToggle);
        setShowAllNCAAFGames(prefs.allNCAAFGamesToggle);
        setShowAllPrimetimeGames(prefs.allPrimetimeGamesToggle);

        // 🟦 persist to browser
        localStorage.setItem("GameScoresGameViewTogglePrefs", JSON.stringify(prefs));
    };
    useEffect(() => {
        const saved = localStorage.getItem("GameScoresGameViewTogglePrefs");
        if (saved) {
            const prefs = JSON.parse(saved);
            setShowAllNFLGames(prefs.allNFLGamesToggle);
            setShowAllNCAAFGames(prefs.allNCAAFGamesToggle);
            setShowAllPrimetimeGames(prefs.allPrimetimeGamesToggle);
        }
    }, []);


    // WebSocket message handler
    const handleGameScoredSavedEvent = useCallback((event: GameScoreSavedEvent) => {
        if (event) {
            const updatedScores = event.gameScores;
            // Update the row data with the new scores
            setGameScorePageDTOs(gameScorePageDTO => {
                return gameScorePageDTO.map(row => {
                    // Find if this game has an update
                    const updatedScore = updatedScores.find(score => score.game_id === row.game_id);
                    return updatedScore ? updatedScore : row;
                });
            });
            notify("Game Scores Updated", "Pages Refreshed", "success");

        }
    }, []);


    useStompSubscription('/topic/zevents/GameScoreUpdate', handleGameScoredSavedEvent);


    useEffect(() => {
        setSelectedSeasonId(currentSeason);
    }, [currentSeason]);

    useEffect(() => {
        if (currentWeek != 0)
            setSelectedWeek(currentWeek);
    }, [currentWeek]);

// fetch teams and weeks whenever sport or season changes
    useEffect(() => {
        if (!selectedSeasonId) return;

        getMaxWeekSeasonRestCall(selectedSeasonId)
            .then(maxWeekAvailable => {
                // 🔥 Clear selectedWeek ONLY when it exceeds the maxAvailableWeek
                setSelectedWeek(prevWeek => {
                    if (prevWeek && prevWeek > maxWeekAvailable) {
                        return null;   // <-- forces user to pick a valid week
                    }
                    return prevWeek;
                });
                setMaxAvailableWeek(maxWeekAvailable);

            })
            .catch(err => {
                setError('Failed to retrieve teams. ' + (err.message || 'Please try again.'));
                setGameScorePageDTOs([]);
            });

    }, [selectedSeasonId]);


    // fetch game scores
    useEffect(() => {
        if (!selectedSeasonId) return;


        // WEEK mode guards
        if (selectedWeek == null) return;
        if (maxAvailableWeek !== null && selectedWeek > maxAvailableWeek) return;

        setLoading(true);
        setError(null);

            getGameScoresByWeekRestCall(selectedSeasonId, selectedWeek)
                .then(data => {
                    setGameScorePageDTOs(data.records);
                    setLoading(false);
                })
                .catch(err => {
                    setError('Failed to retrieve game scores. ' + (err.message || 'Please try again.'));
                    setGameScorePageDTOs([]);
                    setLoading(false);
                });


    }, [
        selectedSeasonId,
        selectedWeek,
        maxAvailableWeek
    ]);


    // Helper function to determine if away team won
    const isAwayWinner = (data: GameScorePageDTO) => {
        return data.completed && data.away_score > data.home_score;
    };

    // Helper function to determine if home team won
    const isHomeWinner = (data: GameScorePageDTO) => {
        return data.completed && data.home_score > data.away_score;
    };


    const handleSnapGameScoresAction = async () => {
        try {
            setSnappingScores(true);
            setError(null);
            const gameScoreSnapStatus = await snapCompletedGameScoresRestCall(selectedSeasonId, selectedWeek);

            // 🟦 Show disappearing tooltip
            setSnapScoresMessage(gameScoreSnapStatus || "Snap successful");
            setShowSnapScoreTooltip(true);

            setTimeout(() => setShowSnapScoreTooltip(false), 10000);

        } catch (err) {
            setError('Failed to snap game scores. ' + (err.message || 'Please try again.'));
        } finally {
            setSnappingScores(false);
        }
    };

    const handleSnapGameOddsAction = async () => {
        try {
            setSnappingOdds(true);
            setError(null);
            const oddsSnapStatus = await snapCompletedGameOddsRestCall(selectedSeasonId, selectedWeek);

            // 🟦 Show disappearing tooltip
            setSnapOddsMessage(oddsSnapStatus || "Snap successful");
            setShowSnapOddsTooltip(true);

            setTimeout(() => setShowSnapOddsTooltip(false), 10000);

        } catch (err) {
            setError('Failed to snap game odds. ' + (err.message || 'Please try again.'));
        } finally {
            setSnappingOdds(false);
        }
    };

    const handleRollWeekAction = async () => {
        try {
            setRollingWeek(true);
            setError(null);
            const rollingWeekReturnMessage = await rollWeekRestCall();

            // 🟦 Show disappearing tooltip
            setRollingWeekReturnMessage(rollingWeekReturnMessage || "Successful Rolled Week");
            setShowRollingWeekTooltip(true);

            setTimeout(() => setShowRollingWeekTooltip(false), 10000);

        } catch (err) {
            setError('Failed to roll the week. ' + (err.message || 'Please try again.'));
        } finally {
            setRollingWeek(false);
        }
    };

    const handleSnapPlayoffGamesAction = async () => {
        try {
            setSnappingPlayoffGames(true);
            setError(null);
            const restCallReturnMessage = await createPlayoffGamesForSportRestCall();

            // 🟦 Show disappearing tooltip
            setPlayoffGamesRestCallReturnMessage(restCallReturnMessage || "Successful Created Playoff Games");
            setShowSnapPlayoffGamesTooltip(true);

            setTimeout(() => setShowSnapPlayoffGamesTooltip(false), 10000);

        } catch (err) {
            setError('Failed to  create  playoff games. ' + (err.message || 'Please try again.'));
        } finally {
            setSnappingPlayoffGames(false);
        }
    };

    const handleUpdatingGameDateTimesAction = async () => {
        try {
            setSnappingGameDateTimes(true);
            setError(null);
            const restCallReturnMessage = await updateGameDateTimesRestCall(selectedSeasonId, selectedWeek);

            // 🟦 Show disappearing tooltip
            setUpdateGameTimesRestCallReturnMessage(restCallReturnMessage || "Successful Update game date times");
            setShowUpdatingGameDateTimesTooltip(true);

            setTimeout(() => setShowUpdatingGameDateTimesTooltip(false), 10000);

        } catch (err) {
            setError('Failed to update game date times. ' + (err.message || 'Please try again.'));
        } finally {
            setSnappingGameDateTimes(false);
        }
    };

        const filteredScores = useMemo(() => {
            return gameScorePageDTOs.filter(gameScore => {
                const isNFL = gameScore.sport === "americanfootball_nfl";
                const isNCAAF = gameScore.sport === "americanfootball_ncaaf";
                const isPrimetime = gameScore.primetime;
                return (
                    (showAllNFLGames && isNFL) ||
                    (showAllNCAAFGames && isNCAAF) ||
                    (showAllPrimetimeGames && isPrimetime) );
            });
        }, [
            gameScorePageDTOs,
            showAllNFLGames,
            showAllNCAAFGames,
            showAllPrimetimeGames
        ]);

        // Generate week options
        const range = (start: number, end: number) =>
            Array.from({length: end - start + 1}, (_, i) => start + i);

        const weekOptions = range(1, maxAvailableWeek || 0).map(week => (
            <MenuItem key={week} value={week}>
                {week}
            </MenuItem>
        ));

        if (loading) {
            return (
                <LoadingSpinner/>
            );
        }

        return (
        <div>
            <Box sx={{p: 3}}>
                <Box sx={{display: 'flex', alignItems: 'center', mb: 3}}>
                    <SportsFootballIcon sx={{mr: 1}}/>
                    <h1>Game Scores</h1>
                </Box>

                <Box sx={{display: 'flex', alignItems: "flex-end", gap: 2, mb: 3, flexWrap: 'wrap'}}>

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
                            onChange={(e, value) => {
                                setSelectedSeasonId(e.target.value);
                            }}
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
                            onChange={(e) => setSelectedWeek(e.target.value)}
                        >
                            {weekOptions}
                        </Select>
                    </FormControl>
                </Box>
                <Box sx={{display: 'flex', alignItems: "flex-end", gap: 2, mb: 3, flexWrap: 'wrap'}}>

                <ToggleButtonGroup
                        value={[
                            ...(showTeamRecords ? ['teamRecordsToggle'] : []),
                            ...(showTeamWinStreaks ? ['streaksToggle'] : []),
                            ...(showGameDate ? ['gameDateToggle'] : []),
                            ...(showGameCategory ? ['gameCategoryToggle'] : []),
                            ...(showGameOdds ? ['gameOddsToggle'] : []),

                        ]}
                        onChange={handleDataViewToggleChange}
                        aria-label="Display options"
                        sx={{
                            height: 56,
                            borderRadius: 2,
                            ml: adminMode ? 1 : 0,
                            boxShadow: 1,
                        }}
                    >

                        <ToggleButtonRenderer showToggle={showTeamRecords} toggleName="Team Records"
                                              toggleKey="teamRecordsToggle"
                                              Icon={EmojiEventsIcon}/>
                        <ToggleButtonRenderer showToggle={showTeamWinStreaks} toggleName="Team Streaks"
                                              toggleKey="streaksToggle" Icon={RepeatIcon}/>
                        <ToggleButtonRenderer showToggle={showGameDate} toggleName="Game Date"
                                              toggleKey="gameDateToggle"
                                              Icon={ScheduleIcon}/>
                        <ToggleButtonRenderer showToggle={showGameCategory} toggleName="Game Category"
                                              toggleKey="gameCategoryToggle" Icon={StarIcon}/>)
                        <ToggleButtonRenderer showToggle={showGameOdds} toggleName="Game Odds"
                                              toggleKey="gameOddsToggle"
                                              Icon={TrendingFlatIcon}/>
                </ToggleButtonGroup>
                    <ToggleButtonGroup
                        value={[
                            ...(showAllNFLGames ? ['allNFLGamesToggle'] : []),
                            ...(showAllNCAAFGames ? ['allNCAAFGamesToggle'] : []),
                            ...(showAllPrimetimeGames ? ['allPrimetimeGamesToggle'] : []),

                        ]}
                        onChange={handleGameViewToggleChange}
                        aria-label="Display options"
                        sx={{
                            height: 56,
                            borderRadius: 2,
                            ml: adminMode ? 1 : 0,
                            boxShadow: 1,
                        }}
                    >


                    <ToggleButtonRenderer showToggle={showAllNCAAFGames} toggleName="All NCAAF Games"
                                              toggleKey="allNCAAFGamesToggle"
                                              Icon={ScheduleIcon}
                                              imgSrc='https://a.espncdn.com/redesign/assets/img/icons/ESPN-icon-football-college.png'/>
                        <ToggleButtonRenderer showToggle={showAllNFLGames} toggleName="All NFL Games"
                                              toggleKey="allNFLGamesToggle"
                                              Icon={ScheduleIcon}
                                              imgSrc='https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png'/>
                        <ToggleButtonRenderer showToggle={showAllPrimetimeGames} toggleName="All Primetime Games"
                                              toggleKey="allPrimetimeGamesToggle"
                                              Icon={StarIcon}/>

                    </ToggleButtonGroup>
                </Box>
                <Box>
                    {/* Snap Game Scores Button - Admin Only */}
                    {adminMode && (
                        <Tooltip
                            title={snapScoresMessage.quotaUsageStatus}
                            placement="top"
                            open={showSnapScoreTooltip}
                            disableHoverListener
                            disableFocusListener
                            disableTouchListener
                            arrow
                        >
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSnapGameScoresAction}
                                disabled={snappingScores || !selectedSeasonId || !selectedWeek}
                                sx={{height: 56}}
                            >
                                {snappingScores ? <CircularProgress size={24}/> : 'Snap Game Scores'}
                            </Button>
                        </Tooltip>
                    )}
                    {/* Snap Game Odds Button - Admin Only */}
                    {adminMode && (
                        <Tooltip
                            title={snapOddsMessage.quotaUsageStatus}
                            placement="top"
                            open={showSnapOddsTooltip}
                            disableHoverListener
                            disableFocusListener
                            disableTouchListener
                            arrow
                        >
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSnapGameOddsAction}
                                disabled={snappingOdds || !selectedSeasonId || !selectedWeek}
                                sx={{height: 56}}
                            >
                                {snappingOdds ? <CircularProgress size={24}/> : 'Snap Game Odds'}
                            </Button>
                        </Tooltip>
                    )}
                    {/* Roll Week Button - Admin Only */}
                    {adminMode && (
                        <Tooltip
                            title={rollingWeekReturnMessage.status}
                            placement="top"
                            open={showRollingWeekTooltip}
                            disableHoverListener
                            disableFocusListener
                            disableTouchListener
                            arrow
                        >
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleRollWeekAction}
                                disabled={rollingWeek || !selectedSeasonId || !selectedWeek}
                                sx={{height: 56}}
                            >
                                {rollingWeek ? <CircularProgress size={24}/> : 'Roll Game Week'}
                            </Button>
                        </Tooltip>
                    )}
                    {/* Create Playoff Games - Admin Only */}
                    {adminMode && (
                        <Tooltip
                            title={playoffGamesRestCallReturnMessage.status}
                            placement="top"
                            open={showSnapPlayoffGamesTooltip}
                            disableHoverListener
                            disableFocusListener
                            disableTouchListener
                            arrow
                        >
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSnapPlayoffGamesAction}
                                disabled={snappingPlayoffGames}
                                sx={{height: 56}}
                            >
                                {snappingPlayoffGames ?
                                    <CircularProgress size={24}/> : 'Create Playoff Games'}
                            </Button>
                        </Tooltip>
                    )}
                    {/* Update Game Date Times - Admin Only */}
                    {adminMode && (
                        <Tooltip
                            title={updateGameTimesRestCallReturnMessage.status}
                            placement="top"
                            open={showUpdatingGameDateTimesTooltip}
                            disableHoverListener
                            disableFocusListener
                            disableTouchListener
                            arrow
                        >
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleUpdatingGameDateTimesAction}
                                disabled={snappingGameDateTimes}
                                sx={{height: 56}}
                            >
                                {snappingGameDateTimes ?
                                    <CircularProgress size={24}/> : 'Update Game Date Times for Selected Week'}
                            </Button>
                        </Tooltip>
                    )}

                </Box>


                {error && (
                    <Alert severity="error" sx={{mb: 2}} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <TableContainer component={Paper} sx={{maxHeight: 1200}}>
                    <Table stickyHeader size="small" sx={{
                        "& td, & th": {
                            padding: "4px 6px",        // tighter vertical + horizontal padding
                            whiteSpace: "nowrap"
                        }
                    }}>

                        <TableHead>
                            <TableRow>
                                <TableCell></TableCell>
                                <TableCell>Away</TableCell>
                                <TableCell>Home</TableCell>
                                {showGameOdds && (<TableCell>O/U</TableCell>)}

                                <TableCell>Score</TableCell>
                                {showGameDate && <TableCell>Game Date</TableCell>}
                                {showGameCategory && (
                                    <TableCell>
                                        <HeaderWithTooltip
                                            label="Game Rank"
                                            tooltip="Game Rank indicates the importance or tier of the matchup (e.g., Prime, Featured, Standard)."
                                        />
                                    </TableCell>
                                )}
                                {adminMode && (
                                    <TableCell>Primetime</TableCell>
                                )}
                                {adminMode && (
                                    <TableCell>Exception</TableCell>
                                )}

                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredScores && filteredScores.map((gameScorePageDTO, index) => {
                                    const homeSpread = gameScorePageDTO.home_team_spread;

                                    return (
                                        <TableRow
                                            key={gameScorePageDTO.game_id || index}
                                            sx={{
                                                '&:hover': {
                                                    backgroundColor: 'action.hover'
                                                }
                                            }}
                                        >
                                            <TableCell>{index + 1}</TableCell>


                                            <TableCell>
                                                <TeamCellRenderer
                                                    name={gameScorePageDTO.away_team_name}
                                                    ext_id={gameScorePageDTO.away_team_ext_id}
                                                    streak={!showTeamWinStreaks || !gameScorePageDTO.completed ? '' : gameScorePageDTO.away_current_streak}
                                                    record={!showTeamRecords || !gameScorePageDTO.completed ? '' : `${gameScorePageDTO.away_wins}-${gameScorePageDTO.away_losses}-${gameScorePageDTO.away_ties}`}
                                                    status={!gameScorePageDTO.completed ? "incomplete" : isAwayWinner(gameScorePageDTO) ? "Win" : isHomeWinner(gameScorePageDTO) ? "Loss" : "Push"}
                                                    onClickTeam={() => {
                                                        launchESPNTeamSchedule(gameScorePageDTO.sport, gameScorePageDTO.away_team_abbreviation, selectedSeasonId);
                                                    }}
                                                    homeTeamSpread={null}  // this is the away team
                                                    sport={gameScorePageDTO.sport}
                                                />
                                            </TableCell>


                                            <TableCell>
                                                <TeamCellRenderer
                                                    name={gameScorePageDTO.home_team_name}
                                                    ext_id={gameScorePageDTO.home_team_ext_id}
                                                    streak={!showTeamWinStreaks || !gameScorePageDTO.completed ? '' : gameScorePageDTO.home_current_streak}
                                                    record={!showTeamRecords || !gameScorePageDTO.completed ? '' : `${gameScorePageDTO.home_wins}-${gameScorePageDTO.home_losses}-${gameScorePageDTO.home_ties}`}
                                                    status={!gameScorePageDTO.completed ? "incomplete" : isHomeWinner(gameScorePageDTO) ? "Win" : isAwayWinner(gameScorePageDTO) ? "Loss" : "Push"}
                                                    onClickTeam={() => {
                                                        launchESPNTeamSchedule(gameScorePageDTO.sport, gameScorePageDTO.home_team_abbreviation, selectedSeasonId);
                                                    }}
                                                    homeTeamSpread={!showGameOdds || (homeSpread == null || homeSpread == '') ? null : `(${homeSpread})`}
                                                    sport={gameScorePageDTO.sport}
                                                />
                                            </TableCell>
                                            {showGameOdds ? (
                                                <TableCell>

                                                    <Tooltip title={`Bookmaker stamp: ${gameScorePageDTO.bookmaker_stamp}`}
                                                             arrow>
                                                        <span>{gameScorePageDTO.over_points}</span>
                                                    </Tooltip>

                                                </TableCell>
                                            ) : null}
                                            <TableCell>
                                                <ScoreCellRenderer game={gameScorePageDTO} />
                                            </TableCell>

                                            {showGameDate && (
                                                <TableCell>
                                                    {formatDate(gameScorePageDTO.commence_time, isMobile)}
                                                </TableCell>
                                            )}
                                            {showGameCategory && (
                                                <TableCell>
                                                    {gameScorePageDTO.sport === 'americanfootball_nfl' && (
                                                    <GameCategoryRenderer rankType={gameScorePageDTO.rank_type}
                                                                                  homeRank={gameScorePageDTO.home_rank_preseason}
                                                                                  awayRank={gameScorePageDTO.away_rank_preseason}/>
                                                        )}
                                                </TableCell>
                                            )}
                                            {adminMode && (
                                                <TableCell
                                                    onClick={() =>
                                                        adminMode &&
                                                        handleTogglePrimetime(gameScorePageDTO.sport,
                                                            gameScorePageDTO.game_id, gameScorePageDTO.primetime
                                                        )
                                                    }
                                                    sx={{
                                                        cursor: adminMode ? 'pointer' : 'default',
                                                        fontWeight: gameScorePageDTO.primetime ? 600 : 400,
                                                        color: gameScorePageDTO.primetime ? 'primary.main' : 'text.secondary',
                                                        '&:hover': adminMode
                                                            ? {backgroundColor: 'action.hover'}
                                                            : undefined
                                                    }}
                                                >
                                                    <Tooltip title={adminMode ? "Click to toggle primetime" : ""}>
                                                     <span>
                                                         {gameScorePageDTO.primetime ?
                                                             (<StarIcon color="warning"/>) :
                                                             (<StarIcon color="disabled"/>)}
                                                    </span>
                                                    </Tooltip>
                                                </TableCell>
                                            )}
                                            { adminMode && (
                                                <TableCell
                                                    onClick={() =>
                                                        adminMode &&
                                                        handleToggleException(gameScorePageDTO.sport,
                                                            gameScorePageDTO.game_id, gameScorePageDTO.exception
                                                        )
                                                    }
                                                    sx={{
                                                        cursor: adminMode ? 'pointer' : 'default',
                                                        fontWeight: gameScorePageDTO.exception ? 600 : 400,
                                                        color: gameScorePageDTO.exception ? 'primary.main' : 'text.secondary',
                                                        '&:hover': adminMode
                                                            ? {backgroundColor: 'action.hover'}
                                                            : undefined
                                                    }}
                                                >
                                                    <Tooltip title={adminMode ? "Click to toggle exception" : ""}>
                                                     <span>
                                                         {gameScorePageDTO.exception ?
                                                             (<StarIcon color="warning"/>) :
                                                             (<StarIcon color="disabled"/>)}
                                                    </span>
                                                    </Tooltip>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    )
                                }
                            )
                            }
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </div>
    );
}

export default GameScoresPage;