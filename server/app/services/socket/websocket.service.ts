import { Trie } from '@app/classes/trie/trie';
import { AdminService } from '@app/services/database/admin-service/admin.service';
import { DictionaryService } from '@app/services/dictionary/dictionary.service';
import { ClueService } from '@app/services/game/clue/clue.service';
import { CommandService } from '@app/services/game/command/command.service';
import { EaselService } from '@app/services/game/easel/easel.service';
import { GameService } from '@app/services/game/game.service';
import { GridService } from '@app/services/game/grid/grid.service';
import { ObjectivesService } from '@app/services/game/objectives/objectives.service';
import { PlayerService } from '@app/services/game/player/player.service';
import { VirtualPlayerService } from '@app/services/game/virtual-player/virtual-player.service';
import { ScoreCalculatorService } from '@app/services/score-calculator/score-calculator.service';
import { RECONNECT_TIMEOUT } from '@app/services/timer/timer.service';
import { WordValidatorService } from '@app/services/word-validator/wordvalidator.service';
import { PlayableWord } from '@common/clue';
import { ClueCommand, Command, CommandName, ExchangeCommand, PlaceCommand } from '@common/command';
import { Game } from '@common/game';
import { GameMode } from '@common/game-mode';
import { Node } from '@common/grid/node';
import { Objective, ObjectiveName } from '@common/objectives';
import { Player, PlayerInfo } from '@common/player';
import { VirtualPlayerType } from '@common/virtualPlayer';
import { ClientEvents, ServerEvents } from '@common/websocket';
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Container, Service } from 'typedi';

export const PLACE_LETTERS_TIMEOUT = 3000;
export const MAX_SKIP_COUNT = 6;

@Service()
export class WebsocketService {
    io: Server<ClientEvents, ServerEvents>;

    startServer(httpServer: HttpServer): void {
        this.io = new Server<ClientEvents, ServerEvents>(httpServer, {
            cors: {
                origin: '*',
            },
        });
        this.handleSockets();
    }

    rejoinGameRoom(room: string, socketId: string): void {
        const socket = this.io.sockets.sockets.get(socketId);
        if (!socket) return;
        this.joinGameRoom(room, socket);
    }

    private handleSockets(): void {
        // Initial Middleware
        this.io.use((socket, next) => {
            const { playerName } = socket.handshake.auth;
            const playerInfo: PlayerInfo = {
                id: socket.id,
                name: playerName,
            };
            socket.data.playerInfo = playerInfo;
            next();
        });

        this.io.on('connection', (socket) => {
            socket.on('message', (msg, room) => {
                const roomSockets: Set<string> = this.io.sockets.adapter.rooms.get(room) as Set<string>;
                if (roomSockets.has(socket.id)) {
                    socket.to(room).emit('message', {
                        playerName: socket.data.playerInfo.name,
                        data: msg,
                        from: 'opponent',
                    });
                }
            });

            socket.on('command', (command, gameId) => {
                const game: Game = Container.get(GameService).getGameById(gameId) as Game;
                if (!game) return;
                const player = Container.get(PlayerService).getPlayerById(socket.id, game);
                if (!player) return;
                let success = false;
                let isClueCommand = false;
                const previousGridState: Node[][] = Container.get(GridService).copyGrid(game.grid);
                switch (command.name) {
                    case 'placer':
                        {
                            const isPositionValid = this.isValidPlacePosition(command as PlaceCommand, game);

                            if (!isPositionValid) {
                                game.skipCounter = 0;
                                socket.emit('badPlaceCommandPosition');
                                break;
                            }

                            success = Container.get(CommandService).isValidPlaceCommand(command as PlaceCommand, player.easel);

                            if (success) {
                                if (Container.get(WordValidatorService).isPlaceCommandValid(game.dict, command as PlaceCommand, game.grid)) {
                                    this.handlePlaceCommand(command as PlaceCommand, game, socket.id);
                                    socket.emit('commandSuccess', true, command);
                                } else {
                                    game.skipCounter = 0;
                                    (command as PlaceCommand).wordsInDictionary = false;
                                    socket.emit('shadowPlaceLetters', command as PlaceCommand);
                                    return;
                                }
                            } else socket.emit('commandSuccess', success, command);
                        }
                        break;

                    case 'échanger':
                        {
                            game.skipCounter = 0;
                            success = Container.get(CommandService).isValidExchangeCommand(command as ExchangeCommand, player.easel);
                            if (success) {
                                Container.get(EaselService).exchangeLetters((command as ExchangeCommand).letters, player.easel, game.letterReserve);
                            }
                            socket.emit('commandSuccess', success, command);
                        }
                        break;

                    case 'passer':
                        {
                            success = true;
                            game.skipCounter++;
                            socket.emit('commandSuccess', success, command);
                        }
                        break;

                    case 'indice': {
                        success = true;
                        isClueCommand = true;
                        const playableWords: PlayableWord[] = Container.get(ClueService).findAllPlayableWords(
                            game.dict,
                            (Container.get(DictionaryService).dictTrie.get(game.dict) as Trie).root,
                            player.easel,
                            game.grid,
                        );
                        const threePlayableWords = Container.get(ScoreCalculatorService).get80th70th60thScoredWords(game, playableWords);
                        const clueCommand = command as ClueCommand;
                        clueCommand.playableWords = threePlayableWords;
                        socket.emit('commandSuccess', success, clueCommand as Command);
                    }
                }
                if (game.mode === GameMode.Log2990 && command.name === CommandName.Place)
                    this.handleObjectives(command as PlaceCommand, game, previousGridState);
                if (success && !isClueCommand) Container.get(PlayerService).switchPlayerTurn(game);
                this.io.to(gameId).emit('updateGame', game);
                this.handleVirtualPlayerAction(game, command as PlaceCommand, previousGridState);
            });

            socket.on('shadowPlaceLetters', (placeCommand, game, playerId) => {
                const player = game.creator.id === playerId ? game.creator : (game.opponent as Player);
                Container.get(EaselService).removeLetters(placeCommand.word, player.easel, game.letterReserve);
                Container.get(GridService).placeLetters(placeCommand, game.grid);
                socket.emit('updateGame', game);
            });

            socket.on('requestGameUpdate', (gameId) => {
                const game = Container.get(GameService).getGameById(gameId) as Game;
                if (!game) return;
                Container.get(PlayerService).switchPlayerTurn(game);
                this.io.to(game.id).emit('updateGame', game);
                if (
                    ((game.opponent as Player).isVirtual && (game.opponent as Player).isPlaying) ||
                    ((game.creator as Player).isVirtual && (game.creator as Player).isPlaying)
                ) {
                    Container.get(VirtualPlayerService).chooseAction(game);
                }
            });

            socket.on('updateEasel', (easel, playerId, gameId) => {
                const game = Container.get(GameService).getGameById(gameId);
                if (!game) return;
                Container.get(PlayerService).updateEasel(easel, playerId, game);
            });

            socket.on('joinRoom', (room) => {
                this.joinGameRoom(room, socket);
                socket.to(room).emit('playerJoined', socket.data.playerInfo);
            });

            socket.on('leaveRoom', (room) => {
                const socketRooms = this.io.sockets.adapter.sids.get(socket.id) as Set<string>;
                if (socketRooms.has(room)) {
                    socket.to(room).emit('playerLeft', socket.data.playerInfo);
                    socket.leave(room);
                }
            });

            socket.on('removeOpponent', (room) => {
                const game = Container.get(GameService).getGameById(room);
                if (!game) return;
                Container.get(PlayerService).removeOpponent(game);
                socket.to(room).emit('playerLeft', socket.data.playerInfo);
                socket.leave(room);
                this.disconnect(socket);
            });

            socket.on('deleteGame', (gameId) => {
                Container.get(GameService).deleteGame(gameId);
                socket.to(gameId).emit('playerLeft', socket.data.playerInfo);
                socket.leave(gameId);
                this.disconnect(socket);
            });

            socket.on('abandonGame', async (gameId) => {
                const game = Container.get(GameService).getGameById(gameId);
                if (!game) return;
                const socketRooms = this.io.sockets.adapter.sids.get(socket.id) as Set<string>;
                if (socketRooms.has(gameId)) {
                    await this.handleAbandon(socket, game);
                }
            });

            socket.on('disconnect', async () => {
                const game = Container.get(GameService).getGameById(socket.data.room);
                if (!game) return;
                this.handleDisconnection(socket, socket.data.room);
            });
        });
    }

    private async makePlayerVirtual(playerAbandoned: Player): Promise<void> {
        playerAbandoned.hasAbandon = true;
        playerAbandoned.isVirtual = true;
        await Container.get(AdminService)
            .getRandomVirtualPlayerName(VirtualPlayerType.debutant)
            .then((jvName) => {
                playerAbandoned.name = jvName;
            });
        // playerAbandoned.isPlaying = false;
    }

    private joinGameRoom(room: string, socket: Socket<ClientEvents, ServerEvents>): void {
        const socketRooms = this.io.sockets.adapter.sids.get(socket.id) as Set<string>;
        if (!socketRooms.has(room)) {
            socket.join(room);
            socket.emit('joinRoom', room);
            socket.data.room = room;
        }
    }

    private isValidPlacePosition(command: PlaceCommand, game: Game): boolean {
        // if (!game) return false;
        if (Container.get(WordValidatorService).isFirstMove(game.grid)) {
            return Container.get(WordValidatorService).isTouchingH8(command as PlaceCommand);
        } else {
            return Container.get(WordValidatorService).isEmpty(command as PlaceCommand, game.grid);
        }
    }

    private handlePlaceCommand(command: PlaceCommand, game: Game, socketId: string): void {
        game.skipCounter = 0;
        const player = Container.get(PlayerService).getPlayerById(socketId, game);
        if (!player) return;
        Container.get(EaselService).removeLetters((command as PlaceCommand).word, player.easel, game.letterReserve);
        Container.get(PlayerService).incrementPlayerScore(
            Container.get(ScoreCalculatorService).calculateScore(
                Container.get(WordValidatorService).getNewWords(command as PlaceCommand, game.grid),
                command as PlaceCommand,
            ),
            socketId,
            game,
        );
        Container.get(GridService).placeLetters(command as PlaceCommand, game.grid);
        (command as PlaceCommand).wordsInDictionary = true;
    }

    private handleObjectives(command: PlaceCommand, game: Game, previousGridState: Node[][]): void {
        const gameObjectives: Objective[] = Container.get(ObjectivesService).getGameObjectives(game);

        for (const objective of gameObjectives) {
            Container.get(ObjectivesService).handleObjective(command, objective, game, previousGridState);
        }
        let currentPlayerObjective: Objective = (game.creator as Player).privateObjective as Objective;

        const opponentPlayerObjective: Objective = (game.opponent as Player).privateObjective as Objective;
        for (const objective of [currentPlayerObjective, opponentPlayerObjective]) {
            if (objective.name === ObjectiveName.FirstTo50)
                Container.get(ObjectivesService).handleObjective(command, objective, game, previousGridState);
        }
        if ((game.creator as Player).isPlaying) currentPlayerObjective = (game.creator as Player).privateObjective as Objective;
        else currentPlayerObjective = (game.opponent as Player).privateObjective as Objective;
        Container.get(ObjectivesService).handleObjective(command, currentPlayerObjective, game, previousGridState);
    }

    private handleVirtualPlayerAction(game: Game, command: PlaceCommand, previousGridState: Node[][]): void {
        if (
            ((game.opponent as Player).isVirtual && (game.opponent as Player).isPlaying) ||
            ((game.creator as Player).isVirtual && (game.creator as Player).isPlaying)
        ) {
            Container.get(VirtualPlayerService).chooseAction(game);
            if (game.mode === GameMode.Log2990 && command.name === CommandName.Place)
                this.handleObjectives(command as PlaceCommand, game, previousGridState);
        }
    }

    private disconnect(socket: Socket<ClientEvents, ServerEvents>): void {
        socket.removeAllListeners();
        socket.disconnect();
    }

    private async handleAbandon(socket: Socket<ClientEvents, ServerEvents>, game: Game): Promise<void> {
        if (!game.isMultiplayer) {
            if (socket.id === game.creator.id) game.creator.hasAbandon = true;
            else (game.opponent as Player).hasAbandon = true;
            this.disconnect(socket);
            return Container.get(GameService).deleteGame(game.id);
        }
        if (socket.id === game.creator.id) {
            await this.makePlayerVirtual(game.creator);
        } else {
            await this.makePlayerVirtual(game.opponent as Player);
        }
        if (
            ((game.opponent as Player).isVirtual && (game.opponent as Player).isPlaying) ||
            ((game.creator as Player).isVirtual && (game.creator as Player).isPlaying)
        ) {
            Container.get(VirtualPlayerService).chooseAction(game);
        }
        game.isMultiplayer = false;
        socket.to(game.id).emit('playerAbandoned');
        this.disconnect(socket);
        this.io.to(game.id).emit('updateGame', game);
    }

    private handleDisconnection(socket: Socket<ClientEvents, ServerEvents>, gameId: string): void {
        setTimeout(async () => {
            const game = Container.get(GameService).getGameById(gameId);
            if (!game) return;
            const player = Container.get(PlayerService).getPlayerById(socket.id, game);
            if (!player) return;
            await this.handleAbandon(socket, game);
        }, RECONNECT_TIMEOUT);
    }
}
