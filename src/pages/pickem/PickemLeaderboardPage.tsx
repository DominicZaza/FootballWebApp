import React, {useEffect, useState} from 'react';
import {
    Box,
    FormControl,
    InputLabel,
    Select,
    Alert,
    Paper,
    MenuItem, Typography, Card
} from "@mui/material";

import {useZAppContext} from "../../components/AppContextProvider.tsx";
import {useRestApi} from "../../api/RestInvocations.ts";
import LoadingSpinner from "../../components/LoadingSpinner.tsx";
import type {PickemLeaderBoardPageDTO, PickemRecordDTO, SeasonWeekDTO} from "../../types/ZTypes.ts";
import { formatDateSmall} from "../../utils/DateUtils.ts";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import PaidIcon from '@mui/icons-material/Paid';
import {Tooltip} from "@mui/material";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer
} from "recharts";
import {Switch, FormControlLabel} from "@mui/material";


const PickemLeaderboardPage = () => {

    const {isMobile, selectedEntry, currentPeriod, currentSeason} = useZAppContext();
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [periods, setPeriods] = useState<SeasonWeekDTO[]>([]);
    const [leaderBoardDTO, setLeaderBoardDTO] = useState<PickemLeaderBoardPageDTO | null>(null);
    const [showGraph, setShowGraph] = useState<boolean>(false);
    const [hiddenEntries, setHiddenEntries] = React.useState<Record<string, boolean>>({});

    const {
        getPickemLeaderboardByPoolInstanceRestCall,
        getSeasonWeekPeriodsBySeasonAndPoolTypeIdRestCall,
    } = useRestApi();


    useEffect(() => {
        if (periods.length !== 0 && currentPeriod) {
            setSelectedPeriod(Number(currentPeriod));
        }
    }, [currentPeriod, periods]);


    useEffect(() => {
        if (!selectedEntry || !selectedEntry.id) return;

        setLoading(true);
        setError(null);
        getPickemLeaderboardByPoolInstanceRestCall(selectedEntry.pool_instance_id)
            .then(setLeaderBoardDTO)
            .catch(() => {
                setError('Failed to load  pickem leaderboard data. Please try again.');
            })
            .finally(() => setLoading(false));
    }, [selectedEntry]);

    useEffect(() => {

        if (!selectedEntry?.poolTypeId) return;

        // Prevent redundant calls if periods for this season/poolType are already loaded
        if (periods.length > 0 && periods[0].seasonId === currentSeason) return;

        getSeasonWeekPeriodsBySeasonAndPoolTypeIdRestCall(currentSeason, selectedEntry.poolTypeId)
            .then(setPeriods)
            .catch(err => {
                setError('Failed to retrieve periods. ' + (err.message || 'Please try again.'));
                setPeriods([]);
            });

    }, [selectedEntry?.poolTypeId]);


    // Generate period options
    const periodOptions = periods.map(period => (
        <MenuItem key={period.id} value={period.period}>
            Week {period.period} - {formatDateSmall(period.periodStart, isMobile)} - {formatDateSmall(period.periodEnd, isMobile)}
        </MenuItem>
    ));


    const recordsForPeriod: PickemRecordDTO[] = React.useMemo(() => {
        if (!leaderBoardDTO || selectedPeriod == null) return [];

        return Object.values(leaderBoardDTO.pickems)
            .flat()                       // flatten per-entry arrays
            .filter(r => r.period === selectedPeriod);
    }, [leaderBoardDTO, selectedPeriod]);

    const balancesForPeriod = React.useMemo(() => {
        if (!leaderBoardDTO || selectedPeriod == null) return [];

        return Object.values(leaderBoardDTO.balances)
            .flat()
            .filter(b => b.period === selectedPeriod);
    }, [leaderBoardDTO, selectedPeriod]);

    const formatWinPct = (winPct: number) => {
        if (winPct == null || isNaN(winPct)) return "-";
        return `${(winPct * 100).toFixed(1)}%`;
    };

    recordsForPeriod.sort(
        (a, b) => Number(b.total_win_pct) - Number(a.total_win_pct)
    );
    const chartData = React.useMemo(() => {
        if (!leaderBoardDTO || periods.length === 0) return [];

        const dataByPeriod: Record<number, any> = {};

        // Initialize periods
        periods.forEach(p => {
            dataByPeriod[p.period] = {period: p.period};
        });

        // Win %
        leaderBoardDTO.pickems.forEach(p => {
            if (!dataByPeriod[p.period]) return;
            dataByPeriod[p.period][p.entry_name] = Number(p.total_win_pct);
        });

        // Balances
        leaderBoardDTO.balances.forEach(b => {
            const entryName = leaderBoardDTO.pickems.find(
                p => p.entry_id === b.entryId
            )?.entry_name;

            if (!entryName || !dataByPeriod[b.period]) return;

            dataByPeriod[b.period][`${entryName}$`] = b.balance;
        });

        return Object.values(dataByPeriod).sort(
            (a, b) => a.period - b.period
        );
    }, [leaderBoardDTO, periods]);

    const entryNames = React.useMemo(() => {
        if (!leaderBoardDTO) return [];

        return Array.from(
            new Set(leaderBoardDTO.pickems.map(p => p.entry_name))
        );
    }, [leaderBoardDTO]);

    const colors = [
        "#1976d2", "#9c27b0", "#2e7d32", "#ed6c02",
        "#d32f2f", "#0288d1", "#6a1b9a"
    ];
    const handleLegendClick = (e: any) => {
        const entryName = e.dataKey as string;
        const isShift = e.event?.shiftKey;

        setHiddenEntries(prev => {
            // SHIFT + CLICK → isolate
            if (isShift) {
                const isAlreadyIsolated =
                    Object.keys(prev).length === entryNames.length - 1 &&
                    !prev[entryName];

                // Restore all if already isolated
                if (isAlreadyIsolated) {
                    return {};
                }

                // Hide all except clicked
                const next: Record<string, boolean> = {};
                entryNames.forEach(name => {
                    next[name] = name !== entryName;
                });
                return next;
            }

            // Normal click → toggle
            return {
                ...prev,
                [entryName]: !prev[entryName]
            };
        });
    };
    const hasCount = (v: any) => Number(v) > 0;


    if (loading) {
        return <LoadingSpinner/>;
    }


    return (
        <Box sx={{p: 0.5}}>
            <Box>
                {/* Season Selector */}
                <FormControl sx={{minWidth: 150}}>
                    <InputLabel id="period-selector-label">
                        <u>W</u>eek
                    </InputLabel>

                    <Select
                        labelId="period-selector-label"
                        id="periodSelector"
                        value={selectedPeriod ?? ''}
                        onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                        label="Week"
                        accessKey="W"
                    >
                        {periodOptions}
                    </Select>
                </FormControl>
                <FormControlLabel
                    control={
                        <Switch
                            checked={showGraph}
                            onChange={(e) => setShowGraph(e.target.checked)}
                        />
                    }
                    label="Show Graph"
                />
            </Box>
            {error && (
                <Alert severity="error" sx={{mb: 2}} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {recordsForPeriod.length === 0 && (
                <Typography variant="body1" sx={{textAlign: 'center', mt: 4, color: 'warning.main'}}>
                    No records found for the selected week.
                </Typography>
            )}


            {showGraph && chartData.length > 0 && (
                <Paper sx={{p: 2, mb: 2}}>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="period" label={{value: "Week", position: "insideBottomRight"}}/>

                            {/* Left axis – Win % */}
                            <YAxis
                                yAxisId="left"
                                domain={[0, 1]}
                                tickFormatter={(v) => `${Math.round(v * 100)}%`}
                                label={{value: "Win %", angle: -90, position: "insideLeft"}}
                            />

                            {/* Right axis – Balance */}
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                label={{value: "$", angle: -90, position: "insideRight"}}
                            />

                            <RechartsTooltip/>
                            <Legend
                                onClick={handleLegendClick}
                                formatter={(value) => (
                                    <span
                                        style={{
                                            opacity: hiddenEntries[value] ? 0.4 : 1,
                                            cursor: "pointer"
                                        }}
                                        title="Click to toggle • Shift+Click to isolate"
                                    >{value}</span>
                                )}
                            />

                            {entryNames.map((name, index) => {
                                const isHidden = hiddenEntries[name];
                                const color = colors[index % colors.length];

                                return (
                                    <React.Fragment key={name}>
                                        {/* Win % */}
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey={name}
                                            stroke={color}
                                            strokeWidth={2}
                                            dot={false}
                                            hide={isHidden}

                                        />

                                        {/* Balance */}
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey={`${name}$`}
                                            stroke={color}
                                            strokeDasharray="4 4"
                                            dot={false}
                                            hide={isHidden}
                                            legendType="none" //no legend
                                        />
                                    </React.Fragment>
                                );
                            })}
                        </LineChart>
                    </ResponsiveContainer>
                </Paper>
            )}
            <Box
                sx={{
                    maxWidth: { xs: '100%', sm: 600, md: 700 },
                    mx: { xs: 'auto', md: 0 },
                    pl: { md: 2 }, // optional spacing from left
                }}
            >
                {recordsForPeriod.map((pickem, index) => {
                    const balance = balancesForPeriod.find(
                        b => b.entryId === pickem.entry_id
                    );
                    const balanceValue = balance?.balance;
                    const isNegative = typeof balanceValue === "number" && balanceValue < 0;

                    return (
                        <Card key={pickem.entry_id} sx={{
                            mb: 2,
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: 1
                        }}>
                            <Box
                                sx={{
                                    position: 'relative',
                                    bgcolor: 'action.hover',
                                    px: 2,
                                    py: 1,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    gap: 2,
                                }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        {/* Row 1: Name + Record */}
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: isMobile ? 1 : 2,
                                        flexWrap: isMobile ? 'wrap' : 'nowrap'
                                    }}>
                                        <Typography
                                            variant="subtitle1"
                                            sx={{
                                                fontWeight: 700,
                                                color: 'text.primary',
                                            }}
                                        >
                                            {pickem.entry_name}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 600,
                                                color: 'text.secondary',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {pickem.total_wins}-{pickem.total_losses}-{pickem.total_pushes} ({formatWinPct(Number(pickem.total_win_pct))})
                                        </Typography>
                                    </Box>
                                        {/* Row 2: Trophy & Sombrero counts */}
                                        {(hasCount(pickem.trophy_count) || hasCount(pickem.sombrero_count)) && (
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                pl: 0.25
                                            }}>
                                                {/* Trophy */}
                                                {hasCount(pickem.trophy_count) && (
                                                    <Tooltip title="Total trophies earned">
                                                        <Box sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 0.5,
                                                            cursor: 'default'
                                                        }}>
                                                            <EmojiEventsIcon fontSize="small" color="warning" />
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {pickem.trophy_count}
                                                            </Typography>
                                                        </Box>
                                                    </Tooltip>
                                                )}

                                                {/* Sombrero */}
                                                {hasCount(pickem.sombrero_count) && (
                                                    <Tooltip title="Total sombreros earned">
                                                        <Box sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 0.5,
                                                            cursor: 'default'
                                                        }}>
                                                            <EmojiEmotionsIcon fontSize="small" color="secondary" />
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {pickem.sombrero_count}
                                                            </Typography>
                                                        </Box>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Right side: Money */}
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                    }}>
                                        <PaidIcon fontSize="small" color="success" />
                                        <Typography variant="body2" sx={{ fontWeight: 600,
                                            color: isNegative ? 'error.main' : 'success.main'}}>
                                            ${balance?.balance?.toFixed(2) ?? 'N/A'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Card>
                    );
                })}
            </Box>
            {recordsForPeriod.length === 0 && !loading && (
                <Typography variant="body1" sx={{textAlign: 'center', mt: 4, color: 'warning.main'}}>
                    No records found for the selected week.
                </Typography>
            )}
        </Box>
    )};

export default PickemLeaderboardPage;