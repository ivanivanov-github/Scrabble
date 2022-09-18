/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable dot-notation */
import {
    MOCK_EXCHANGE_COMMAND,
    MOCK_INVALID_EXCHANGE_COMMAND,
    MOCK_INVALID_PLACE_COMMAND,
    MOCK_PLACE_COMMAND,
    MOCK_PLAYER_LETTERS,
} from '@app/classes/mocks/command-service-stubs';
import { STUB_PLAYER_EASEL, STUB_PLAYER_EASEL_NO_STAR } from '@app/classes/mocks/easel-service-stubs';
import { ExchangeCommand, PlaceCommand } from '@common/command';
import { Letter } from '@common/grid/node';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Container } from 'typedi';
import { CommandService } from './command.service';

describe('CommandService', () => {
    let service: CommandService;
    let stubPlayerLetters: string[];
    let stubPlayerEasel: Letter[];
    let stubExchangeCommand: ExchangeCommand;
    let stubInvalidExchangeCommand: ExchangeCommand;
    let stubPlaceCommand: PlaceCommand;
    let stubInvalidPlaceCommand: PlaceCommand;
    let stubPlayerEaselNoStar: Letter[];

    beforeEach(() => {
        service = Container.get(CommandService);
        stubPlayerLetters = JSON.parse(JSON.stringify(MOCK_PLAYER_LETTERS));
        stubPlayerEasel = JSON.parse(JSON.stringify(STUB_PLAYER_EASEL));
        stubExchangeCommand = JSON.parse(JSON.stringify(MOCK_EXCHANGE_COMMAND));
        stubInvalidExchangeCommand = JSON.parse(JSON.stringify(MOCK_INVALID_EXCHANGE_COMMAND));
        stubPlaceCommand = JSON.parse(JSON.stringify(MOCK_PLACE_COMMAND));
        stubInvalidPlaceCommand = JSON.parse(JSON.stringify(MOCK_INVALID_PLACE_COMMAND));
        stubPlayerEaselNoStar = JSON.parse(JSON.stringify(STUB_PLAYER_EASEL_NO_STAR));
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should be created', () => {
        expect(service).to.be.equal(service);
    });

    it('should return whether the player has the specified letter', () => {
        expect(service['includesLetter']('a', stubPlayerLetters)).to.be.eql(true);
        expect(service['includesLetter']('j', stubPlayerLetters)).to.be.eql(false);
        expect(service['includesLetter']('*', stubPlayerLetters)).to.be.eql(true);
    });

    it('should return whether the player has the specified letters', () => {
        expect(service['hasLetters']('aac', stubPlayerEasel)).to.be.eql(true);
        expect(service['hasLetters']('xac', stubPlayerEasel)).to.be.eql(false);
        expect(service['hasLetters']('R', stubPlayerEasel)).to.be.eql(true);
        expect(service['hasLetters']('deLg', stubPlayerEasel)).to.be.eql(true);
    });

    it("should return invalid place command if the word contains an upper case letter but the player easel doesn't contain a *", () => {
        expect(service['hasLetters']('R', stubPlayerEaselNoStar)).to.be.eql(false);
    });

    it('isValidPlaceCommand should call hasLetters with the place command letters and the player easel', () => {
        const hasLettersSpy: sinon.SinonSpy = sinon.spy(service as any, 'hasLetters');
        service.isValidPlaceCommand(stubPlaceCommand, stubPlayerEasel);
        sinon.assert.calledWith(hasLettersSpy, stubPlaceCommand.word, stubPlayerEasel);
    });

    it('should return whether is it a valid place command', () => {
        expect(service.isValidPlaceCommand(stubPlaceCommand, stubPlayerEasel)).to.be.eql(true);
        expect(service.isValidPlaceCommand(stubInvalidPlaceCommand, stubPlayerEasel)).to.be.eql(false);
    });

    it('isValidExchangeCommand should call hasLetters with the exchange command letters and the player easel', () => {
        const hasLettersSpy: sinon.SinonSpy = sinon.spy(service as any, 'hasLetters');
        service.isValidExchangeCommand(stubExchangeCommand, stubPlayerEasel);
        sinon.assert.calledWith(hasLettersSpy, stubExchangeCommand.letters, stubPlayerEasel);
    });

    it('should return whether is it a valid exchange command', () => {
        expect(service.isValidExchangeCommand(stubExchangeCommand, stubPlayerEasel)).to.be.eql(true);
        expect(service.isValidExchangeCommand(stubInvalidExchangeCommand, stubPlayerEasel)).to.be.eql(false);
    });
});
