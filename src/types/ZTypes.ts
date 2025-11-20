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
    logo: string;
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

export interface TeamWinStreakDTO {
    team_id: number;
    season: number;
    week: number;
    sport: string;
    team_name: string;
    streakType: string;
    streakLength: number;
}

export interface TeamWinRecordDTO {
    team_id: number;
    season: number;
    week: number;
    sport: string;
    team_name: string;
    wins: number;
    losses: number;
    draws: number;
}

export interface GameScoreDTO {
    id: number;
    gameDTO: GameDTO;
    home_score: number;
    away_score: number;
    completed: boolean;
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
    total: number;
    wins: number;
    losses: number;
    ties: number;
    penalties: number;
    current_streak_type: string;
    current_streak: number;
    rank: number;
    rankLastWeek: number;
    away_team: string;
    commence_time: string;
    home_rank: number;
    away_rank: number;
    home_logo: string;
    away_logo: string;
    rankType: string;
}

