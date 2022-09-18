import { DictionaryService } from '@app/services/dictionary/dictionary.service';
import { EaselService } from '@app/services/game/easel/easel.service';
import { GridService } from '@app/services/game/grid/grid.service';
import { ObjectivesService } from '@app/services/game/objectives/objectives.service';
import { PlayerService } from '@app/services/game/player/player.service';
import { VirtualPlayerService } from '@app/services/game/virtual-player/virtual-player.service';
import { WebsocketService } from '@app/services/socket/websocket.service';
import { TimerService } from '@app/services/timer/timer.service';
import { generateId } from '@app/utils/id';
import { Game, GameOptions, JoinMultiplayerOption } from '@common/game';
import { GameMode } from '@common/game-mode';
import { LETTERS } from '@common/grid/letterCount';
import { Node } from '@common/grid/node';
import { Player, PlayerInfo } from '@common/player';
import { VirtualPlayerType } from '@common/virtualPlayer';
import { Container, Service } from 'typedi';
import { GameHistoryService } from '@app/services/database/game-history-service/game-history.service';

export const MAX_SKIP_COUNT = 6;

@Service()
export class GameService {
    gameSessions: Game[];

    constructor() {
        this.gameSessions = [];
    }

    initGame(gameOptions: GameOptions): Game {
        const letterReserve = Array.from(LETTERS);
        const playerEasel = Container.get(EaselService).generatePlayerLetters(letterReserve);

        const creator: Player = Container.get(PlayerService).addCreator(gameOptions, playerEasel);
        const grid: Node[][] = Container.get(GridService).loadGrid();

        const game: Game = this.createGame(gameOptions, creator, grid, letterReserve);

        this.addGameSession(game);
        Container.get(WebsocketService).io.emit('updateGamesAvailable');
        return game;
    }

    joinGame({ playerInfo, gameId }: JoinMultiplayerOption, isVirtualPlayer: boolean = false): Game | undefined {
        const game = this.getGameById(gameId);
        if (!game) return;
        if (game.capacity < 2 && !isVirtualPlayer) {
            Container.get(PlayerService).addOpponent(playerInfo, game);
            Container.get(WebsocketService).io.emit('updateGamesAvailable');
        } else if (game.capacity < 2 && isVirtualPlayer) {
            Container.get(PlayerService).addOpponent(playerInfo, game, true);
            Container.get(WebsocketService).io.emit('updateGamesAvailable');
        }
        game.startedTime = new Date();
        return game;
    }

    handleMaxSkip(game: Game): void {
        if (game.skipCounter === MAX_SKIP_COUNT) this.deleteGame(game.id);
    }

    convertToSolo(gameId: string, virtualPlayerName: string, virtualPlayerType: VirtualPlayerType): void {
        const virtualPlayer: PlayerInfo = { name: virtualPlayerName, id: generateId(), virtualPlayerType };
        const soloPlayerOption: JoinMultiplayerOption = { playerInfo: virtualPlayer, gameId };
        this.joinGame(soloPlayerOption, true);
        this.startGame(gameId);
    }

    startGame(gameId: string): void {
        const game: Game = this.getGameById(gameId) as Game;
        if (this.isDictionnaryDeleted(gameId)) return;
        if (game.mode === GameMode.Log2990) Container.get(ObjectivesService).addObjectives(game);
        Container.get(PlayerService).setRandomStartingPlayer(game);
        Container.get(WebsocketService).io.to(gameId).emit('startGame', game);
        Container.get(TimerService).startTimer(game);
        if ((game.opponent as Player).isPlaying && (game.opponent as Player).isVirtual) {
            Container.get(VirtualPlayerService).chooseAction(game);
        } else if ((game.creator as Player).isPlaying && (game.creator as Player).isVirtual) {
            Container.get(VirtualPlayerService).chooseAction(game);
        }
    }

    adjustPlayersFinalScore(creator: Player, opponent: Player): void {
        if (!creator.easel.length) {
            const remainingScore: number = Container.get(PlayerService).getRemainingLettersScore(opponent);
            creator.score += remainingScore;
            opponent.score -= remainingScore;
        } else if (!opponent.easel.length) {
            const remainingScore: number = Container.get(PlayerService).getRemainingLettersScore(creator);
            creator.score -= remainingScore;
            opponent.score += remainingScore;
        }
        if (creator.score < 0) creator.score = 0;
        if (opponent.score < 0) opponent.score = 0;
        for (const player of [creator, opponent]) {
            Container.get(PlayerService).updatePlayerFinalScore(player);
        }
    }

    deleteGame(gameId: string): void {
        const game = this.getGameById(gameId);
        if (!game) return;
        Container.get(TimerService).clearGameInterval(game);
        if (game.opponent) this.adjustPlayersFinalScore(game.creator, game.opponent);
        game.hasEnded = true;
        Container.get(GameHistoryService).addNewGameHistory(game);
        Container.get(WebsocketService).io.to(game.id).emit('updateGame', game);
        Container.get(WebsocketService).io.to(game.id).emit('endOfGame');
        this.removeGameSession(game);
        Container.get(DictionaryService).updateNumberOfUserOfDictTrie(game.dict);
    }

    removeGameSession(game: Game): void {
        this.gameSessions = this.gameSessions.filter((session) => session.id !== game.id);
        Container.get(WebsocketService).io.emit('updateGamesAvailable');
    }

    getGameById(id: string): Game | undefined {
        return this.gameSessions.find((game) => game.id === id);
    }

    reconnectToGame(oldId: string, newId: string, gameId: string): Game | undefined {
        const game = this.getGameById(gameId);
        if (!game) return;
        const player = Container.get(PlayerService).getPlayerById(oldId, game);
        if (!player) return;
        if (player.hasAbandon) return;
        if (player.id === game.creator.id) {
            game.creator.id = newId;
        } else {
            (game.opponent as Player).id = newId;
        }
        Container.get(WebsocketService).rejoinGameRoom(game.id, newId);
        Container.get(TimerService).refreshTimer(game);
        return game;
    }
    private isDictionnaryDeleted(gameId: string): boolean {
        const game: Game = this.getGameById(gameId) as Game;
        if (Container.get(DictionaryService).getDictionary(game.dict) === undefined) {
            Container.get(WebsocketService).io.in(gameId).emit('nonExistingDict');
            return true;
        } else {
            Container.get(DictionaryService).numberDictUser.set(
                game.dict,
                (Container.get(DictionaryService).numberDictUser.get(game.dict) as number) + 1,
            );
            return false;
        }
    }
    private createGame(gameOptions: GameOptions, creator: Player, grid: Node[][], letterReserve: string[]): Game {
        return {
            id: generateId(),
            creator,
            opponent: null,
            capacity: 1,
            dict: gameOptions.dictionary,
            time: gameOptions.time,
            timer: gameOptions.time,
            grid,
            letterReserve,
            skipCounter: 0,
            mode: gameOptions.gameMode,
            totalTime: 0,
            hasEnded: false,
            isMultiplayer: gameOptions.isMultiplayer,
        };
    }

    private addGameSession(game: Game): void {
        this.gameSessions.push(game);
    }
}
