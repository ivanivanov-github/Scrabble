/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable dot-notation */
import { DatabaseService } from '@app/services/database/database.service';
import { VirtualPlayerName } from '@common/player';
import { VirtualPlayerType } from '@common/virtualPlayer';
import { assert, expect } from 'chai';
import { describe } from 'mocha';
import { Collection, Db, FindCursor } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import * as sinon from 'sinon';
import { Container } from 'typedi';
import { AdminService } from './admin.service';

const virtualPlayer: VirtualPlayerName = {
    name: 'Schumaner',
    type: VirtualPlayerType.debutant,
    isReadonly: false,
};
const virtualPlayerExpert: VirtualPlayerName = {
    name: 'Schumaner',
    type: VirtualPlayerType.expert,
    isReadonly: false,
};

class ScoreMocks {
    limit() {
        return this;
    }
    toArray(): VirtualPlayerName[] {
        return [virtualPlayer];
    }
    sort() {
        return this;
    }
}
describe('Admin Service', () => {
    let service: AdminService;
    let dbServiceStub: sinon.SinonStubbedInstance<DatabaseService>;
    let collectionStub: sinon.SinonStubbedInstance<Collection>;
    let dbStub: sinon.SinonStubbedInstance<Db>;

    let mongoServer: MongoMemoryServer;
    let serverUrl: string;
    beforeEach(async () => {
        dbServiceStub = sinon.createStubInstance(DatabaseService);
        dbStub = sinon.createStubInstance(Db);
        dbServiceStub['db'] = dbStub;
        collectionStub = sinon.createStubInstance(Collection);
        collectionStub.insertOne.resolves(undefined);
        collectionStub.insertMany.resolves();
        collectionStub.findOneAndDelete.resolves();
        collectionStub.findOneAndUpdate.resolves();
        collectionStub.deleteOne.resolves();
        collectionStub.drop.resolves();
        collectionStub.countDocuments.resolves(0);

        collectionStub.find.returns(new ScoreMocks() as unknown as FindCursor);
        collectionStub.findOne.resolves(virtualPlayer);
        dbStub.collection.returns(collectionStub as unknown as Collection);
        service = Container.get(AdminService);

        service = new AdminService(dbServiceStub as unknown as DatabaseService);
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
    it('shoud create', () => {
        assert(service);
    });
    it('should insert DEFAULT_VIRTUAL_PLAYER_NAME is database is empty', async () => {
        await service.init();
        sinon.assert.calledOnce(collectionStub.insertMany);
    });
    it('should not insert DEFAULT_VIRTUAL_PLAYER_NAME is database is  not empty', async () => {
        collectionStub.countDocuments.resolves(1);
        await service.init();
        sinon.assert.notCalled(collectionStub.insertMany);
    });

    it('should getVirtualPlayerNames', async () => {
        expect(await service.getVirtualPlayerNames()).to.deep.equal([virtualPlayer]);
    });

    it('should getRandomVirtualPlayerName in VurtualPlayerType.debutant', async () => {
        sinon.stub(service, 'getVirtualPlayerNames').resolves([virtualPlayer]);
        const virtualPlayerNameRes = await service.getRandomVirtualPlayerName(VirtualPlayerType.debutant);
        expect(virtualPlayerNameRes).to.equal(virtualPlayer.name);
    });

    it('should getRandomVirtualPlayerName in VurtualPlayerType.expert', async () => {
        sinon.stub(service, 'getVirtualPlayerNames').resolves([virtualPlayerExpert]);
        const virtualPlayerNameRes = await service.getRandomVirtualPlayerName(VirtualPlayerType.expert);
        expect(virtualPlayerNameRes).to.equal(virtualPlayerExpert.name);
    });

    it('should add new Virtual player', async () => {
        service.addVirtualPlayer(virtualPlayer.name, virtualPlayer.type);
        sinon.assert.calledOnce(collectionStub.insertOne);
    });

    it('should delete new Virtual player', async () => {
        service.deleteVirtualPlayer(virtualPlayer.name, virtualPlayer.type);
        sinon.assert.calledOnce(collectionStub.findOneAndDelete);
    });

    it('should rename new Virtual player', async () => {
        service.renameVirtualPlayer(virtualPlayer.name, virtualPlayer.name, virtualPlayer.type);
        sinon.assert.calledOnce(collectionStub.findOneAndUpdate);
    });

    it('should reset new Virtual player Names', async () => {
        collectionStub.countDocuments.resolves(1);
        await service.reset();
        sinon.assert.calledOnce(collectionStub.drop);
    });

    it('should not reset new Virtual player Names', async () => {
        await service.reset();
        sinon.assert.notCalled(collectionStub.drop);
    });
});
