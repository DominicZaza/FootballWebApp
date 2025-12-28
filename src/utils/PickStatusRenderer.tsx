import React from "react";
import Chip from "@mui/material/Chip";

export const PickStatusRenderer = ({
                                       pickStatus
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


    const statusMap = {
        Won: {label: "Win", color: "success", variant: "outlined"},
        Lost: {label: "Loss", color: "error", variant: "outlined"},
        Push: {label: "Push", color: "warning", variant: "outlined"},
        Penalty: {label: "Penalty", color: "warning", variant: "outlined"},
        Locked: {label: "Locked", color: undefined, variant: "outlined"},
        Pending: {label: "Pending", color: undefined, variant: "outlined"},
    };

    const status = statusMap[pickStatus];
    if (!status) return null;

    if (useChip ) {
        return (
            <Chip
                size="small"
                label={status.label}
                color={status.color}
                variant={status.variant}
            />
        );
    }
    return status.label;
};
