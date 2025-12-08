import React from "react";
import {Box} from "@mui/material";

export const WagerRenderer = ({
                                  wager, pickStatus
                              }) => {
    let prefix = "";

    if (pickStatus === "Won") {
        prefix = "+";
    } else if (pickStatus === "Lost" || pickStatus === "Penalty") {
        prefix = "-";
    }

    return (
        <Box component="span">
            {prefix}{wager}
        </Box>
    );
};
