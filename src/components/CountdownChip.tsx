import React, {useEffect, useMemo, useState} from "react";
import {Chip, Tooltip} from "@mui/material";

/* -------------------------------- Helpers -------------------------------- */

const formatCountdown = (deadline: string | number) => {
    const now = Date.now();
    const end = new Date(deadline).getTime();
    const diffMs = end - now;

    if (diffMs <= 0) return "Closed";

    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);

    return parts.join(" ");
};

const formatExactDateTime = (deadline: string | number) =>
    new Date(deadline).toLocaleString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
    });

/* -------------------------------- Props ---------------------------------- */

export interface CountdownChipProps {
    deadline: string | number;
    labelPrefix?: string;
    hideWhenExpired?: boolean;
    updateIntervalMs?: number;
}

/* ------------------------------- Component -------------------------------- */

const CountdownChip: React.FC<CountdownChipProps> = ({
                                                         deadline,
                                                         labelPrefix = "Deadline",
                                                         hideWhenExpired = false,
                                                         updateIntervalMs = 60_000,
                                                     }) => {
    const [countdown, setCountdown] = useState(() =>
        formatCountdown(deadline)
    );

    useEffect(() => {
        const update = () => setCountdown(formatCountdown(deadline));

        update();
        const interval = setInterval(update, updateIntervalMs);

        return () => clearInterval(interval);
    }, [deadline, updateIntervalMs]);

    const isExpired = countdown === "Closed";

    const color = useMemo(() => {
        if (isExpired) return "error";

        const daysMatch = countdown.match(/^(\d+)d/);
        const days = daysMatch ? Number(daysMatch[1]) : 0;

        if (days === 0) return "error";
        if (days === 1) return "warning";
        return "success";
    }, [countdown, isExpired]);

    if (hideWhenExpired && isExpired) return null;

    return (
        <Tooltip
            title={`Closes: ${formatExactDateTime(deadline)}`}
            arrow
            enterTouchDelay={400}   // long-press delay
            leaveTouchDelay={4000}  // stay visible long enough to read
            enterDelay={300}        // desktop hover delay
        >
            <Chip
                label={`${labelPrefix}: ${countdown}`}
                color={color}
                variant={isExpired ? "filled" : "outlined"}
                sx={{fontWeight: "bold"}}
            />
        </Tooltip>
    );
};

export default CountdownChip;
