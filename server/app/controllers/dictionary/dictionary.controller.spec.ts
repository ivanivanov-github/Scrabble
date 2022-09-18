/* eslint-disable max-lines */
/* eslint-disable dot-notation */
import { Application } from '@app/app';
import { dictionaryStub } from '@app/classes/mocks/dictionary-stub';
import { DictionaryService } from '@app/services/dictionary/dictionary.service';
import { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import * as sinon from 'sinon';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import * as supertest from 'supertest';
import { Container } from 'typedi';

describe('DictionaryController', () => {
    let dictionaryService: SinonStubbedInstance<DictionaryService>;
    let expressApp: Express.Application;

    beforeEach(async () => {
        dictionaryService = createStubInstance(DictionaryService);
        const app = Container.get(Application);
        Object.defineProperty(app['dictionaryController'], 'dictionaryService', { value: dictionaryService, writable: true });
        expressApp = app.app;
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('GET /dictionaries/:title', () => {
        it('should succeed', async () => {
            const title = 'title';
            dictionaryService.getDictionary.returns(dictionaryStub);
            return supertest(expressApp)
                .get('/api/dictionaries/' + title)
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.OK);
                    expect(res.body).to.deep.equal(dictionaryStub);
                });
        });

        it('should not succeed', async () => {
            const error = new Error('some fake error');
            dictionaryService.getDictionary.throws(error);
            return supertest(expressApp)
                .get('/api/dictionaries/' + 'title')
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.INTERNAL_SERVER_ERROR);
                });
        });

        it('should not succeed with 404', async () => {
            dictionaryService.getDictionary.returns(undefined);
            return supertest(expressApp)
                .get('/api/dictionaries/' + 'title')
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.NOT_FOUND);
                });
        });
    });

    describe('GET /dictionaries', () => {
        it('should succeed', async () => {
            dictionaryService.getDictionnariesHeaders.returns([
                { title: 'title1', description: '' },
                { title: 'title2', description: '' },
            ]);
            return supertest(expressApp)
                .get('/api/dictionaries')
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.OK);
                    expect(res.body).to.be.deep.equal([
                        { title: 'title1', description: '' },
                        { title: 'title2', description: '' },
                    ]);
                });
        });

        it('should not succeed', async () => {
            const error = new Error('some fake error');
            dictionaryService.getDictionnariesHeaders.throws(error);
            return supertest(expressApp)
                .get('/api/dictionaries')
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.INTERNAL_SERVER_ERROR);
                });
        });

        it('GET /dictionaries should not succeed', async () => {
            const error = new Error('some fake error');
            dictionaryService.getDictionnariesHeaders.throws(error);
            return supertest(expressApp)
                .get('/api/dictionaries')
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.INTERNAL_SERVER_ERROR);
                });
        });
    });

    describe('PATCH /dictionaries', () => {
        it('should succeed', async () => {
            dictionaryService.modifyDictionary.resolves();
            return supertest(expressApp)
                .patch('/api/dictionaries')
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.NO_CONTENT);
                });
        });

        it('should not succeed (default dictionary)', async () => {
            const error = new Error('Vous ne pouvez pas modifier le dictionnaire par défaut');
            dictionaryService.modifyDictionary.throws(error);

            return supertest(expressApp)
                .patch('/api/dictionaries')
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
                });
        });

        it('should not succeed (dictionary not found)', async () => {
            const error = new Error("Le dictionnaire n'existe pas");
            dictionaryService.modifyDictionary.throws(error);

            return supertest(expressApp)
                .patch('/api/dictionaries')
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.NOT_FOUND);
                });
        });

        it('should not succeed', async () => {
            const error = new Error('some fake error');
            dictionaryService.modifyDictionary.throws(error);

            return supertest(expressApp)
                .patch('/api/dictionaries')
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.INTERNAL_SERVER_ERROR);
                });
        });
    });

    describe('DELETE /dictionaries/:dictionaryName', () => {
        it('should succeed', async () => {
            const dictionaryName = 'def';
            dictionaryService.deleteDictionary.resolves();
            return supertest(expressApp)
                .delete('/api/dictionaries/' + dictionaryName)
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.NO_CONTENT);
                });
        });

        it('should not succeed (default dictionary)', async () => {
            const dictionaryName = 'def';
            const error = new Error('Vous ne pouvez pas supprimer le dictionnaire par défaut');
            dictionaryService.deleteDictionary.throws(error);

            return supertest(expressApp)
                .delete('/api/dictionaries/' + dictionaryName)
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
                });
        });

        it('should not succeed', async () => {
            const dictionaryName = 'def';

            const error = new Error('some fake error');
            dictionaryService.deleteDictionary.throws(error);

            return supertest(expressApp)
                .delete('/api/dictionaries/' + dictionaryName)
                .send()
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.INTERNAL_SERVER_ERROR);
                });
        });
    });

    describe('POST /dictionaries', () => {
        it(' should succeed', async () => {
            dictionaryService.addDictionary.returns(Promise.resolve(undefined));
            return supertest(expressApp)
                .post('/api/dictionaries')
                .send(dictionaryStub)
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.CREATED);
                });
        });

        it(' should not succeed (already exists)', async () => {
            const error = new Error('Le dictionnaire existe déjà');

            dictionaryService.addDictionary.throws(error);
            return supertest(expressApp)
                .post('/api/dictionaries')
                .send(dictionaryStub)
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.CONFLICT);
                });
        });

        it('should not succeed', async () => {
            const error = new Error('some fake error');

            dictionaryService.addDictionary.throws(error);
            return supertest(expressApp)
                .post('/api/dictionaries')
                .send(dictionaryStub)
                .then((res) => {
                    expect(res.status).to.be.equal(StatusCodes.INTERNAL_SERVER_ERROR);
                });
        });
    });
});
