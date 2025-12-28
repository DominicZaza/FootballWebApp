import React from "react";
import Tooltip from "@mui/material/Tooltip";
import ToggleButton from "@mui/material/ToggleButton";

type ToggleButtonRendererProps = {
    showToggle: boolean;
    toggleName: string;
    toggleKey: string;
    Icon: React.ElementType;
    imgSrc?: string;        // 👈 optional override
    imgAlt?: string;
};

export const ToggleButtonRenderer = ({
                                         showToggle,
                                         toggleName,
                                         toggleKey,
                                         Icon,
                                         imgSrc,
                                         imgAlt,
                                     }: ToggleButtonRendererProps) => {
    return (
        <Tooltip title={showToggle ? `Hide ${toggleName}` : `Show ${toggleName}`}>
            <ToggleButton
                value={toggleKey}
                aria-label={toggleKey}
                sx={(theme) => ({
                    px: 2,
                    py: 1,
                    minWidth: 48,
                    position: "relative",
                    overflow: "visible",
                    borderRadius: 1.5,
                    transition: "all 0.16s ease",

                    "&:hover": {
                        bgcolor: "action.hover",
                    },

                    // 🔵 Selected state — ribbon only
                    "&.Mui-selected, &.Mui-selected:hover": {
                        bgcolor: "transparent",
                        color: "inherit",

                        "&::after": {
                            content: '""',
                            position: "absolute",
                            top: 0,
                            right: 0,
                            width: 0,
                            height: 0,
                            borderTop: `20px solid ${theme.palette.primary.main}`,
                            borderLeft: "20px solid transparent",
                            zIndex: 5,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                        },

                        "& > *": {
                            zIndex: 10,
                            position: "relative",
                        },
                    },
                })}
            >
                {imgSrc ? (
                    <img
                        src={imgSrc}
                        alt={imgAlt ?? toggleName}
                        style={{
                            width: 20,
                            height: 20,
                            opacity: showToggle ? 1 : 0.6,
                        }}
                    />
                ) : (
                    <Icon color={showToggle ? "primary" : "action"} />
                )}
            </ToggleButton>
        </Tooltip>
    );
};
