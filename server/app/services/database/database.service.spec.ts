/* eslint-disable dot-notation,
@typescript-eslint/no-unused-expressions,
@typescript-eslint/no-empty-function,
no-unused-expressions,
*/
import { PlayerScore } from '@common/player-score';
import { expect } from 'chai';
import { describe } from 'mocha';
import { Db, MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import * as sinon from 'sinon';
import { Container } from 'typedi';
import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
    let service: DatabaseService;
    let mongoServer: MongoMemoryServer;
    let serverUrl: string;
    let sandbox: sinon.SinonSandbox;

    beforeEach(async () => {
        sandbox = sinon.createSandbox();
        service = Container.get(DatabaseService);
        mongoServer = await MongoMemoryServer.create();
        serverUrl = mongoServer.getUri();
        await new Promise<void>((resolve) => {
            resolve();
        });
    });

    afterEach(async () => {
        sinon.restore();
        await mongoServer.stop();
        await service.closeConnection();
    });

    it('should be created', () => {
        expect(service).to.be.equal(service);
    });

    it('getdatabase should return an instance of database', async () => {
        await service.connectToServer(serverUrl);
        expect(service.database).to.be.instanceof(Db);
    });

    it('should connect to the database', async () => {
        await service.connectToServer(serverUrl);
        expect(service['client']).not.to.equal(undefined);
        expect(service['client']).to.be.instanceof(MongoClient);
    });

    it('should call closeConnection if an error occur', async () => {
        sandbox.stub(service['client'], 'connect').throws(new Error('error'));
        const closeConnectionSpy = sinon.spy(service, 'closeConnection');
        try {
            await service.connectToServer('CORRUPTED_URL');
        } catch (err) {
            sinon.assert.calledOnce(closeConnectionSpy);
        }
    });

    it('it should not populateDb if the collection isnt empty', async () => {
        const playerScore1: PlayerScore = { name: 'Daniel', score: 20 };
        const playerScore2: PlayerScore = { name: 'Hello', score: 20 };
        const collectionName = 'Test';
        await service.connectToServer(serverUrl);
        await service['db'].createCollection(collectionName);
        await service['db'].collection(collectionName).insertOne(playerScore1);
        await service.populateDb(collectionName, [playerScore1, playerScore2]);
        const insertedPlayers = await service['db'].collection(collectionName).find({}).toArray();
        expect(insertedPlayers.length).to.equal(1);
        expect(insertedPlayers).to.deep.equal([playerScore1]);
    });

    it('it should populateDb if the collection empty', async () => {
        const playerScore1: PlayerScore = { name: 'Daniel', score: 20 };
        const playerScore2: PlayerScore = { name: 'Hello', score: 20 };
        const collectionName = 'Test';
        await service.connectToServer(serverUrl);
        await service['db'].createCollection(collectionName);
        await service.populateDb(collectionName, [playerScore1, playerScore2]);
        const insertedPlayers = await service['db'].collection(collectionName).find({}).toArray();
        expect(insertedPlayers.length).to.equal(2);
        expect(insertedPlayers).to.deep.equal([playerScore1, playerScore2]);
    });
});
