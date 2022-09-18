/* eslint-disable dot-notation */ // We have to be able to access private methods for the sake of tests
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */ // Test files can have more than the max allowed number of lines
/* eslint-disable @typescript-eslint/no-magic-numbers */ // we shouldn't need to create constants for magic numbers in spec files
import { defaultDictMock } from '@app/classes/mocks/clue-service-mock';
import {
    STUB_ANCHOR,
    STUB_ANCHORS,
    STUB_ANCHOR_FOR_PREFIX,
    STUB_CLUE_FUNCTION_PARAMS,
    STUB_HORIZONTAL_DIRECTION,
    STUB_PLACE_COMMAND_POSITION,
    STUB_PLAYABLE_WORDS,
    STUB_POSITION,
    STUB_POSITION1,
    STUB_VERTICAL_DIRECTION,
} from '@app/classes/mocks/clue-service-stubs';
import { STUB_PLAYER_EASEL_NO_STAR, STUB_PLAYER_LETTERS_CLUE, STUB_PLAYER_LETTERS_FROM_EASEL } from '@app/classes/mocks/easel-service-stubs';
import { STUB_GRID } from '@app/classes/mocks/grid-service-stubs';
import { TrieNode } from '@app/classes/trie/trie-node';
import { DictionaryService } from '@app/services/dictionary/dictionary.service';
import { ClueService } from '@app/services/game/clue/clue.service';
import { CommandService } from '@app/services/game/command/command.service';
import { GridService } from '@app/services/game/grid/grid.service';
import { ClueFunctionParams, PlayableWord, Position } from '@common/clue';
import { PlaceCommand } from '@common/command';
import { Letter } from '@common/grid';
import { Node } from '@common/grid/node';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Container } from 'typedi';

describe('ClueService', () => {
    let clueService: ClueService;
    let gridService: GridService;
    let dictionnaryService: DictionaryService;
    let commandService: CommandService;
    let stubPosition: Position;
    let stubPlaceCommandPosition: Position;
    let stubHorizontalDirection: string;
    let stubVerticalDirection: string;
    let stubAnchor: Position;
    let stubAnchor1: Position;
    let stubAnchorPlaceCommandWord: Position;
    let stubAnchorForPrefix: Position;
    let stubAnchors: Position[];
    let stubEmptyGrid: Node[][];
    let stubHorizontalPlaceCommand: PlaceCommand;
    let stubPlayerLetters: string[];
    let stubPlayerLettersFromEasel: string[];
    let stubClueFunctionParams: ClueFunctionParams;
    let stubPlayableWords: PlayableWord[];
    let stubPlayerEasel: Letter[];
    let dictTitle: string;

    beforeEach(async () => {
        clueService = Container.get(ClueService);
        gridService = Container.get(GridService);
        dictionnaryService = Container.get(DictionaryService);

        commandService = Container.get(CommandService);
        stubPosition = JSON.parse(JSON.stringify(STUB_POSITION));
        stubPlaceCommandPosition = JSON.parse(JSON.stringify(STUB_PLACE_COMMAND_POSITION));
        stubHorizontalDirection = JSON.parse(JSON.stringify(STUB_HORIZONTAL_DIRECTION));
        stubVerticalDirection = JSON.parse(JSON.stringify(STUB_VERTICAL_DIRECTION));
        stubAnchor = JSON.parse(JSON.stringify(STUB_POSITION));
        stubAnchor1 = JSON.parse(JSON.stringify(STUB_POSITION1));
        stubAnchorPlaceCommandWord = JSON.parse(JSON.stringify(STUB_ANCHOR));
        stubAnchorForPrefix = JSON.parse(JSON.stringify(STUB_ANCHOR_FOR_PREFIX));
        stubAnchors = JSON.parse(JSON.stringify(STUB_ANCHORS));
        stubEmptyGrid = JSON.parse(JSON.stringify(STUB_GRID));
        stubPlayerLetters = JSON.parse(JSON.stringify(STUB_PLAYER_LETTERS_CLUE));
        stubPlayerLettersFromEasel = JSON.parse(JSON.stringify(STUB_PLAYER_LETTERS_FROM_EASEL));
        stubClueFunctionParams = JSON.parse(JSON.stringify(STUB_CLUE_FUNCTION_PARAMS));
        stubPlayableWords = JSON.parse(JSON.stringify(STUB_PLAYABLE_WORDS));
        stubPlayerEasel = JSON.parse(JSON.stringify(STUB_PLAYER_EASEL_NO_STAR));
        dictTitle = 'dictTitle';
        stubHorizontalPlaceCommand = {
            fullCommand: 'placer g9h tree',
            name: 'placer',
            row: 'g',
            column: 9,
            direction: 'h',
            word: 'tree',
            wordsInDictionary: true,
        };
        sinon.stub(dictionnaryService);
        Object.defineProperty(dictionnaryService, 'dictTrie', { value: defaultDictMock, writable: true });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should be created', () => {
        expect(clueService).to.be.equal(clueService);
    });

    it('should return a position with 8 as row and 7 as column if direction is horizontal and starting position is 8, 8', () => {
        const positionBefore: Position = clueService['positionBefore'](stubPosition, stubHorizontalDirection);
        expect(positionBefore.row).to.be.equal(8);
        expect(positionBefore.col).to.be.equal(7);
    });

    it('should return a position with 7 as row and 8 as column if direction is vertical and starting position is 8, 8', () => {
        const positionBefore: Position = clueService['positionBefore'](stubPosition, stubVerticalDirection);
        expect(positionBefore.row).to.be.equal(7);
        expect(positionBefore.col).to.be.equal(8);
    });

    it('should return a position with 8 as row and 9 as column if direction is horizontal and starting position is 8, 8', () => {
        const positionBefore: Position = clueService['positionAfter'](stubPosition, stubHorizontalDirection);
        expect(positionBefore.row).to.be.equal(8);
        expect(positionBefore.col).to.be.equal(9);
    });

    it('should return a position with 9 as row and 8 as column if direction is vertical and starting position is 8, 8', () => {
        const positionBefore: Position = clueService['positionAfter'](stubPosition, stubVerticalDirection);
        expect(positionBefore.row).to.be.equal(9);
        expect(positionBefore.col).to.be.equal(8);
    });

    it('should return a position with 7 as row and 8 as column if direction is horizontal and starting position is 8, 8', () => {
        const positionBefore: Position = clueService['positionBeforeOpposite'](stubPosition, stubHorizontalDirection);
        expect(positionBefore.row).to.be.equal(7);
        expect(positionBefore.col).to.be.equal(8);
    });

    it('should return a position with 8 as row and 7 as column if direction is vertical and starting position is 8, 8', () => {
        const positionBefore: Position = clueService['positionBeforeOpposite'](stubPosition, stubVerticalDirection);
        expect(positionBefore.row).to.be.equal(8);
        expect(positionBefore.col).to.be.equal(7);
    });

    it('should return a position with 9 as row and 8 as column if direction is horizontal and starting position is 8, 8', () => {
        const positionBefore: Position = clueService['positionAfterOpposite'](stubPosition, stubHorizontalDirection);
        expect(positionBefore.row).to.be.equal(9);
        expect(positionBefore.col).to.be.equal(8);
    });

    it('should return a position with 8 as row and 9 as column if direction is vertical and starting position is 8, 8', () => {
        const positionBefore: Position = clueService['positionAfterOpposite'](stubPosition, stubVerticalDirection);
        expect(positionBefore.row).to.be.equal(8);
        expect(positionBefore.col).to.be.equal(9);
    });

    it("should return that the anchors don't contain the given anchor", () => {
        expect(clueService['includesAnchor'](stubAnchor, stubAnchors)).to.be.equal(false);
    });

    it('should return that the anchors contain the given anchor', () => {
        expect(clueService['includesAnchor'](stubAnchor1, stubAnchors)).to.be.equal(true);
    });

    it("should return the horizontal letters ('tr') before the first 'e' in 'tree' in reverse order ('rt')", () => {
        gridService.placeLetters(stubHorizontalPlaceCommand, stubEmptyGrid);
        expect(clueService['getLettersBefore'](stubEmptyGrid, stubPlaceCommandPosition, stubVerticalDirection)).to.be.equal('rt');
    });

    it("should return the horizontal letters ('e') after the first 'e' in 'tree' in reverse order ('e')", () => {
        gridService.placeLetters(stubHorizontalPlaceCommand, stubEmptyGrid);
        expect(clueService['getLettersAfter'](stubEmptyGrid, stubPlaceCommandPosition, stubVerticalDirection)).to.be.equal('e');
    });

    it("shouldn't call search on the default dict in game service", () => {
        const defaultDictSearchSpy = sinon.spy(dictionnaryService.dictTrie, 'get');
        clueService['getValidLettersCrossingWords'](dictTitle, stubEmptyGrid, stubVerticalDirection, stubPlayerLetters);
        sinon.assert.notCalled(defaultDictSearchSpy);
    });

    it('should call search on the default dict in game service', () => {
        sinon.stub(clueService as any, 'getLettersBefore').returns('tes');
        sinon.stub(clueService as any, 'getLettersAfter').returns('');
        stubPlayerLetters.pop();
        stubPlayerLetters.push('t');
        const defaultDictSearchSpy = sinon.spy(dictionnaryService.dictTrie, 'get');
        clueService['getValidLettersCrossingWords'](dictTitle, stubEmptyGrid, stubVerticalDirection, stubPlayerLetters);
        sinon.assert.called(defaultDictSearchSpy);
    });
    it('should call positionBefore, positionAfter, positionBeforeOpposite, positionAfterOpposite', () => {
        const positionBeforeSpy = sinon.spy(clueService as any, 'positionBefore');
        const positionAfterSpy = sinon.spy(clueService as any, 'positionAfter');
        const positionBeforeOppositeSpy = sinon.spy(clueService as any, 'positionBeforeOpposite');
        const positionAfterOppositeSpy = sinon.spy(clueService as any, 'positionAfterOpposite');
        gridService.placeLetters(stubHorizontalPlaceCommand, stubEmptyGrid);
        clueService['findAnchors'](stubEmptyGrid);
        sinon.assert.called(positionBeforeSpy);
        sinon.assert.called(positionAfterSpy);
        sinon.assert.called(positionBeforeOppositeSpy);
        sinon.assert.called(positionAfterOppositeSpy);
    });

    it('should call findWordSuffix with partialWord, currentNode, anchor and clueFunctionParams', () => {
        const findWordSuffixSpy = sinon.spy(clueService as any, 'findWordSuffix');
        const trieNode: TrieNode = new TrieNode();
        clueService['findWordPrefix'](dictTitle, '', trieNode, stubPosition, stubClueFunctionParams);
        sinon.assert.calledWith(findWordSuffixSpy, dictTitle, '', trieNode, stubPosition, stubClueFunctionParams);
    });

    it('should call only once findWordSuffix with partialWord, currentNode, anchor and clueFunctionParams', () => {
        const findWordSuffixSpy = sinon.spy(clueService as any, 'findWordSuffix');
        const trieNode: TrieNode = new TrieNode();
        stubClueFunctionParams.prefixLimit = 0;
        clueService['findWordPrefix'](dictTitle, '', trieNode, stubPosition, stubClueFunctionParams);
        sinon.assert.calledOnce(findWordSuffixSpy);
    });

    it('should splice a letter from the player letters and call findWordSuffix', () => {
        sinon.stub(gridService, 'isEmptyPosition').returns(true);
        sinon.stub(commandService, 'includesLetter').returns(true);
        const findWordSuffixSpy = sinon.spy(clueService as any, 'findWordSuffix');
        const trieNode: TrieNode = new TrieNode();
        const childTrieNode: TrieNode = new TrieNode();
        trieNode.children.set('a', childTrieNode);
        clueService['findWordPrefix'](dictTitle, '', trieNode, stubPosition, stubClueFunctionParams);
        sinon.assert.calledWith(findWordSuffixSpy, dictTitle, '', trieNode, stubPosition, stubClueFunctionParams);
    });

    it("shouldn't splice a letter from the player letters and call findWordSuffix", () => {
        sinon.stub(gridService, 'isEmptyPosition').returns(true);
        sinon.stub(commandService, 'includesLetter').returns(false);
        const findWordSuffixSpy = sinon.spy(clueService as any, 'findWordSuffix');
        const trieNode: TrieNode = new TrieNode();
        const childTrieNode: TrieNode = new TrieNode();
        trieNode.children.set('a', childTrieNode);
        clueService['findWordPrefix'](dictTitle, '', trieNode, stubPosition, stubClueFunctionParams);
        sinon.assert.calledOnce(findWordSuffixSpy);
    });

    it('should add horizontal word to array of playable words', () => {
        clueService['addWordToPlayableWord'](stubPosition, stubHorizontalDirection, stubPlayableWords, 'hello');
        stubPlayableWords[2].word = 'hello';
    });

    it('should add vertical word to array of playable words', () => {
        clueService['addWordToPlayableWord'](stubPosition, stubVerticalDirection, stubPlayableWords, 'hello');
        stubPlayableWords[2].word = 'hello';
    });

    it('should call getValidLettersCrossingWords only once with correct parameters', () => {
        const getValidLettersCrossingWordsSpy = sinon.spy(clueService as any, 'getValidLettersCrossingWords');
        sinon.stub(gridService, 'isInBounds').returns(false);
        const trieNode: TrieNode = new TrieNode();
        const childTrieNode: TrieNode = new TrieNode();
        trieNode.children.set('a', childTrieNode);
        clueService['findWordSuffix'](dictTitle, '', trieNode, stubPosition, stubClueFunctionParams);
        sinon.assert.calledOnce(getValidLettersCrossingWordsSpy);
    });

    it("shouldn't call addWordToPlayableWords if the nextLetterPosition isn't empty", () => {
        const addWordToPlayableWordsSpy = sinon.spy(clueService as any, 'addWordToPlayableWord');
        sinon.stub(gridService, 'isInBounds').returns(true);
        sinon.stub(gridService, 'isEmptyPosition').returns(false);
        const trieNode: TrieNode = new TrieNode();
        trieNode.isEndOfWord = true;
        gridService.placeLetters(stubHorizontalPlaceCommand, stubClueFunctionParams.grid);
        stubClueFunctionParams.grid[stubPlaceCommandPosition.row][stubPlaceCommandPosition.col].isEmpty = false;
        clueService['findWordSuffix'](dictTitle, '', trieNode, stubPlaceCommandPosition, stubClueFunctionParams);
        sinon.assert.notCalled(addWordToPlayableWordsSpy);
    });

    it("shouldn't call addWordToPlayableWords if the anchor isn't included in the anchors array", () => {
        const addWordToPlayableWordsSpy = sinon.spy(clueService as any, 'addWordToPlayableWord');
        sinon.stub(gridService, 'isInBounds').returns(true);
        sinon.stub(gridService, 'isEmptyPosition').returns(false);
        const trieNode: TrieNode = new TrieNode();
        trieNode.isEndOfWord = true;
        gridService.placeLetters(stubHorizontalPlaceCommand, stubClueFunctionParams.grid);
        stubClueFunctionParams.grid[stubPosition.row][stubPosition.col].isEmpty = true;
        clueService['findWordSuffix'](dictTitle, '', trieNode, stubPlaceCommandPosition, stubClueFunctionParams);
        sinon.assert.notCalled(addWordToPlayableWordsSpy);
    });

    it("should call addWordToPlayableWords if currentNode is end of word, next letter is empty and anchor isn't included in anchors", () => {
        const addWordToPlayableWordsSpy = sinon.spy(clueService as any, 'addWordToPlayableWord');
        sinon.stub(gridService, 'isInBounds').returns(true);
        sinon.stub(gridService, 'isEmptyPosition').returns(false);
        const trieNode: TrieNode = new TrieNode();
        trieNode.isEndOfWord = true;
        gridService.placeLetters(stubHorizontalPlaceCommand, stubClueFunctionParams.grid);
        stubClueFunctionParams.grid[stubPlaceCommandPosition.row][stubPlaceCommandPosition.col].isEmpty = true;
        clueService['findWordSuffix'](dictTitle, '', trieNode, stubPlaceCommandPosition, stubClueFunctionParams);
        sinon.assert.called(addWordToPlayableWordsSpy);
    });

    it('should call findWordSuffix if the next letter node children contain the letter on the board', () => {
        const findWordSuffixSpy = sinon.spy(clueService as any, 'findWordSuffix');
        sinon.stub(gridService, 'isInBounds').returns(true);
        sinon.stub(gridService, 'isEmptyPosition').returns(false);
        const trieNode: TrieNode = new TrieNode();
        trieNode.isEndOfWord = true;
        const childTrieNode: TrieNode = new TrieNode();
        trieNode.children.set('e', childTrieNode);
        gridService.placeLetters(stubHorizontalPlaceCommand, stubClueFunctionParams.grid);
        stubClueFunctionParams.grid[stubPlaceCommandPosition.row][stubPlaceCommandPosition.col].isEmpty = true;
        clueService['findWordSuffix'](dictTitle, '', trieNode, stubPlaceCommandPosition, stubClueFunctionParams);
        sinon.assert.called(findWordSuffixSpy);
    });

    it('should generate a random column index for a horizontally placed first word', () => {
        const mathRandomSpy = sinon.spy(Math, 'random');
        clueService['generateRandomFirstWordPosition'](stubHorizontalDirection, 5);
        sinon.assert.called(mathRandomSpy);
    });

    it('should generate a random row index for a vertically placed first word', () => {
        const mathRandomSpy = sinon.spy(Math, 'random');
        clueService['generateRandomFirstWordPosition'](stubVerticalDirection, 5);
        sinon.assert.called(mathRandomSpy);
    });

    it('should generate a random direction', () => {
        const mathRandomSpy = sinon.spy(Math, 'random');
        clueService['generateRandomDirection']();
        sinon.assert.called(mathRandomSpy);
    });

    it('should generate a random direction and a random position', () => {
        const generateRandomDirectionSpy = sinon.spy(clueService as any, 'generateRandomDirection');
        const generateRandomFirstWordPositionSpy = sinon.spy(clueService as any, 'generateRandomFirstWordPosition');
        const trieNode: TrieNode = new TrieNode();
        trieNode.isEndOfWord = true;
        clueService['generateWordsWithEasel'](trieNode, '', stubClueFunctionParams);
        sinon.assert.called(generateRandomDirectionSpy);
        sinon.assert.called(generateRandomFirstWordPositionSpy);
    });

    it('should call generateWordsWithEasel with correct parameters and splice a letter from the player letters', () => {
        const generateWordsWithEaselSpy = sinon.spy(clueService as any, 'generateWordsWithEasel');
        const trieNode: TrieNode = new TrieNode();
        trieNode.isEndOfWord = false;
        const childTrieNode: TrieNode = new TrieNode();
        trieNode.children.set('e', childTrieNode);
        stubClueFunctionParams.playerLetters.push('e');
        clueService['generateWordsWithEasel'](trieNode, '', stubClueFunctionParams);
        sinon.assert.called(generateWordsWithEaselSpy);
    });

    it('should call generateWordsWithEasel only once with correct parameters and splice a letter from the player letters', () => {
        const generateWordsWithEaselSpy = sinon.spy(clueService as any, 'generateWordsWithEasel');
        const trieNode: TrieNode = new TrieNode();
        trieNode.isEndOfWord = false;
        const childTrieNode: TrieNode = new TrieNode();
        trieNode.children.set('e', childTrieNode);
        clueService['generateWordsWithEasel'](trieNode, '', stubClueFunctionParams);
        sinon.assert.calledOnce(generateWordsWithEaselSpy);
    });

    it('should return the letters before the anchor', () => {
        gridService.placeLetters(stubHorizontalPlaceCommand, stubClueFunctionParams.grid);
        expect(clueService['getAnchorPrefix'](stubAnchorPlaceCommandWord, stubClueFunctionParams)).to.be.equal('tree');
    });

    it('should return undefined as the letters before the anchor', () => {
        expect(clueService['getAnchorPrefix'](stubAnchorPlaceCommandWord, stubClueFunctionParams)).to.be.equal(undefined);
    });

    it("shouldn't return undefined or tree as the letters before the anchor", () => {
        gridService.placeLetters(stubHorizontalPlaceCommand, stubClueFunctionParams.grid);
        stubClueFunctionParams.grid[7][8].isEmpty = false;
        clueService['getAnchorPrefix'](stubAnchorPlaceCommandWord, stubClueFunctionParams);
        expect(clueService['getAnchorPrefix'](stubAnchorPlaceCommandWord, stubClueFunctionParams)).to.not.be.equal(undefined);
        expect(clueService['getAnchorPrefix'](stubAnchorPlaceCommandWord, stubClueFunctionParams)).to.not.be.equal('tree');
    });

    it('should get the limit of the prefix length to the given anchor position', () => {
        gridService.placeLetters(stubHorizontalPlaceCommand, stubClueFunctionParams.grid);
        expect(clueService['getPrefixLimit'](stubAnchorForPrefix, stubClueFunctionParams)).to.be.equal(7);
    });

    it("should call findWordSuffix with 'tree' as partial word", () => {
        const findWordSuffixSpy = sinon.spy(clueService as any, 'findWordSuffix');
        sinon.stub(gridService as any, 'isEmptyPosition').returns(false);
        sinon.stub(clueService as any, 'getAnchorPrefix').returns('tree');
        const trieNode: TrieNode = new TrieNode();
        stubClueFunctionParams.anchors = [];
        stubClueFunctionParams.anchors.push(stubAnchorPlaceCommandWord);
        gridService.placeLetters(stubHorizontalPlaceCommand, stubClueFunctionParams.grid);
        clueService['generateWordsWithEaselAndBoard'](dictTitle, trieNode, stubClueFunctionParams);
        sinon.assert.calledWith(findWordSuffixSpy, dictTitle, 'tree', trieNode, stubAnchorPlaceCommandWord, stubClueFunctionParams);
    });

    it("shouldn't call findWordSuffix", () => {
        const findWordSuffixSpy = sinon.spy(clueService as any, 'findWordSuffix');
        sinon.stub(gridService, 'isEmptyPosition').returns(false);
        sinon.stub(clueService as any, 'getAnchorPrefix').returns('test');
        const trieNode: TrieNode = new TrieNode();
        stubClueFunctionParams.anchors = [];
        stubClueFunctionParams.anchors.push(stubAnchorPlaceCommandWord);
        gridService.placeLetters(stubHorizontalPlaceCommand, stubClueFunctionParams.grid);
        clueService['generateWordsWithEaselAndBoard'](dictTitle, trieNode, stubClueFunctionParams);
        sinon.assert.notCalled(findWordSuffixSpy);
    });

    it("should call findWordSuffix with 4 as prefix limit and '' as partial word", () => {
        const findWordPrefixSpy = sinon.spy(clueService as any, 'findWordPrefix');
        sinon.stub(gridService as any, 'isEmptyPosition').returns(true);
        sinon.stub(clueService as any, 'getPrefixLimit').returns(4);
        const trieNode: TrieNode = new TrieNode();
        stubClueFunctionParams.anchors = [];
        stubClueFunctionParams.anchors.push(stubAnchorPlaceCommandWord);
        clueService['generateWordsWithEaselAndBoard'](dictTitle, trieNode, stubClueFunctionParams);
        expect(stubClueFunctionParams.prefixLimit).to.be.equal(4);
        sinon.assert.calledWith(findWordPrefixSpy, dictTitle, '', trieNode, stubAnchorPlaceCommandWord, stubClueFunctionParams);
    });

    it('should call once findAnchors with correct parameters', () => {
        const findAnchorsSpy = sinon.spy(clueService as any, 'findAnchors');
        const trieNode: TrieNode = new TrieNode();
        clueService.findAllPlayableWords(dictTitle, trieNode, stubPlayerEasel, stubEmptyGrid);
        sinon.assert.calledOnce(findAnchorsSpy);
        sinon.assert.calledWith(findAnchorsSpy, stubEmptyGrid);
    });

    it('should call once generateWordsWithEaselAndBoard with correct parameters', () => {
        const generateWordsWithEaselAndBoardSpy = sinon.spy(clueService as any, 'generateWordsWithEaselAndBoard');
        sinon.stub(clueService as any, 'findAnchors').returns(stubAnchors);
        const trieNode: TrieNode = new TrieNode();
        stubClueFunctionParams.playableWords = [];
        stubClueFunctionParams.playerLetters = stubPlayerLettersFromEasel;
        stubClueFunctionParams.prefixLimit = 0;
        clueService.findAllPlayableWords(dictTitle, trieNode, stubPlayerEasel, stubEmptyGrid);
        sinon.assert.calledOnce(generateWordsWithEaselAndBoardSpy);
    });

    it('should call once generateWordsWithEasel with correct parameters', () => {
        const generateWordsWithEaselSpy = sinon.spy(clueService as any, 'generateWordsWithEasel');
        sinon.stub(clueService as any, 'findAnchors').returns([] as Position[]);
        const trieNode: TrieNode = new TrieNode();
        stubClueFunctionParams.anchors = [];
        stubClueFunctionParams.playableWords = [];
        stubClueFunctionParams.playerLetters = stubPlayerLettersFromEasel;
        stubClueFunctionParams.prefixLimit = 0;
        clueService.findAllPlayableWords(dictTitle, trieNode, stubPlayerEasel, stubEmptyGrid);
        sinon.assert.calledOnce(generateWordsWithEaselSpy);
        sinon.assert.calledWith(generateWordsWithEaselSpy, trieNode, '', stubClueFunctionParams);
    });
});
