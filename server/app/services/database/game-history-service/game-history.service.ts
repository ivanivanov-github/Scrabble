/* eslint-disable @typescript-eslint/no-explicit-any */
import { DatabaseService } from '@app/services/database/database.service';
import { WebsocketService } from '@app/services/socket/websocket.service';
import { DATABASE_COLLECTION_GAME_HISTORY } from '@app/utils/score-database-contant';
import { Game } from '@common/game';
import { GameMode } from '@common/game-mode';
import { GameHistory, Player } from '@common/player';
import { Collection } from 'mongodb';
import { Container, Service } from 'typedi';

@Service()
export class GameHistoryService {
    constructor(private readonly db: DatabaseService) {}

    async reset(): Promise<void> {
        if ((await this.collection.countDocuments()) > 0) {
            await this.collection.drop();
        }
        this.emitHistoriqueDesPartis();
    }

    async addNewGameHistory(game: Game): Promise<void> {
        const gameHistory = this.createNewGameHistory(game);
        await this.collection.insertOne(gameHistory);
    }

    async getGameHistory(): Promise<GameHistory[]> {
        return await this.collection.find({}).toArray();
    }

    private createNewGameHistory(game: Game): GameHistory {
        const newGameHistory: GameHistory = {
            started: game.startedTime as Date,
            duration: game.totalTime,
            creator: game.creator as Player,
            creatorScore: (game.creator as Player).score,
            opponent: game.opponent as Player,
            oponentScore: (game.opponent as Player).score,
            mode: game.mode as GameMode,
            gameAbandoned: this.hashGameBeenAbandon(game),
        };
        return newGameHistory;
    }
    private hashGameBeenAbandon(game: Game): boolean {
        return game.creator.hasAbandon || (game.opponent as Player).hasAbandon;
    }

    private get collection(): Collection<GameHistory> {
        return this.db.database.collection(DATABASE_COLLECTION_GAME_HISTORY);
    }
    private async emitHistoriqueDesPartis() {
        const gameHistory: GameHistory[] = await this.getGameHistory();
        Container.get(WebsocketService).io.emit('resetHistory', gameHistory);
    }
}
