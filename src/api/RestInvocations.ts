import {useZAppContext} from "../components/AppContextProvider";
import {
    GameRankDTO,
    PickDTO,
    TeamWinRecordDTO,
    TeamWinStreakDTO,
    AssignedGameDTO,
    ApplicationSettingsDTO,
    GameScoreDTO,
    TotalDTO,
    ProfileDTO,
    EntryDTO,
    SeasonDTO,
    LeaderBoardDTO
} from "../types/ZTypes";


export const useRestApi = () => {
    const {authUser} = useZAppContext();


// Get the base URL from the current origin
    const getBaseServerURL = () => {
        const {protocol, hostname} = window.location;
        const serverPort=8082;
        return `${protocol}//${hostname}:${serverPort}`;
    };
    const getBaseApiURL = () => {
        return getBaseServerURL()+`/api/v1`;
    };
    const getBaseImageUrl = (logo) => {
        return getBaseServerURL() + `/images/`+logo;
    };
    const getWebSocketEndpoint = () => {
        return getBaseServerURL()+`/zazafootballpool-websocket`;
    };


// Generic function to make REST calls
     const makeRestCall = async (endpoint, method = 'GET', body = null) => {

    if (!authUser) return;



        const url = `${getBaseApiURL()}${endpoint}`;
        const token = await authUser.getIdToken();

        const headers = {
            'Content-Type': 'application/json',
        };

        headers['Authorization'] = `Bearer ${token}`;

        const options = {
            method,
            headers,
        };

        if (body && method !== 'GET') {
            options.body = body;
        }

            const response = await fetch(url, options);

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`${errorBody.detail || 'Error'}: ${response.statusText}`);
            }

            if (method === 'GET') // no data returned
               return await response.json();
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
     const getCurrentWeekRestCall = async (): Promise<ApplicationSettingsDTO> => {
        return await makeRestCall('/settings');
    };

    const getMyAccountBalanceRestCall = async () => {
        return await makeRestCall('/account/balances/me');
    };

    const getMyAccountDetailRestCall = async () => {
        return await makeRestCall('/account/detail');
    };

    const getTeamRankingsRestCall = async (season) => {
        return await makeRestCall(`/teamranking/all/${season}`);
    };

    const saveTeamRankingsRestCall = async (rankings) => {
        const body = JSON.stringify(rankings);
        await makeRestCall(`/teamranking/`, 'POST', body);
    };

    const snapCompletedGameScoresRestCall = async (season,week) => {
        await makeRestCall(`/games/snapCompletedGames/sport/americanfootball_nfl/season/${season}/week/${week}`, 'PUT');
    };

    const getAllSeasonsRestCall = async (): Promise<SeasonDTO[]> => {
        return await makeRestCall(`/season`);
    };
    const getGameScoresRestCall = async (sport, season, week): Promise<GameScoreDTO[]> => {
        return await makeRestCall(`/gamescores/sport/${sport}/season/${season}/week/${week}`);
    }
    const getGameScoresByGamesRestCall = async (listOfGames: number[]): Promise<GameScoreDTO[]> => {
        return await makeRestCall(`/gamescores/games/${listOfGames.join(',')}`);
    }
    const getTeamWinStreaksRestCall = async (sport: String, season:number, week:number): Promise<TeamWinStreakDTO[]> => {
        return await makeRestCall(`/team/streaks/sport/${sport}/season/${season}/week/${week}`);
    }
    const getTeamRecordsRestCall = async (sport: String, season: number, week: number): Promise<TeamWinRecordDTO[]> => {
        return await makeRestCall(`/team/records/sport/${sport}/season/${season}/week/${week}`);
    }
     const getGameRanksRestCall = async (sport: string, season: number, week: number): Promise<GameRankDTO[]> => {
        return await makeRestCall(`/games/rankings/sport/${sport}/season/${season}/week/${week}`);
    };

    const getGameRanksByGamesRestCall = async (listOfGames: number[]): Promise<GameRankDTO[]> => {
        return await makeRestCall(`/games/rankings/games/${listOfGames.join(',')}`);
    };

    const getAssignedGamesRestCall = async (entryId: number): Promise<AssignedGameDTO[]> => {
        return await makeRestCall(`/assignedgame/entry/${entryId}`);
    };
    const getPicksByEntryAndSeasonRestCall = async (entryId: number, seasonId: number): Promise<PickDTO[]> => {
        return await makeRestCall(`/picks/season/${seasonId}/entry/${entryId}`);
    };
    const getEntryTotalsByEntryRestCall = async (entry: number): Promise<TotalDTO[]> => {
        return await makeRestCall(`/totals/entry/${entry}`);
    };

    const getLeaderboardByPoolInstanceAndWeek = async (poolInstanceId: number,week: number): Promise<LeaderBoardDTO[]> => {
        return await makeRestCall(`/totals/leader/pool/${poolInstanceId}/week/${week}`);
    };


    return {
        getProfileRestCall,
        loginRestCall,
        logoutRestCall,
        getEntriesRestCall,
        getCurrentWeekRestCall,
        getMyAccountBalanceRestCall,
        getMyAccountDetailRestCall,
        getTeamRankingsRestCall,
        saveTeamRankingsRestCall,
        getBaseImageUrl,
        getAllSeasonsRestCall,
        getGameScoresRestCall,
        getGameScoresByGamesRestCall,
        getWebSocketEndpoint,
        snapCompletedGameScoresRestCall,
        getTeamWinStreaksRestCall,
        getTeamRecordsRestCall,
        makeRestCall,
        getGameRanksRestCall,
        getAssignedGamesRestCall,
        getGameRanksByGamesRestCall,
        getPicksByEntryAndSeasonRestCall,
        getEntryTotalsByEntryRestCall,
        getLeaderboardByPoolInstanceAndWeek
     };

};