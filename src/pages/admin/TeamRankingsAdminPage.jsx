
import React, { useState, useEffect } from 'react';
import { useZAppContext } from '../../components/AppContextProvider.tsx';

import {
    Box,
    Typography,
    Paper,
    Button,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    IconButton
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArrowDropUp from '@mui/icons-material/ArrowDropUp';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import {getTeamLogoUrl, useRestApi} from '../../api/RestInvocations.ts';

export default function TeamRankingsAdminPage() {
    const { currentWeek, currentSeason   } = useZAppContext();


    const [teamRanks, setTeamRanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [draggedItem, setDraggedItem] = useState(null);

    const { getTeamRankingsRestCall, saveTeamRankingsRestCall } = useRestApi();

    useEffect(() => {
        fetchTeamRankings();
    }, []);

    const fetchTeamRankings = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getTeamRankingsRestCall(currentSeason);
            // Sort teams by order
            const sortedTeamRanks = data.sort((a, b) => a.order - b.order);
            setTeamRanks(sortedTeamRanks);
        } catch (err) {
            console.error('Error fetching teams:', err);
            setError('Failed to load teams. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const calculateRankDelta = (rank, index) => {
        // Get the current week's rank from the ranks array
        const currentWeekRank = rank.ranks && rank.ranks[currentWeek-2];
        
        // Current dragged position (1-indexed)
        const newRank = index + 1;
        
        // If no current week rank, can't calculate delta
        if (!currentWeekRank) {
            return null;
        }
        
        // Calculate delta (negative means improvement, positive means decline)
        // Lower rank number = better position
        const delta = newRank - currentWeekRank;
        
        return delta;
    };

    const renderRankDelta = (rank, index) => {
        const delta = calculateRankDelta(rank, index);
        
        if (delta === null || delta === 0) {
            return <Typography variant="body2">-</Typography>;
        }
        
        const isImprovement = delta < 0;
        const absDelta = Math.abs(delta);
        
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                {isImprovement ? (
                    <ArrowDropUp sx={{ color: 'success.main', fontSize: 18 }} />
                ) : (
                    <ArrowDropDown sx={{ color: 'error.main', fontSize: 18 }} />
                )}
                <Typography 
                    variant="body2" 
                    sx={{ 
                        color: isImprovement ? 'success.main' : 'error.main',
                        fontWeight: 'bold'
                    }}
                >
                    {absDelta}
                </Typography>
            </Box>
        );
    };

    const renderWeekDelta = (rank, weekIndex) => {
        // Don't show delta for week 0 (no previous week to compare)
        if (weekIndex === 0 || !rank.deltas || rank.deltas[weekIndex] === undefined || rank.deltas[weekIndex] === null) {
            return null;
        }

        const delta = rank.deltas[weekIndex];

        // Don't display anything if delta is zero
        if (delta === 0) {
            return null;
        }

        const isImprovement = delta > 0;
        const absDelta = Math.abs(delta);

        return (
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', mt: 0.5 }}>
                {isImprovement ? (
                    <ArrowDropUp sx={{ color: 'success.main', fontSize: 14, mb: -0.5 }} />
                ) : (
                    <ArrowDropDown sx={{ color: 'error.main', fontSize: 14, mb: -0.5 }} />
                )}
                <Typography 
                    variant="caption" 
                    sx={{ 
                        color: isImprovement ? 'success.main' : 'error.main',
                        fontWeight: 'bold'
                    }}
                >
                    {absDelta}
                </Typography>
            </Box>
        );
    };

    const handleDragStart = (e, index) => {
        setDraggedItem(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedItem === null || draggedItem === index) return;

        const newTeams = [...teamRanks];
        const draggedTeam = newTeams[draggedItem];
        
        // Remove from the old position
        newTeams.splice(draggedItem, 1);
        // Insert at the new position
        newTeams.splice(index, 0, draggedTeam);
        
        // Update order values
        const updatedTeams = newTeams.map((team, idx) => ({
            ...team,
            order: idx + 1
        }));
        
        setTeamRanks(updatedTeams);
        setDraggedItem(index);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    const handleSubmit = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(false);
            
            // Prepare the rankings data
            const rankings = teamRanks.map((rank, index) => ({
                team: {
                    id:  rank.team.id
                },
                rank: index + 1
            }));
            
            await saveTeamRankingsRestCall(rankings);
            setSuccess(true);
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Error saving team rankings:', err);
            setError('Failed to save team rankings. '+err.message || 'Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div>
            <Box>
                <Typography variant="h4" gutterBottom>
                    Team Rankings
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Drag and drop teams to reorder them, then click Submit to save the changes.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
                        Team rankings saved successfully!
                    </Alert>
                )}

                <TableContainer component={Paper} sx={{ mb: 2, maxHeight: '70vh' }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', minWidth: 50 }}></TableCell>
                                <TableCell sx={{ fontWeight: 'bold', minWidth: 60 }}>Rank</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', minWidth: 80 }}>Delta</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>Team</TableCell>
                                {Array.from({ length: 19 }, (_, i) => (
                                    <TableCell 
                                        key={i} 
                                        align="center" 
                                        sx={{ 
                                            fontWeight: 'bold',
                                            minWidth: 50,
                                            backgroundColor: i === currentWeek ? 'action.selected' : 'inherit'
                                        }}
                                    >
                                        W{i}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {teamRanks.map((rank, index) => (
                                <TableRow
                                    key={rank.team.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    sx={{
                                        cursor: 'move',
                                        bgcolor: draggedItem === index ? 'action.hover' : 'transparent',
                                        '&:hover': {
                                            bgcolor: 'action.hover'
                                        }
                                    }}
                                >
                                    <TableCell>
                                        <IconButton size="small">
                                            <DragIndicatorIcon />
                                        </IconButton>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                            {rank.order}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {renderRankDelta(rank, index)}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar 
                                                src={getTeamLogoUrl(rank.team.ext_id,sport)}
                                                alt={rank.team.name}
                                                sx={{ width: 32, height: 32 }}
                                            >
                                                {rank.team.name?.charAt(0)}
                                            </Avatar>
                                            <Typography variant="body2" fontWeight="bold">
                                                {rank.team.name}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    {Array.from({ length: 19 }, (_, weekIndex) => (
                                        <TableCell 
                                            key={weekIndex} 
                                            align="center"
                                            sx={{
                                                backgroundColor: weekIndex === currentWeek ? 'action.selected' : 'inherit'
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                                <Typography variant="body2">
                                                    {rank.ranks && rank.ranks[weekIndex] !== null && rank.ranks[weekIndex] !== undefined
                                                        ? rank.ranks[weekIndex]
                                                        : '-'}
                                                </Typography>
                                                {renderWeekDelta(rank, weekIndex)}
                                            </Box>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={fetchTeamRankings}
                        disabled={saving}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={saving}
                    >
                        {saving ? <CircularProgress size={24} /> : 'Submit'}
                    </Button>
                </Box>
            </Box>
        </div>
    );
}
