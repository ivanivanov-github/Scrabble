/* eslint-disable @typescript-eslint/no-magic-numbers */ // Shouldn't define constants for magic numbers
/* eslint-disable max-lines */ // Test files can be longer than maximum number of lines given by eslint
/* eslint-disable @typescript-eslint/no-useless-constructor,no-unused-vars,@typescript-eslint/no-empty-function */
/* eslint-disable dot-notation */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-expressions -- Needed for chai library assertions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { STUB_PLAYER_EASEL, STUB_PLAYER_EASEL_NO_STAR } from '@app/classes/mocks/easel-service-stubs';
import { STUB_CREATOR, STUB_GAME, STUB_GAME_OPTIONS, STUB_OPPONENT, STUB_OPPONENT_INFOS } from '@app/classes/mocks/game-service-stubs';
import { serverMock } from '@app/classes/mocks/web-socket-mock';
import { EaselService } from '@app/services/game/easel/easel.service';
import { GameService } from '@app/services/game/game.service';
import { WebsocketService } from '@app/services/socket/websocket.service';
import { Game, GameOptions } from '@common/game';
import { Player, PlayerInfo } from '@common/player';
import { VirtualPlayerType } from '@common/virtualPlayer';
import { assert, expect } from 'chai';
import * as sinon from 'sinon';
import { Container } from 'typedi';
import { PlayerService } from './player.service';

describe('PlayerService', () => {
    let service: PlayerService;
    let easelService: EaselService;
    let ws: WebsocketService;
    let gameService: GameService;
    let stubGame: Game;
    let stubGameOptions: GameOptions;
    let stubCreator: Player;
    let stubOpponent: Player;
    let stubOpponentInfos: PlayerInfo;
    let generatePlayerLettersStub: sinon.SinonStub;

    beforeEach(() => {
        service = Container.get(PlayerService);
        easelService = Container.get(EaselService);
        ws = Container.get(WebsocketService);
        gameService = Container.get(GameService);

        stubGame = JSON.parse(JSON.stringify(STUB_GAME));
        stubGameOptions = JSON.parse(JSON.stringify(STUB_GAME_OPTIONS));
        stubCreator = JSON.parse(JSON.stringify(STUB_CREATOR));
        stubOpponent = JSON.parse(JSON.stringify(STUB_OPPONENT));
        stubOpponentInfos = JSON.parse(JSON.stringify(STUB_OPPONENT_INFOS));

        generatePlayerLettersStub = sinon.stub(easelService, 'generatePlayerLetters').returns(STUB_PLAYER_EASEL);

        Object.defineProperty(ws, 'io', { value: serverMock, writable: true });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should be created', () => {
        expect(service).to.be.ok;
    });

    it('addCreator() should create a player object', () => {
        const result = service.addCreator(stubGameOptions, stubCreator.easel);

        expect(result).to.be.ok;
        expect(result.id).to.equal(stubGameOptions.playerId);
        expect(result.name).to.equal(stubGameOptions.playerName);
        expect(result.isPlaying).to.equal(true);
        expect(result.completedWords).to.deep.equal([]);
        expect(result.easel).to.equal(stubCreator.easel);
        expect(result.score).to.equal(0);
    });

    it('addOpponent() should call generatePlayerLetters() from easel service', () => {
        service.addOpponent(stubOpponentInfos, stubGame);
        sinon.assert.calledOnce(generatePlayerLettersStub);
    });

    it('addOpponent() should call generatePlayerLetters() from easel service', () => {
        stubOpponentInfos.virtualPlayerType = VirtualPlayerType.debutant;
        service.addOpponent(stubOpponentInfos, stubGame);
        sinon.assert.calledOnce(generatePlayerLettersStub);
    });

    it('addOpponent() should call increase the game capacity by 1', () => {
        stubGame.capacity = 1;
        service.addOpponent(stubOpponentInfos, stubGame);
        expect(stubGame.capacity).to.be.eql(2);
    });

    it('addOpponent() should add an opponent to the game', () => {
        service.addOpponent(stubOpponentInfos, stubGame);
        expect(stubGame.opponent).to.be.eql(stubOpponent);
    });
    it('TODO addOpponent() should add an virtualPlayer opponent to the game', () => {
        service.addOpponent(stubOpponentInfos, stubGame);
        expect(stubGame.opponent).to.be.eql(stubOpponent);
    });

    it('rejectPlayer() should call removeOpponent and updateGameSession', () => {
        const removeOpponentStub = sinon.stub(service, 'removeOpponent');
        const wsToRoomSpy = sinon.spy(ws.io, 'to');
        service.rejectPlayer(stubGame);
        sinon.assert.calledOnce(removeOpponentStub);
        sinon.assert.calledWith(wsToRoomSpy, stubGame.id);
    });

    it('removeOpponent should succeed if opponent exists and emit updateGamesAvailable', () => {
        const wsEmitStub = sinon.spy(ws.io, 'emit');
        service.removeOpponent(stubGame);
        assert.isNull(stubGame.opponent, 'opponent should be null');
        sinon.assert.calledOnce(wsEmitStub);
    });

    it('removeOpponent should not do anything if opponent does not exist', () => {
        stubGame.opponent = null;
        const wsEmitStub = sinon.stub(ws.io, 'emit');
        service.removeOpponent(stubGame);
        assert.isNull(stubGame.opponent, 'opponent should be null');
        sinon.assert.notCalled(wsEmitStub);
    });

    it('getPlayerById() should return the creator from the specified game', () => {
        const player = service.getPlayerById((stubGame.creator as Player).id, stubGame);
        expect(player).to.equal(stubGame.creator);
    });

    it('getPlayerById() should return the opponent from the specified game', () => {
        const player = service.getPlayerById((stubGame.opponent as Player).id, stubGame);
        expect(player).to.equal(stubGame.opponent);
    });

    it('getPlayerById() should return undefined if player does not exist', () => {
        const player = service.getPlayerById('unknown', stubGame);
        expect(player).to.be.undefined;
    });

    it('incrementPlayerScore() should call getPlayerById', () => {
        const getPlayerByIdStub = sinon.stub(service, 'getPlayerById').returns(stubCreator);
        service.incrementPlayerScore(5, stubCreator.id, stubGame);
        sinon.assert.calledOnce(getPlayerByIdStub);
    });

    it("incrementPlayerScore() should increase the player's score from 0 to 5", () => {
        sinon.stub(service, 'getPlayerById').returns(stubCreator);
        service.incrementPlayerScore(5, stubCreator.id, stubGame);
        expect(stubCreator.score).to.equal(5);
    });

    it('incrementPlayerScore() should not do anything if player not found', () => {
        sinon.stub(service, 'getPlayerById').returns(undefined);
        service.incrementPlayerScore(5, 'unknown', stubGame);
        expect(stubCreator.score).to.equal(0);
    });

    it("updatePlayerFinalScore() should update player's score with returned value of getRemainingLettersScore()", () => {
        const getRemainingLettersScoreStub = sinon.stub(service, 'getRemainingLettersScore').returns(5);
        stubCreator.score = 7;
        service['updatePlayerFinalScore'](stubCreator);
        expect(stubCreator.score).to.equal(2);
        sinon.assert.calledOnce(getRemainingLettersScoreStub);
    });

    it("updatePlayerFinalScore() should update make player's score 0 if it's real score is below 0", () => {
        const getRemainingLettersScoreStub = sinon.stub(service, 'getRemainingLettersScore').returns(5);
        stubCreator.score = 2;
        service['updatePlayerFinalScore'](stubCreator);
        expect(stubCreator.score).to.equal(0);
        sinon.assert.calledOnce(getRemainingLettersScoreStub);
    });

    it('switchPlayerTurn() should keep the creator as the current player if there is no opponent in game', () => {
        stubGame.opponent = null;
        service.switchPlayerTurn(stubGame);
        expect(stubGame.creator.isPlaying).to.be.eql(true);
    });

    it('switchPlayerTurn() should put the creator as the current player, and the opponent as the spectator', () => {
        stubCreator.isPlaying = false;
        stubOpponent.isPlaying = true;
        stubGame.creator = stubCreator;
        stubGame.opponent = stubOpponent;
        service.switchPlayerTurn(stubGame);
        expect(stubGame.creator.isPlaying).to.be.eql(true);
        expect(stubGame.opponent?.isPlaying).to.be.eql(false);
    });

    it('switchPlayerTurn() should put the opponent as the current player, and the creator as the spectator', () => {
        service.switchPlayerTurn(stubGame);
        expect(stubGame.creator?.isPlaying).to.be.eql(false);
        expect(stubGame.opponent?.isPlaying).to.be.eql(true);
    });

    it('switchPlayerTurn() should reset the game timer to the default game time', () => {
        stubGame.timer = 2000;
        service.switchPlayerTurn(stubGame);
        expect(stubGame.timer).to.be.eql(stubGame.time);
    });

    it('switchPlayerTurn() should call handleMaxSkip', () => {
        const stubHandleMaxSkip = sinon.stub(gameService, 'handleMaxSkip').resolves();
        service.switchPlayerTurn(stubGame);
        sinon.assert.calledOnce(stubHandleMaxSkip);
    });

    it("getRemainingLettersScore() should sum the value of each remaining letters on player's easel", () => {
        stubCreator.easel = STUB_PLAYER_EASEL_NO_STAR;
        expect(service.getRemainingLettersScore(stubCreator)).to.be.eql(11);
    });

    it('updateEasel() should assign player easel with the one given in parameters', () => {
        const getPlayerByIdStub = sinon.stub(service, 'getPlayerById').returns(stubCreator);
        service.updateEasel(STUB_PLAYER_EASEL_NO_STAR, stubCreator.id, stubGame);
        sinon.assert.calledWith(getPlayerByIdStub, stubCreator.id);
        expect(stubCreator.easel).to.be.eql(STUB_PLAYER_EASEL_NO_STAR);
    });

    it('updateEasel() should not do anything if player not found', () => {
        const getPlayerByIdStub = sinon.stub(service, 'getPlayerById').returns(undefined);
        service.updateEasel(STUB_PLAYER_EASEL_NO_STAR, 'unknown', stubGame);
        sinon.assert.calledWith(getPlayerByIdStub, 'unknown');
        expect(stubCreator.easel).to.be.eql(STUB_PLAYER_EASEL);
    });

    it('setRandomStartingPlayer() should not switch players turn if random result rounded is 0', () => {
        sinon.stub(Math, 'round').returns(0);
        const switchPlayerTurnStub = sinon.stub(service, 'switchPlayerTurn');
        service.setRandomStartingPlayer(stubGame);
        sinon.assert.notCalled(switchPlayerTurnStub);
    });

    it('setRandomStartingPlayer() should switch players turn if random result rounded is 1', () => {
        sinon.stub(Math, 'round').returns(1);
        const switchPlayerTurnStub = sinon.stub(service, 'switchPlayerTurn');
        service.setRandomStartingPlayer(stubGame);
        sinon.assert.calledOnce(switchPlayerTurnStub);
    });
});
