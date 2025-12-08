import React from "react";
import {Box, Tooltip} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const HeaderWithTooltip = ({
                               label,
                               tooltip,
                               iconSize = 18,
                               iconColor = "action.active",
                           }) => {
    return (
        <Tooltip title={tooltip} arrow placement="top">
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    cursor: "help",
                    width: "fit-content",
                }}
            >
                {label}
                <InfoOutlinedIcon sx={{fontSize: iconSize, color: iconColor}}/>
            </Box>
        </Tooltip>
    );
};

export default HeaderWithTooltip;
