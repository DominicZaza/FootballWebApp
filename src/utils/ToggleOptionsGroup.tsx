import React, { useEffect, useState } from "react";
import { ToggleButtonGroup } from "@mui/material";
import { ToggleButtonRenderer } from "./ToggleButtonRenderer";

/**
 * Represents one toggle config passed into the reusable group
 */
export interface ToggleOption {
    key: string;              // unique ID for this toggle
    label: string;            // display text
    icon: React.ElementType;  // MUI icon component
    default?: boolean;        // default ON/OFF if localStorage empty
}

interface ToggleOptionsGroupProps {
    id: string; // used for localStorage key (e.g. "myGames", "adminPanel", etc.)
    options: ToggleOption[];
    onChange: (enabledKeys: string[]) => void; // passes back active toggles
    height?: number;
    initialValues?: string[]; // override initial load (optional)
}

export const ToggleOptionsGroup = ({
                                       id,
                                       options,
                                       onChange,
                                       height = 56,
                                       initialValues
                                   }: ToggleOptionsGroupProps) => {

    const storageKey = `togglePrefs_${id}`;

    const getDefaultState = () =>
        options.filter(o =>
            initialValues?.includes(o.key) ||
            (!initialValues && o.default)
        ).map(o => o.key);

    const [activeToggleState, setActiveToggleState] = useState<string[]>(getDefaultState);

    // Load saved prefs
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                setActiveToggleState(JSON.parse(saved));
            } catch {
                setActiveToggleState(getDefaultState());
            }
        } else {
            setActiveToggleState(getDefaultState());
        }
    }, []);

    // Notify parent after the initial load or whenever toggles change
    useEffect(() => {
        onChange(activeToggleState);
    }, [activeToggleState]);

    // When toggles change
    const handleToggleChange = (_event, newValues: string[]) => {
        if (!newValues) return;

        setActiveToggleState(newValues);

        localStorage.setItem(storageKey, JSON.stringify(newValues));
        onChange(newValues);
    };

    return (
        <ToggleButtonGroup
            value={activeToggleState}
            onChange={handleToggleChange}
            aria-label="Toggle options"
            sx={{ height, borderRadius: 2, boxShadow: 1 }}
        >
            {options.map(opt => (
                <ToggleButtonRenderer
                    toggleKey={opt.key}
                    toggleName={opt.label}
                    Icon={opt.icon}
                    showToggle={activeToggleState.includes(opt.key)}
                />
            ))}
        </ToggleButtonGroup>
    );
};
