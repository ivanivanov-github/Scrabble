/* eslint-disable dot-notation */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
import { defaultDictMock } from '@app/classes/mocks/clue-service-mock';
import { STUB_PLAYABLE_WORDS } from '@app/classes/mocks/clue-service-stubs';
import { MOCK_PLACE_COMMAND } from '@app/classes/mocks/command-service-stubs';
import { STUB_CREATOR, STUB_GAME, STUB_OPPONENT } from '@app/classes/mocks/game-service-stubs';
import { STUB_GRID } from '@app/classes/mocks/grid-service-stubs';
import { OBJECTIVE_STUB_1, PUBLIC_OBJECTIVES_STUB } from '@app/classes/mocks/objectives-service-stubs';
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
import { WebsocketService } from '@app/services/socket/websocket.service';
import { RECONNECT_TIMEOUT, TimerService } from '@app/services/timer/timer.service';
import { WordValidatorService } from '@app/services/word-validator/wordvalidator.service';
import { ChatMessage } from '@common/chatMessage';
import { PlayableWord } from '@common/clue';
import { ClueCommand, Command, ExchangeCommand, PlaceCommand } from '@common/command';
import { Game } from '@common/game';
import { GameMode } from '@common/game-mode';
import { Objective, ObjectiveName } from '@common/objectives';
import { Player } from '@common/player';
import { ClientEvents, ServerEvents } from '@common/websocket';
import { Server } from 'app/server';
import { assert, expect } from 'chai';
import * as sinon from 'sinon';
import { io as ioClient, Socket } from 'socket.io-client';
import { Container } from 'typedi';

const RESPONSE_DELAY = 500;

describe('WebsocketService tests', () => {
    let service: WebsocketService;
    let server: Server;
    let dictionnaryService: DictionaryService;
    let objectiveService: ObjectivesService;
    let virtualPlayerService: VirtualPlayerService;
    let playerService: PlayerService;

    let clientSocket: Socket<ServerEvents, ClientEvents>;
    let clientSocket2: Socket<ServerEvents, ClientEvents>;

    let game: Game;
    let player: Player;
    let player2: Player;
    let stubPlayableWords: PlayableWord[];

    let isValidPlaceCommandStub: sinon.SinonStub;
    let removeLettersStub: sinon.SinonStub;
    let placeLettersStub: sinon.SinonStub;
    let isValidExchangeCommandStub: sinon.SinonStub;
    let exchangeLettersStub: sinon.SinonStub;
    let getGameByIdStub: sinon.SinonStub;
    let reconnectionTimeout: NodeJS.Timeout;
    let isEmptyStub: sinon.SinonStub;
    let isPlaceCommandValidStub: sinon.SinonStub;
    let isFirstMoveStub: sinon.SinonStub;
    let isTouchingH8Stub: sinon.SinonStub;
    let getPlayerByIdStub: sinon.SinonStub;
    let makePlayerVirtualStub: sinon.SinonStub;

    let chooseActionStub: sinon.SinonStub;
    let removeOpponentStub: sinon.SinonStub;
    let handleObjectiveStub: sinon.SinonSpy;
    let getGameObjectivesStub: sinon.SinonStub;
    let clock: sinon.SinonFakeTimers;
    const urlString = 'ws://localhost:3000';
    beforeEach((done) => {
        clock = sinon.useFakeTimers({
            toFake: ['setTimeout'],
        });
        server = Container.get(Server);
        objectiveService = Container.get(ObjectivesService);
        virtualPlayerService = Container.get(VirtualPlayerService);
        playerService = Container.get(PlayerService);
        server.init();
        service = server.wsService;

        player = JSON.parse(JSON.stringify(STUB_CREATOR));
        player2 = JSON.parse(JSON.stringify(STUB_OPPONENT));
        game = JSON.parse(JSON.stringify(STUB_GAME));
        stubPlayableWords = JSON.parse(JSON.stringify(STUB_PLAYABLE_WORDS));
        dictionnaryService = Container.get(DictionaryService);
        game.publicObjectives = [] as Objective[];

        isValidPlaceCommandStub = sinon.stub(Container.get(CommandService), 'isValidPlaceCommand');
        isValidExchangeCommandStub = sinon.stub(Container.get(CommandService), 'isValidExchangeCommand');
        removeLettersStub = sinon.stub(Container.get(EaselService), 'removeLetters');
        placeLettersStub = sinon.stub(Container.get(GridService), 'placeLetters').returns();
        exchangeLettersStub = sinon.stub(Container.get(EaselService), 'exchangeLetters');
        getGameByIdStub = sinon.stub(Container.get(GameService), 'getGameById').returns(game);
        isEmptyStub = sinon.stub(Container.get(WordValidatorService), 'isEmpty');
        isPlaceCommandValidStub = sinon.stub(Container.get(WordValidatorService), 'isPlaceCommandValid');
        isFirstMoveStub = sinon.stub(Container.get(WordValidatorService), 'isFirstMove');
        isTouchingH8Stub = sinon.stub(Container.get(WordValidatorService), 'isTouchingH8');
        chooseActionStub = sinon.stub(virtualPlayerService, 'chooseAction').returns();
        removeOpponentStub = sinon.stub(playerService, 'removeOpponent').returns();
        handleObjectiveStub = sinon.stub(objectiveService, 'handleObjective').returns();
        const objectiveStub: Objective[] = JSON.parse(JSON.stringify(PUBLIC_OBJECTIVES_STUB));
        getPlayerByIdStub = sinon.stub(Container.get(PlayerService), 'getPlayerById').returns(player);
        makePlayerVirtualStub = sinon.stub(Container.get(WebsocketService) as any, 'makePlayerVirtual').callThrough();
        getGameObjectivesStub = sinon.stub(objectiveService, 'getGameObjectives').returns(objectiveStub);
        Object.defineProperty(dictionnaryService, 'dictTrie', { value: defaultDictMock, writable: true });
        clientSocket = ioClient(urlString, { auth: { playerName: player.name } });
        clientSocket.once('connect', () => {
            player.id = clientSocket.id;
            clientSocket2 = ioClient(urlString, { auth: { playerName: player2.name } });
            clientSocket2.once('connect', () => {
                player2.id = clientSocket2.id;
                clientSocket2.emit('joinRoom', game.id);
                clientSocket2.once('joinRoom', () => {
                    done();
                });
            });
        });
    });

    afterEach(() => {
        sinon.restore();
        clientSocket.close();
        clientSocket2.close();
        service.io.close();
        Container.get(TimerService).gameTimers.forEach((timer) => {
            clearInterval(timer);
        });
        clearTimeout(reconnectionTimeout);
        Container.get(TimerService).clearGameInterval(game);
    });

    it('should make opponent virtual if player did not reconnect after reconnection timeout', (done) => {
        (game.opponent as Player).id = player2.id;
        getPlayerByIdStub.returns(player2);
        service['handleDisconnection'](clientSocket2 as any, game.id);
        reconnectionTimeout = setTimeout(() => {
            sinon.assert.calledWith(makePlayerVirtualStub, game.opponent);
            done();
        }, RECONNECT_TIMEOUT);
        clock.tick(RECONNECT_TIMEOUT);
    });

    it('should rejoin game room', () => {
        const joinGameRoomStub = sinon.spy(service as any, 'joinGameRoom');

        service.rejoinGameRoom(game.id, clientSocket.id);
        sinon.assert.called(joinGameRoomStub);
    });

    it('should not rejoin game room if no socket', () => {
        const joinGameRoomStub = sinon.spy(service as any, 'joinGameRoom');

        sinon.stub(service.io.sockets.sockets, 'get').returns(undefined);
        service.rejoinGameRoom(game.id, clientSocket.id);
        sinon.assert.notCalled(joinGameRoomStub);
    });

    it('should not remove player from game if he is not in game', () => {
        const setTimeoutSpy = sinon.spy(setTimeout);
        getPlayerByIdStub.returns(undefined);
        service['handleDisconnection'](clientSocket2 as any, game.id);
        sinon.assert.notCalled(setTimeoutSpy);
    });

    it('should not delete game if game is not alive', () => {
        const setTimeoutSpy = sinon.spy(setTimeout);
        getGameByIdStub.returns(undefined);
        service['handleDisconnection'](clientSocket2 as any, game.id);
        sinon.assert.notCalled(setTimeoutSpy);
    });

    it('should not make player virtual if player is not alive after reconnection timeout', (done) => {
        service['handleDisconnection'](clientSocket2 as any, game.id);
        getGameByIdStub.returns(undefined);
        reconnectionTimeout = setTimeout(() => {
            sinon.assert.notCalled(makePlayerVirtualStub);
            done();
        }, RECONNECT_TIMEOUT);
        clock.tick(RECONNECT_TIMEOUT);
    });

    it('should not make player virtual if player did reconnect after reconnection timeout', (done) => {
        service['handleDisconnection'](clientSocket2 as any, game.id);
        getPlayerByIdStub.returns(undefined);
        reconnectionTimeout = setTimeout(() => {
            sinon.assert.notCalled(makePlayerVirtualStub);
            done();
        }, RECONNECT_TIMEOUT);
        clock.tick(RECONNECT_TIMEOUT);
    });

    it('should make creator virtual if player did not reconnect after reconnection timeout', (done) => {
        game.creator.id = player.id;
        getPlayerByIdStub.returns(game.creator);
        service['handleDisconnection'](clientSocket as any, game.id);
        reconnectionTimeout = setTimeout(() => {
            sinon.assert.called(makePlayerVirtualStub);
            done();
        }, RECONNECT_TIMEOUT);
        clock.tick(RECONNECT_TIMEOUT);
    });

    it('should send message to all players in game if socket in room', (done) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Socket is not null thanks to the beforeEach where it is created
        const serverSocket = service.io.sockets.sockets.get(clientSocket.id)!;
        const socketToRoomSpy = sinon.spy(serverSocket, 'to');
        const message = 'test message';
        const expectedReceivedMessage: ChatMessage = {
            playerName: player.name,
            data: message,
            from: 'opponent',
        };
        clientSocket.once('joinRoom', () => {
            clientSocket2.once('message', (msg) => {
                assert(socketToRoomSpy.calledWith(game.id), 'socket.to was not called');
                assert.deepEqual(msg, expectedReceivedMessage, 'message was not received');
                done();
            });
            clientSocket.emit('message', message, game.id);
        });
        clientSocket.emit('joinRoom', game.id);
    });
    it('should not send message to all players in game if origin socket not in room', (done) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Socket is not null thanks to the beforeEach where it is created
        const serverSocket = service.io.sockets.sockets.get(clientSocket.id)!;
        const socketToRoomSpy = sinon.spy(serverSocket, 'to');
        const message = 'test message';
        clientSocket.emit('message', message, game.id);
        setTimeout(() => {
            assert(socketToRoomSpy.notCalled, 'socket.to was called');
            done();
        }, RESPONSE_DELAY);
        clock.tick(RESPONSE_DELAY);
    });

    it('should place letters from received grid and remove them from easel and if command is valid', (done) => {
        (game.creator as Player).id = clientSocket.id;
        const placeCommand: PlaceCommand = MOCK_PLACE_COMMAND;
        isValidPlaceCommandStub.returns(true);
        clientSocket.once('updateGame', (receivedGame) => {
            assert.deepEqual(receivedGame, game, 'game was not received');
            done();
        });
        clientSocket.emit('shadowPlaceLetters', placeCommand, game, player.id);
    });

    it('should not do anything if no player found after a command event', (done) => {
        const placeCommand: PlaceCommand = MOCK_PLACE_COMMAND;
        const wsEmitSpy = sinon.spy(service.io, 'to');
        getPlayerByIdStub.returns(undefined);
        setTimeout(() => {
            sinon.assert.notCalled(wsEmitSpy);
            done();
        }, RESPONSE_DELAY);
        clientSocket.emit('command', placeCommand, game.id);
        clock.tick(RESPONSE_DELAY);
    });

    it('should not place letters if they are not in the easel of the player', (done) => {
        const placeCommand: PlaceCommand = MOCK_PLACE_COMMAND;
        isFirstMoveStub.returns(false);
        isValidPlaceCommandStub.returns(false);
        isEmptyStub.returns(true);
        clientSocket.once('commandSuccess', (success, receivedPlaceCommand) => {
            assert.deepEqual(receivedPlaceCommand, placeCommand, 'placeCommand was not received');
            assert.isFalse(success, 'success should be false');
            done();
        });
        clientSocket.emit('command', placeCommand, game.id);
    });

    it('should not place letters if the node is not empty', (done) => {
        const placeCommand: PlaceCommand = MOCK_PLACE_COMMAND;
        isFirstMoveStub.returns(false);
        isValidPlaceCommandStub.returns(true);
        isEmptyStub.returns(false);
        clientSocket.once('badPlaceCommandPosition', () => {
            done();
        });
        clientSocket.emit('command', placeCommand, game.id);
    });

    it('should send a shadowPlaceLetters if the placeCommand is not valid', (done) => {
        const placeCommand: PlaceCommand = MOCK_PLACE_COMMAND;
        placeCommand.wordsInDictionary = false;
        isFirstMoveStub.returns(false);
        isValidPlaceCommandStub.returns(true);
        isEmptyStub.returns(true);
        isPlaceCommandValidStub.returns(false);
        clientSocket.once('shadowPlaceLetters', (receivedPlaceCommand) => {
            assert.deepEqual(receivedPlaceCommand, placeCommand, 'placeCommand was not received');
            done();
        });
        clientSocket.emit('command', placeCommand, game.id);
    });

    it('should send a commandSuccess if the placeCommand is valid', (done) => {
        const placeCommand: PlaceCommand = MOCK_PLACE_COMMAND;
        placeCommand.wordsInDictionary = true;
        isFirstMoveStub.returns(false);
        isValidPlaceCommandStub.returns(true);
        isEmptyStub.returns(true);
        isPlaceCommandValidStub.returns(true);
        clientSocket.once('commandSuccess', (success, receivedPlaceCommand) => {
            assert(success, 'command should be valid');
            assert.deepEqual(receivedPlaceCommand, placeCommand, 'command should be the same');
            assert(isValidPlaceCommandStub.calledWith(placeCommand, player.easel), 'isValidPlaceCommand was not called');
            assert(removeLettersStub.calledWith(placeCommand.word, player.easel, game.letterReserve), 'removeLetters was not called');
            assert(placeLettersStub.calledWith(placeCommand, game.grid), 'placeLetters was not called');
            done();
        });
        clientSocket.emit('command', placeCommand, game.id);
    });

    it('should also handle shadowPlaceLetters event for opponent', (done) => {
        (game.opponent as Player).id = clientSocket2.id;
        const placeCommand: PlaceCommand = MOCK_PLACE_COMMAND;
        isValidPlaceCommandStub.returns(false);
        clientSocket2.once('updateGame', (receivedGame) => {
            assert.deepEqual(receivedGame, game, 'game was not received');
            done();
        });
        clientSocket2.emit('shadowPlaceLetters', placeCommand, game, player2.id);
    });

    it('should not place letters if it is the first move and the word does not touch h8', (done) => {
        const placeCommand: PlaceCommand = MOCK_PLACE_COMMAND;
        isFirstMoveStub.returns(true);
        isTouchingH8Stub.returns(false);
        clientSocket.once('badPlaceCommandPosition', () => {
            done();
        });
        clientSocket.emit('command', placeCommand, game.id);
    });

    it('should place the letters if it is the first move and the word touches h8', (done) => {
        const placeCommand: PlaceCommand = MOCK_PLACE_COMMAND;
        placeCommand.wordsInDictionary = true;
        isFirstMoveStub.returns(true);
        isTouchingH8Stub.returns(true);
        isValidPlaceCommandStub.returns(true);
        isEmptyStub.returns(true);
        isPlaceCommandValidStub.returns(true);
        clientSocket.once('commandSuccess', (success, receivedPlaceCommand) => {
            assert(success, 'command should be valid');
            assert.deepEqual(receivedPlaceCommand, placeCommand, 'command should be the same');
            assert(isValidPlaceCommandStub.calledWith(placeCommand, player.easel), 'isValidPlaceCommand was not called');
            assert(removeLettersStub.calledWith(placeCommand.word, player.easel, game.letterReserve), 'removeLetters was not called');
            assert(placeLettersStub.calledWith(placeCommand, game.grid), 'placeLetters was not called');
            done();
        });
        clientSocket.emit('command', placeCommand, game.id);
    });

    it('should send the updated game to the origin socket on requestGameUpdate event', (done) => {
        const switchPlayerTurnStub = sinon.spy(playerService, 'switchPlayerTurn');

        clientSocket2.once('updateGame', (updatedGame) => {
            assert(switchPlayerTurnStub.calledOnce, 'switch playerTurn was called');
            assert.deepEqual(updatedGame, game, 'game was not received');
            done();
        });
        clientSocket.emit('requestGameUpdate', game.id);
    });
    it('should send the updated game to the origin socket and let the VP opponent chooseAction on requestGameUpdate event', (done) => {
        (game.opponent as Player).isVirtual = true;
        (game.opponent as Player).isPlaying = false;

        setTimeout(() => {
            done();
        }, RESPONSE_DELAY);
        clientSocket2.emit('requestGameUpdate', game.id);

        clock.tick(RESPONSE_DELAY);
    });

    it('should send the updated game to the origin socket and let the VP creator chooseAction on requestGameUpdate event', (done) => {
        (game.creator as Player).isVirtual = true;
        (game.creator as Player).isPlaying = true;

        setTimeout(() => {
            done();
        }, RESPONSE_DELAY);
        clientSocket2.emit('requestGameUpdate', game.id);

        clock.tick(RESPONSE_DELAY);
    });

    it('should not update easel on updateEasel event if no game is found', (done) => {
        getGameByIdStub.returns(undefined);
        setTimeout(() => {
            done();
        }, RESPONSE_DELAY);
        clientSocket2.emit('updateEasel', player.easel, player.id, game.id);

        clock.tick(RESPONSE_DELAY);
    });

    it('should update easel on updateEasel event', (done) => {
        getGameByIdStub.returns(game);
        setTimeout(() => {
            done();
        }, RESPONSE_DELAY);
        clientSocket2.emit('updateEasel', player.easel, player.id, game.id);

        clock.tick(RESPONSE_DELAY);
    });

    it('should call joinGameRoom() and emit playerJoined after a joinRoom event', (done) => {
        setTimeout(() => {
            done();
        }, RESPONSE_DELAY);
        clientSocket.emit('joinRoom', game.id);
        clock.tick(RESPONSE_DELAY);
    });

    it('should remove socket from the room after a leaveRoom event and emit leaveRoom and playerLeft event back', (done) => {
        const roomSockets = service.io.sockets.adapter.rooms.get(game.id);
        assert(roomSockets?.has(clientSocket2.id), 'Socket be in the room');
        setTimeout(() => {
            assert.isFalse(roomSockets?.has(clientSocket.id), 'socket should not be in the room');
            done();
        }, RESPONSE_DELAY);
        clientSocket2.emit('leaveRoom', game.id);
        clock.tick(RESPONSE_DELAY);
    });

    it('should not remove socket if not in room after a leaveRoom event', (done) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Socket is not null thanks to the beforeEach where it is created
        const serverSocket = service.io.sockets.sockets.get(clientSocket.id)!;
        const leaveRoomSpy = sinon.spy(serverSocket, 'leave');
        const roomSockets = service.io.sockets.adapter.rooms.get(game.id);
        assert.isFalse(roomSockets?.has(clientSocket.id), 'socket should not be in the room');
        clientSocket.emit('leaveRoom', game.id);
        setTimeout(() => {
            assert(leaveRoomSpy.notCalled, 'leaveRoom was called');
            done();
        }, RESPONSE_DELAY);
        clock.tick(RESPONSE_DELAY);
    });

    it('should call removeOpponent and emit playerLeft after a removeOpponent event', (done) => {
        getGameByIdStub.returns(game);
        clientSocket2.emit('removeOpponent', game.id);
        setTimeout(() => {
            done();
        }, RESPONSE_DELAY);
        clock.tick(RESPONSE_DELAY);
    });

    it('should not call removeOpponent if no game found', (done) => {
        getGameByIdStub.returns(undefined);
        setTimeout(() => {
            sinon.assert.notCalled(removeOpponentStub);
            done();
        }, RESPONSE_DELAY);
        clientSocket2.emit('removeOpponent', 'not-a-game-id');
        clock.tick(RESPONSE_DELAY);
    });

    it('should call deleteGame and emit playerLeft after a deleteGame event', (done) => {
        setTimeout(() => {
            done();
        }, RESPONSE_DELAY);
        clientSocket2.emit('deleteGame', game.id);
        clock.tick(RESPONSE_DELAY);
    });

    it('should emit playerAbandoned event to other players in the room after an abandonGame event', (done) => {
        getGameByIdStub.returns(game);
        clientSocket.once('joinRoom', () => {
            clientSocket2.once('playerAbandoned', () => {
                sinon.assert.called(makePlayerVirtualStub);
                done();
            });
            clientSocket.emit('abandonGame', game.id);
            done();
        });
        clientSocket.emit('joinRoom', game.id);
    });
    /** test a revoir */

    it('should set hasAbandon when the player abandons', (done) => {
        (game.creator as Player).id = clientSocket.id;
        clientSocket.once('joinRoom', () => {
            clientSocket2.once('playerAbandoned', () => {
                assert.isTrue((game.creator as Player).hasAbandon);
                done();
            });
            clientSocket.emit('abandonGame', game.id);
            done();
        });
        clientSocket.emit('joinRoom', game.id);
        clientSocket.emit('abandonGame', game.id);
    });
    /** test a revoir */

    it('should set hasAbandon when the opponent abandons and call chooseAction if the opponent is playing', (done) => {
        (game.opponent as Player).id = clientSocket.id;
        clientSocket.once('joinRoom', () => {
            clientSocket2.once('playerAbandoned', () => {
                assert.isTrue((game.opponent as Player).hasAbandon);
                done();
            });
            clientSocket.emit('abandonGame', game.id);
            done();
        });
        clientSocket.emit('joinRoom', game.id);
        clientSocket.emit('abandonGame', game.id);
    });

    it('should not emit playerAbandoned if not in room', (done) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Socket is not null thanks to the beforeEach where it is created
        const serverSocket = service.io.sockets.sockets.get(clientSocket.id)!;
        const broadcastToSpy = sinon.spy(serverSocket.broadcast, 'to');
        const socketRooms = service.io.sockets.adapter.sids.get(clientSocket.id);
        assert.isFalse(socketRooms?.has(game.id), 'socket should not be in the room');
        clientSocket.emit('abandonGame', game.id);
        setTimeout(() => {
            assert(broadcastToSpy.notCalled, 'playerAbandoned was received');
            done();
        }, RESPONSE_DELAY);
        clock.tick(RESPONSE_DELAY);
    });

    it('should handle disconnection when socket disconnects', (done) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Socket is not null thanks to the beforeEach where it is created
        const serverSocket = service.io.sockets.sockets.get(clientSocket.id)!;
        getGameByIdStub.returns(game);
        const handleDisconnectionSpy = sinon.spy(service as any, 'handleDisconnection');
        serverSocket.once('disconnect', () => {
            assert(handleDisconnectionSpy.calledWith(serverSocket, serverSocket.data.room), 'handleDisconnection was not called');
            done();
        });
        clientSocket.disconnect();
    });

    it("should not validate a place command if player doesn't have the letters", (done) => {
        isValidPlaceCommandStub.returns(false);
        isFirstMoveStub.returns(false);
        isEmptyStub.returns(true);
        const placeCommand: PlaceCommand = {
            fullCommand: '!placer h8v allo',
            name: 'placer',
            column: 8,
            row: 'h',
            direction: 'v',
            word: 'allo',
            wordsInDictionary: true,
        };
        clientSocket.once('commandSuccess', (success, command) => {
            assert.isFalse(success, 'command should not be valid');
            assert.deepEqual(command, placeCommand, 'command should be the same');
            assert(isValidPlaceCommandStub.calledWith(placeCommand, player.easel), 'isValidPlaceCommand was not called');
            assert(removeLettersStub.notCalled, 'removeLetters was called');
            assert(placeLettersStub.notCalled, 'placeLetters was called');
            done();
        });
        clientSocket.emit('command', placeCommand, game.id);
    });

    it('should validate an exchange command, exchange the letters and send back the validation to the socket', (done) => {
        isValidExchangeCommandStub.returns(true);
        exchangeLettersStub.returns(true);
        const exchangeCommand: ExchangeCommand = {
            fullCommand: '!échanger xwfr',
            name: 'échanger',
            letters: 'xwfr',
        };
        clientSocket.once('commandSuccess', (success, command) => {
            assert(success, 'command should be valid');
            assert.deepEqual(command, exchangeCommand, 'command should be the same');
            assert(isValidExchangeCommandStub.calledWith(exchangeCommand, player.easel), 'isValidExchangeCommand was not called');
            assert(exchangeLettersStub.calledWith(exchangeCommand.letters, player.easel, game.letterReserve), 'exchangeLetters was not called');
            done();
        });
        clientSocket.emit('command', exchangeCommand, game.id);
    });

    it("should not validate an exchange command if player doesn't have the letters", (done) => {
        isValidExchangeCommandStub.returns(false);
        const exchangeCommand: ExchangeCommand = {
            fullCommand: '!échanger xwfr',
            name: 'échanger',
            letters: 'xwfr',
        };
        clientSocket.once('commandSuccess', (success, command) => {
            assert.isFalse(success, 'command should not be valid');
            assert.deepEqual(command, exchangeCommand, 'command should be the same');
            assert(isValidExchangeCommandStub.calledWith(exchangeCommand, player.easel), 'isValidExchangeCommand was not called');
            assert(exchangeLettersStub.notCalled, 'exchangeLetters was called');
            done();
        });
        clientSocket.emit('command', exchangeCommand, game.id);
    });

    it('should call findAllPlayableWords and get80th70th60thScoredWords', (done) => {
        const clueCommand: ClueCommand = {
            fullCommand: '!indice',
            name: 'indice',
            playableWords: stubPlayableWords,
        };
        const findAllPlayableWordsStub = sinon.stub(Container.get(ClueService), 'findAllPlayableWords').returns(stubPlayableWords);
        const get80th70th60thScoredWordsStub = sinon
            .stub(Container.get(ScoreCalculatorService), 'get80th70th60thScoredWords')
            .returns(stubPlayableWords);
        clientSocket.once('commandSuccess', (success, command) => {
            assert(success, 'command should be valid');
            assert.deepEqual(command, clueCommand, 'command should be the same');
            sinon.assert.calledOnce(findAllPlayableWordsStub);
            sinon.assert.calledOnce(get80th70th60thScoredWordsStub);
            done();
        });
        clientSocket.emit('command', clueCommand, game.id);
    });

    it('should switch player turn and send updateGame event to players in game on any successful command', (done) => {
        (game.opponent as Player).isVirtual = true;
        (game.opponent as Player).isPlaying = true;
        const emitToRoomSpy = sinon.spy(service.io, 'to');
        const passCommand: Command = {
            fullCommand: '!passer',
            name: 'passer',
        };
        const switchPlayerTurnStub = sinon.spy(playerService, 'switchPlayerTurn');

        clientSocket2.once('updateGame', () => {
            assert(emitToRoomSpy.calledWith(game.id), 'updateGame event was not sent to players in game');
            assert(switchPlayerTurnStub.calledWith(game), 'switchPlayerTurn was not called');
            done();
        });
        clientSocket2.emit('command', passCommand, game.id);
    });

    it('should reinitialize the skipCounter on any command but a skip command', (done) => {
        (game.opponent as Player).isVirtual = true;
        (game.opponent as Player).isPlaying = false;
        isValidExchangeCommandStub.returns(false);
        const exchangeCommand: ExchangeCommand = {
            fullCommand: '!échanger',
            name: 'échanger',
            letters: 'gqa*',
        };
        clientSocket2.once('updateGame', () => {
            expect(game.skipCounter).to.equal(0, 'skipCounter should be 0');
            done();
        });
        clientSocket2.emit('command', exchangeCommand, game.id);
    });

    it('onCommand should not do anything if game not found', (done) => {
        getGameByIdStub.returns(undefined);
        const exchangeCommand: ExchangeCommand = {
            fullCommand: '!échanger',
            name: 'échanger',
            letters: 'gqa*',
        };
        const emitSpy = sinon.spy(service.io, 'emit');
        setTimeout(() => {
            sinon.assert.notCalled(emitSpy);
            done();
        }, RESPONSE_DELAY);

        clientSocket2.emit('command', exchangeCommand, game.id);
        clock.tick(RESPONSE_DELAY);
    });

    it('requestGameUpdate should not do anything if game not found', (done) => {
        getGameByIdStub.returns(undefined);
        const emitSpy = sinon.spy(service.io, 'emit');
        setTimeout(() => {
            sinon.assert.notCalled(emitSpy);
            done();
        }, RESPONSE_DELAY);

        clientSocket2.emit('requestGameUpdate', game.id);
        clock.tick(RESPONSE_DELAY);
    });

    it('abandonGame should not do anything if game not found', (done) => {
        getGameByIdStub.returns(undefined);
        const emitSpy = sinon.spy((service.io.sockets.sockets.get(clientSocket2.id) as any).broadcast, 'to');
        setTimeout(() => {
            sinon.assert.notCalled(emitSpy);
            done();
        }, RESPONSE_DELAY);
        clientSocket2.emit('abandonGame', game.id);
        clock.tick(RESPONSE_DELAY);
    });

    it('should send the updated game to the origin socket on requestGameUpdate event for gameMode Log2990', (done) => {
        game.mode = GameMode.Log2990;
        (game.creator as Player).privateObjective = JSON.parse(JSON.stringify(OBJECTIVE_STUB_1));
        (game.opponent as Player).privateObjective = JSON.parse(JSON.stringify(OBJECTIVE_STUB_1));
        const command: Command = {
            fullCommand: '!passer',
            name: 'placer',
        };

        clientSocket2.once('updateGame', () => {
            sinon.assert.called(handleObjectiveStub);
            done();
        });
        clientSocket2.emit('command', command, game.id);
    });

    it('should call getGameObjectives', () => {
        (game.creator as Player).privateObjective = JSON.parse(JSON.stringify(OBJECTIVE_STUB_1));
        (game.opponent as Player).privateObjective = JSON.parse(JSON.stringify(OBJECTIVE_STUB_1));
        const command: Command = {
            fullCommand: '!passer',
            name: 'passer',
        };
        service['handleObjectives'](command as PlaceCommand, game, game.grid);
        sinon.assert.called(getGameObjectivesStub);
    });

    it('should call handleObjectives with opponent objective if opponent is currently playing', () => {
        (game.creator as Player).isPlaying = false;
        (game.opponent as Player).isPlaying = true;
        (game.creator as Player).privateObjective = JSON.parse(JSON.stringify(OBJECTIVE_STUB_1));
        (game.opponent as Player).privateObjective = JSON.parse(JSON.stringify(OBJECTIVE_STUB_1));
        const command: Command = {
            fullCommand: '!passer',
            name: 'passer',
        };
        service['handleObjectives'](command as PlaceCommand, game, game.grid);
        sinon.assert.calledWith(handleObjectiveStub, command, (game.opponent as Player).privateObjective, game);
    });

    it('should call handleObjectives with opponent objective if opponent is currently playing and private objective is FirstTo50', () => {
        (game.creator as Player).isPlaying = false;
        (game.opponent as Player).isPlaying = true;
        (game.creator as Player).privateObjective = JSON.parse(JSON.stringify(OBJECTIVE_STUB_1));
        (game.opponent as Player).privateObjective = JSON.parse(JSON.stringify(OBJECTIVE_STUB_1));
        ((game.opponent as Player).privateObjective as Objective).name = ObjectiveName.FirstTo50;
        const command: Command = {
            fullCommand: '!passer',
            name: 'passer',
        };
        service['handleObjectives'](command as PlaceCommand, game, game.grid);
        sinon.assert.called(handleObjectiveStub);
    });

    it('should call chooseAction if game opponent isVirtual and isPlaying', () => {
        (game.opponent as Player).isVirtual = true;
        (game.opponent as Player).isPlaying = true;
        const command: Command = {
            fullCommand: '!passer',
            name: 'passer',
        };
        service['handleVirtualPlayerAction'](game, command as PlaceCommand, game.grid);
        sinon.assert.calledWith(chooseActionStub, game);
    });

    it("shouldn't call chooseAction if game opponent isVirtual and isPlaying", () => {
        (game.opponent as Player).isVirtual = false;
        (game.opponent as Player).isPlaying = true;
        const command: Command = {
            fullCommand: '!passer',
            name: 'passer',
        };
        service['handleVirtualPlayerAction'](game, command as PlaceCommand, game.grid);
        sinon.assert.notCalled(chooseActionStub);
    });

    it('should call handleObjectives if game opponent isVirtual and isPlaying and game mode is Log2990', () => {
        game.mode = GameMode.Log2990;
        (game.creator as Player).isPlaying = false;
        (game.opponent as Player).isVirtual = true;
        (game.opponent as Player).isPlaying = true;
        (game.creator as Player).privateObjective = JSON.parse(JSON.stringify(OBJECTIVE_STUB_1));
        (game.opponent as Player).privateObjective = JSON.parse(JSON.stringify(OBJECTIVE_STUB_1));
        const command: Command = {
            fullCommand: '!passer',
            name: 'placer',
        };

        service['handleVirtualPlayerAction'](game, command as PlaceCommand, game.grid);
        sinon.assert.called(handleObjectiveStub);
    });

    it('should call handleObjectives if game creator isVirtual and isPlaying and game mode is Classic', () => {
        game.mode = GameMode.Classic;
        (game.creator as Player).isVirtual = true;
        (game.creator as Player).isPlaying = true;
        (game.opponent as Player).isPlaying = false;
        const command: Command = {
            fullCommand: '!placer h8h allo',
            name: 'placer',
        };
        service['handleVirtualPlayerAction'](game, command as PlaceCommand, STUB_GRID);
        sinon.assert.notCalled(handleObjectiveStub);
    });

    it('joinGameRoom() should not do anything if already in the room', () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We added the socket in the beforeEach
        const socket = service.io.sockets.sockets.get(clientSocket2.id)!;
        const wsEmitSpy = sinon.spy(socket, 'emit');
        service['joinGameRoom'](game.id, socket);
        sinon.assert.notCalled(wsEmitSpy);
    });

    it('should handleAbandon correctly', () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We added the socket in the beforeEach
        const socket = service.io.sockets.sockets.get(clientSocket.id)!;
        game.isMultiplayer = false;
        game.creator.id = clientSocket.id;
        service['handleAbandon'](socket, game);
        expect(game.creator.hasAbandon).to.be.equal(true);
    });

    it('should handleAbandon correctly', () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We added the socket in the beforeEach
        const socket = service.io.sockets.sockets.get(clientSocket.id)!;
        game.isMultiplayer = false;
        game.creator.id = clientSocket2.id;
        service['handleAbandon'](socket, game);
        expect(game.opponent?.hasAbandon).to.be.equal(true);
    });
});
