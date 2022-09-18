/* eslint-disable dot-notation */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */ // We shouldn't define constants for the sake of the test
import { STUB_PLAYER_EASEL, STUB_RESERVE, STUB_RESERVE_5_LETTERS } from '@app/classes/mocks/easel-service-stubs';
import { Letter } from '@common/grid/node';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Container } from 'typedi';
import { EaselService } from './easel.service';

describe('EaselService', () => {
    let stubPlayerEasel: Letter[];
    let stubWord: string;
    let stubReserve: string[];
    let stub5LetterReserve: string[];
    let service: EaselService;

    beforeEach(() => {
        service = Container.get(EaselService);
        stubPlayerEasel = JSON.parse(JSON.stringify(STUB_PLAYER_EASEL));
        stubWord = 'abc';
        stubReserve = JSON.parse(JSON.stringify(STUB_RESERVE));
        stub5LetterReserve = JSON.parse(JSON.stringify(STUB_RESERVE_5_LETTERS));
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should be created', () => {
        expect(service).to.be.equal(service);
    });

    it('removeLetters should call removeLetter and addLetter n times (n being the number of letters in the player easel)', () => {
        const removeLetterSpy: sinon.SinonSpy = sinon.spy(service as any, 'removeLetter');
        const addLetterSpy: sinon.SinonSpy = sinon.spy(service as any, 'addLetter');
        service.removeLetters(stubWord, stubPlayerEasel, stubReserve);
        const callCount = stubWord.length;
        sinon.assert.callCount(removeLetterSpy, callCount);
        sinon.assert.callCount(addLetterSpy, callCount);
    });

    it('addLetters should return if the randomly generated letter is undefined', () => {
        const playerEaselDeepCopy = JSON.parse(JSON.stringify(stubPlayerEasel));
        sinon.stub(service as any, 'getRandomLetter').returns(undefined);
        service['addLetter'](stubPlayerEasel, stubReserve);
        expect(stubPlayerEasel).to.be.eql(playerEaselDeepCopy);
    });

    it('should remove letter from player easel', () => {
        service['removeLetter']('a', stubPlayerEasel);
        const newPlayerEasel: Letter[] = [
            { character: 'a', value: 1 },
            { character: 'c', value: 3 },
            { character: 'd', value: 2 },
            { character: 'e', value: 1 },
            { character: '*', value: 0 },
            { character: 'g', value: 2 },
        ];
        expect(stubPlayerEasel).to.be.eql(newPlayerEasel);
    });

    it('should remove * from player easel', () => {
        service['removeLetter']('*', stubPlayerEasel);
        const newPlayerEasel: Letter[] = [
            { character: 'a', value: 1 },
            { character: 'a', value: 1 },
            { character: 'c', value: 3 },
            { character: 'd', value: 2 },
            { character: 'e', value: 1 },
            { character: 'g', value: 2 },
        ];
        expect(stubPlayerEasel).to.be.eql(newPlayerEasel);
    });

    it('addLetter should call getRandomLetter and updateLetterReserve once', () => {
        const getRandomLetterSpy: sinon.SinonSpy = sinon.spy(service as any, 'getRandomLetter');
        const updateLetterReserveSpy: sinon.SinonSpy = sinon.spy(service as any, 'updateLetterReserve');
        service['addLetter'](stubPlayerEasel, stubReserve);
        sinon.assert.calledOnce(getRandomLetterSpy);
        sinon.assert.calledOnce(updateLetterReserveSpy);
    });

    it('should add letter to player easel', () => {
        sinon.stub(service as any, 'getRandomLetter').callsFake(() => {
            return 'h';
        });
        service['addLetter'](stubPlayerEasel, stubReserve);
        const newPlayerEasel: Letter[] = [
            { character: 'a', value: 1 },
            { character: 'a', value: 1 },
            { character: 'c', value: 3 },
            { character: 'd', value: 2 },
            { character: 'e', value: 1 },
            { character: '*', value: 0 },
            { character: 'g', value: 2 },
            { character: 'h', value: 4 },
        ];
        expect(stubPlayerEasel).to.be.eql(newPlayerEasel);
    });

    it('removeLetters should call removeLetter with *', () => {
        const removeLetterSpy: sinon.SinonSpy = sinon.spy(service as any, 'removeLetter');
        service.removeLetters('if*', stubPlayerEasel, stubReserve);
        sinon.assert.calledWith(removeLetterSpy, '*', stubPlayerEasel);
    });

    it('should exchange the specified player easel letters with randomly generated ones from the reserve', () => {
        const removeLetterSpy: sinon.SinonSpy = sinon.spy(service as any, 'removeLetter');
        const addLetterSpy: sinon.SinonSpy = sinon.spy(service as any, 'addLetter');
        service.exchangeLetters('aad', stubPlayerEasel, stubReserve);
        const callCount = 3;
        sinon.assert.callCount(removeLetterSpy, callCount);
        sinon.assert.callCount(addLetterSpy, callCount);
    });

    it('should add 3 new letters from the reserve to the player easel', () => {
        const getRandomLetterStub = sinon.stub(service as any, 'getRandomLetter');
        getRandomLetterStub.onCall(0).returns('x');
        getRandomLetterStub.onCall(1).returns('y');
        getRandomLetterStub.onCall(2).returns('z');
        service.exchangeLetters('aad', stubPlayerEasel, stubReserve);
        const newPlayerEasel: Letter[] = [
            { character: 'c', value: 3 },
            { character: 'e', value: 1 },
            { character: '*', value: 0 },
            { character: 'g', value: 2 },
            { character: 'x', value: 10 },
            { character: 'y', value: 10 },
            { character: 'z', value: 10 },
        ];
        expect(stubPlayerEasel).to.be.eql(newPlayerEasel);
    });

    it('should do nothing when value is undefined', () => {
        sinon.stub(service as any, 'getRandomLetter').returns(undefined);
        expect(stubPlayerEasel).to.be.eql(stubPlayerEasel);
    });

    it('should get a random letter', () => {
        sinon.stub(service as any, 'getRandomLetter').callsFake(() => {
            return 'u';
        });
        expect(service['getRandomLetter'](stubReserve)).to.be.eql('u');
    });

    it('should remove letter s from reserve', () => {
        service['updateLetterReserve']('s', stubReserve);
        const updatedReserve: string[] = [
            'a',
            'b',
            'c',
            'd',
            'e',
            'f',
            'g',
            'h',
            'i',
            'j',
            'k',
            'l',
            'm',
            'n',
            'o',
            'p',
            'q',
            'r',
            't',
            'u',
            'v',
            'w',
            'x',
            'y',
            'z',
        ];
        expect(stubReserve).to.be.eql(updatedReserve);
    });

    it('should generate a player easel with randomly picked letters', () => {
        const getRandomLetterStub = sinon.stub(service as any, 'getRandomLetter');
        getRandomLetterStub.onCall(0).returns('f');
        getRandomLetterStub.onCall(1).returns('a');
        getRandomLetterStub.onCall(2).returns('h');
        getRandomLetterStub.onCall(3).returns('q');
        getRandomLetterStub.onCall(4).returns('s');
        getRandomLetterStub.onCall(5).returns('t');
        getRandomLetterStub.onCall(6).returns('y');
        const playerEasel: Letter[] = [
            { character: 'f', value: 4 },
            { character: 'a', value: 1 },
            { character: 'h', value: 4 },
            { character: 'q', value: 8 },
            { character: 's', value: 1 },
            { character: 't', value: 1 },
            { character: 'y', value: 10 },
        ];
        const generatedPlayerEasel = service.generatePlayerLetters(stubReserve);
        expect(generatedPlayerEasel).to.be.eql(playerEasel);
    });

    it('should not exchange letter if the reserve has less than 7 letters', () => {
        expect(service.exchangeLetters('abc', stubPlayerEasel, stub5LetterReserve)).to.be.eql(false);
    });

    it("exchange letters should addLetters from the reserve before putting the player's letters in the reserve", () => {
        const addLetterSpy: sinon.SinonSpy = sinon.spy(service as any, 'addLetter');
        const pushLetterToReserveSpy: sinon.SinonSpy = sinon.spy(stubReserve, 'push');
        service.exchangeLetters('a', stubPlayerEasel, stubReserve);
        expect(addLetterSpy.calledBefore(pushLetterToReserveSpy)).to.be.eql(true);
        expect(pushLetterToReserveSpy.calledAfter(addLetterSpy)).to.be.eql(true);
    });
});
