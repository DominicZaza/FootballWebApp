import type { User } from 'firebase/auth';
import type { SeasonDTO, EntryDTO } from "./ZTypes";
import React from "react";

export interface ZAppContextType {
    entries: EntryDTO[];
    setEntries: React.Dispatch<React.SetStateAction<EntryDTO[]>>;

    selectedEntryId: string | null;
    setSelectedEntryId: React.Dispatch<React.SetStateAction<string | null>>;

    authUser: User | null;
    setAuthUser: React.Dispatch<React.SetStateAction<User | null>>;

    currentWeek: number;
    setCurrentWeek: React.Dispatch<React.SetStateAction<number>>;

    currentSeason: number;
    setCurrentSeason: React.Dispatch<React.SetStateAction<number>>;

    currentPeriod: string | null;
    setCurrentPeriod: React.Dispatch<React.SetStateAction<string | null>>;

    accountBalance: number | null;
    setAccountBalance: React.Dispatch<React.SetStateAction<number | null>>;

    isAdmin: boolean;
    setIsAdmin: React.Dispatch<React.SetStateAction<boolean>>;

    isMobile: boolean;

    seasons: SeasonDTO[];
    setSeasons: React.Dispatch<React.SetStateAction<SeasonDTO[]>>;
}
