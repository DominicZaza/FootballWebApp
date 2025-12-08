import React, {useState} from "react";
import {
    Box,
    Alert,
    Button,
    Typography,
    Paper,
    Divider, Chip, TextField, MenuItem
} from "@mui/material";
import {useZAppContext} from "../components/AppContextProvider";
import {useRestApi} from "../api/RestInvocations";

const PickSelectionForm = ({
                               currentWeek,
                               myGames,
                               pickControl,
                               isMobile,
                               onPickSubmitted
                           }) => {

    const {selectedEntry} = useZAppContext();
    const {submitPickRestCall, getTeamLogoUrl} = useRestApi();

    // Find this week's game
    const currentGame = myGames.find(g => g.week === currentWeek);

    if (!currentGame) {
        return (
            <Alert severity="warning">No game found for the current week.</Alert>
        );
    }

    if (!pickControl || !pickControl.pickAllowed) {
        return null; // Don't show form if picks aren't allowed
    }

    // Default values from previous pick
    const originalTeam = currentGame.pick || "";
    const originalWager = currentGame.wager || "";

    const [selectedTeam, setSelectedTeam] = useState(originalTeam);
    const [wager, setWager] = useState(originalWager);
    const [validationError, setValidationError] = useState({message: "", severity: ""});

    const validate = () => {
        let valid = true;
        let newErrors = {message: "", severity: ""};

        if (!selectedTeam) {
            newErrors.message = "Please select a team.";
            newErrors.severity = "error";
            valid = false;
        }

        const wagerNum = Number(wager);
        if (!wager || isNaN(wagerNum) || wagerNum <= 0) {
            newErrors.message = "Wager must be greater than 0.";
            newErrors.severity = "error";
            valid = false;
        } else if (wagerNum > pickControl.total) {
            newErrors.message = `Wager cannot exceed ${pickControl.total}.`;
            newErrors.severity = "error";
            valid = false;
        }

        setValidationError(newErrors);
        return valid;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        const payload = {
            entryId: selectedEntry.id,
            selection: selectedTeam,
            wager: Number(wager)
        };

        let submitError = {message: "Pick submitted successfully.", severity: "success"};
        try {
            await submitPickRestCall(payload);
            // Refresh MyGamesPage
            onPickSubmitted();
        } catch (err) {
            submitError.message = err.message;
            submitError.severity = "error";
        }finally{
            setValidationError(submitError);
        }
    };


    return (
            <Paper elevation={4} sx={{p: 4, borderRadius: 4, mb: 4}}>
                <Box sx={{display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1}}>
                    <Typography variant="h6">🏈 Week {currentWeek} Matchup</Typography>
                    <Chip size="small" label={`Balance: ${pickControl.total} pts`} color="success" variant="outlined"/>
                    <Typography variant="h6" sx={{mb: 2}}>
                        Deadline: <strong>{pickControl.deadline}</strong>
                    </Typography>
                </Box>
                <TextField
                    select
                    fullWidth
                    label="Select Winner"
                    value={selectedTeam || ""}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    sx={{ mb: 2 }}
                >
                    {[
                        { team: currentGame.away_team, team_ext_id: currentGame.away_ext_id },
                        { team: currentGame.home_team, team_ext_id: currentGame.home_ext_id }
                    ].map(({ team, team_ext_id }) => (
                        <MenuItem key={team} value={team}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <img
                                    src={getTeamLogoUrl(team_ext_id,currentGame.sport)}
                                    alt={team}
                                    style={{ width: 28, height: 28, borderRadius: "4px" }}
                                />
                                <Typography>{team}</Typography>
                            </Box>
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    type="number"
                    fullWidth={isMobile}
                    label="Wager Amount"
                    value={wager}
                    onChange={(e) => setWager(e.target.value)}
                    inputProps={{
                        min: 1,
                        max: pickControl.total
                    }}
                    error={validationError.severity === "error"}
                    helperText={validationError.severity === "error" ? validationError.message : ""}
                    sx={{
                        mb: 3,
                        width: isMobile ? "100%" : "200px",
                    }}
                />

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    sx={{
                        width: isMobile ? "100%" : "200px",
                    }}
                >
                    Submit Pick
                </Button>

                {validationError.message && validationError.severity !== "error" && (
                    <Alert severity={validationError.severity} sx={{ mt: 2 }}>
                        {validationError.message}
                    </Alert>
                )}
            </Paper>
    );
};

export default PickSelectionForm;
