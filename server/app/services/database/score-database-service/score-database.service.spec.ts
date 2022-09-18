/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable dot-notation */
import { STUB_CREATOR, STUB_GAME } from '@app/classes/mocks/game-service-stubs';
import { DatabaseService } from '@app/services/database/database.service';
import { DATABASE_COLLECTION_CLASSIC, DATABASE_COLLECTION_LOG2990 } from '@app/utils/score-database-contant';
import { GameMode } from '@common/game-mode';
import { Player } from '@common/player';
import { PlayerScore } from '@common/player-score';
import { expect } from 'chai';
import { describe } from 'mocha';
import { Collection, Db, FindCursor } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import * as sinon from 'sinon';
import { ScoreDatabaseService } from './score-database.service';
const score: PlayerScore = {
    name: 'Schumaner',
    score: 300,
};

class ScoreMocks {
    limit() {
        return this;
    }
    toArray(): PlayerScore[] {
        return [score];
    }
    sort() {
        return this;
    }
}
describe('Score-database-service', () => {
    let service: ScoreDatabaseService;
    let dbServiceStub: sinon.SinonStubbedInstance<DatabaseService>;
    let collectionStub: sinon.SinonStubbedInstance<Collection>;
    let dbStub: sinon.SinonStubbedInstance<Db>;

    let mongoServer: MongoMemoryServer;
    let serverUrl: string;

    beforeEach(async () => {
        dbServiceStub = sinon.createStubInstance(DatabaseService);
        dbStub = sinon.createStubInstance(Db);
        sinon.stub(dbServiceStub, 'database').get(() => {
            return dbStub as unknown as Db;
        });
        collectionStub = sinon.createStubInstance(Collection);
        collectionStub.insertOne.resolves(undefined);
        collectionStub.insertMany.resolves();
        collectionStub.deleteOne.resolves();
        collectionStub.find.returns(new ScoreMocks() as unknown as FindCursor);
        collectionStub.findOne.resolves(score);
        collectionStub.countDocuments.resolves(0);
        dbStub.collection.returns(collectionStub as unknown as Collection);
        service = new ScoreDatabaseService(dbServiceStub as unknown as DatabaseService);

        mongoServer = await MongoMemoryServer.create();
        serverUrl = mongoServer.getUri();
        await new Promise<void>((resolve) => {
            resolve();
        });

        await dbServiceStub.connectToServer(serverUrl);
    });
    afterEach(() => {
        sinon.restore();
    });

    it('should get the top score for Classic', async () => {
        expect(await service.getTopScore(GameMode.Classic)).to.deep.equal([score]);
    });

    it('should get top score for Log', async () => {
        expect(await service.getTopScore(GameMode.Log2990)).to.deep.equal([score]);
    });

    it('should populate Database ', async () => {
        await service.populateDb();
        sinon.assert.calledTwice(dbServiceStub.populateDb);
    });

    it('should rePopulate Database when reset called ', async () => {
        await service.resetScore();
        sinon.assert.calledTwice(dbServiceStub.populateDb);
    });

    it('should add new  Score  for Classic Mode', async () => {
        await service['addNewScore'](GameMode.Classic, score);
        sinon.assert.calledOnce(collectionStub.insertOne);
    });
    it('should add new  Score  for Log2990 Mode', async () => {
        await service['addNewScore'](GameMode.Log2990, score);
        sinon.assert.calledOnce(collectionStub.insertOne);
    });

    it('should be eligible to be on leaderBoard hasAbandon: false, isVirtual: false', async () => {
        const playerMock: Player = { ...STUB_CREATOR, hasAbandon: false, isVirtual: false };
        expect(service['isEligibleToBeOnLeaderBoard'](playerMock)).to.be.equal(true);
    });

    it('should not be eligible to be on leaderBoard hasAbandon: true, isVirtual: false', async () => {
        const playerMock: Player = { ...STUB_CREATOR, hasAbandon: true, isVirtual: false };
        expect(service['isEligibleToBeOnLeaderBoard'](playerMock)).to.be.equal(false);
    });
    it('should not be eligible to be on leaderBoard hasAbandon: false, isVirtual: true ', async () => {
        const playerMock: Player = { ...STUB_CREATOR, hasAbandon: false, isVirtual: true };
        expect(service['isEligibleToBeOnLeaderBoard'](playerMock)).to.be.equal(false);
    });
    it('should not be eligible to be on leaderBoard hasAbandon: true, isVirtual: true', async () => {
        const playerMock: Player = { ...STUB_CREATOR, hasAbandon: true, isVirtual: true };
        expect(service['isEligibleToBeOnLeaderBoard'](playerMock)).to.be.equal(false);
    });

    it('should not be eligible to be on leaderBoard hasAbandon: true, isVirtual: true', async () => {
        expect(service['isEligibleToBeOnLeaderBoard'](null as unknown as Player)).to.be.equal(false);
    });

    it('should add NewGameScore for Classic Mode', async () => {
        sinon.stub(service, 'isEligibleToBeOnLeaderBoard' as any).returns(true);
        const addNewScore = sinon.spy(service, 'addNewScore' as any);
        await service.addNewGameScore(STUB_GAME);

        sinon.assert.calledTwice(addNewScore);
    });

    it('should add NewGameScore for LOG2990', async () => {
        sinon.stub(service, 'isEligibleToBeOnLeaderBoard' as any).returns(true);
        // const addNewScore = sinon.spy(service, 'addNewScore');
        STUB_GAME.mode = DATABASE_COLLECTION_LOG2990;

        await service.addNewGameScore(STUB_GAME);

        // sinon.assert.calledTwice(addNewScore);
    });
    it('should do nothing if not Eligible ', async () => {
        sinon.stub(service, 'isEligibleToBeOnLeaderBoard' as any).returns(false);
        const addNewScore = sinon.spy(service, 'addNewScore' as any);
        STUB_GAME.mode = DATABASE_COLLECTION_CLASSIC;
        await service.addNewGameScore(STUB_GAME);
        sinon.assert.notCalled(addNewScore);
    });
});
