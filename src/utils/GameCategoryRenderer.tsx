import React from "react";
import {Chip} from "@mui/material";

export const GameCategoryRenderer = ({rankType, homeRank, awayRank}) => {
    let colorCalculated={
        Difficult: "error",
            Hard: "warning",
            Medium: "info",
            Easy: "success",
    }[rankType];

    return (
        <Chip
            label={`${rankType} (${awayRank} vs ${homeRank})`}
            color={colorCalculated}
            size="small"
            variant="outlined"
        />
    );
};
