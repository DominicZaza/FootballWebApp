import React, {createContext, useContext, useEffect, useState} from 'react';
import {onAuthStateChanged} from 'firebase/auth';
import {auth} from './firebase';
import {SeasonDTO, EntryDTO} from "../types/ZTypes";

const AppContext = createContext();

export const AppProvider = ({children}) => {

    const [entries, setEntries] =  useState<EntryDTO[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<EntryDTO>(null);
    const [authUser, setAuthUser] = useState(null);
    const [seasons, setSeasons] = useState<SeasonDTO[]>([]);
    const [currentWeek, setCurrentWeek ] = useState<number>(0);
    const [currentSeason, setCurrentSeason ] = useState<number>(0);
    const [currentPeriod, setCurrentPeriod ] = useState<string>(null);
    const [accountBalance, setAccountBalance ] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);



    /*  mobile device check */
    useEffect(() => {
        const checkIfMobile = () => setIsMobile(window.innerWidth < 768);
        checkIfMobile(); // run on mount
        window.addEventListener('resize', checkIfMobile);
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setAuthUser(currentUser);
            } else {
                setAuthUser(null);
                setIsAdmin(false);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <AppContext.Provider
            value={{
                entries,
                setEntries,
                selectedEntry,
                setSelectedEntry,
                authUser,
                setUserProfile: setAuthUser,
                currentWeek,
                setCurrentWeek,
                currentSeason,
                setCurrentSeason,
                currentPeriod,
                setCurrentPeriod,
                accountBalance,
                setAccountBalance,
                isAdmin,
                setIsAdmin,
                isMobile,
                seasons,
                setSeasons
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useZAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
