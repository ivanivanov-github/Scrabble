/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable max-lines */
import { defaultDictMock } from '@app/classes/mocks/clue-service-mock';
import { WordValidatorHelper } from '@app/classes/mocks/word-validator-helper';
import { MOCK_GRID } from '@app/classes/mocks/word-validator-mock';
import { DictionaryService } from '@app/services/dictionary/dictionary.service';
import { WordValidatorService } from '@app/services/word-validator/wordvalidator.service';
import { PlaceCommand } from '@common/command';
import { Node } from '@common/grid/node';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Container } from 'typedi';

describe('WordValidatorService', () => {
    let service: WordValidatorService;
    const wordValidatorHelper = new WordValidatorHelper();
    let stubPlaceCommand: PlaceCommand;
    let stubGrid: Node[][];
    const dictionnaryService: DictionaryService = Container.get(DictionaryService);
    let verifyWordStub: sinon.SinonStub;
    let dictTitle: string;
    beforeEach(() => {
        service = Container.get(WordValidatorService);
        stubGrid = wordValidatorHelper.copyGrid(MOCK_GRID);
        verifyWordStub = sinon.stub(dictionnaryService, 'verifyWord').returns(true);
        dictTitle = 'dictTitle';
        Object.defineProperty(dictionnaryService, 'dictTrie', { value: defaultDictMock, writable: true });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should be created', () => {
        expect(service).to.be.equal(service);
    });

    it('should be able to place an horizontal word with a * in the middle for the first turn', () => {
        stubPlaceCommand = wordValidatorHelper.createPlaceCommand('!placer h8h aRbre');
        expect(service.isPlaceCommandValid(dictTitle, stubPlaceCommand, stubGrid)).to.be.equal(true);
    });

    it('should be able to place a vertical word in the middle for the first turn', () => {
        stubPlaceCommand = wordValidatorHelper.createPlaceCommand('!placer h8v arbre');
        expect(service.isPlaceCommandValid(dictTitle, stubPlaceCommand, stubGrid)).to.be.equal(true);
    });

    it('should not be able to place an horizontal word not in the middle for the first turn', () => {
        stubPlaceCommand = wordValidatorHelper.createPlaceCommand('!placer d4h bas');
        expect(service.isPlaceCommandValid(dictTitle, stubPlaceCommand, stubGrid)).to.be.equal(false);
    });

    it('should not be able to place a vertical word not in the middle for the first turn', () => {
        stubPlaceCommand = wordValidatorHelper.createPlaceCommand('!placer d4v bas');
        expect(service.isPlaceCommandValid(dictTitle, stubPlaceCommand, stubGrid)).to.be.equal(false);
    });

    it('should not add a new word that is not touching another word', () => {
        stubPlaceCommand = wordValidatorHelper.createPlaceCommand('!placer h8h arbre');
        stubGrid[1][15] = wordValidatorHelper.createNewNode('n', 15, 1, false);
        stubGrid[2][15] = wordValidatorHelper.createNewNode('o', 15, 2, false);
        stubGrid[3][15] = wordValidatorHelper.createNewNode('n', 15, 3, false);
        expect(service.isPlaceCommandValid(dictTitle, stubPlaceCommand, stubGrid)).to.be.equal(false);
    });

    it('should add a new horizontal word that is touching another word', () => {
        stubPlaceCommand = wordValidatorHelper.createPlaceCommand('!placer a2h nimal');
        stubGrid[1][1] = wordValidatorHelper.createNewNode('a', 1, 1, false);
        stubGrid[2][1] = wordValidatorHelper.createNewNode('r', 1, 2, false);
        stubGrid[3][1] = wordValidatorHelper.createNewNode('b', 1, 3, false);
        stubGrid[4][1] = wordValidatorHelper.createNewNode('r', 1, 4, false);
        stubGrid[5][1] = wordValidatorHelper.createNewNode('e', 1, 5, false);
        expect(service.isPlaceCommandValid(dictTitle, stubPlaceCommand, stubGrid)).to.be.equal(true);
    });

    it('should add a new vertical word that is touching another word', () => {
        stubPlaceCommand = wordValidatorHelper.createPlaceCommand('!placer b1v nimal');
        stubGrid[1][1] = wordValidatorHelper.createNewNode('a', 1, 1, false);
        stubGrid[1][2] = wordValidatorHelper.createNewNode('r', 2, 1, false);
        stubGrid[1][3] = wordValidatorHelper.createNewNode('b', 3, 1, false);
        stubGrid[1][4] = wordValidatorHelper.createNewNode('r', 4, 1, false);
        stubGrid[1][5] = wordValidatorHelper.createNewNode('e', 5, 1, false);
        expect(service.isPlaceCommandValid(dictTitle, stubPlaceCommand, stubGrid)).to.be.equal(true);
    });

    it('should add a new horizontal word that is touching other words', () => {
        stubPlaceCommand = wordValidatorHelper.createPlaceCommand('!placer b3h ae');
        stubGrid[1][2] = wordValidatorHelper.createNewNode('a', 2, 1, false);
        stubGrid[2][2] = wordValidatorHelper.createNewNode('r', 2, 2, false);
        stubGrid[3][2] = wordValidatorHelper.createNewNode('b', 2, 3, false);
        stubGrid[4][2] = wordValidatorHelper.createNewNode('r', 2, 4, false);
        stubGrid[5][2] = wordValidatorHelper.createNewNode('e', 2, 5, false);

        stubGrid[2][4] = wordValidatorHelper.createNewNode('t', 4, 2, false);
        stubGrid[3][4] = wordValidatorHelper.createNewNode('r', 4, 3, false);
        stubGrid[4][4] = wordValidatorHelper.createNewNode('o', 4, 4, false);
        stubGrid[5][4] = wordValidatorHelper.createNewNode('p', 4, 5, false);
        expect(service.isPlaceCommandValid(dictTitle, stubPlaceCommand, stubGrid)).to.be.equal(true);
    });

    it('should add a new vertical word that is touching other words', () => {
        stubPlaceCommand = wordValidatorHelper.createPlaceCommand('!placer b3v obon');
        stubGrid[1][1] = wordValidatorHelper.createNewNode('a', 1, 1, false);
        stubGrid[1][2] = wordValidatorHelper.createNewNode('r', 2, 1, false);
        stubGrid[1][3] = wordValidatorHelper.createNewNode('b', 3, 1, false);
        stubGrid[1][4] = wordValidatorHelper.createNewNode('r', 4, 1, false);
        stubGrid[1][5] = wordValidatorHelper.createNewNode('e', 5, 1, false);

        stubGrid[3][3] = wordValidatorHelper.createNewNode('n', 3, 3, false);
        stubGrid[3][4] = wordValidatorHelper.createNewNode('u', 4, 3, false);
        stubGrid[3][5] = wordValidatorHelper.createNewNode('i', 5, 3, false);
        stubGrid[3][6] = wordValidatorHelper.createNewNode('t', 6, 3, false);
        expect(service.isPlaceCommandValid(dictTitle, stubPlaceCommand, stubGrid)).to.be.equal(true);
    });

    it('should add an horizontal word that is touching another word further than 1 node away', () => {
        stubPlaceCommand = wordValidatorHelper.createPlaceCommand('!placer h8h ani');
        stubGrid[8][11] = wordValidatorHelper.createNewNode('m', 11, 8, false);
        stubGrid[8][12] = wordValidatorHelper.createNewNode('a', 12, 8, false);
        stubGrid[8][13] = wordValidatorHelper.createNewNode('l', 13, 8, false);
        expect(service.isPlaceCommandValid(dictTitle, stubPlaceCommand, stubGrid)).to.be.equal(true);
    });

    it('should add an horizontal word that is touching another vertical word further than 1 node away and under', () => {
        stubPlaceCommand = wordValidatorHelper.createPlaceCommand('!placer h8h animal');
        stubGrid[9][11].isNewNode = false;
        stubGrid[10][11].isNewNode = false;
        expect(service.isPlaceCommandValid(dictTitle, stubPlaceCommand, stubGrid)).to.be.equal(true);
    });

    it('should add a vertical word that is touching another word further than 1 node away', () => {
        stubPlaceCommand = wordValidatorHelper.createPlaceCommand('!placer h8v ani');
        stubGrid[11][8] = wordValidatorHelper.createNewNode('m', 8, 11, false);
        stubGrid[12][8] = wordValidatorHelper.createNewNode('a', 8, 12, false);
        stubGrid[13][8] = wordValidatorHelper.createNewNode('l', 8, 13, false);
        expect(service.isPlaceCommandValid(dictTitle, stubPlaceCommand, stubGrid)).to.be.equal(true);
    });

    it('should add a vertical word that is touching another vertical word further than 1 node away and to the right', () => {
        stubPlaceCommand = wordValidatorHelper.createPlaceCommand('!placer h8v aniMal');
        stubGrid[11][9] = wordValidatorHelper.createNewNode('a', 9, 11, false);
        stubGrid[11][10] = wordValidatorHelper.createNewNode('l', 10, 11, false);
        expect(service.isPlaceCommandValid(dictTitle, stubPlaceCommand, stubGrid)).to.be.equal(true);
    });

    it('should verify the first word is in the dictionary and return true', () => {
        const result = service.isWordInDict(dictTitle, 'animal');
        sinon.assert.calledOnce(verifyWordStub);
        expect(result).to.be.equal(true);
    });

    it('should not add a new vertical word that is not touching another letter', () => {
        stubPlaceCommand = wordValidatorHelper.createPlaceCommand('!placer h8v animal');
        stubGrid[1][1] = wordValidatorHelper.createNewNode('m', 1, 1, false);
        stubGrid[2][1] = wordValidatorHelper.createNewNode('a', 1, 2, false);
        stubGrid[3][1] = wordValidatorHelper.createNewNode('l', 1, 3, false);

        expect(service.isPlaceCommandValid(dictTitle, stubPlaceCommand, stubGrid)).to.be.equal(false);
    });

    it('should add a new horizontal word that is touching an other word', () => {
        stubPlaceCommand = wordValidatorHelper.createPlaceCommand('!placer h8h animal');
        stubGrid[9][11] = wordValidatorHelper.createNewNode('a', 11, 9, false);
        stubGrid[10][11] = wordValidatorHelper.createNewNode('l', 11, 10, false);
        expect(service.isPlaceCommandValid(dictTitle, stubPlaceCommand, stubGrid)).to.be.equal(true);
    });

    it('isEmpty should return true if the node is empty', () => {
        stubPlaceCommand = wordValidatorHelper.createPlaceCommand('!placer h8h animal');
        expect(service.isEmpty(stubPlaceCommand, stubGrid)).to.be.equal(true);
    });

    it('isEmpty should return false if the node is not empty', () => {
        stubGrid[8][8] = wordValidatorHelper.createNewNode('a', 8, 8, false);
        stubPlaceCommand = wordValidatorHelper.createPlaceCommand('!placer h8h animal');
        expect(service.isEmpty(stubPlaceCommand, stubGrid)).to.be.equal(false);
    });

    it('should add an horizontal word touching another horizontal word', () => {
        const getHorizontalWordTouchingStub = sinon.stub(service, 'getWordTouching').returns(undefined);
        stubGrid[8][11] = wordValidatorHelper.createNewNode('m', 11, 8, false);
        stubGrid[8][12] = wordValidatorHelper.createNewNode('a', 12, 8, false);
        stubGrid[8][13] = wordValidatorHelper.createNewNode('l', 13, 8, false);
        stubPlaceCommand = wordValidatorHelper.createPlaceCommand('!placer h8h ani');
        expect(service.isPlaceCommandValid(dictTitle, stubPlaceCommand, stubGrid)).to.be.equal(false);
        sinon.assert.called(getHorizontalWordTouchingStub);
    });

    it('should add an horizontal word touching another horizontal word', () => {
        const getVerticalWordTouchingStub = sinon.stub(service, 'getWordTouching').returns(undefined);
        stubGrid[11][8] = wordValidatorHelper.createNewNode('m', 8, 11, false);
        stubGrid[12][8] = wordValidatorHelper.createNewNode('a', 8, 12, false);
        stubGrid[13][8] = wordValidatorHelper.createNewNode('l', 8, 13, false);
        stubPlaceCommand = wordValidatorHelper.createPlaceCommand('!placer h8v ani');
        expect(service.isPlaceCommandValid(dictTitle, stubPlaceCommand, stubGrid)).to.be.equal(false);
        sinon.assert.called(getVerticalWordTouchingStub);
    });

    it('should not add a word not in the dictionary', () => {
        const isWordInDictStub = sinon.stub(service, 'isWordInDict').returns(false);
        stubGrid[8][11] = wordValidatorHelper.createNewNode('m', 11, 8, false);
        stubGrid[9][8] = wordValidatorHelper.createNewNode('m', 8, 9, false);
        stubPlaceCommand = wordValidatorHelper.createPlaceCommand('!placer h8h asdf');
        expect(service.isPlaceCommandValid(dictTitle, stubPlaceCommand, stubGrid)).to.be.equal(false);
        sinon.assert.called(isWordInDictStub);
    });

    it('isTouchingHorizontal should return true if the word is on the right edge but touching another letter', () => {
        MOCK_GRID[1][14].isEmpty = false;
        // eslint-disable-next-line dot-notation
        expect(service['isTouchingHorizontal'](1, 2, 14, MOCK_GRID)).to.be.equal(true);
    });

    it('isTouchingHorizontal should return true if the word is at the top of the board', () => {
        MOCK_GRID[0][15].isEmpty = true;
        MOCK_GRID[0][13].isEmpty = true;
        // eslint-disable-next-line dot-notation
        expect(service['isTouchingHorizontal'](1, 0, 14, MOCK_GRID)).to.be.equal(true);
    });

    it('isTouchingHorizontal should return true if the word is at bottom of the board', () => {
        MOCK_GRID[15][0].isEmpty = true;
        MOCK_GRID[14][0].isEmpty = true;
        MOCK_GRID[15][1].isEmpty = true;
        // eslint-disable-next-line dot-notation
        expect(service['isTouchingHorizontal'](1, 15, 0, MOCK_GRID)).to.be.equal(false);
    });

    it('isTouchingVertical should return true if the word is at the right of the board', () => {
        // MOCK_GRID[0][15].isEmpty = true;
        MOCK_GRID[0][14].isEmpty = true;
        // eslint-disable-next-line dot-notation
        expect(service['isTouchingVertical'](1, 0, 15, MOCK_GRID)).to.be.equal(false);
    });

    it('isTouchingVertical should return true if the word is at the left of the board', () => {
        MOCK_GRID[0][0].isEmpty = false;
        // eslint-disable-next-line dot-notation
        expect(service['isTouchingVertical'](1, 0, 1, MOCK_GRID)).to.be.equal(true);
    });

    it('isTouchingVertical should return true if the word is at left of the board', () => {
        MOCK_GRID[15][0].isEmpty = true;
        MOCK_GRID[14][0].isEmpty = true;
        MOCK_GRID[15][1].isEmpty = true;
        // eslint-disable-next-line dot-notation
        expect(service['isTouchingVertical'](1, 15, 0, MOCK_GRID)).to.be.equal(false);
    });
});

describe('WordValidatorService false', () => {
    let service: WordValidatorService;
    let dictionnaryService: DictionaryService;
    let verifyWordStub: sinon.SinonStub;
    const wordValidatorHelper = new WordValidatorHelper();
    let stubPlaceCommand: PlaceCommand;
    let stubGrid: Node[][];
    let dictTitle: string;
    beforeEach(() => {
        dictionnaryService = Container.get(DictionaryService);
        service = Container.get(WordValidatorService);
        verifyWordStub = sinon.stub(dictionnaryService, 'verifyWord').returns(false);
        stubGrid = wordValidatorHelper.copyGrid(MOCK_GRID);
        dictTitle = 'dictTitle';
    });

    afterEach(() => {
        sinon.restore();
    });

    it('isWordsInDict should return false if at least 1 word is not in the dictionary', () => {
        stubPlaceCommand = wordValidatorHelper.createPlaceCommand('!placer h8h adk');
        stubGrid[8][11] = wordValidatorHelper.createNewNode('m', 11, 8, false);
        stubGrid[9][8] = wordValidatorHelper.createNewNode('m', 8, 9, false);
        const result = service.isPlaceCommandValid(dictTitle, stubPlaceCommand, stubGrid);
        sinon.assert.called(verifyWordStub);
        expect(result).to.be.equal(false);
    });
});
