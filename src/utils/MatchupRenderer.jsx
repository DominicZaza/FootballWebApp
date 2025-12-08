import React from "react";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import {getTeamLogoUrl} from "../api/RestInvocations.ts";



export const MatchupRenderer = ({
                             awayName,
                             away_ext_id,
                             homeName,
                             home_ext_id,
                             pick,
                             pickStatus, sport
                         }) => {

    // Map pickStatus → MUI Chip styling
    const chipColorMap = {
        Won: "success",
        Lost: "error",
        Push: "warning",
        Penalty: "warning",
    };

    // Only chip if pickStatus is meaningful (not null, not Locked)
    const useChip = pickStatus && pickStatus !== "Locked";

    // Chip color based on status (undefined = default gray)
    const chipColor = chipColorMap[pickStatus];

    // Renders either text OR chip, depending on conditions
    const renderTeamName = (teamName) => {
        // Only the picked team gets a chip
        if (useChip && pick === teamName) {
            return (
                <Chip
                    label={teamName}
                    size="small"
                    variant="outlined"
                    color={chipColor}
                />
            );
        }
        return teamName;
    };

    return (
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
            {away_ext_id && (
                <img
                    src={getTeamLogoUrl(away_ext_id,sport)}
                    alt={`${awayName} logo`}
                    style={{
                        height: "2.2rem",
                        width: "auto",
                        objectFit: "contain",
                    }}
                />
            )}

            {renderTeamName(awayName)}

            {" @ "}

            {home_ext_id && (
                <img
                    src={getTeamLogoUrl(home_ext_id,sport)}
                    alt={`${homeName} logo`}
                    style={{
                        height: "2.2rem",
                        width: "auto",
                        objectFit: "contain",
                    }}
                />
            )}

            {renderTeamName(homeName)}
        </Box>
    );
};
