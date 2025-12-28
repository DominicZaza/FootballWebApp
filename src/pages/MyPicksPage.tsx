import {useZAppContext} from '../components/AppContextProvider';
import {useRestApi} from '../api/RestInvocations.js';
import ScheduleIcon from "@mui/icons-material/Schedule";
import StarIcon from "@mui/icons-material/Star";
import ScoreIcon from "@mui/icons-material/Score";
import {MatchupRenderer} from '../utils/MatchupRenderer'
import {PickStatusRenderer} from '../utils/PickStatusRenderer'
import {WagerRenderer} from '../utils/WagerRenderer'
import {GameCategoryRenderer} from '../utils/GameCategoryRenderer'
import { ToggleOptionsGroup } from "../utils/ToggleOptionsGroup";
import PickSelectionForm from "../components/PickSelectionForm";
import { useNotify } from "../components/NotificationProvider";


const toggleOptions = [
    { key: "entryRecordToggle", label: "Win Record", icon: EmojiEventsIcon },
    { key: "winStreakToggle", label: "Win Streak", icon: RepeatIcon },
    { key: "showGameDateToggle", label: "Game Date", icon: ScheduleIcon },
    { key: "displayGameScoreToggle", label: "Game Score", icon: ScoreIcon },
    { key: "gameCategoryToggle", label: "Game Category", icon: StarIcon },
];



import {
    Alert,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from "@mui/material";
import React from "react";
import { useEffect, useState} from "react";

import type {MyGamesPageDTO, PickControl} from "../types/ZTypes";
import {formatDate} from "../utils/DateUtils";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import RepeatIcon from "@mui/icons-material/Repeat";
import LoadingSpinner from "../components/LoadingSpinner.tsx";

const MyPicksPage = () => {

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState(null);
    const [myGames, setMyGames] = useState<MyGamesPageDTO[]>([]);
    const [pickControl, setPickControl] = useState<PickControl>(null);
    const { isMobile,  selectedEntry, currentWeek} = useZAppContext();
    const { notify } = useNotify();

    const handlePickSubmitted = () => {
        notify("Pick Submitted", "Success!.", "success");
        refreshMyGames();
    };

    //toggle states
    const [visibleToggles, setVisibleToggles] = useState<string[]>([]);

    const {
        getMyGamesPageRestCall,
    } = useRestApi();


    //dependency on selectedEntry
    useEffect(() => {
        refreshMyGames();
    }, [selectedEntry]);

    const refreshMyGames = async () => {
        if (!selectedEntry?.id) return;

        try {
            setLoading(true);
            const data = await getMyGamesPageRestCall(selectedEntry.id);
            setMyGames(data.records);
            setPickControl(data.control);
        } catch (err) {
            console.error("Error refreshing after submit:", err);
        } finally {
            setLoading(false);
        }
    };


    if (loading) {
        return (
            <LoadingSpinner/>
        );
    }

    return (
        <div>
            <Box sx={{p: 3}}>
                <Box sx={{display: 'flex', alignItems: 'center', mb: 3}}>

                    <ToggleOptionsGroup
                        id="myGames"             // unique per page
                        options={toggleOptions}
                        onChange={(keys) => setVisibleToggles(keys)}
                    />


                </Box>

                {error && (
                    <Alert severity="error" sx={{mb: 2}} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}
                <PickSelectionForm
                    currentWeek={currentWeek}
                    myGames={myGames}
                    pickControl={pickControl}
                    isMobile={isMobile}
                    onPickSubmitted={handlePickSubmitted}
                />

                <TableContainer component={Paper} sx={{maxHeight: 1200}}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{width: 'auto'}}>Week</TableCell>
                                <TableCell sx={{width: 'auto'}}>Matchup</TableCell>
                                <TableCell sx={{width: 'auto'}}>Status</TableCell>
                                <TableCell sx={{width: 'auto'}}>Wager</TableCell>
                                <TableCell sx={{width: 'auto'}}>Total</TableCell>
                                {visibleToggles.includes("gameCategoryToggle") && <TableCell>Game Category</TableCell>}
                                {visibleToggles.includes("displayGameScoreToggle") && <TableCell>Score</TableCell>}
                                {visibleToggles.includes("showGameDateToggle") && <TableCell>Game Date</TableCell>}
                                {visibleToggles.includes("entryRecordToggle") && <TableCell>Win Record</TableCell>}
                                {visibleToggles.includes("winStreakToggle") && <TableCell>Win Streak</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {myGames.map((myGame, index) => (
                                <TableRow
                                    key={myGame.week || index}
                                    sx={{ // for zero total entries, make them slightly transparent
                                        opacity: myGame.opening_balance == 0 && myGame.overall_total === 0 ? 0.4 : 1,
                                        '& td': myGame.opening_balance == 0 &&  myGame.overall_total === 0 ? {
                                            fontStyle: 'italic'
                                        } : {},
                                        transition: 'opacity 0.2s ease',
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                            opacity: 1
                                        }
                                    }}
                                >
                                    <TableCell align="center">{myGame.week}</TableCell>
                                    <TableCell >
                                        <MatchupRenderer
                                            awayName={myGame.away_team}
                                            away_ext_id={myGame.away_ext_id}
                                            homeName={myGame.home_team}
                                            home_ext_id={myGame.home_ext_id}
                                            pick={myGame.pick}
                                            pickStatus={myGame.pickStatus}
                                            sport={myGame.sport}
                                        />
                                    </TableCell>
                                    <TableCell> <PickStatusRenderer pickStatus={myGame.pickStatus}/></TableCell>
                                    <TableCell> <WagerRenderer wager={myGame.wager} pickStatus={myGame.pickStatus}/> </TableCell>
                                    <TableCell>{myGame.weekly_balance}</TableCell>
                                    {visibleToggles.includes("gameCategoryToggle") && (
                                        <TableCell> <GameCategoryRenderer rankType={myGame.rankType} homeRank={myGame.home_rank} awayRank={myGame.away_rank}/> </TableCell>
                                    )}
                                    {visibleToggles.includes("displayGameScoreToggle") && (
                                        <TableCell align="center">
                                            {myGame.away_score} - {myGame.home_score}
                                        </TableCell>
                                    )}
                                    {visibleToggles.includes("showGameDateToggle") && (
                                        <TableCell>{formatDate(myGame.commence_time, isMobile)}</TableCell>
                                    )}
                                    {visibleToggles.includes("entryRecordToggle") && (
                                        <TableCell>{myGame.wins}-{myGame.losses}-{myGame.ties}-{myGame.penalties}</TableCell>
                                    )}
                                    {visibleToggles.includes("winStreakToggle") && (
                                        <TableCell>{myGame.current_streak}</TableCell>
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

export default MyPicksPage;