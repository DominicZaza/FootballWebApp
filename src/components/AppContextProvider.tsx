import { createContext, useContext, useEffect, useState} from 'react';
import type {SeasonDTO, EntryDTO} from "../types/ZTypes";
import type {ZAppContextType} from "../types/ZAppContextType";

const AppContext = createContext<ZAppContextType | undefined>(undefined);


export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {


    const [entries, setEntries] =  useState<EntryDTO[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<EntryDTO | null>(null);
    const [authUser, setAuthUser] = useState(null);
    const [seasons, setSeasons] = useState<SeasonDTO[]>([]);
    const [currentWeek, setCurrentWeek ] = useState<number>(0);
    const [currentSeason, setCurrentSeason ] = useState<number>(0);
    const [currentPeriod, setCurrentPeriod ] = useState<string | null>(null);
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

    return (
        <AppContext.Provider
            value={{
                entries,
                setEntries,
                selectedEntry,
                setSelectedEntry,
                authUser,
                setAuthUser,
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
                setSeasons,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};


export const useZAppContext = (): ZAppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useZAppContext must be used within an AppProvider');
    }
    return context;
};


