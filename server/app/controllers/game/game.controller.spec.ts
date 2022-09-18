/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable dot-notation */

import { Application } from '@app/app';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/game/player/player.service';
import { Game, GameOptions, JoinMultiplayerOption } from '@common/game';
import { GameMode } from '@common/game-mode';
import { Player, PlayerInfo } from '@common/player';
import { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import * as sinon from 'sinon';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import * as supertest from 'supertest';
import { Container } from 'typedi';

describe('GameController', () => {
    let gameService: SinonStubbedInstance<GameService>;
    let playerService: SinonStubbedInstance<PlayerService>;
    let expressApp: Express.Application;

    const gameOption: GameOptions = {
        playerName: 'jamesley',
        playerId: 'id',
        time: 300000,
        dictionary: 'default',
        isMultiplayer: true,
        gameMode: GameMode.Classic,
    };

    const gameId = 'gameId';
    const gameStub = <Game>{
        creator: <Player>{ id: 'id', name: 'jamesley' },
        opponent: <Player>{ id: 'oponent', name: 'Eliott' },
    };

    const stubPlayerInfo: PlayerInfo = {
        name: 'test player',
        id: '123456789',
    };
    const joinOption: JoinMultiplayerOption = {
        gameId,
        playerInfo: stubPlayerInfo,
    };

    beforeEach(async () => {
        gameService = createStubInstance(GameService);
        playerService = createStubInstance(PlayerService);
        const app = Container.get(Application);
        Object.defineProperty(app['gameController'], 'gameService', { value: gameService, writable: true });
        Object.defineProperty(app['gameController'], 'playerService', { value: playerService, writable: true });
        expressApp = app.app;
    });

    const soloGameOption = {
        gameId: '123456789',
        oponentName: 'Maximus',
    };
    afterEach(() => {
        sinon.restore();
    });

    it('POST /init/multi should succeed', async () => {
        gameService.initGame.returns(gameStub);
        return supertest(expressApp)
            .post('/api/game/init/multi')
            .send(gameOption)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.CREATED);
                const gameRes: Game = res.body;
                expect(gameRes.creator?.name).to.deep.equal(gameOption.playerName);
                expect(gameRes.creator?.id).to.deep.equal(gameOption.playerId);
            });
    });

    it('POST /init/multi should not succeed', async () => {
        const error = new Error('some fake error');
        gameService.initGame.throws(error);
        return supertest(expressApp)
            .post('/api/game/init/multi')
            .send(gameOption)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.NOT_FOUND);
                expect(res.body).to.deep.equal({});
            });
    });

    it('POST /join should succeed', async () => {
        gameService.joinGame.returns(gameStub);
        return supertest(expressApp)
            .post('/api/game/join')
            .send(joinOption)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.OK);
            });
    });
    it('POST /join should not succeed', async () => {
        gameService.joinGame.returns(undefined);
        return supertest(expressApp)
            .post('/api/game/join')
            .send(joinOption)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.NOT_FOUND);
            });
    });

    it('POST /join should not return an internal server error', async () => {
        const error = new Error('some fake error');
        gameService.joinGame.throws(error);
        return supertest(expressApp)
            .post('/api/game/join')
            .send(joinOption)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.INTERNAL_SERVER_ERROR);
            });
    });

    it('POST /start should succeed', async () => {
        gameService.startGame.returns();
        return supertest(expressApp)
            .post('/api/game/start')
            .send(gameId)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.CREATED);
            });
    });

    it('POST /start should succeed', async () => {
        const error = new Error('some fake error');
        gameService.startGame.throws(error);
        return supertest(expressApp)
            .post('/api/game/start')
            .send(gameId)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.NOT_FOUND);
            });
    });

    it('DELETE /rejectPlayer should succeed', async () => {
        gameService.getGameById.returns(gameStub);
        playerService.rejectPlayer.returns();
        return supertest(expressApp)
            .delete('/api/game/rejectPlayer')
            .send(gameId)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.OK);
            });
    });

    it('DELETE /rejectPlayer should succeed if no game', async () => {
        gameService.getGameById.returns(undefined);
        playerService.rejectPlayer.returns();
        return supertest(expressApp)
            .delete('/api/game/rejectPlayer')
            .send(gameId)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.NOT_FOUND);
            });
    });

    it('DELETE /rejectPlayer should succeed', async () => {
        const error = new Error('some fake error');
        playerService.rejectPlayer.throws(error);
        gameService.getGameById.returns(gameStub);
        return supertest(expressApp)
            .delete('/api/game/rejectPlayer')
            .send(gameId)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.NOT_FOUND);
            });
    });

    it('DELETE /gameSession should succeed', async () => {
        gameService.removeGameSession.returns();
        return supertest(expressApp)
            .delete('/api/game/gameSession')
            .send(gameId)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.OK);
            });
    });

    it('DELETE /gameSession should succeed', async () => {
        const error = new Error('some fake error');
        gameService.removeGameSession.throws(error);
        return supertest(expressApp)
            .delete('/api/game/gameSession')
            .send(gameId)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.NOT_FOUND);
            });
    });

    it('GET /gameSession should succeed', async () => {
        return supertest(expressApp)
            .get('/api/game/gameSession')
            .send(gameId)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.OK);
            });
    });

    it('POST /convertSolo should succeed', async () => {
        const error = new Error('some fake error');
        gameService.convertToSolo.throws(error);
        return supertest(expressApp)
            .post('/api/game/convertSolo')
            .send(soloGameOption)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.NOT_FOUND);
            });
    });

    it('POST /convertSolo should succeed', async () => {
        gameService.convertToSolo.rejects();
        return supertest(expressApp)
            .post('/api/game/convertSolo')
            .send(soloGameOption)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.OK);
            });
    });

    it('POST /playerCheck should not succeed without a player', async () => {
        gameService.getGameById.returns(gameStub);
        return supertest(expressApp)
            .post('/api/game/playerCheck')
            .send(gameId)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.NOT_FOUND);
                // expect(res.body).to.be.equal(true);
            });
    });

    it('POST /playerCheck should not succeed if the player abandoned', async () => {
        gameService.getGameById.returns(gameStub);
        gameStub.creator.hasAbandon = true;
        playerService.getPlayerById.returns(gameStub.creator);
        return supertest(expressApp)
            .post('/api/game/playerCheck')
            .send(gameId)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.OK);
                expect(res.body).to.be.equal(false);
            });
    });

    it('POST /playerCheck should succeed if the player has not abandoned', async () => {
        gameService.getGameById.returns(gameStub);
        gameStub.creator.hasAbandon = false;
        playerService.getPlayerById.returns(gameStub.creator);
        return supertest(expressApp)
            .post('/api/game/playerCheck')
            .send(gameId)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.OK);
                expect(res.body).to.be.equal(true);
            });
    });

    it("POST /playerCheck shouldn't succeed", async () => {
        gameService.getGameById.returns(undefined);
        return supertest(expressApp)
            .post('/api/game/playerCheck')
            .send(gameId)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.NOT_FOUND);
            });
    });

    it('POST /playerCheck should send an internal server error', async () => {
        const error = new Error('some fake error');
        gameService.getGameById.throws(error);
        return supertest(expressApp)
            .post('/api/game/playerCheck')
            .send(gameId)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.INTERNAL_SERVER_ERROR);
            });
    });

    it('POST /reconnect should reconnect', async () => {
        gameService.reconnectToGame.returns(gameStub);
        return supertest(expressApp)
            .post('/api/game/reconnect')
            .send(gameId)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.OK);
                const gameRes: Game = res.body;
                expect(gameRes.creator?.name).to.deep.equal(gameOption.playerName);
                expect(gameRes.creator?.id).to.deep.equal(gameOption.playerId);
            });
    });

    it("POST /reconnect should not succeed end send back 'Reconnection timeout'", async () => {
        gameService.reconnectToGame.returns(undefined);
        return supertest(expressApp)
            .post('/api/game/reconnect')
            .send(gameId)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.NOT_FOUND);
                expect(res.body).to.deep.equal('Reconnection timeout');
            });
    });

    it('POST /reconnect should not succeed and send back an internal server error', async () => {
        const error = new Error('some fake error');
        gameService.reconnectToGame.throws(error);
        return supertest(expressApp)
            .post('/api/game/reconnect')
            .send(gameId)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.INTERNAL_SERVER_ERROR);
            });
    });

    it('POST /reconnect should not succeed', async () => {
        const error = new Error('some fake error');
        gameService.reconnectToGame.throws(error);
        return supertest(expressApp)
            .post('/api/game/reconnect')
            .send(gameId)
            .then((res) => {
                expect(res.status).to.be.equal(StatusCodes.INTERNAL_SERVER_ERROR);
            });
    });
});
