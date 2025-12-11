import {useZAppContext} from "../components/AppContextProvider";
import {
    GameRankDTO,
    TeamWinRecordDTO,
    TeamWinStreakDTO,
    AssignedGameDTO,
    ApplicationSettingsDTO,
    GameScoreDTO,
    TotalDTO,
    ProfileDTO,
    EntryDTO,
    SeasonDTO,
    LeaderBoardDTO, WeeklyPicksPageDTO, GameScorePageDTO, MyGamesPageResponse, PickSubmission, GameScoresPageResponse,
    TeamsForScorePageResponse
} from "../types/ZTypes";

export const getTeamLogoUrl = (ext_id,sport) => {
    let sportUrl='nfl';
    if (sport==='americanfootball_ncaaf') sportUrl='ncaa';
    return "http://a.espncdn.com/i/teamlogos/"+sportUrl+"/500/" + ext_id + ".png";
};


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

    const getTeamRankingsRestCall = async (season) => {
        return await makeRestCall(`/teamranking/all/${season}`);
    };

    const saveTeamRankingsRestCall = async (rankings) => {
        const body = JSON.stringify(rankings);
        await makeRestCall(`/teamranking/`, 'POST', body);
    };

    const snapCompletedGameScoresRestCall = async (sport, season,week): Promise<string> => {
        return await makeRestCall(`/games/snapCompletedGames/sport/${sport}/season/${season}/week/${week}`, 'PUT');
    };

    const snapCompletedGameOddsRestCall = async (season,week): Promise<string> => {
        return await makeRestCall(`/games/snapGameOdds/season/${season}/week/${week}`, 'PUT');
    };

    const getAllSeasonsRestCall = async (): Promise<SeasonDTO[]> => {
        return await makeRestCall(`/season`);
    };
    const getGameScoresByWeekRestCall = async (sport, season, week): Promise<GameScoresPageResponse> => {
        return await makeRestCall(`/gamescores/sport/${sport}/season/${season}/week/${week}`);
    }
    const getGameScoresByTeamRestCall = async (sport, season, team): Promise<GameScoresPageResponse> => {
        return await makeRestCall(`/gamescores/sport/${sport}/season/${season}/team/${team}`);
    }
    const getTeamsAndWeeksBySportAndSeasonRestCall = async (sport,season): Promise<TeamsForScorePageResponse> => {
        return await makeRestCall(`/gamescores/teams/sport/${sport}/season/${season}`);
    };

    const getGameRanksByGamesRestCall = async (listOfGames: number[]): Promise<GameRankDTO[]> => {
        return await makeRestCall(`/games/rankings/games/${listOfGames.join(',')}`);
    };

    const getAssignedGamesRestCall = async (entryId: number): Promise<AssignedGameDTO[]> => {
        return await makeRestCall(`/assignedgame/entry/${entryId}`);
    };
    const getMyGamesPageRestCall = async (entryId: number): Promise<MyGamesPageResponse> => {
        return await makeRestCall(`/picks/entry/${entryId}`);
    };

    const getLeaderboardByPoolInstanceAndWeek = async (poolInstanceId: number,week: number): Promise<LeaderBoardDTO[]> => {
        return await makeRestCall(`/totals/leader/pool/${poolInstanceId}/week/${week}`);
    };
    const getWeeklyPicksByPoolInstanceAndWeekRestCall = async (poolInstanceId: number,week: number): Promise<WeeklyPicksPageDTO[]> => {
        return await makeRestCall(`/picks/${poolInstanceId}/week/${week}`);
    };
    const rollWeekRestCall = async (): Promise<string> => {
        return await makeRestCall(`/games/rollWeek`, 'PUT');
    };
    const submitPickRestCall = async (pick: PickSubmission): Promise<string> => {
        return await makeRestCall(`/picks/submit`, 'POST',JSON.stringify(pick));
    };
    const createCollegePlayoffGamesRestCall = async (): Promise<string> => {
        return await makeRestCall(`/games/downloadCollegePlayoffGames`, 'PUT');
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
        getGameScoresByTeamRestCall,
        getWebSocketEndpoint,
        snapCompletedGameScoresRestCall,
        snapCompletedGameOddsRestCall,
        makeRestCall,
        getTeamLogoUrl,
        getAssignedGamesRestCall,
        getGameRanksByGamesRestCall,
        getLeaderboardByPoolInstanceAndWeek,
        getWeeklyPicksByPoolInstanceAndWeekRestCall,
        rollWeekRestCall,
        getMyGamesPageRestCall,
        submitPickRestCall,
        getTeamsAndWeeksBySportAndSeasonRestCall,
        createCollegePlayoffGamesRestCall
     };

};