/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable dot-notation */
import { defaultDictMock, defaultNumberDictUser } from '@app/classes/mocks/clue-service-mock';
import { dictionaryStub } from '@app/classes/mocks/dictionary-stub';
import { STUB_GAME } from '@app/classes/mocks/game-service-stubs';
import { assert, expect } from 'chai';
import * as fs from 'fs';
import { describe } from 'mocha';
import * as sinon from 'sinon';
import { Container } from 'typedi';
import { DictionaryService } from './dictionary.service';

describe('Dictionary Service', () => {
    let service: DictionaryService;

    beforeEach(async () => {
        service = Container.get(DictionaryService);
        sinon.stub(fs.promises as any, 'readdir').resolves(['dictionary.json', 'dictionary2.json']);
        service.dictionaries = [dictionaryStub];
        service.defaultDict = dictionaryStub;
        Object.defineProperty(service, 'dictTrie', { value: defaultDictMock, writable: true });
        Object.defineProperty(service, 'numberDictUser', { value: defaultNumberDictUser, writable: true });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should init the dictionaries', async () => {
        sinon.stub(service as any, 'parseDictionary').resolves(dictionaryStub);
        await service.init();
        expect(service.dictionaries).to.have.lengthOf(2);
    });

    it('should return the dictionary if it exists', () => {
        const dict = service.getDictionary(dictionaryStub.title);
        expect(dict).to.be.deep.equal(dictionaryStub);
    });

    it('should not return a dictionary if it does not exits', () => {
        const dict = service.getDictionary('unknown');
        assert.isUndefined(dict);
    });

    it('should return all dictionaries titles', () => {
        service.dictionaries = [
            { title: 'dictionary1', description: '', words: [] },
            { title: 'dictionary2', description: '', words: [] },
        ];
        const titles = service.getDictionnariesHeaders();
        expect(titles).to.be.deep.equal([
            { title: 'dictionary1', description: '' },
            { title: 'dictionary2', description: '' },
        ]);
    });

    it('should add a dictionary if it does not exist yet', async () => {
        const writeFileStub = sinon.stub(service as any, 'writeFile').resolves();
        const getDictionaryStub = sinon.stub(service, 'getDictionary').returns(undefined);
        await service.addDictionary(dictionaryStub);
        sinon.assert.called(getDictionaryStub);
        sinon.assert.called(writeFileStub);
    });

    it('should throw an error if it already exists', async () => {
        const writeFileStub = sinon.stub(service as any, 'writeFile').resolves();
        const getDictionaryStub = sinon.stub(service, 'getDictionary').returns(dictionaryStub);
        try {
            await service.addDictionary(dictionaryStub);
            assert.fail('Should have thrown an error');
        } catch (e) {
            assert.equal(e.message, 'Le dictionnaire existe déjà');
        }
        sinon.assert.called(getDictionaryStub);
        sinon.assert.notCalled(writeFileStub);
    });

    it('should not modify the dictionary if it does not exist', async () => {
        const writeFileStub = sinon.stub(service as any, 'writeFile').resolves();
        sinon.stub(service, 'getDictionary').returns(undefined);
        try {
            await service.modifyDictionary(dictionaryStub.title, 'newTitle', 'New Description');
        } catch (e) {
            assert.equal(e.message, "Le dictionnaire n'existe pas");
        }
        sinon.assert.notCalled(writeFileStub);
    });

    it('should not modify the dictionary if it is the default one', async () => {
        const writeFileStub = sinon.stub(service as any, 'writeFile').resolves();
        sinon.stub(service, 'getDictionary').returns(dictionaryStub);
        service.defaultDict.title = dictionaryStub.title;
        try {
            await service.modifyDictionary(dictionaryStub.title, 'newTitle', 'New Description');
        } catch (e) {
            assert.equal(e.message, 'Vous ne pouvez pas modifier le dictionnaire par défaut');
        }
        sinon.assert.notCalled(writeFileStub);
    });

    it('should modifyDict', async () => {
        const writeFileStub = sinon.stub(service as any, 'writeFile').resolves();
        sinon.stub(service, 'getDictionary').resolves(dictionaryStub);
        await service.modifyDictionary(dictionaryStub.title, 'newTitle', 'New Description');
        sinon.assert.calledOnce(writeFileStub);
    });

    it('should modifyDict even with empty string', async () => {
        const writeFileStub = sinon.stub(service as any, 'writeFile').resolves();
        sinon.stub(service, 'getDictionary').resolves(dictionaryStub);
        await service.modifyDictionary(dictionaryStub.title, '', '');
        sinon.assert.calledOnce(writeFileStub);
    });

    it('should not delete dictionary if it is the default Dict', async () => {
        const deleteFileStub = sinon.stub(service as any, 'deleteFile').resolves();
        service.defaultDict.title = 'dictionnaire par défaut';
        try {
            await service.deleteDictionary('dictionnaire par défaut');
        } catch (e) {
            assert.equal(e.message, 'Vous ne pouvez pas supprimer le dictionnaire par défaut');
        }
        sinon.assert.notCalled(deleteFileStub);
    });

    it('should delete dictionary', async () => {
        const deleteFileStub = sinon.stub(service as any, 'deleteFile').resolves();
        await service.deleteDictionary('not dictionnaire par défaut');
        sinon.assert.calledOnce(deleteFileStub);
    });

    it('should reset dictionaries', async () => {
        const deleteFileStub = sinon.stub(service as any, 'deleteFile').resolves();
        await service.reset();
        sinon.assert.calledOnce(deleteFileStub);
    });

    it('should write dictionary to a file', () => {
        const writeFileStub = sinon.stub(fs.promises, 'writeFile').resolves();
        service['writeFile'](dictionaryStub, dictionaryStub.title);
        sinon.assert.called(writeFileStub);
    });

    it('should delete a file', () => {
        const unlinkStub = sinon.stub(fs.promises, 'unlink').resolves();
        service['deleteFile'](dictionaryStub.title);
        sinon.assert.called(unlinkStub);
    });
    it('verifyWord() should return true if word is in dict', () => {
        expect(service.verifyWord('dictTitle', 'test')).to.be.eql(false);
    });

    it("verifyWord() should return false if word isn't in dict", () => {
        expect(service.verifyWord('dictTitle', 'notTest')).to.be.eql(true);
    });

    it('it should update number of User in DictTrie ', () => {
        const setNumberDict = sinon.spy(service.numberDictUser, 'set');
        service.updateNumberOfUserOfDictTrie(STUB_GAME.id);
        sinon.assert.calledOnce(setNumberDict);
    });

    it('it should delete dict Trie if no one is using it', () => {
        const deleteDict = sinon.spy(service.dictTrie, 'delete');
        sinon.stub(service.numberDictUser, 'get').returns(0);
        service.updateNumberOfUserOfDictTrie(STUB_GAME.id);
        sinon.assert.calledOnce(deleteDict);
    });
});
