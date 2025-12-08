import {
    PickDTO,
    TotalDTO,
    LeaderBoardDTO,
    GameScorePageDTO
} from "./ZTypes";

export interface GameScoreSavedEvent {
    gameScores: GameScorePageDTO[];
    sport: string;
    season: number;
    week: number;
}


export interface PickStatusUpdatedEvent {
    pickRecords: PickDTO[];
    sport: string;
    season: number;
    week: number;
}
export interface EntryTotalUpdatedEvent {
    totalsUpdated: TotalDTO[];
    totalsToRemove: number[];
    season: number;
    week: number;
}
export interface LeaderboardUpdateEvent {
    totalsUpdated: TotalDTO[];
    totalsToRemove: number[];
    season: number;
    week: number;
    poolInstanceId: number;
    leaderBoards: LeaderBoardDTO[];
}
export interface WeekRollEvent {
    season: number;
    week: number;
}
