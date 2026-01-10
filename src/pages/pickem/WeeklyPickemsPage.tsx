import React, {memo, useEffect, useState} from 'react';
import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Card,
    CardContent,
    Typography,
    Grid, Collapse, FormControlLabel, Switch, Tooltip
} from "@mui/material";

import {useZAppContext} from "../../components/AppContextProvider.tsx";
import type {SelectChangeEvent} from "@mui/material/Select/SelectInput";
import {useRestApi} from "../../api/RestInvocations.ts";
import LoadingSpinner from "../../components/LoadingSpinner.tsx";
import type { SeasonWeekDTO, WeeklyPickemCardDTO, WeeklyPickemDTO} from "../../types/ZTypes.ts";
import {formatDateSmall, formatDate} from '../../utils/DateUtils'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { Chip } from "@mui/material";

const WeeklyPickemsPage = () => {

    const {isMobile, selectedEntry, currentPeriod, currentSeason} = useZAppContext();
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [weeklyPickemRecords, setWeeklyPickemRecords] = useState<WeeklyPickemCardDTO[]>([]);
    const [periods, setPeriods] = useState<SeasonWeekDTO[]>([]);
    const [selectedSeasonId, setSelectedSeasonId] = useState<number>(currentSeason);
    const [collapsedCards, setCollapsedCards] = useState<Record<number, boolean>>({});
    const [allCollapsed, setAllCollapsed] = useState<boolean>(false);
    const [hideCompletedGamesSwitch, setHideCompletedGamesSwitch] = useState<boolean>(false);


    const {
        getWeeklyPickemByPoolInstanceAndPeriodRestCall,
        getSeasonWeekPeriodsBySeasonAndPoolTypeIdRestCall,
        getTeamLogoUrl
    } = useRestApi();

    const handlePeriodChange = (event: SelectChangeEvent) => {
        const period = event.target.value;
        setSelectedPeriod(period as number);
    };

    useEffect(() => {
        if (!periods.length) return;
        if (currentPeriod) {
            setSelectedPeriod(currentPeriod);
        }
    }, [periods]);

    useEffect(() => {
        if (!weeklyPickemRecords.length) return;

        const allAreCollapsed = weeklyPickemRecords.every(
            record => collapsedCards[record.entry_id]
        );

        setAllCollapsed(allAreCollapsed);
    }, [collapsedCards, weeklyPickemRecords]);


    useEffect(() => {
        if (!selectedEntry || !selectedEntry.id || !selectedPeriod) return;

        setLoading(true);
        setError(null);

        getWeeklyPickemByPoolInstanceAndPeriodRestCall(selectedEntry.pool_instance_id, selectedPeriod)
            .then(setWeeklyPickemRecords)
            .catch(() => {
                setError('Failed to load weekly pickem data. Please try again.');
            })
            .finally(() => setLoading(false));
    }, [selectedEntry, selectedPeriod]);

    useEffect(() => {
        if (!selectedSeasonId || !selectedEntry?.poolTypeId) return;

        // Prevent redundant calls if periods for this season/poolType are already loaded
        if (periods.length > 0 && periods[0].seasonId === selectedSeasonId) return;

        getSeasonWeekPeriodsBySeasonAndPoolTypeIdRestCall(selectedSeasonId, selectedEntry.poolTypeId)
            .then(setPeriods)
            .catch(err => {
                setError('Failed to retrieve periods. ' + (err.message || 'Please try again.'));
                setPeriods([]);
            });

    }, [selectedSeasonId, selectedEntry?.poolTypeId]);

    const formatWinPct = (winPct: number) => {
        if (winPct == null || isNaN(winPct)) return "-";
        return `${(winPct * 100).toFixed(1)}%`;
    };


    type TeamRendererProps = {
        name: string;
        abbr: string;
        logo: string;
        score: string;
        spread?: number;
        isPick?: boolean;
        isMobile?: boolean;
        gameCompleted?: boolean;
        teamPickStatus?: "Won" | "Lost" | "Push" | "Pending" | null;
    };

    const TeamRenderer = memo(
        ({
             name,
             abbr,
             logo,
             score,
             spread,
             isPick,
             isMobile,
            gameCompleted = false,
            teamPickStatus = null,
         }: TeamRendererProps) => {
            const logoSize = isMobile ? 24 : 32;

            return (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between', // keeps score vertically aligned
                        gap: 1,
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    {/* Left: Logo + team name/spread */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            minWidth: 0,
                        }}
                    >
                        <Box
                            component="img"
                            src={logo}
                            alt={name}
                            sx={{ width: logoSize, height: logoSize, flexShrink: 0 }}
                        />

                        <Box
/*
                            sx={{
                                flexGrow: 1,
                                minWidth: 0,
                                px: 0.5,
                                py: 0.25,

                            }}
*/
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                minWidth: 0,
                                overflow: "hidden",
                            }}                        >
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: 700,
                                    fontSize: isMobile ? '0.7rem' : '0.95rem',
                                    lineHeight: 1.1,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {isMobile ? abbr : name}
                            </Typography>
                            {/* Pick Status Icon */}
                            {isPick && gameCompleted && teamPickStatus && (
                                <>
                                    {teamPickStatus === "Won" && (
                                        <CheckCircleIcon sx={{ color: 'green', fontSize: isMobile ? 16 : 20 }} />
                                    )}
                                    {teamPickStatus === "Lost" && (
                                        <CancelIcon sx={{ color: 'red', fontSize: isMobile ? 16 : 20 }} />
                                    )}
                                    {teamPickStatus === "Push" && (
                                        <HourglassEmptyIcon sx={{ color: 'orange', fontSize: isMobile ? 16 : 20 }} />
                                    )}
                                </>
                            )}

                            {/* Pending pick */}
                            {isPick && !gameCompleted && (
                                <HourglassEmptyIcon sx={{ color: 'gray', fontSize: isMobile ? 16 : 20 }} />
                            )}

                            {spread != null && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: 'block',
                                        fontSize: isMobile ? '0.6rem' : '0.65rem',
                                        lineHeight: 1.1,
                                        color: 'text.secondary',
                                    }}
                                >
                                    {spread > 0 ? `+${spread}` : spread}
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    {/* Right: Plain score text */}
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 700,
                            fontSize: isMobile ? '0.7rem' : '0.95rem',
                            lineHeight: 1.1,
                            minWidth: 24, // optional: keeps vertical alignment if numbers vary
                            textAlign: 'right',
                        }}
                    >
                        {score}
                    </Typography>
                </Box>
            );
        }
    );






    if (loading) {
        return <LoadingSpinner/>;
    }
    const toggleCard = (entryId: number) => {
        setCollapsedCards(prev => ({
            ...prev,
            [entryId]: !prev[entryId],
        }));
    };

    return (
        <Box sx={{p: isMobile ? 1 : 3}}>
            <Box sx={{display: 'flex', alignItems: 'center', mb: 3}}>
                <FormControl sx={{minWidth: 150}}>
                    <InputLabel id="period-selector-label"><u>W</u>eek</InputLabel>
                    <Select
                        labelId="period-selector-label"
                        id="periodSelector"
                        value={selectedPeriod || ''}
                        label="Week"
                        accessKey="W"
                        onChange={handlePeriodChange}
                    >
                        {periods && periods.map((period) => (
                            <MenuItem key={period.id} value={period.period}>
                                Week {period.period} - {formatDateSmall(period.periodStart, isMobile)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Tooltip title={!hideCompletedGamesSwitch ? 'Hide completed games' : 'Display completed games'}>
                    {/* Push switch to extreme right */}
                    <Box sx={{ml: 'auto'}}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={!hideCompletedGamesSwitch}
                                    onChange={() => {
                                        setHideCompletedGamesSwitch(!hideCompletedGamesSwitch);
                                    }}
                                />
                            }
                            label={isMobile ? '' : hideCompletedGamesSwitch ? 'Display Completed Games' : 'Hide Completed Games'}
                        />
                    </Box>
                </Tooltip>

                <Tooltip title={allCollapsed ? 'Expand all entries' : 'Collapse all entries'}>
                    {/* Push switch to extreme right */}
                    <Box sx={{ml: 'auto'}}>

                        {/* Expand / Collapse All */}
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={!allCollapsed}
                                    onChange={() => {
                                        const nextCollapsed = allCollapsed;

                                        const newState: Record<number, boolean> = {};
                                        weeklyPickemRecords.forEach(record => {
                                            newState[record.entry_id] = !nextCollapsed;
                                        });

                                        setCollapsedCards(newState);
                                    }}
                                />
                            }
                            label={isMobile ? '' : allCollapsed ? 'Expand All Cards' : 'Collapse All Cards'}
                        />
                    </Box>
                </Tooltip>
            </Box>

            {weeklyPickemRecords.map((record) => (
                <Card key={record.entry_id} sx={{
                    mb: 4,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid text.secondary',
                    boxShadow: 'none'
                }}>
                    <Box
                        onClick={() => toggleCard(record.entry_id)}
                        sx={{
                            bgcolor: 'action.hover',
                            p: 1.5,
                            borderBottom: '1px solid text.primary',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                        <Typography variant="subtitle2" sx={{fontWeight: 700, color: 'text.secondary'}}>
                             {record.entry_name}
                        </Typography>
                        <Box sx={{display: 'flex', gap: 2}}>
                            <Typography variant="caption" sx={{fontWeight: 600}}>
                                WEEK: {record.week_wins}-{record.week_losses}-{record.week_pushes}
                            </Typography>
                            <Typography variant="caption" sx={{fontWeight: 600, color: 'text.secondary'}}>
                                TOTAL: {record.total_wins}-{record.total_losses} ({formatWinPct(record.total_win_pct)})
                            </Typography>
                        </Box>
                        <ExpandMoreIcon
                            sx={{
                                transform: collapsedCards[record.entry_id] ? 'rotate(0deg)': 'rotate(180deg)',
                                transition: 'transform 0.2s',
                                color: 'text.secondary'
                            }}
                        />

                    </Box>
                    <Collapse in={!collapsedCards[record.entry_id]} timeout="auto" unmountOnExit>
                        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                                {record.weeklyPickemDTOList
                                    .filter(pick => !hideCompletedGamesSwitch || !pick.gameCompleted)
                                    .map((pick, index, filteredPicks) => {

                                return (
                                    <Box
                                        key={index}
                                        sx={{
                                            p: 1.5,
                                            borderBottom:
                                                index === record.weeklyPickemDTOList.length - 1
                                                    ? 'none'
                                                    : '1px solid #f0f0f0',
                                            '&:hover': { bgcolor: 'action.hover' },
                                        }}
                                    >
                                        <Grid container spacing={1} alignItems="center">
                                            {/* Left side: Teams + O/U + Date */}
                                            <Grid size={{ xs:12, md:8 }}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    {/* Row 1: Teams */}
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            gap: isMobile ? 1 : 2,
                                                            flexWrap: 'nowrap', // prevents wrapping for vertical score alignment
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', flex: 1 }}>
                                                            <TeamRenderer
                                                                name={pick.awayTeam}
                                                                abbr={pick.awayTeamAbbreviation}
                                                                logo={getTeamLogoUrl(pick.awayTeamId, pick.sport)}
                                                                score={pick.awayScore}
                                                                gameCompleted={pick.gameCompleted}
                                                                isPick={pick.teamPick === 'Away'}
                                                                isMobile={isMobile}
                                                                teamPickStatus={pick.teamPickStatus}
                                                            />
                                                        </Box>

                                                        <Box sx={{ display: 'flex', flex: 1 }}>
                                                            <TeamRenderer
                                                                name={pick.homeTeam}
                                                                abbr={pick.homeTeamAbbreviation}
                                                                logo={getTeamLogoUrl(pick.homeTeamId, pick.sport)}
                                                                score={pick.homeScore}
                                                                spread={pick.homeTeamSpread}
                                                                gameCompleted={pick.gameCompleted}
                                                                isPick={pick.teamPick === 'Home'}
                                                                isMobile={isMobile}
                                                                teamPickStatus={pick.teamPickStatus}
                                                            />
                                                        </Box>
                                                    </Box>

                                                    {/* Row 2: O/U left, Game Date right */}
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                            mt: 0.5,
                                                            flexWrap: 'wrap'
                                                        }}
                                                    >
                                                        {/* Left side: O/U + Total Pick */}
                                                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                                                            {pick.overPoints && (
                                                                <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                    sx={{ fontSize: '0.65rem', lineHeight: 1.2 }}
                                                                >
                                                                    O/U {pick.overPoints}
                                                                </Typography>
                                                            )}

                                                            {pick.totalPick && pick.totalPickStatus && (
                                                                <Chip
                                                                    label={pick.totalPick}
                                                                    size={isMobile ? "small" : "medium"}
                                                                    variant={pick.gameCompleted ? "filled" : "outlined"}
                                                                    sx={{
                                                                        fontSize: isMobile ? '0.6rem' : '0.65rem',
                                                                        fontWeight: 600,
                                                                        height: isMobile ? 20 : 24,
                                                                        bgcolor: pick.gameCompleted
                                                                            ? pick.totalPickStatus === "Won"
                                                                                ? "success.main"
                                                                                : pick.totalPickStatus === "Lost"
                                                                                    ? "error.main"
                                                                                    : pick.totalPickStatus === "Push"
                                                                                        ? "warning.main"
                                                                                        : undefined
                                                                            : undefined,
                                                                        color: pick.gameCompleted ? "common.white" : undefined,
                                                                        borderColor: pick.gameCompleted ? undefined : "text.secondary",
                                                                    }}
                                                                />
                                                            )}
                                                        </Box>

                                                        {/* Right side: Game date */}
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            sx={{ fontSize: '0.65rem', lineHeight: 1.2 }}
                                                        >
                                                            {formatDate(pick.commenceTime, isMobile)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>

                                            {/* Right side (optional for desktop layout) */}
                                            <Grid size={{ xs:12, md:4 }}>
                                                {/* Empty on mobile; desktop can have additional info if needed */}
                                            </Grid>
                                        </Grid>
                                    </Box>
                                );
                            })}
                        </CardContent>
                    </Collapse>
                </Card>
            ))}

            {weeklyPickemRecords.length === 0 && !loading && (
                <Typography variant="body1" sx={{textAlign: 'center', mt: 4}}>
                    No records found for the selected week.
                </Typography>
            )}
        </Box>
    );
};

export default WeeklyPickemsPage;