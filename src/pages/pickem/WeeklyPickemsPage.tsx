import React, { useEffect, useState } from 'react';

import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Card,
    CardContent,
    Typography,
    Divider,
    Chip,
    Grid
} from "@mui/material";

import { useZAppContext } from "../../components/AppContextProvider.tsx";
import type { SelectChangeEvent } from "@mui/material/Select/SelectInput";
import { useRestApi } from "../../api/RestInvocations.ts";
import LoadingSpinner from "../../components/LoadingSpinner.tsx";
import type {SeasonWeekDTO, WeeklyPickemCardDTO} from "../../types/ZTypes.ts";
import {formatDateSmall, formatDate} from '../../utils/DateUtils'

const WeeklyPickemsPage = () => {

    const { isMobile, selectedEntry, currentPeriod ,currentSeason, seasons} = useZAppContext();
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [weeklyPickemRecords, setWeeklyPickemRecords] = useState<WeeklyPickemCardDTO[]>([]);
    const [periods, setPeriods] = useState<SeasonWeekDTO[]>([]);
    const [selectedSeasonId, setSelectedSeasonId] = useState<number>(currentSeason);

    const {
        getWeeklyPickemByPoolInstanceAndPeriodRestCall,
        getSeasonWeekPeriodsBySeasonAndPoolTypeIdRestCall
    } = useRestApi();

    const handlePeriodChange = (event: SelectChangeEvent) => {
        const period = event.target.value;
        setSelectedPeriod(period);
    };



    useEffect(() => {
        if (currentPeriod) {
            setSelectedPeriod(currentPeriod);
        }
    }, [currentPeriod]);

    useEffect(() => {
        if (!selectedEntry || !selectedEntry.id || !selectedPeriod ) return;

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
        getSeasonWeekPeriodsBySeasonAndPoolTypeIdRestCall(selectedSeasonId, selectedEntry?.poolTypeId)
            .then(setPeriods)
            .catch(err => {
                setError('Failed to retrieve periods. ' + (err.message || 'Please try again.'));
                setPeriods([]);
            });

    }, [selectedSeasonId]);

    // Chip styling based on pick status
    const getChipStyles = (status: string) => {
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
    const formatWinPct = (winPct: number) => {
        if (winPct == null || isNaN(winPct)) {
            return "-";  // Return a placeholder if the win percentage is null or invalid
        }
        return `${(winPct * 100).toFixed(2)}%`;  // Multiply by 100 to get the percentage and format it to 2 decimals
    };

    // Generate period options
    const periodOptions = [];
    {periods && periods.map((period) => (
        periodOptions.push(
            <MenuItem key={period.id} value={period.period}>
                Week {period.period} - {formatDateSmall(period.periodStart,isMobile)} - {formatDateSmall(period.periodEnd,isMobile)}
            </MenuItem>
        )))
    }

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
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

                <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel id="period-selector-label">
                        <u>W</u>eek
                    </InputLabel>
                    <Select
                        labelId="period-selector-label"
                        id="periodSelector"
                        value={selectedPeriod || ''}
                        label="Week"
                        accessKey="W"
                        onChange={handlePeriodChange}
                    >
                        {periodOptions}
                    </Select>
                </FormControl>
            </Box>

            {weeklyPickemRecords.map((record) => (
                <Card key={record.entry_id} sx={{ mb: 3, boxShadow: 3 }}>
                    <CardContent>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 2
                            }}
                        >
                            <Typography variant="h6" sx={{ flex: 1, fontWeight: 'bold' }}>
                                {record.entry_name}
                            </Typography>

                            <Typography variant="subtitle1" sx={{ flex: 1, textAlign: 'center' }}>
                                {record.week_wins}-{record.week_losses}-{record.week_pushes}
                            </Typography>

                            <Typography
                                variant="subtitle1"
                                sx={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}
                            >
                                {record.total_wins}-{record.total_losses}-{record.total_pushes} {formatWinPct(record.total_win_pct)}
                            </Typography>
                        </Box>

                        <Divider sx={{ mb: 1 }} />

                        {record.weeklyPickemDTOList.map((pick, index) => {
                            const chipProps = getChipStyles(pick.pickStatus);

                            return (
                                <Box key={index} sx={{ py: 0.5 }}>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid size="grow">
                                            <Typography variant="body2">
                                                {pick.awayTeam} @ {pick.homeTeam} (
                                                {pick.homeTeamSpread > 0
                                                    ? `+${pick.homeTeamSpread}`
                                                    : pick.homeTeamSpread}
                                                ) O/U {pick.overPoints}
                                            </Typography>
                                        </Grid>

                                        <Grid size="auto">
                                            <Typography variant="body2">
                                                {formatDate(pick.commenceTime,isMobile)}
                                            </Typography>
                                        </Grid>

                                        <Grid size="auto" sx={{ minWidth: 100, textAlign: 'center' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                {pick.awayScore} - {pick.homeScore}
                                            </Typography>
                                        </Grid>

                                        <Grid size="auto" sx={{ minWidth: 150, textAlign: 'right' }}>
                                            <Chip
                                                label={`${pick.pick} (${pick.pickStatus})`}
                                                size="small"
                                                {...chipProps}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                            );
                        })}
                    </CardContent>
                </Card>
            ))}

            {weeklyPickemRecords.length === 0 && !loading && (
                <Typography variant="body1" sx={{ textAlign: 'center', mt: 4 }}>
                    No records found for the selected week.
                </Typography>
            )}
        </div>
    );
};

// TODO add a sombrero counter/animation and a perfect score counter (trophy Icon)
export default WeeklyPickemsPage;
