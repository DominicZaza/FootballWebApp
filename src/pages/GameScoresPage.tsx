import {useZAppContext} from '../components/AppContextProvider.tsx';
import {getTeamLogoUrl,   useRestApi} from '../api/RestInvocations.js';
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
    keyframes,
    MenuItem,
    Paper,
    RadioGroup,
    Radio,
    FormControlLabel,
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
import type {GameScoreSavedEvent} from "../types/ZEvents";
import type {GameScorePageDTO} from "../types/ZTypes";
import {zWebSocket} from '../hooks/useStompClient';
import LoadingSpinner from "../components/LoadingSpinner.tsx";


const glowPulse = keyframes`
    0% {
        text-shadow: 0 0 2px currentColor;
    }
    50% {
        text-shadow: 0 0 8px currentColor;
    }
    100% {
        text-shadow: 0 0 2px currentColor;
    }
`;

const getGlowColor = (status) => {
    switch (status) {
        case "Win":
            return "rgba(76, 175, 80, 1)";
        case "Loss":
            return "rgba(244, 67, 54, 1)";
        case "Push":
            return "rgba(255, 193, 7, 1)";
        default:
            return "rgba(120, 120, 120, 0.8)";
    }
};

const TeamCellRenderer = ({
                              name, ext_id,
                              status,
                              streak,
                              record,
                              highlightTeam,
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

    const glowColor = getGlowColor(status);

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
                            color: highlightTeam ? glowColor : 'inherit',
                            animation: highlightTeam ? `${glowPulse} 1.3s ease-in-out infinite` : 'none',
                            cursor: onClickTeam ? 'pointer' : 'default',
                            // textDecoration: onClickTeam ? 'underline' : 'none'
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

interface OpponentCellRendererProps {
    displayAtSign?: string
}

const OpponentCellRenderer = ({name, status, ext_id, streak, record, onClickTeam, displayAtSign, sport}) => {
    const logoUrl = getTeamLogoUrl(ext_id, sport);

    const dotColor =
        status === "Win" ? "rgba(76, 175, 80, 0.35)" :
            status === "Loss" ? "rgba(244, 67, 54, 0.35)" :
                status === "Push" ? "rgba(255, 193, 7, 0.45)" :
                    "rgba(0,0,0,0.25)";

    const glowColor = getGlowColor(status);

    return (
        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
            {displayAtSign}
            {ext_id && <img loading="lazy" src={logoUrl} style={{width: 24, height: 24}}/>}
            {name && (
                <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                    <Typography
                        variant="body2"
                        sx={{
                            cursor: onClickTeam ? 'pointer' : 'default',
                        }}
                        onClick={onClickTeam}
                    >
                        {name}
                    </Typography>
                </Box>
            )}

            {record && <Chip label={record} size="small"/>}
            {streak && <Chip label={streak} size="small"/>}
        </Box>
    );
};
const ScoreCellRenderer = ({game, filterMode, selectedTeamId}) => {

    if (!game.completed) return <></>;

    const getSelectedTeamResult = () => {
        if (!selectedTeamId) return null;

        const selectedIsHome = game.home_team_id === selectedTeamId;
        const selectedScore = selectedIsHome ? game.home_score : game.away_score;
        const oppScore = selectedIsHome ? game.away_score : game.home_score;

        if (selectedScore > oppScore) return "W";
        if (selectedScore < oppScore) return "L";
        return "P";
    };

    if (filterMode === "team" && selectedTeamId) {
        const selectedIsHome = selectedTeamId === game.home_team_id;
        const selectedScore = selectedIsHome ? game.home_score : game.away_score;
        const opponentScore = selectedIsHome ? game.away_score : game.home_score;

        const higher = Math.max(selectedScore, opponentScore);
        const lower = Math.min(selectedScore, opponentScore);

        const result = getSelectedTeamResult();

        return (
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                {result === "W" && <span style={{color: "green", fontWeight: 700}}>W</span>}
                {result === "L" && <span style={{color: "red", fontWeight: 700}}>L</span>}
                {result === "P" && <span style={{color: "gray", fontWeight: 700}}>P</span>}
                <Typography variant="body2">{higher} - {lower}</Typography>
            </Box>
        );
    }

    // WEEK mode fallback
    return <Typography variant="body2">{game.away_score} - {game.home_score}</Typography>;
};


const GameScoresPage = () => {

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState(null);
    const [gameScorePageDTOs, setGameScorePageDTOs] = useState<GameScorePageDTO[]>([]);
    const [snappingScores, setSnappingScores] = useState<boolean>(false);
    const [snappingOdds, setSnappingOdds] = useState<boolean>(false);
    const [snappingCollegePlayoffGames, setSnappingCollegePlayoffGames] = useState<boolean>(false);
    const [rollingWeek, setRollingWeek] = useState<boolean>(false);
    const {isAdmin, isMobile, currentWeek, currentSeason, seasons} = useZAppContext();
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
    const [showSnapCollegePlayoffGamesTooltip, setShowSnapCollegePlayoffGamesTooltip] = useState(false);
    const [showRollingWeekTooltip, setShowRollingWeekTooltip] = useState(false);
    const [rollingWeekReturnMessage, setRollingWeekReturnMessage] = useState('');
    const [collegePlayoffGamesRestCallReturnMessage, setCollegePlayoffGamesRestCallReturnMessage] = useState('');
    const {notify} = useNotify();
// Filtering mode: "week" or "team"
    const [filterMode, setFilterMode] = useState<'week' | 'team'>('week');
// When filtering by team:
    const [teams, setTeams] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
    const [selectedSport, setSelectedSport] = useState<string>('americanfootball_nfl');
    const [selectedSeasonId, setSelectedSeasonId] = useState<number>(currentSeason);
    const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek);
    const [maxAvailableWeek, setMaxAvailableWeek] = useState<number>(null);

    const {
        getGameScoresByWeekRestCall,
        getGameScoresByTeamRestCall,
        getTeamsAndWeeksBySportAndSeasonRestCall,
        snapCompletedGameScoresRestCall,
        snapCompletedGameOddsRestCall,
        rollWeekRestCall,
        createCollegePlayoffGamesRestCall,
        togglePrimetimeRestCall,
        toggleExceptionRestCall
    } = useRestApi();
    const {useStompSubscription} = zWebSocket();


    const handleTogglePrimetime = async (gameId: number, currentValue: boolean) => {
        if (!isAdmin) return;

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
    const handleToggleException = async (gameId: number, currentValue: boolean) => {
        if (!isAdmin) return;

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

    const handleToggleChange = (event, newValues) => {
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
        localStorage.setItem("GameScoresTogglePrefs", JSON.stringify(prefs));
    };
    useEffect(() => {
        const saved = localStorage.getItem("GameScoresTogglePrefs");
        if (saved) {
            const prefs = JSON.parse(saved);
            setShowTeamRecords(prefs.teamRecordsToggle);
            setShowTeamWinStreaks(prefs.streaksToggle);
            setShowGameDate(prefs.gameDateToggle);
            setShowGameCategory(prefs.gameCategoryToggle);
            setShowGameOdds(prefs.gameOddsToggle);
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
        if (!selectedSport || !selectedSeasonId) return;

        getTeamsAndWeeksBySportAndSeasonRestCall(selectedSport, selectedSeasonId)
            .then(data => {
                // 🔥 Clear selectedWeek ONLY when it exceeds the maxAvailableWeek
                setSelectedWeek(prevWeek => {
                    if (prevWeek && prevWeek > data.maxWeekAvailable) {
                        return null;   // <-- forces user to pick a valid week
                    }
                    return prevWeek;
                });
                setTeams(data.teams);
                setMaxAvailableWeek(data.maxWeekAvailable);

            })
            .catch(err => {
                setError('Failed to retrieve teams. ' + (err.message || 'Please try again.'));
                setGameScorePageDTOs(null);
            });

    }, [selectedSport, selectedSeasonId]);


// Clear table results whenever switching between team/week filters
    useEffect(() => {
        setGameScorePageDTOs([]);       // Clear table rows
        //setSelectedTeamId(null); // Clear team selection
    }, [filterMode, selectedSport]);

    // fetch game scores
    useEffect(() => {
        if (selectedSeasonId === 0 || !selectedSport) return;

        // TEAM mode guard
        if (filterMode === 'team' && selectedTeamId == null) return;

        // WEEK mode guards
        if (filterMode === 'week') {
            if (maxAvailableWeek === null) return;             // ⛔ DO NOT FETCH YET
            if (selectedWeek == null) return;
            if (selectedWeek > maxAvailableWeek) return;        // ⛔ Prevent invalid fetch
        }

        setLoading(true);
        setError(null);

        try {
            if (filterMode === 'week') {
                getGameScoresByWeekRestCall(selectedSport, selectedSeasonId, selectedWeek)
                    .then(data => setGameScorePageDTOs(data.records))
                    .catch(err => {
                        setError('Failed to retrieve game scores. ' + (err.message || 'Please try again.'));
                        setGameScorePageDTOs(null);
                    });
            } else {
                getGameScoresByTeamRestCall(selectedSport, selectedSeasonId, selectedTeamId ?? -1)
                    .then(data => setGameScorePageDTOs(data.records))
                    .catch(err => {
                        setError('Failed to retrieve game scores. ' + (err.message || 'Please try again.'));
                        setGameScorePageDTOs(null);
                    });
            }
        } finally {
            setLoading(false);
        }
    }, [
        selectedSport,
        selectedSeasonId,
        selectedWeek,
        selectedTeamId,
        filterMode,
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
            const gameScoreSnapStatus = await snapCompletedGameScoresRestCall(selectedSport, selectedSeasonId, selectedWeek);

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

            setTimeout(() => setShowRollingWeekTooltip(false), 3000);

        } catch (err) {
            setError('Failed to roll the week. ' + (err.message || 'Please try again.'));
        } finally {
            setRollingWeek(false);
        }
    };

    const handleSnapCollegePlayoffGamesAction = async () => {
        try {
            setSnappingCollegePlayoffGames(true);
            setError(null);
            const restCallReturnMessage = await createCollegePlayoffGamesRestCall();

            // 🟦 Show disappearing tooltip
            setCollegePlayoffGamesRestCallReturnMessage(restCallReturnMessage || "Successful Created College Games");
            setShowSnapCollegePlayoffGamesTooltip(true);

            setTimeout(() => setShowSnapCollegePlayoffGamesTooltip(false), 3000);

        } catch (err) {
            setError('Failed to  create college playoff games. ' + (err.message || 'Please try again.'));
        } finally {
            setSnappingCollegePlayoffGames(false);
        }
    };

    if (loading) {
        return (
            <LoadingSpinner/>
        );
    }

    const getOpponentInfo = (game, selectedTeamId) => {
        const isSelectedHome = selectedTeamId === game.home_team_id;

        const opponentIsHome = !isSelectedHome; // if selected team is away, opponent is home

        const name = isSelectedHome
            ? game.away_team_name
            : game.home_team_name;

        const team_ext_id = isSelectedHome
            ? game.away_team_ext_id
            : game.home_team_ext_id;

        const wins = isSelectedHome ? game.away_wins : game.home_wins;
        const losses = isSelectedHome ? game.away_losses : game.home_losses;
        const ties = isSelectedHome ? game.away_ties : game.home_ties;

        const streak = isSelectedHome
            ? game.away_current_streak
            : game.home_current_streak;

        // Determine win/loss/push
        let status = "incomplete";
        if (game.completed) {
            const opponentWon =
                (isSelectedHome && game.away_score > game.home_score) ||
                (!isSelectedHome && game.home_score > game.away_score);

            const opponentLost =
                (isSelectedHome && game.away_score < game.home_score) ||
                (!isSelectedHome && game.home_score < game.away_score);

            if (opponentWon) status = "Win";
            else if (opponentLost) status = "Loss";
            else status = "Push";
        }

        const opponentId = isSelectedHome
            ? game.away_team_id
            : game.home_team_id;

        return {
            opponentId,
            name,
            team_ext_id,
            wins,
            losses,
            ties,
            streak,
            status,
            opponentIsHome,
        };
    };


    // Generate week options
    const range = (start: number, end: number) =>
        Array.from({length: end - start + 1}, (_, i) => start + i);

    const weekOptions = range(1, maxAvailableWeek).map(week => (
        <MenuItem key={week} value={week}>
            {week}
        </MenuItem>
    ));


    return (
        <div>
            <Box sx={{p: 3}}>
                <Box sx={{display: 'flex', alignItems: 'center', mb: 3}}>
                    <SportsFootballIcon sx={{mr: 1}}/>
                    <h1>Game Scores</h1>
                </Box>

                <Box sx={{display: 'flex', alignItems: "flex-end", gap: 2, mb: 3, flexWrap: 'wrap'}}>

                    {/* Sport Selector */}
                    <FormControl sx={{minWidth: 150}}>
                        <InputLabel id="sport-selector-label">
                            Spor<u>t</u>
                        </InputLabel>
                        <Select
                            labelId="sport-selector-label"
                            id="sportSelector"
                            value={selectedSport || ''}
                            label="Sport"
                            accessKey="t"
                            onChange={(e, value) => {
                                setSelectedTeamId(null);
                                setSelectedSport(e.target.value);
                            }}
                        >
                            <MenuItem key="1" value="americanfootball_nfl">NFL</MenuItem>
                            <MenuItem key="2" value="americanfootball_ncaaf">NCAAF</MenuItem>

                        </Select>
                    </FormControl>
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
                    {/* Filter Mode Selector between team vs week based */}
                    <Box display="flex" flexDirection="column" sx={{ml: 1}}>
                        <FormControl component="fieldset">
                            <RadioGroup
                                row
                                value={filterMode}
                                onChange={(e) => setFilterMode(e.target.value)}
                            >
                                <FormControlLabel value="week" control={<Radio size="small"/>} label="Week"/>
                                <FormControlLabel value="team" control={<Radio size="small"/>} label="Team"/>
                            </RadioGroup>
                        </FormControl>


                        {/* Week Selector */}
                        {filterMode === 'week' && (
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
                        )}
                        {filterMode === 'team' && (
                            <FormControl sx={{minWidth: 200}}>
                                <InputLabel id="team-selector-label">Tea<u>m</u></InputLabel>
                                <Select
                                    labelId="team-selector-label"
                                    id="teamSelector"
                                    value={selectedTeamId || ''}
                                    label="Team"
                                    accessKey="m"
                                    onChange={(e) => setSelectedTeamId(e.target.value)}
                                >
                                    {teams.map(team => (
                                        <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>
                    <ToggleButtonGroup
                        value={[
                            ...(showTeamRecords ? ['teamRecordsToggle'] : []),
                            ...(showTeamWinStreaks ? ['streaksToggle'] : []),
                            ...(showGameDate ? ['gameDateToggle'] : []),
                            ...(showGameCategory ? ['gameCategoryToggle'] : []),
                            ...(showGameOdds ? ['gameOddsToggle'] : []),

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

                        <ToggleButtonRenderer showToggle={showTeamRecords} toggleName="Team Records"
                                              toggleKey="teamRecordsToggle"
                                              Icon={EmojiEventsIcon}/>
                        <ToggleButtonRenderer showToggle={showTeamWinStreaks} toggleName="Team Streaks"
                                              toggleKey="streaksToggle" Icon={RepeatIcon}/>
                        <ToggleButtonRenderer showToggle={showGameDate} toggleName="Game Date"
                                              toggleKey="gameDateToggle"
                                              Icon={ScheduleIcon}/>
                        {selectedSport == 'americanfootball_nfl' && (
                            <ToggleButtonRenderer showToggle={showGameCategory} toggleName="Game Category"
                                                  toggleKey="gameCategoryToggle" Icon={StarIcon}/>)
                        }
                        <ToggleButtonRenderer showToggle={showGameOdds} toggleName="Game Odds"
                                              toggleKey="gameOddsToggle"
                                              Icon={TrendingFlatIcon}/>
                    </ToggleButtonGroup>

                    {/* Snap Game Scores Button - Admin Only */}
                    {isAdmin && (
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
                    {isAdmin && (
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
                    {isAdmin && (
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
                    {/* Create College Playoff Games - Admin Only */}
                    {isAdmin && (
                        <Tooltip
                            title={collegePlayoffGamesRestCallReturnMessage.status}
                            placement="top"
                            open={showSnapCollegePlayoffGamesTooltip}
                            disableHoverListener
                            disableFocusListener
                            disableTouchListener
                            arrow
                        >
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSnapCollegePlayoffGamesAction}
                                disabled={snappingCollegePlayoffGames}
                                sx={{height: 56}}
                            >
                                {snappingCollegePlayoffGames ?
                                    <CircularProgress size={24}/> : 'Create College Playoff Games'}
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
                                {filterMode == 'week' && (<TableCell>Away</TableCell>)}
                                {filterMode == 'team' && (<TableCell sx={{
                                    maxWidth: 120,
                                    width: 120,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    padding: "4px 6px"
                                }}>Opponent</TableCell>)}
                                {filterMode == 'week' && (<TableCell>Home</TableCell>)}
                                {showGameOdds && (<TableCell>O/U</TableCell>)}

                                <TableCell>Score</TableCell>
                                {showGameDate && <TableCell>Game Date</TableCell>}
                                {selectedSport == 'americanfootball_nfl' && showGameCategory && (
                                    <TableCell>
                                        <HeaderWithTooltip
                                            label="Game Rank"
                                            tooltip="Game Rank indicates the importance or tier of the matchup (e.g., Prime, Featured, Standard)."
                                        />
                                    </TableCell>
                                )}
                                {selectedSport == 'americanfootball_nfl' && isAdmin && (
                                    <TableCell>Primetime</TableCell>
                                )}
                                {selectedSport == 'americanfootball_nfl' && isAdmin && (
                                    <TableCell>Exception</TableCell>
                                )}

                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {gameScorePageDTOs && gameScorePageDTOs.map((gameScorePageDTO, index) => {
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

                                            {filterMode == 'week' && (
                                                <TableCell>
                                                    <TeamCellRenderer
                                                        name={gameScorePageDTO.away_team_name}
                                                        ext_id={gameScorePageDTO.away_team_ext_id}
                                                        streak={!showTeamWinStreaks || !gameScorePageDTO.completed ? '' : gameScorePageDTO.away_current_streak}
                                                        record={!showTeamRecords || !gameScorePageDTO.completed ? '' : `${gameScorePageDTO.away_wins}-${gameScorePageDTO.away_losses}-${gameScorePageDTO.away_ties}`}
                                                        status={!gameScorePageDTO.completed ? "incomplete" : isAwayWinner(gameScorePageDTO) ? "Win" : isHomeWinner(gameScorePageDTO) ? "Loss" : "Push"}
                                                        highlightTeam={filterMode === 'team' && selectedTeamId == gameScorePageDTO.away_team_id}
                                                        onClickTeam={() => {
                                                            setFilterMode('team');
                                                            setSelectedTeamId(gameScorePageDTO.away_team_id);
                                                        }}
                                                        homeTeamSpread={null}  // this is the away team
                                                        sport={selectedSport}
                                                    />
                                                </TableCell>)}
                                            {filterMode === 'team' && (
                                                <TableCell>
                                                    {(() => {
                                                        const opp = getOpponentInfo(gameScorePageDTO, selectedTeamId);
                                                        const displayAtSign = opp.opponentIsHome ? `@` : ``;

                                                        return (
                                                            <OpponentCellRenderer
                                                                name={opp.name}
                                                                ext_id={opp.team_ext_id}
                                                                displayAtSign={displayAtSign}
                                                                record={
                                                                    !showTeamRecords || !gameScorePageDTO.completed
                                                                        ? ''
                                                                        : `${opp.wins}-${opp.losses}-${opp.ties}`
                                                                }
                                                                streak={
                                                                    !showTeamWinStreaks || !gameScorePageDTO.completed
                                                                        ? ''
                                                                        : opp.streak
                                                                }
                                                                status={opp.status}
                                                                onClickTeam={() => {
                                                                    setFilterMode('team');
                                                                    setSelectedTeamId(opp.opponentId);
                                                                }}
                                                                sport={selectedSport}
                                                            />
                                                        );
                                                    })()}
                                                </TableCell>
                                            )}

                                            {filterMode == 'week' && (
                                                <TableCell>
                                                    <TeamCellRenderer
                                                        name={gameScorePageDTO.home_team_name}
                                                        ext_id={gameScorePageDTO.home_team_ext_id}
                                                        streak={!showTeamWinStreaks || !gameScorePageDTO.completed ? '' : gameScorePageDTO.home_current_streak}
                                                        record={!showTeamRecords || !gameScorePageDTO.completed ? '' : `${gameScorePageDTO.home_wins}-${gameScorePageDTO.home_losses}-${gameScorePageDTO.home_ties}`}
                                                        status={!gameScorePageDTO.completed ? "incomplete" : isHomeWinner(gameScorePageDTO) ? "Win" : isAwayWinner(gameScorePageDTO) ? "Loss" : "Push"}
                                                        highlightTeam={filterMode === 'team' && selectedTeamId == gameScorePageDTO.home_team_id}
                                                        onClickTeam={() => {
                                                            setFilterMode('team');
                                                            setSelectedTeamId(gameScorePageDTO.home_team_id);
                                                        }}
                                                        homeTeamSpread={!showGameOdds || (homeSpread == null || homeSpread == '') ? null : `(${homeSpread})`}
                                                        sport={selectedSport}
                                                    />
                                                </TableCell>)}
                                            {showGameOdds ? (
                                                <TableCell>

                                                    <Tooltip title={`Bookmaker stamp: ${gameScorePageDTO.bookmaker_stamp}`}
                                                             arrow>
                                                        <span>{gameScorePageDTO.over_points}</span>
                                                    </Tooltip>

                                                </TableCell>
                                            ) : null}
                                            <TableCell>
                                                <ScoreCellRenderer
                                                    game={gameScorePageDTO}
                                                    filterMode={filterMode}
                                                    selectedTeamId={selectedTeamId}
                                                />
                                            </TableCell>

                                            {showGameDate && (
                                                <TableCell>
                                                    {formatDate(gameScorePageDTO.commence_time, isMobile)}
                                                </TableCell>
                                            )}
                                            {selectedSport == 'americanfootball_nfl' && showGameCategory && (
                                                <TableCell> <GameCategoryRenderer rankType={gameScorePageDTO.rank_type}
                                                                                  homeRank={gameScorePageDTO.home_rank_preseason}
                                                                                  awayRank={gameScorePageDTO.away_rank_preseason}/>
                                                </TableCell>
                                            )}
                                            {selectedSport === 'americanfootball_nfl' && isAdmin && (
                                                <TableCell
                                                    onClick={() =>
                                                        isAdmin &&
                                                        handleTogglePrimetime(
                                                            gameScorePageDTO.game_id,gameScorePageDTO.primetime
                                                        )
                                                    }
                                                    sx={{
                                                        cursor: isAdmin ? 'pointer' : 'default',
                                                        fontWeight: gameScorePageDTO.primetime ? 600 : 400,
                                                        color: gameScorePageDTO.primetime ? 'primary.main' : 'text.secondary',
                                                        '&:hover': isAdmin
                                                            ? {backgroundColor: 'action.hover'}
                                                            : undefined
                                                    }}
                                                >
                                                    <Tooltip title={isAdmin ? "Click to toggle primetime" : ""}>
                                                     <span>
                                                         {gameScorePageDTO.primetime ?
                                                             (<StarIcon color="warning"/>) :
                                                             (<StarIcon color="disabled"/>)}
                                                    </span>
                                                    </Tooltip>
                                                </TableCell>
                                            )}
                                            {selectedSport === 'americanfootball_nfl' && isAdmin && (
                                                <TableCell
                                                    onClick={() =>
                                                        isAdmin &&
                                                        handleToggleException(
                                                            gameScorePageDTO.game_id,gameScorePageDTO.exception
                                                        )
                                                    }
                                                    sx={{
                                                        cursor: isAdmin ? 'pointer' : 'default',
                                                        fontWeight: gameScorePageDTO.exception ? 600 : 400,
                                                        color: gameScorePageDTO.exception ? 'primary.main' : 'text.secondary',
                                                        '&:hover': isAdmin
                                                            ? {backgroundColor: 'action.hover'}
                                                            : undefined
                                                    }}
                                                >
                                                    <Tooltip title={isAdmin ? "Click to toggle exception" : ""}>
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