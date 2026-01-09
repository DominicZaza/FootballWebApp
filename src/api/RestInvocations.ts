import {useZAppContext} from "../components/AppContextProvider";
import type {
    GameRankDTO,
    ProfileDTO,
    EntryDTO,
    SeasonDTO,
    LeaderBoardDTO, WeeklyPicksPageDTO, MyGamesPageResponse, PickSubmission, PickemSubmission, GameScoresPageResponse,
    TeamsForScorePageResponse, TeamRankingDTO, WeeklyPickemCardDTO, SeasonWeekDTO, MyPickemsGamesDTO, MyPickemsPageDTO
} from "../types/ZTypes";

export const getTeamLogoUrl = (
    ext_id: string,sport: string) => {
    let sportUrl='nfl';
    if (sport==='americanfootball_ncaaf') sportUrl='ncaa';
    return "https://a.espncdn.com/i/teamlogos/"+sportUrl+"/500/" + ext_id + ".png";
};


export const useRestApi = () => {
    const {authUser} = useZAppContext();

    const getBaseApiURL = () => {
        return import.meta.env.VITE_ZAZA_API_URL+`/api/v1`;
    };
    const getWebSocketEndpoint = () => {
        return import.meta.env.VITE_ZAZA_API_URL+`/ws`;
    };


// Generic function to make REST calls
     const makeRestCall = async (endpoint:string, method = 'GET', body:string|null = null) => {

         if (!authUser) {
             throw new Error(`authUser is not set; cannot call API endpoint: ${endpoint}`);
         }


        const url = `${getBaseApiURL()}${endpoint}`;
        const token = await authUser.getIdToken();

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const options = {
            method,
            headers,
            body
        };

        if (body && method !== 'GET') {
            options.body = body;
        }

            const response = await fetch(url, options);

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`${errorBody.detail || 'Error'}: ${response.statusText}`);
            }

         // ---- Handle NO BODY cases ----
         // Case 1: HTTP 204 No Content
         if (response.status === 204) {
             return null;
         }

         // Case 2: Content-Length = 0
         const contentLength = response.headers.get('content-length');
         if (contentLength === '0') {
             return null;
         }

         // Case 3: Attempt JSON; catch empty response
         try {
             return await response.json();
         } catch (_) {
             return null;
         }
     };

     const loginRestCall = async () => {
        return await makeRestCall('/login', 'POST');
    };
    const getProfileRestCall = async () : Promise<ProfileDTO> => {
        return await makeRestCall('/profile');
    };

     const logoutRestCall = async () => {
        return await makeRestCall('/logout', 'POST');
    };
     const getEntriesRestCall = async () : Promise<EntryDTO[]> => {
        return await makeRestCall('/entries');
    };
     const getCurrentWeekRestCall = async (): Promise<number> => {
        return await makeRestCall('/settings/currentWeek');
    };

    const getCurrentSeasonRestCall = async (): Promise<number> => {
        return await makeRestCall('/settings/currentSeason');
    };

    const getCurrentPeriodRestCall = async (): Promise<string> => {
        return await makeRestCall('/settings/currentPeriod');
    };

    const getMyAccountBalanceRestCall = async () => {
        return await makeRestCall('/account/balances/me');
    };

    const getMyAccountDetailRestCall = async () => {
        return await makeRestCall('/account/detail');
    };

    const getTeamRankingsRestCall = async (season:string): Promise<TeamRankingDTO[]> => {
        return await makeRestCall(`/teamranking/all/${season}`);
    };

    const saveTeamRankingsRestCall = async (rankings: TeamRankingDTO[]) => {
        const body = JSON.stringify(rankings);
        await makeRestCall(`/teamranking/`, 'POST', body);
    };

    const snapCompletedGameScoresRestCall = async (sport:string, season:string,week:string): Promise<string> => {
        return await makeRestCall(`/games/snapCompletedGames/sport/${sport}/season/${season}/week/${week}`, 'PUT');
    };

    const snapCompletedGameOddsRestCall = async (season:string,week:string): Promise<string> => {
        return await makeRestCall(`/games/snapGameOdds/season/${season}/week/${week}`, 'PUT');
    };

    const getAllSeasonsRestCall = async (): Promise<SeasonDTO[]> => {
        return await makeRestCall(`/season`);
    };
    const getGameScoresByWeekRestCall = async (sport:string, season:number, week:number): Promise<GameScoresPageResponse> => {
        return await makeRestCall(`/gamescores/sport/${sport}/season/${season}/week/${week}`);
    }
    const getMyPickemsByEntrySeasonPeriod = async ( entryId: number, season:number, period:number): Promise<MyPickemsPageDTO> => {
        return await makeRestCall(`/pickem/entry/${entryId}/season/${season}/period/${period}`);
    }

    const getTeamsAndWeeksBySportAndSeasonRestCall = async (sport:string,season:string): Promise<TeamsForScorePageResponse> => {
        return await makeRestCall(`/gamescores/teams/sport/${sport}/season/${season}`);
    };

    const getGameRanksByGamesRestCall = async (listOfGames: number[]): Promise<GameRankDTO[]> => {
        return await makeRestCall(`/games/rankings/games/${listOfGames.join(',')}`);
    };

    const getMyGamesPageRestCall = async (entryId: number): Promise<MyGamesPageResponse> => {
        return await makeRestCall(`/picks/entry/${entryId}`);
    };

    const getLeaderboardByPoolInstanceAndWeek = async (poolInstanceId: number,week: number): Promise<LeaderBoardDTO[]> => {
        return await makeRestCall(`/totals/leader/pool/${poolInstanceId}/week/${week}`);
    };
    const getWeeklyPicksByPoolInstanceAndWeekRestCall = async (poolInstanceId: number,week: number): Promise<WeeklyPicksPageDTO> => {
        return await makeRestCall(`/picks/${poolInstanceId}/week/${week}`);
    };
    const getWeeklyPickemByPoolInstanceAndPeriodRestCall = async (poolInstanceId: number,period: string): Promise<WeeklyPickemCardDTO[]> => {
        return await makeRestCall(`/pickems/poolInstanceId/${poolInstanceId}/period/${period}`);
    };
    const rollWeekRestCall = async (): Promise<string> => {
        return await makeRestCall(`/games/rollWeek`, 'PUT');
    };
    const submitPickRestCall = async (pick: PickSubmission): Promise<string> => {
        return await makeRestCall(`/picks/submit`, 'POST',JSON.stringify(pick));
    };
    const createPlayoffGamesForSportRestCall = async (sport: string): Promise<string> => {
        return await makeRestCall(`/games/downloadPlayoffGames/sport/${sport}`, 'PUT');
    };
    const getSeasonWeekPeriodsBySeasonAndPoolTypeIdRestCall = async (season: number, poolTypeId: number): Promise<SeasonWeekDTO[]> => {
        return await makeRestCall(`/seasonweek/season/${season}/poolType/${poolTypeId}`, 'GET');
    };

    const togglePrimetimeRestCall = async (gameId: number): Promise<string> => {
        return await makeRestCall(`/games/togglePrimetime/${gameId}`, 'PUT');
    };
    const toggleExceptionRestCall = async (gameId: number): Promise<string> => {
        return await makeRestCall(`/games/toggleException/${gameId}`, 'PUT');
    };
    const updateGameDateTimesRestCall = async ( season: number, week: number): Promise<string> => {
        return await makeRestCall(`/games/updateGameDateTimes/season/${season}/week/${week}`, 'PUT');
    };


    const submitPickemRestCall = async (entryId: number, gameId: number, pick: string, removeExisting: boolean, period: number): Promise<string> => {
        const payload = {
            entryId: entryId,
            gameId: gameId,
            pick: pick,
            removeExisting: removeExisting,
            period: period
        };

        return await makeRestCall(`/pickem/submitPick`, 'POST',JSON.stringify(payload));
    };


    return {
        getProfileRestCall,
        loginRestCall,
        logoutRestCall,
        getEntriesRestCall,
        getCurrentWeekRestCall,
        getCurrentSeasonRestCall,
        getCurrentPeriodRestCall,
        getMyAccountBalanceRestCall,
        getMyAccountDetailRestCall,
        getTeamRankingsRestCall,
        saveTeamRankingsRestCall,
        getAllSeasonsRestCall,
        getGameScoresByWeekRestCall,
        getWebSocketEndpoint,
        snapCompletedGameScoresRestCall,
        snapCompletedGameOddsRestCall,
        makeRestCall,
        getTeamLogoUrl,
        getGameRanksByGamesRestCall,
        getLeaderboardByPoolInstanceAndWeek,
        getWeeklyPicksByPoolInstanceAndWeekRestCall,
        rollWeekRestCall,
        getMyGamesPageRestCall,
        submitPickRestCall,
        getTeamsAndWeeksBySportAndSeasonRestCall,
        createPlayoffGamesForSportRestCall,
        getWeeklyPickemByPoolInstanceAndPeriodRestCall,
        getSeasonWeekPeriodsBySeasonAndPoolTypeIdRestCall,
        getMyPickemsByEntrySeasonPeriod,
        togglePrimetimeRestCall,
        toggleExceptionRestCall,
        submitPickemRestCall,
        updateGameDateTimesRestCall
     };

};