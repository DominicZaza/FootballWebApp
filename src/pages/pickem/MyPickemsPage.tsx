import {useZAppContext} from '../../components/AppContextProvider.tsx';
import {getTeamLogoUrl, useRestApi} from '../../api/RestInvocations.js';
import {
    ToggleButtonGroup,
    Typography,
    Alert,
    Box,
    Chip,
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
    TableRow, Dialog, DialogTitle, DialogActions, Button
} from "@mui/material";

import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import RepeatIcon from "@mui/icons-material/Repeat";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import React, {useEffect, useMemo, useState} from "react";
import type {MyPickemsGamesDTO, PickemEntryControl, SeasonWeekDTO} from "../../types/ZTypes";
import LoadingSpinner from "../../components/LoadingSpinner.tsx";
import CountdownChip from "../../components/CountdownChip";

import {formatDate, formatDateSmall} from '../../utils/DateUtils'
import {ToggleButtonRenderer} from '../../utils/ToggleButtonRenderer';
import StarIcon from "@mui/icons-material/Star";
import {useNotify} from "../../components/NotificationProvider.tsx";

/* ---------------------------------- Helpers ---------------------------------- */

const getRequirementChipColor = (
    count: number,
    min: number) => {
    if (min === 0) return "success";
    return count >= min ? "success" : "error";
};


/* -------------------------------- Component ---------------------------------- */

const MyPickemsPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    //data coming back from API
    const [myPickems, setMyPickems] = useState<MyPickemsGamesDTO[]>([]);
    const [pickemEntryControl, setPickemEntryControl] = useState<PickemEntryControl | null>(null);
    const [periods, setPeriods] = useState<SeasonWeekDTO[]>([]);
    const [seasonWeek, setSeasonWeek] = useState<SeasonWeekDTO | null>(null);
    const [ouDialog, setOuDialog] = useState<{ open: boolean; myPickem?: MyPickemsGamesDTO; }>({open: false});
    const {notify} = useNotify();

    const {
        isMobile,
        currentPeriod,
        currentSeason,
        seasons,
        selectedEntry
    } = useZAppContext();

    const {
        getMyPickemsByEntrySeasonPeriod,
        getSeasonWeekPeriodsBySeasonAndPoolTypeIdRestCall,
        submitPickemRestCall
    } = useRestApi();
    const [selectedSeasonId, setSelectedSeasonId] = useState(currentSeason);
    const [selectedPeriod, setSelectedPeriod] = useState<SeasonWeekDTO | null>(null);

    //toggle states
    const [showTeamRecords, setShowTeamRecords] = useState<boolean>(false);
    const [showTeamWinStreaks, setShowTeamWinStreaks] = useState<boolean>(false);
    const [showGameDate, setShowGameDate] = useState<boolean>(false);
    const [showAllNFLGames, setShowAllNFLGames] = useState<boolean>(false);
    const [showAllNCAAFGames, setShowAllNCAAFGames] = useState<boolean>(false);
    const [showAllPrimetimeGames, setShowAllPrimetimeGames] = useState<boolean>(false);


    const filteredPickems = useMemo(() => {
        return myPickems.filter(pickem => {
            const isNFL = pickem.sport === "americanfootball_nfl";
            const isNCAAF = pickem.sport === "americanfootball_ncaaf";
            const isPrimetime = pickem.primetime;
            const isMyPick = pickem.teampick !== null || pickem.totalpick !== null;
            return (
                (showAllNFLGames && isNFL) ||
                (showAllNCAAFGames && isNCAAF) ||
                (showAllPrimetimeGames && isPrimetime) ||
                isMyPick
            );
        });
    }, [
        myPickems,
        showAllNFLGames,
        showAllNCAAFGames,
        showAllPrimetimeGames
    ]);

    /* -------------------------- Week completion flag --------------------------- */

    const isWeekCompleted = !!pickemEntryControl?.pickAllowed;

    /* -------------------------- Minimum requirements --------------------------- */

    const minRequirements = selectedPeriod
        ? {
            college: selectedPeriod.collegeMinimum ?? 0,
            nfl: selectedPeriod.nflMinimum ?? 0,
            primetime: selectedPeriod.primetimeMinimum ?? 0,
        }
        : null;

    /* ---------------------------- Pick counts ---------------------------------- */

    const pickCounts = useMemo(() => {
        let nfl = 0;
        let college = 0;
        let primetime = 0;

        myPickems.forEach(p => {
            if (!p.teampick && !p.totalpick) return;

            if (p.sport === "americanfootball_nfl") nfl++;
            if (p.sport === "americanfootball_ncaaf") college++;
            if (p.primetime) primetime++;
        });

        return {nfl, college, primetime};
    }, [myPickems]);


    /* ------------------------------ Effects ------------------------------------ */
    const handleToggleChange = (event, newValues) => {
        if (!newValues) return; // prevent all off state

        const prefs = {
            teamRecordsToggle: newValues.includes('teamRecordsToggle'),
            streaksToggle: newValues.includes('streaksToggle'),
            gameDateToggle: newValues.includes('gameDateToggle'),
            allNFLGamesToggle: newValues.includes('allNFLGamesToggle'),
            allNCAAFGamesToggle: newValues.includes('allNCAAFGamesToggle'),
            allPrimetimeGamesToggle: newValues.includes('allPrimetimeGamesToggle'),
        };

        setShowTeamRecords(prefs.teamRecordsToggle);
        setShowTeamWinStreaks(prefs.streaksToggle);
        setShowGameDate(prefs.gameDateToggle);
        setShowAllNFLGames(prefs.allNFLGamesToggle);
        setShowAllNCAAFGames(prefs.allNCAAFGamesToggle);
        setShowAllPrimetimeGames(prefs.allPrimetimeGamesToggle);

        // 🟦 persist to browser
        localStorage.setItem("MyPickemsTogglePrefs", JSON.stringify(prefs));
    };
    useEffect(() => {
        const saved = localStorage.getItem("MyPickemsTogglePrefs");
        if (saved) {
            const prefs = JSON.parse(saved);
            setShowTeamRecords(prefs.teamRecordsToggle);
            setShowTeamWinStreaks(prefs.streaksToggle);
            setShowGameDate(prefs.gameDateToggle);
            setShowAllNFLGames(prefs.allNFLGamesToggle);
            setShowAllNCAAFGames(prefs.allNCAAFGamesToggle);
            setShowAllPrimetimeGames(prefs.allPrimetimeGamesToggle);
        }
    }, []);

    useEffect(() => {
        if (currentPeriod) {
            const periodValue = Number(currentPeriod);
            const found = periods.find(p => p.period === periodValue) || null;
            setSelectedPeriod(found);
        }
    }, [currentPeriod, periods]);

    useEffect(() => {
        setSelectedSeasonId(currentSeason);
    }, [currentSeason]);

    useEffect(() => {
        if (!selectedSeasonId || !selectedEntry) return;

        getSeasonWeekPeriodsBySeasonAndPoolTypeIdRestCall(
            selectedSeasonId,
            selectedEntry.poolTypeId
        )
            .then(setPeriods)
            .catch(() => {
                setError("Failed to retrieve periods");
                setPeriods([]);
            });
    }, [selectedSeasonId, selectedEntry]);

    useEffect(() => {
        if (!selectedEntry || !selectedSeasonId || !selectedPeriod) return;

        setLoading(true);
        setError(null);

        getMyPickemsByEntrySeasonPeriod(
            selectedEntry.id,
            selectedSeasonId,
            selectedPeriod.period
        )
            .then(data => {
                setMyPickems(data.games);
                setPickemEntryControl(data.pickemEntryControl);
                setSeasonWeek(data.seasonWeekDTO);
            })
            .catch(() => {
                setError("Failed to retrieve pickems");
                setMyPickems([]);
            })
            .finally(() => setLoading(false));
    }, [selectedEntry, selectedSeasonId, selectedPeriod]);

    // Helper function to determine if away team won
    const isAwayWinner = (data: MyPickemsGamesDTO) => {
        return data.completed && data.away_score > data.home_score;
    };

    // Helper function to determine if home team won
    const isHomeWinner = (data: MyPickemsGamesDTO) => {
        return data.completed && data.home_score > data.away_score;
    };

    const getTeamPickOutlineColor = (pickem: MyPickemsGamesDTO) => {
        if (!pickem.completed || !pickem.teampick) return null;

        if (pickem.teampickstatus === "Won") return "success.main";
        if (pickem.teampickstatus === "Lost") return "error.main";
        if (pickem.teampickstatus === "Push") return "warning.main";
        if (pickem.teampickstatus === "Pending") return "warning.main";

        return null;
    };

    type TeamCellProps = {
        name?: string;
        ext_id?: string;
        status?: string;
        streak?: string;
        record?: string;
        homeTeamSpread?: string | null;
        sport: string;
        outlined?: boolean;
        outlineColor?: string | null;
        outlineStyle?: "solid" | "dashed";
        onClick?: () => void;
        clickable?: boolean;
    };

    const TeamCellRenderer = React.memo(({
                                             name,
                                             ext_id,
                                             status,
                                             streak,
                                             record,
                                             homeTeamSpread,
                                             sport,
                                             outlined = false,
                                             outlineColor,
                                             outlineStyle = "solid",
                                             onClick,
                                             clickable = false
                                         }: TeamCellProps) => {
        const logoUrl = getTeamLogoUrl(ext_id, sport)

        const dotColor =
            status === "Win" ? "rgba(76, 175, 80, 0.35)" :
                status === "Loss" ? "rgba(244, 67, 54, 0.35)" :
                    status === "Push" ? "rgba(255, 193, 7, 0.45)" :
                        "rgba(0,0,0,0.25)";


        return (
            <Box
                onClick={clickable ? onClick : undefined}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    border: outlined ? 2 : 0,
                    borderStyle: outlined ? outlineStyle : 'none',
                    borderColor: outlined ? outlineColor : 'transparent',
                    opacity: clickable && !outlined ? 0.7 : 1,
                    cursor: clickable ? "default" : "not-allowed",
                }}
            >
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
                        <Typography variant="body2">
                            {name} {homeTeamSpread}
                        </Typography>
                    </Box>
                )}

                {record && <Chip label={record} size="small"/>}
                {streak && <Chip label={streak} size="small"/>}
            </Box>
        );
    });

    // Chip styling based on pick status
    const getTeamChipStyles = (status: string) => {
        switch (status) {
            case "Won":
                return {
                    color: "success" as const,
                    variant: "filled" as const,
                };
            case "Lost":
                return {
                    color: "error" as const,
                    variant: "filled" as const,
                };
            case "Push":
                return {
                    color: "warning" as const,
                    variant: "filled" as const,
                };
            case "Pending":
                return {
                    color: "primary" as const,
                    variant: "outlined" as const,
                    sx: {
                        borderWidth: 2,
                        borderStyle: "solid",
                        borderImageSlice: 1,
                        borderImageSource:
                            "linear-gradient(45deg, #1976d2, #42a5f5)",
                        color: "#1976d2",
                    },
                };
            default:
                return {
                    color: "default" as const,
                    variant: "filled" as const,
                };
        }
    };


    if (loading) return <LoadingSpinner/>;

    // Generate period options
    const periodOptions = [];
    {
        periods && periods.map((period) => (
            periodOptions.push(
                <MenuItem key={period.id} value={period.period}>
                    Week {period.period} - {formatDateSmall(period.periodStart)} - {formatDateSmall(period.periodEnd)}
                </MenuItem>
            )))
    }
    const getOverUnderArrow = (pickem: MyPickemsGamesDTO) => {
        if (!pickem.totalpick || !pickem.over_points) return null;

        const pick = pickem.totalpick.toLowerCase();

        if (pick !== "over" && pick !== "under") return null;

        const Icon = pick === "over" ? ArrowUpwardIcon : ArrowDownwardIcon;

        let color: "success" | "error" | "warning" | "default" = "default";

        switch (pickem.totalpickstatus) {
            case "Won":
                color = "success";
                break;
            case "Lost":
                color = "error";
                break;
            case "Push":
            case "Pending":
                color = "warning";
                break;
            default:
                color = "default";
        }

        return {Icon, color};
    };

    const applyTeamPickUpdate = (
        gameId: number, newPick: "Home" | "Away"  | null
    ) => {
        setMyPickems(prev =>
            prev.map(g => g.game_id === gameId
                ? {...g, teampick: newPick, teampickstatus: "Pending"} : g));
    };

    const applyTotalPickUpdate = (
        gameId: number, newPick: "Over" | "Under"  | null
    ) => {
        setMyPickems(prev =>
            prev.map(g => g.game_id === gameId
                ? {...g, totalpick: newPick, totalpickstatus: "Pending"} : g));
    };

    const handleTotalPick = async (side: "Over" | "Under") => {
        if (!ouDialog.myPickem) return;
        const previousPick = ouDialog.myPickem.totalpick;

        const newPick = previousPick === side ? null : side;

        applyTotalPickUpdate(ouDialog.myPickem.game_id, newPick);

        try {
            const response = await submitPickemRestCall(selectedEntry.id, ouDialog.myPickem.game_id, side, previousPick != null,selectedPeriod?.period);
            notify(newPick ? `${side} selected` : `${side} pick removed`, response.message);
        } catch (err) {
            applyTotalPickUpdate(ouDialog.myPickem.game_id, previousPick);
            notify("Failed to save pick", err.message);
        }

        setOuDialog({open: false});
    };

    const PickemRow = React.memo(({myPickem, index}) => {
            const homeSpread = myPickem.home_team_spread;
            const chipProps = getTeamChipStyles(myPickem.teampickstatus);
            const outlineColor = getTeamPickOutlineColor(myPickem);
            const outlineStyle = myPickem.teampickstatus === "Pending" ? "dashed" : "solid";
            const canPick = pickemEntryControl?.pickAllowed && homeSpread != null;

            const handleTeamPick = async (side: "Home" | "Away") => {
                if (!canPick) return;

                const previousPick = myPickem.teampick;
                const newPick = previousPick === side ? null : side;

                applyTeamPickUpdate(myPickem.game_id, newPick);

                try {
                    const response = await submitPickemRestCall(selectedEntry.id, myPickem.game_id, side,  previousPick != null,selectedPeriod?.period);
                    notify(newPick ? `${side} selected` : `${side} pick removed`, response.message);
                } catch (err) {
                    applyTeamPickUpdate(myPickem.game_id, previousPick);
                    notify("Failed to save pick", err.message);
                }
            };


            return (
                <TableRow
                    key={myPickem.game_id || index}
                    sx={{
                        '&:hover': {
                            backgroundColor: 'action.hover'
                        }
                    }}
                >
                    <TableCell>{index + 1}</TableCell>


                    <TableCell>
                        <TeamCellRenderer
                            name={myPickem.away_team_name}
                            ext_id={myPickem.away_team_ext_id}
                            streak={!showTeamWinStreaks || !myPickem.completed ? '' : myPickem.away_current_streak}
                            record={!showTeamRecords || !myPickem.completed ? '' : `${myPickem.away_wins}-${myPickem.away_losses}-${myPickem.away_ties}`}
                            status={!myPickem.completed ? "incomplete" : isAwayWinner(myPickem) ? "Win" : isHomeWinner(myPickem) ? "Loss" : "Push"}
                            homeTeamSpread={null}  // this is the away team
                            sport={myPickem.sport}
                            outlined={myPickem?.teampick === "Away"}
                            outlineColor={outlineColor}
                            outlineStyle={outlineStyle}
                            clickable={canPick}
                            onClick={() => handleTeamPick("Away")}

                        />
                    </TableCell>

                    <TableCell>
                        <TeamCellRenderer
                            name={myPickem.home_team_name}
                            ext_id={myPickem.home_team_ext_id}
                            streak={!showTeamWinStreaks || !myPickem.completed ? '' : myPickem.home_current_streak}
                            record={!showTeamRecords || !myPickem.completed ? '' : `${myPickem.home_wins}-${myPickem.home_losses}-${myPickem.home_ties}`}
                            status={!myPickem.completed ? "incomplete" : isHomeWinner(myPickem) ? "Win" : isAwayWinner(myPickem) ? "Loss" : "Push"}
                            homeTeamSpread={(homeSpread == null || homeSpread == '') ? null : `(${homeSpread})`}
                            sport={myPickem.sport}
                            outlined={myPickem?.teampick === "Home"}
                            outlineColor={outlineColor}
                            outlineStyle={outlineStyle}
                            clickable={canPick}
                            onClick={() => handleTeamPick("Home")}

                        />
                    </TableCell>

                    <TableCell>
                        <Box sx={{
                            display: "flex", alignItems: "center", gap: 0.5,
                            cursor: canPick ? "default" : "not-allowed",
                            '&:hover': canPick ? {color: 'primary.main'} : {}
                        }}
                             onClick={() =>
                                 canPick &&
                                 setOuDialog({open: true, myPickem: myPickem})
                             }>
                            <Typography variant="body2">
                                {myPickem.over_points}
                            </Typography>

                            {(() => {
                                const arrow = getOverUnderArrow(myPickem);
                                if (!arrow) return null;

                                const {Icon, color} = arrow;

                                return (
                                    <Icon
                                        fontSize="small"
                                        color={color}
                                        sx={{fontWeight: "bold"}}
                                    />
                                );
                            })()}
                        </Box>
                    </TableCell>
                    <TableCell>
                        <Typography variant="body2" sx={{fontWeight: 'bold'}}>
                            {myPickem.completed && `${myPickem.away_score} - ${myPickem.home_score}`}
                        </Typography>
                    </TableCell>

                    {showGameDate && (
                        <TableCell>
                            {formatDate(myPickem.commence_time, isMobile)}
                        </TableCell>
                    )}
                    <TableCell>
                        {myPickem.teampick && (<Chip
                            label={`${myPickem.teampick} (${myPickem.teampickstatus})`}
                            size="small"
                            {...chipProps}
                        />)}
                        {myPickem.totalpick && (<Chip
                            label={`${myPickem.totalpick} (${myPickem.totalpickstatus})`}
                            size="small"
                            {...chipProps}
                        />)}
                    </TableCell>
                    <TableCell>
                        {myPickem.primetime ? (<StarIcon color="warning"/>) : (<span/>)}
                    </TableCell>
                </TableRow>
            )
    });

    /* -------------------------------- Render ----------------------------------- */

    return (
        <Box sx={{p: 3}}>
            {/* Header */}
            <Box sx={{display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center'}}>
                <Typography variant="h4">My Pickems</Typography>

                {pickemEntryControl && (
                    <Chip
                        label={`${pickemEntryControl.weekly_wins}-${pickemEntryControl.weekly_losses}-${pickemEntryControl.weekly_pushes}`}
                        variant="outlined"
                    />
                )}

                {pickemEntryControl && (
                    <Chip
                        label={`${pickemEntryControl.total_wins}-${pickemEntryControl.total_losses}-${pickemEntryControl.total_pushes}`}
                        variant="outlined"
                    />
                )}

                {/* Requirement Chips */}
                {minRequirements && (
                    <>
                        <Chip
                            label={`College: ${pickCounts.college} / ${minRequirements.college}`}
                            color={getRequirementChipColor(
                                pickCounts.college,
                                minRequirements.college
                            )}
                            variant={isWeekCompleted ? "filled" : "outlined"}
                        />

                        <Chip
                            label={`NFL: ${pickCounts.nfl} / ${minRequirements.nfl}`}
                            color={getRequirementChipColor(
                                pickCounts.nfl,
                                minRequirements.nfl
                            )}
                            variant={isWeekCompleted ? "filled" : "outlined"}
                        />

                        <Chip
                            label={`Primetime: ${pickCounts.primetime} / ${minRequirements.primetime}`}
                            color={getRequirementChipColor(
                                pickCounts.primetime,
                                minRequirements.primetime
                            )}
                            variant={isWeekCompleted ? "filled" : "outlined"}
                        />
                    </>
                )}
            </Box>
            <Box>
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
                        onChange={(e) => {
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

                <FormControl sx={{minWidth: 150}}>
                    <InputLabel id="period-selector-label">
                        <u>W</u>eek
                    </InputLabel>
                    <Select
                        labelId="period-selector-label"
                        id="periodSelector"
                        value={selectedPeriod?.period ?? ''}
                        label="Week"
                        accessKey="W"
                        onChange={(e) => {
                            const periodValue = Number(e.target.value);
                            const found = periods.find(p => p.period === periodValue) || null;
                            setSelectedPeriod(found);
                        }}
                    >
                        {periodOptions}
                    </Select>
                </FormControl>

                <ToggleButtonGroup
                    value={[
                        ...(showTeamRecords ? ['teamRecordsToggle'] : []),
                        ...(showTeamWinStreaks ? ['streaksToggle'] : []),
                        ...(showGameDate ? ['gameDateToggle'] : []),
                        ...(showAllNFLGames ? ['allNFLGamesToggle'] : []),
                        ...(showAllNCAAFGames ? ['allNCAAFGamesToggle'] : []),
                        ...(showAllPrimetimeGames ? ['allPrimetimeGamesToggle'] : []),

                    ]}
                    onChange={handleToggleChange}
                    aria-label="Display options"
                    sx={{
                        height: 56,
                        borderRadius: 2,
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
                {pickemEntryControl?.pickAllowed && seasonWeek?.periodDeadline && (
                    <CountdownChip
                        deadline={seasonWeek.periodDeadline}
                        labelPrefix="Pick Deadline"
                    />
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
                            <TableCell>O/U</TableCell>
                            <TableCell>Score</TableCell>
                            {showGameDate && <TableCell>Game Date</TableCell>}
                            <TableCell>PickStatus</TableCell>
                            <TableCell>Primetime</TableCell>

                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredPickems.map((myPickem, index) => (
                            <PickemRow key={myPickem.game_id} myPickem={myPickem} index={index}/>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Dialog open={ouDialog.open} onClose={() => setOuDialog({open: false})}>
                <DialogTitle>Select Over / Under</DialogTitle>
                <DialogActions sx={{justifyContent: "space-between", px: 3}}>
                    <Button onClick={() => handleTotalPick("Over")}
                        variant="contained">Over</Button>
                    <Button onClick={() => handleTotalPick("Under")}
                        variant="contained" color="secondary">Under</Button>
                </DialogActions>
            </Dialog>


        </Box>


    )
};

export default MyPickemsPage;
