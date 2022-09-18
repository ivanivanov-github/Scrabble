/* eslint-disable @typescript-eslint/no-magic-numbers */ // Shouldn't define constants for magic numbers
/* eslint-disable max-lines */ // Test files can be longer than maximum number of lines given by eslint
/* eslint-disable @typescript-eslint/no-useless-constructor,no-unused-vars,@typescript-eslint/no-empty-function */
/* eslint-disable dot-notation */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-expressions -- Needed for chai library assertions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { defaultDictMock } from '@app/classes/mocks/clue-service-mock';
import { dictionaryStub } from '@app/classes/mocks/dictionary-stub';
import { STUB_PLAYER_EASEL } from '@app/classes/mocks/easel-service-stubs';
import {
    STUB_CREATOR,
    STUB_GAME,
    STUB_GAME_OPTIONS,
    STUB_JOIN_OPTIONS,
    STUB_OPPONENT,
    STUB_OPPONENT_INFOS,
} from '@app/classes/mocks/game-service-stubs';
import { STUB_GRID } from '@app/classes/mocks/grid-service-stubs';
import { serverMock } from '@app/classes/mocks/web-socket-mock';
import { ScoreDatabaseService } from '@app/services/database/score-database-service/score-database.service';
import { DictionaryService } from '@app/services/dictionary/dictionary.service';
import { EaselService } from '@app/services/game/easel/easel.service';
import { GameService } from '@app/services/game/game.service';
import { GridService } from '@app/services/game/grid/grid.service';
import { ObjectivesService } from '@app/services/game/objectives/objectives.service';
import { PlayerService } from '@app/services/game/player/player.service';
import { VirtualPlayerService } from '@app/services/game/virtual-player/virtual-player.service';
import { WebsocketService } from '@app/services/socket/websocket.service';
import { TimerService } from '@app/services/timer/timer.service';
import { Game, GameOptions, JoinMultiplayerOption } from '@common/game';
import { GameMode } from '@common/game-mode';
import { Player } from '@common/player';
import { VirtualPlayerType } from '@common/virtualPlayer';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Container } from 'typedi';

describe('GameService', () => {
    let service: GameService;
    let ws: WebsocketService;
    let dictionnaryService: DictionaryService;
    let timerService: TimerService;
    let easelService: EaselService;
    let gridService: GridService;
    let playerService: PlayerService;
    let objectivesService: ObjectivesService;
    let stubGameOptions: GameOptions;
    let stubJoinGameOptions: JoinMultiplayerOption;
    let stubGame: Game;
    let stubCreator: Player;
    let stubOpponent: Player;
    let addGameSessionStub: sinon.SinonStub;
    let generatePlayerLettersStub: sinon.SinonStub;
    let getGameByIdStub: sinon.SinonStub;
    let addObjectivesStub: sinon.SinonStub;
    let getPlayerByIdStub: sinon.SinonStub;
    let getDictionnaryStub: sinon.SinonStub;

    let rejoinGameRoomStub: sinon.SinonStub<[room: string, socketId: string], void>;
    let refreshTimerStub: sinon.SinonStub<[game: Game], void>;

    let clock: sinon.SinonFakeTimers;
    beforeEach(async () => {
        service = Container.get(GameService);
        ws = Container.get(WebsocketService);
        timerService = Container.get(TimerService);
        easelService = Container.get(EaselService);
        gridService = Container.get(GridService);
        playerService = Container.get(PlayerService);
        objectivesService = Container.get(ObjectivesService);
        dictionnaryService = Container.get(DictionaryService);

        stubGameOptions = JSON.parse(JSON.stringify(STUB_GAME_OPTIONS));
        stubCreator = JSON.parse(JSON.stringify(STUB_CREATOR));
        stubOpponent = JSON.parse(JSON.stringify(STUB_OPPONENT));
        stubGame = JSON.parse(JSON.stringify(STUB_GAME));
        stubJoinGameOptions = JSON.parse(JSON.stringify(STUB_JOIN_OPTIONS));

        addGameSessionStub = sinon.stub(service as any, 'addGameSession').returns(null);
        generatePlayerLettersStub = sinon.stub(easelService, 'generatePlayerLetters').returns(STUB_PLAYER_EASEL);
        getGameByIdStub = sinon.stub(service, 'getGameById').returns(stubGame);
        addObjectivesStub = sinon.stub(objectivesService, 'addObjectives');
        getPlayerByIdStub = sinon.stub(playerService, 'getPlayerById').returns(stubCreator);

        rejoinGameRoomStub = sinon.stub(Container.get(WebsocketService), 'rejoinGameRoom');
        refreshTimerStub = sinon.stub(Container.get(TimerService), 'refreshTimer');
        Object.defineProperty(dictionnaryService, 'dictTrie', { value: defaultDictMock, writable: true });
        Object.defineProperty(dictionnaryService, 'numberDictUser', { value: defaultDictMock, writable: true });

        getDictionnaryStub = sinon.stub(Container.get(DictionaryService), 'getDictionary');
        getDictionnaryStub.returns(dictionaryStub);

        sinon.stub(Container.get(ScoreDatabaseService), 'addNewGameScore').resolves();
        clock = sinon.useFakeTimers();

        Object.defineProperty(ws, 'io', { value: serverMock, writable: true });
    });

    afterEach(() => {
        sinon.restore();
        clock.restore();
    });

    it('should be created', () => {
        expect(service).to.be.ok;
    });

    it('initGame() should create a multiplayer game', () => {
        const game = service.initGame(stubGameOptions);
        expect(game).to.be.ok;
    });

    it('initGame() should add that game to the game sessions', () => {
        service.initGame(stubGameOptions);
        sinon.assert.calledOnce(addGameSessionStub);
    });

    it('initGame() should call updateGameSession()', () => {
        const updateGamesAvailableSpy = sinon.spy(ws.io, 'emit');
        service.initGame(stubGameOptions);
        sinon.assert.calledWith(updateGamesAvailableSpy, 'updateGamesAvailable');
    });

    it('initGame() should call generatePlayerLetters() from easel service', () => {
        service.initGame(stubGameOptions);
        sinon.assert.called(generatePlayerLettersStub);
    });

    it('initGame() should call loadGrid() from grid service', () => {
        const loadGridStub: sinon.SinonStub = sinon.stub(gridService, 'loadGrid').returns(STUB_GRID);
        service.initGame(stubGameOptions);
        sinon.assert.called(loadGridStub);
    });

    it('should init the game with the options passed in the parameters', () => {
        const game: Game = service.initGame(stubGameOptions);
        expect(game.creator?.name).to.be.eql('jamesley');
        expect(game.creator?.id).to.be.eql('id');
        expect(game.creator?.isPlaying).to.be.eql(true);
        expect(game.creator?.completedWords).to.be.eql([]);
        expect(game.creator?.score).to.be.eql(0);
        expect(game.creator?.easel).to.be.eql(STUB_PLAYER_EASEL);
        expect(game.opponent).to.be.eql(null);
        expect(game.capacity).to.be.eql(1);
        expect(game.dict).to.be.eql(stubGameOptions.dictionary);
        expect(game.time).to.be.eql(stubGameOptions.time);
        expect(game.timer).to.be.eql(stubGameOptions.time);
        expect(game.grid).to.be.eql(STUB_GRID);
        expect(game.skipCounter).to.be.eql(0);
    });

    it('joinGame() should call addOpponent() and updateGameSession()', () => {
        const stubAddOpponent = sinon.stub(playerService, 'addOpponent');
        const updateGamesAvailableSpy = sinon.spy(ws.io, 'emit');
        service.joinGame(stubJoinGameOptions);
        sinon.assert.calledOnce(stubAddOpponent);
        sinon.assert.calledWith(updateGamesAvailableSpy, 'updateGamesAvailable');
    });

    it('joinGame() should not call addOpponent() and updateGameSession() if no game is found', () => {
        const stubAddOpponent = sinon.stub(playerService, 'addOpponent');
        const updateGamesAvailableSpy = sinon.spy(ws.io, 'emit');
        getGameByIdStub.returns(undefined);
        service.joinGame(stubJoinGameOptions);
        sinon.assert.notCalled(stubAddOpponent);
        sinon.assert.notCalled(updateGamesAvailableSpy);
    });

    it('joinGame() should not call addOpponent() and updateGameSession() if the game capacity is 2', () => {
        stubGame.capacity = 2;
        const stubAddOpponent = sinon.stub(playerService, 'addOpponent');
        const updateGamesAvailableSpy = sinon.spy(ws.io, 'emit');
        getGameByIdStub.returns(stubGame);
        service.joinGame(stubJoinGameOptions);
        sinon.assert.notCalled(stubAddOpponent);
        sinon.assert.notCalled(updateGamesAvailableSpy);
    });

    it('joinGame() should call addOpponent() with isVirtualPlayer as true and updateGameSession() if the opponent isVirtual and is under 2', () => {
        stubGame.capacity = 1;
        const stubAddOpponent = sinon.stub(playerService, 'addOpponent');
        const updateGamesAvailableSpy = sinon.spy(ws.io, 'emit');
        getGameByIdStub.returns(stubGame);
        service.joinGame(stubJoinGameOptions, true);
        sinon.assert.called(stubAddOpponent);
        sinon.assert.calledWith(stubAddOpponent, stubJoinGameOptions.playerInfo, stubGame, true);
        sinon.assert.calledWith(updateGamesAvailableSpy, 'updateGamesAvailable');
    });

    it('convertToSolo() should convertGame ', () => {
        const stubJoinGame = sinon.stub(service, 'joinGame');

        service.convertToSolo(stubGame.id, STUB_OPPONENT_INFOS.name, VirtualPlayerType.debutant);
        sinon.assert.calledOnce(stubJoinGame);
    });

    it('convertToSolo() should call startGame', () => {
        sinon.stub(service, 'joinGame').returns(stubGame);
        const stubStartGame = sinon.spy(service, 'startGame');

        service.convertToSolo(stubGame.id, STUB_OPPONENT_INFOS.name, VirtualPlayerType.debutant);
        sinon.assert.calledOnce(stubStartGame);
    });

    it("startGame() should emit 'startGame' event to all sockets in room", () => {
        const wsToRoomSpy = sinon.spy(ws.io, 'to');
        service.startGame(stubGame.id);
        sinon.assert.calledWith(wsToRoomSpy, stubGame.id);
    });

    it('startGame() should call chooseAction if the opponent isVirtual and is currently playing', () => {
        const chooseActionStub = sinon.stub(Container.get(VirtualPlayerService), 'chooseAction');
        sinon.stub(playerService, 'setRandomStartingPlayer');
        (stubGame.opponent as Player).isVirtual = true;
        (stubGame.opponent as Player).isPlaying = true;
        service.startGame(stubGame.id);
        sinon.assert.called(chooseActionStub);
    });

    it('startGame() should call chooseAction if the creator isVirtual and is currently playing', () => {
        const chooseActionStub = sinon.stub(Container.get(VirtualPlayerService), 'chooseAction');
        sinon.stub(playerService, 'setRandomStartingPlayer');
        (stubGame.creator as Player).isVirtual = true;
        (stubGame.creator as Player).isPlaying = true;
        service.startGame(stubGame.id);
        sinon.assert.called(chooseActionStub);
    });

    it('startGame() should not call chooseAction if the opponent not isVirtual and is currently playing', () => {
        const chooseActionStub = sinon.stub(Container.get(VirtualPlayerService), 'chooseAction');
        sinon.stub(playerService, 'setRandomStartingPlayer');
        (stubGame.opponent as Player).isVirtual = false;
        (stubGame.opponent as Player).isPlaying = true;
        service.startGame(stubGame.id);
        sinon.assert.notCalled(chooseActionStub);
    });

    it('startGame() should call startTimer() on websocket service', () => {
        const startTimerStub = sinon.stub(timerService, 'startTimer').returns();
        service.startGame(stubGame.id);
        sinon.assert.calledWith(startTimerStub, stubGame);
    });

    it('addGameSession() should add a game to the game sessions array', () => {
        addGameSessionStub.restore();
        service.gameSessions = [];
        service['addGameSession'](stubGame);
        expect(service.gameSessions).to.be.eql([stubGame]);
    });

    it('removeGameSession() should delete game from the game sessions array and emit updateGamesAvailable', () => {
        const wsEmitSpy = sinon.spy(ws.io, 'emit');
        service.gameSessions = [stubGame];
        service.removeGameSession(stubGame);
        expect(service.gameSessions.length).to.equal(0);
        sinon.assert.calledWith(wsEmitSpy, 'updateGamesAvailable');
    });

    it('getGameById() should return the game with the specified id', () => {
        getGameByIdStub.restore();
        service.gameSessions = [stubGame];
        expect(service.getGameById(stubGame.id)).to.be.eql(stubGame);
    });

    it('getGameById() should return undefined if no game found with specified id', () => {
        getGameByIdStub.restore();
        service.gameSessions = [stubGame];
        expect(service.getGameById('bad id')).undefined;
    });

    it('reconnectToGame() should return undefined if no game found', () => {
        getGameByIdStub.returns(undefined);
        expect(service.reconnectToGame('12345', '54321', stubGame.id)).to.be.undefined;
    });

    it('reconnectToGame() should return undefined if the player abandoned', () => {
        stubCreator.hasAbandon = true;
        getPlayerByIdStub.returns(stubCreator);
        expect(service.reconnectToGame('12345', '54321', stubGame.id)).to.be.undefined;
    });

    it('reconnectToGame() should return undefined if player found', () => {
        getPlayerByIdStub.returns(undefined);
        expect(service.reconnectToGame('12345', '54321', stubGame.id)).to.be.undefined;
    });

    it('reconnectToGame() should return current game if old socket in game', () => {
        const oldId = stubCreator.id;
        getPlayerByIdStub.returns(stubCreator);
        rejoinGameRoomStub.returns();
        refreshTimerStub.returns();
        expect(service.reconnectToGame(oldId, '54321', stubGame.id)).to.be.eql(stubGame);
    });

    it("reconnectToGame() should update the creator's old id to it's new id", () => {
        const oldId = stubCreator.id;
        const newId = '54321';
        rejoinGameRoomStub.returns();
        refreshTimerStub.returns();
        service.reconnectToGame(oldId, newId, stubGame.id);
        expect(stubGame.creator.id).to.be.eql(newId);
    });

    it("reconnectToGame() should update the opponent's old id to it's new id", () => {
        getPlayerByIdStub.returns(stubOpponent);
        const oldId = stubOpponent.id;
        const newId = '54321';
        rejoinGameRoomStub.returns();
        refreshTimerStub.returns();
        service.reconnectToGame(oldId, newId, stubGame.id);
        expect(stubGame.opponent?.id).to.be.eql(newId);
    });

    it('reconnectToGame() should call rejoinGameRoom and restartTimer', () => {
        const oldId = stubOpponent.id;
        const newId = '54321';
        rejoinGameRoomStub.returns();
        refreshTimerStub.returns();
        service.reconnectToGame(oldId, newId, stubGame.id);
        sinon.assert.calledOnce(rejoinGameRoomStub);
        sinon.assert.calledOnce(refreshTimerStub);
    });

    it('deleteGame() should not do anything if no game found', () => {
        const removeGameSessionStub = sinon.stub(service, 'removeGameSession');
        getGameByIdStub.returns(undefined);
        service.deleteGame(stubGame.id);
        sinon.assert.notCalled(removeGameSessionStub);
    });

    it('deleteGame() should call removeGameSession() and notifyEndGame()', async () => {
        const removeGameSessionStub = sinon.stub(service, 'removeGameSession');
        const wsEmitSpy = sinon.spy(ws.io, 'to');
        service.deleteGame(stubGame.id);
        sinon.assert.calledOnce(removeGameSessionStub);
        sinon.assert.calledTwice(wsEmitSpy);
        expect(stubGame.hasEnded).to.be.eql(true);
    });

    it('deleteGame() should not call adjustPlayersFinalScore() if there is no opponent', () => {
        stubGame.opponent = null;
        const adjustPlayersFinalScoreStub = sinon.stub(service, 'adjustPlayersFinalScore');
        service.deleteGame(stubGame.id);
        sinon.assert.notCalled(adjustPlayersFinalScoreStub);
    });

    it('adjustPlayersFinalScore() should change the score of the creator', () => {
        const EXPECTED_SCORE = 10;
        stubGame.letterReserve = [];
        stubGame.creator = stubCreator;
        stubGame.opponent = stubOpponent;
        (stubGame.creator as Player).easel = [];

        service.adjustPlayersFinalScore(stubGame.creator, stubGame.opponent);
        expect(stubGame.creator.score).to.be.eql(EXPECTED_SCORE);
    });

    it('adjustPlayersFinalScore() should change the score of the opponent', () => {
        const EXPECTED_SCORE = 10;
        stubGame.letterReserve = [];
        stubGame.creator = stubCreator;
        stubGame.opponent = stubOpponent;
        (stubGame.opponent as Player).easel = [];

        service.adjustPlayersFinalScore(stubGame.creator, stubGame.opponent);
        expect(stubGame.opponent.score).to.be.eql(EXPECTED_SCORE);
    });

    it('adjustPlayersFinalScore() should not change the score of the players if they both still have letters', () => {
        const updatePlayerFinalScoreStub = sinon.stub(playerService, 'updatePlayerFinalScore');
        const EXPECTED_SCORE_CREATOR = 10;
        const EXPECTED_SCORE_OPPONENT = 15;
        stubGame.letterReserve = [];
        stubGame.creator = stubCreator;
        stubGame.opponent = stubOpponent;
        stubGame.creator.score = EXPECTED_SCORE_CREATOR;
        stubGame.opponent.score = EXPECTED_SCORE_OPPONENT;

        service.adjustPlayersFinalScore(stubGame.creator, stubGame.opponent);
        sinon.assert.calledTwice(updatePlayerFinalScoreStub);
        expect(stubGame.opponent.score).to.be.eql(EXPECTED_SCORE_OPPONENT);
        expect(stubGame.creator.score).to.be.eql(EXPECTED_SCORE_CREATOR);
    });

    it('handleMaxSkip() should call deleteGame() if skipCounter is at 6', () => {
        const endGameStub = sinon.stub(service, 'deleteGame');
        stubGame.skipCounter = 6;
        service.handleMaxSkip(stubGame);
        sinon.assert.calledOnce(endGameStub);
    });

    it('handleMaxSkip() should not do anything if skipCounter is lower than 6', () => {
        const endGameStub = sinon.stub(service, 'deleteGame');
        stubGame.skipCounter = 2;
        service.handleMaxSkip(stubGame);
        sinon.assert.notCalled(endGameStub);
    });

    it('startGame() should call addObjectives if game mode is Log2990', () => {
        stubGame.mode = GameMode.Log2990;
        service.startGame(stubGame.id);
        sinon.assert.calledOnce(addObjectivesStub);
        sinon.assert.calledWith(addObjectivesStub, stubGame);
    });

    it('isDictionnaryDeletedshould emit nonExistingDict if dict is deleted', () => {
        getDictionnaryStub.returns(undefined);
        const wsEmitSpy = sinon.spy(ws.io, 'in');
        service['isDictionnaryDeleted'](stubGame.id);
        sinon.assert.calledWith(wsEmitSpy, stubGame.id);
    });
});
