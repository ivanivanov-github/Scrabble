/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable dot-notation */
import { STUB_GAME } from '@app/classes/mocks/game-service-stubs';
import { DatabaseService } from '@app/services/database/database.service';
import { Player } from '@common/player';
import { PlayerScore } from '@common/player-score';
import { assert } from 'chai';
import { describe } from 'mocha';
import { Collection, Db, FindCursor } from 'mongodb';
import * as sinon from 'sinon';
import { Container } from 'typedi';
import { GameHistoryService } from './game-history.service';

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
describe('GameHistoryService', () => {
    let service: GameHistoryService;
    let dbServiceStub: sinon.SinonStubbedInstance<DatabaseService>;
    let collectionStub: sinon.SinonStubbedInstance<Collection>;
    let dbStub: sinon.SinonStubbedInstance<Db>;

    let serverUrl: string;

    beforeEach(async () => {
        dbServiceStub = sinon.createStubInstance(DatabaseService);
        dbStub = sinon.createStubInstance(Db);
        dbServiceStub['db'] = dbStub;
        collectionStub = sinon.createStubInstance(Collection);
        collectionStub.insertOne.resolves(undefined);
        collectionStub.insertMany.resolves();
        collectionStub.deleteOne.resolves();
        collectionStub.find.returns(new ScoreMocks() as unknown as FindCursor);
        collectionStub.findOne.resolves(score);
        collectionStub.countDocuments.resolves(0);
        dbStub.collection.returns(collectionStub as unknown as Collection);
        service = Container.get(GameHistoryService);

        service = new GameHistoryService(dbServiceStub as unknown as DatabaseService);
        await dbServiceStub.connectToServer(serverUrl);
    });
    afterEach(() => {
        sinon.restore();
    });
    it('shoud create', () => {
        assert(service);
    });
    it('should reset  Game Hisroty', async () => {
        collectionStub.countDocuments.resolves(1);
        await service.reset();
        sinon.assert.calledOnce(collectionStub.drop);
    });

    it('should not reset  Game Hisroty', async () => {
        await service.reset();
        sinon.assert.notCalled(collectionStub.drop);
    });

    it('should create New Game History', () => {
        const game = JSON.parse(JSON.stringify(STUB_GAME));
        game.creator.hasAbandon = true;
        (game.opponent as Player).isVirtual = true;
        assert.isTrue(service['createNewGameHistory'](game).gameAbandoned);
    });
});
