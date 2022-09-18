/* eslint-disable max-lines */
/* eslint-disable dot-notation */
import { Application } from '@app/app';
import { GAME_HISTORY_MOCKS } from '@app/classes/mocks/game-history-mocks';
import { AdminService } from '@app/services/database/admin-service/admin.service';
import { GameHistoryService } from '@app/services/database/game-history-service/game-history.service';
import { ScoreDatabaseService } from '@app/services/database/score-database-service/score-database.service';
import { DictionaryService } from '@app/services/dictionary/dictionary.service';
import { SETTING_DICTIONNARY, SETTING_HIGHSCORE, SETTING_HISTORIQUE_DES_PARTIS, SETTING_JV_NAMES } from '@common/dictionnary';
import { GameMode } from '@common/game-mode';
import { VirtualPlayerName } from '@common/player';
import { PlayerScore } from '@common/player-score';
import { VirtualPlayerType } from '@common/virtualPlayer';
import { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import * as sinon from 'sinon';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import * as supertest from 'supertest';
import { Container } from 'typedi';

describe('dbController', () => {
    let scoreService: SinonStubbedInstance<ScoreDatabaseService>;
    let adminService: SinonStubbedInstance<AdminService>;
    let dictionaryService: SinonStubbedInstance<DictionaryService>;
    let gameHistoryService: SinonStubbedInstance<GameHistoryService>;
    let expressApp: Express.Application;

    const playerScoreStub: PlayerScore[] = [
        { name: 'Jamesley', score: 100 },
        { name: 'Eliot', score: 99 },
        { name: 'Krim', score: 98 },
        { name: 'Olivier', score: 97 },
        { name: 'Ivan', score: 96 },
        { name: 'Maxime', score: 95 },
    ];
    beforeEach(async () => {
        scoreService = createStubInstance(ScoreDatabaseService);
        adminService = createStubInstance(AdminService);
        dictionaryService = createStubInstance(DictionaryService);
        gameHistoryService = createStubInstance(GameHistoryService);
        const app = Container.get(Application);
        Object.defineProperty(app['db'], 'scoreService', { value: scoreService, writable: true });
        Object.defineProperty(app['db'], 'adminService', { value: adminService, writable: true });
        Object.defineProperty(app['db'], 'dictionaryService', { value: dictionaryService, writable: true });
        Object.defineProperty(app['db'], 'gameHistoryService', { value: gameHistoryService, writable: true });

        expressApp = app.app;
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('GET /scores/:mode', () => {
        it('should succeed', async () => {
            scoreService.getTopScore.resolves(playerScoreStub);
            const isClassicMode = GameMode.Classic;
            return supertest(expressApp)
                .get('/api/db/scores/' + isClassicMode)
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.OK);
                    expect(res.body).to.be.deep.equal(playerScoreStub);
                });
        });

        it('should not succeed', async () => {
            const error = new Error('some fake error');

            scoreService.getTopScore.throws(error);
            const isClassicMode = GameMode.Classic;

            return supertest(expressApp)
                .get('/api/db/scores/' + isClassicMode)
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.INTERNAL_SERVER_ERROR);
                });
        });
    });

    describe('GET /gameHistory', () => {
        it('should succeed', async () => {
            gameHistoryService.getGameHistory.resolves([GAME_HISTORY_MOCKS]);
            return supertest(expressApp)
                .get('/api/db/gameHistory/')
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.OK);
                });
        });

        it('should not succeed', async () => {
            const error = new Error('some fake error');

            gameHistoryService.getGameHistory.throws(error);

            return supertest(expressApp)
                .get('/api/db/gameHistory/')
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.INTERNAL_SERVER_ERROR);
                });
        });
    });

    describe('GET /virtualPlayer/names/random/:mode ', () => {
        it(' should  succeed', async () => {
            const virtualPlayerName = 'Schumacher';
            adminService.getRandomVirtualPlayerName.resolves(virtualPlayerName);
            const virtualPlayerType = VirtualPlayerType.debutant;

            return supertest(expressApp)
                .get('/api/db/virtualPlayer/names/random/' + virtualPlayerType)
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.OK);
                    expect(res.body).to.be.equal(virtualPlayerName);
                });
        });
        it('should not succeed', async () => {
            const error = new Error('some fake error');

            adminService.getRandomVirtualPlayerName.throws(error);
            const virtualPlayerType = VirtualPlayerType.debutant;

            return supertest(expressApp)
                .get('/api/db/virtualPlayer/names/random/' + virtualPlayerType)
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.INTERNAL_SERVER_ERROR);
                });
        });
    });

    describe('GET /virtualPlayer/names ', () => {
        it(' should  succeed', async () => {
            const virtualPlayerNames: VirtualPlayerName[] = [{ name: 'Eliott', type: VirtualPlayerType.debutant, isReadonly: false }];
            adminService.getVirtualPlayerNames.resolves(virtualPlayerNames);

            return supertest(expressApp)
                .get('/api/db/virtualPlayer/names')
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.OK);
                    expect(res.body).to.be.deep.equal(virtualPlayerNames);
                });
        });
        it(' should not succeed', async () => {
            const error = new Error('some fake error');

            adminService.getVirtualPlayerNames.throws(error);

            return supertest(expressApp)
                .get('/api/db/virtualPlayer/names')
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.INTERNAL_SERVER_ERROR);
                });
        });
    });

    describe('POST /virtualPlayer', () => {
        it('should succeed', async () => {
            adminService.addVirtualPlayer.resolves();
            return supertest(expressApp)
                .post('/api/db/virtualPlayer')
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.OK);
                });
        });
        it('should not succeed', async () => {
            const error = new Error('some fake error');
            adminService.addVirtualPlayer.throws(error);
            return supertest(expressApp)
                .post('/api/db/virtualPlayer')
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.INTERNAL_SERVER_ERROR);
                });
        });
    });

    describe('PATCH /reset', () => {
        it('should succeed SETTING_JV_NAMES', async () => {
            adminService.reset.resolves();
            scoreService.resetScore.resolves();
            gameHistoryService.reset.resolves();
            dictionaryService.reset.resolves();
            return supertest(expressApp)
                .patch('/api/db/reset')
                .send({ settingType: SETTING_JV_NAMES })
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.OK);
                });
        });
        it('should succeed SETTING_DICTIONNARY', async () => {
            adminService.reset.resolves();
            scoreService.resetScore.resolves();
            gameHistoryService.reset.resolves();
            dictionaryService.reset.resolves();
            return supertest(expressApp)
                .patch('/api/db/reset')
                .send({ settingType: SETTING_DICTIONNARY })
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.OK);
                });
        });

        it('should succeed SETTING_HIGHSCORE', async () => {
            adminService.reset.resolves();
            scoreService.resetScore.resolves();
            gameHistoryService.reset.resolves();
            dictionaryService.reset.resolves();
            return supertest(expressApp)
                .patch('/api/db/reset')
                .send({ settingType: SETTING_HIGHSCORE })
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.OK);
                });
        });

        it('should succeed SETTING_HISTORIQUE_DES_PARTIS', async () => {
            adminService.reset.resolves();
            scoreService.resetScore.resolves();
            gameHistoryService.reset.resolves();
            dictionaryService.reset.resolves();
            return supertest(expressApp)
                .patch('/api/db/reset')
                .send({ settingType: SETTING_HISTORIQUE_DES_PARTIS })
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.OK);
                });
        });
        it('should not succeed', async () => {
            const error = new Error('some fake error');
            adminService.reset.throws(error);
            scoreService.resetScore.throws(error);
            gameHistoryService.reset.throws(error);
            dictionaryService.reset.throws(error);
            return supertest(expressApp)
                .patch('/api/db/reset')
                .send({ settingType: SETTING_JV_NAMES })
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.INTERNAL_SERVER_ERROR);
                });
        });
    });

    describe('DELETE /virtualPlayer', () => {
        it('should succeed', async () => {
            adminService.deleteVirtualPlayer.resolves();
            return supertest(expressApp)
                .delete('/api/db/virtualPlayer/')
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.OK);
                });
        });
        it('should not succeed', async () => {
            const error = new Error('some fake error');
            adminService.deleteVirtualPlayer.throws(error);

            return supertest(expressApp)
                .delete('/api/db/virtualPlayer/')
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.INTERNAL_SERVER_ERROR);
                });
        });
    });

    describe('PATCH /virtualPlayer', () => {
        it('should succeed', async () => {
            adminService.renameVirtualPlayer.resolves();
            return supertest(expressApp)
                .patch('/api/db/virtualPlayer')
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.OK);
                });
        });

        it('should not succeed', async () => {
            const error = new Error('some fake error');
            adminService.renameVirtualPlayer.throws(error);

            return supertest(expressApp)
                .patch('/api/db/virtualPlayer')
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.INTERNAL_SERVER_ERROR);
                });
        });
    });
});
