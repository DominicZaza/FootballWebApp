import {TeamWinStreakDTO, GameScoreDTO, TeamWinRecordDTO, PickDTO, TotalDTO} from "./ZTypes";

export interface TeamWinStreaksUpdatedEvent {
    teamWinStreaks: TeamWinStreakDTO[];
    sport: string;
    season: number;
    week: number;
}

export interface GameScoreSavedEvent {
    gameScores: GameScoreDTO[];
    sport: string;
    season: number;
    week: number;
}

export interface TeamWinRecordsUpdatedEvent {
    teamWinRecords: TeamWinRecordDTO[];
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
