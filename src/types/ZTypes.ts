export interface ProfileDTO {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    stamp: string;
    admin: boolean;
    referredBy: string;
}

export interface TeamDTO {
    id: number;
    sport: string;
    name: string;
    stamp: string;
    ext_id: string;
}

export interface GameDTO {
    id: number;
    season: number;
    week: number;
    sport: string;
    home_team: TeamDTO;
    away_team: TeamDTO;
    commence_time: string;
    stamp: string;
}

export interface AssignedGameDTO {
    id: number;
    entryId: number;
    gameDTO: GameDTO;
}

export interface GameRankDTO {
    sport: string;
    season: number;
    week: number;
    rankAsOfWeek: number;
    gameId: number;
    homeTeamId: number;
    awayTeamId: number;
    homeTeam: string;
    awayTeam: string;
    homeRank: number;
    awayRank: number;
    rankType: "Difficult" | "Hard" | "Medium" | "Easy";
}

export interface ApplicationSettingsDTO {
    id: number;
    season: number;
    week: number;
    stamp: string;
}


export interface PickDTO {
    id: number;
    assignment_id: number;
    pick: number;
    wager: number;
    status: string;
    stamp: string;
}

export interface TotalDTO {
    id: number;
    entry_id: number;
    week: number;
    net: number;
    total: number;
    stamp: string;
}

export interface SeasonDTO {
    id: number;
    name: string;
    stamp: string;
}

export interface EntryDTO {
    id: number;
    profile_id: string;
    entry_name: string;
    pool_instance_id: number;
    season: number;
    poolName: string;
    denomination: number;
    stamp: string;
}

export interface LeaderBoardDTO {
    entryId: number;
    entryName: string;
    current_balance: number;
    game_is_pending: boolean;
    wins: number;
    losses: number;
    ties: number;
    penalties: number;
    current_streak_type: string;
    current_streak: number;
    rank: number;
    rankLastWeek: number;
    sport: string;
    home_team: string;
    away_team: string;
    commence_time: string;
    home_rank: number;
    away_rank: number;
    home_ext_id: string;
    away_ext_id: string;
    rankType: string;
}

export interface WeeklyPicksPageDTO {
    entryId: number;
    entryName: string;
    current_balance: number;
    wins: number;
    losses: number;
    ties: number;
    penalties: number;
    current_streak_type: string;
    current_streak: number;
    home_team: string;
    away_team: string;
    commence_time: string;
    home_rank: number;
    away_rank: number;
    home_ext_id: string;
    away_ext_id: string;
    home_score: number;
    away_score: number;
    game_completed: boolean;
    pick: number;
    wager: number;
    pickStatus: string;
    gameWinner: string;
    rankType: string;
}


export interface  GameScorePageDTO{
     game_id: number,
     home_team_id: number, home_team_ext_id: string, home_team_name: string,
     away_team_id: number, away_team_ext_id: string, away_team_name: string,
     commence_time: string,
     home_rank_current: number,home_rank_prior: number , home_rank_delta: number,home_rank_preseason: number,
     away_rank_current: number, away_rank_prior: number, away_rank_delta: number,away_rank_preseason: number,
     home_score: number, away_score:number , completed: boolean,
     home_wins: number, home_losses: number, home_ties:number,home_current_streak: string,
     away_wins: number, away_losses: number, away_ties:number,away_current_streak: string,
     rank_type: string, home_team_spread: string, over_points: string, bookmaker_stamp: string

}

export interface  MyGamesPageDTO{
        week: number,
        weekly_balance: number,
        opening_balance: number,
        overall_total: number,
        wins: number,
        losses: number,
        ties: number,
        penalties: number,
        pickStatus: string,
        current_streak: string,
        home_team: string,
        away_team: string,
        commence_time: string,
        home_rank: number,
        away_rank: number,
        home_ext_id: string,
        away_ext_id: string,
        home_score: number,
        away_score: number,
        game_completed: boolean,
        pick: string,
        wager: number,
        gameWinner: string,
        rankType: string
        sport: string

}
export interface PickControl {
    total: number;
    pickAllowed: boolean;
    deadline: string;
}
export interface MyGamesPageResponse {
    records: MyGamesPageDTO[],
    control: PickControl
}
export interface GameScoresPageResponse {
    records: GameScorePageDTO[]
}
export interface TeamsForScorePageResponse {
    teams: TeamDTO[]
    maxWeekAvailable: number
}




export interface PickSubmission {
    entryId: number;
    selection: string;
    wager: number;
}
