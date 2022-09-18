/* eslint-disable @typescript-eslint/no-explicit-any */
import { DatabaseService } from '@app/services/database/database.service';
import { DATABASE_COLLECTION_CLASSIC, DATABASE_COLLECTION_LOG2990, TOP_5 } from '@app/utils/score-database-contant';
import { Game } from '@common/game';
import { GameMode } from '@common/game-mode';
import { Player } from '@common/player';
import { PlayerScore } from '@common/player-score';
import { Collection } from 'mongodb';
import { Service } from 'typedi';

export const CLASSIC_SCORES: PlayerScore[] = [
    {
        name: 'Bob',
        score: 15,
    },
    {
        name: 'Ronny',
        score: 20,
    },
    {
        name: 'Fiorella',
        score: 35,
    },
    {
        name: 'Konrad',
        score: 10,
    },
    {
        name: 'Aryan',
        score: 25,
    },
];

export const LOG_SCORES: PlayerScore[] = [
    {
        name: 'Samuel',
        score: 15,
    },
    {
        name: 'Michel',
        score: 20,
    },
    {
        name: 'Nicholas',
        score: 35,
    },
    {
        name: 'Catherine',
        score: 10,
    },
    {
        name: 'Pascal',
        score: 25,
    },
];

@Service()
export class ScoreDatabaseService {
    constructor(private dbService: DatabaseService) {}

    async getTopScore(mode: string): Promise<PlayerScore[]> {
        return mode === GameMode.Classic
            ? this.getCollection(GameMode.Classic).find().limit(TOP_5).sort({ score: -1 }).toArray()
            : this.getCollection(GameMode.Log2990).find().limit(TOP_5).sort({ score: -1 }).toArray();
    }

    async addNewGameScore(game: Game) {
        const mode: string = game.mode;
        if (this.isEligibleToBeOnLeaderBoard(game.opponent as Player)) {
            const playerScore: PlayerScore = { name: (game.opponent as Player).name as string, score: (game.opponent as Player).score as number };
            await this.addNewScore(mode, playerScore);
        }
        if (this.isEligibleToBeOnLeaderBoard(game.creator as Player)) {
            const playerScore: PlayerScore = { name: (game.creator as Player).name as string, score: (game.creator as Player).score as number };
            await this.addNewScore(mode, playerScore);
        }
    }

    async resetScore(): Promise<void> {
        await this.getCollection(GameMode.Classic).deleteMany({});
        await this.getCollection(GameMode.Log2990).deleteMany({});
        await this.populateDb();
    }

    async populateDb(): Promise<void> {
        await this.dbService.populateDb(DATABASE_COLLECTION_CLASSIC, CLASSIC_SCORES);
        await this.dbService.populateDb(DATABASE_COLLECTION_LOG2990, LOG_SCORES);
    }

    private getCollection(mode: string): Collection<PlayerScore> {
        return mode === GameMode.Classic
            ? this.dbService.database.collection(DATABASE_COLLECTION_CLASSIC)
            : this.dbService.database.collection(DATABASE_COLLECTION_LOG2990);
    }

    private async addNewScore(mode: string, playerScore: PlayerScore): Promise<void> {
        if (mode === GameMode.Classic) {
            await this.getCollection(mode).insertOne(playerScore);
        } else {
            await this.getCollection(mode).insertOne(playerScore);
        }
    }

    private isEligibleToBeOnLeaderBoard(player: Player): boolean {
        if (!player) return false;
        return !player.hasAbandon && !player.isVirtual;
    }
}
