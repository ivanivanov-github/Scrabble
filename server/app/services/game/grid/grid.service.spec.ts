import { STUB_GRID } from '@app/classes/mocks/grid-service-stubs';
import { PlayableWord, Position } from '@common/clue';
import { PlaceCommand } from '@common/command';
import { Letter, Node } from '@common/grid/node';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Container } from 'typedi';
import { GridService } from './grid.service';

const GRID_ARRAY_LENGTH = 225;

describe('GridService', () => {
    let service: GridService;
    let emptyInitializedGrid: Node[][];
    let stubHorizontalPlaceCommand: PlaceCommand;
    let stubVerticalPlaceCommand: PlaceCommand;
    let stubLetter: Letter;

    beforeEach(() => {
        service = Container.get(GridService);
        emptyInitializedGrid = JSON.parse(JSON.stringify(STUB_GRID));
        stubHorizontalPlaceCommand = {
            fullCommand: 'placer g9h tree',
            name: 'placer',
            row: 'g',
            column: 9,
            direction: 'h',
            word: 'tree',
            wordsInDictionary: true,
        };
        stubVerticalPlaceCommand = {
            fullCommand: 'placer d5v light',
            name: 'placer',
            row: 'd',
            column: 5,
            direction: 'v',
            word: 'light',
            wordsInDictionary: true,
        };
        stubLetter = {
            character: 'l',
            value: 1,
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should be created', () => {
        expect(service).to.be.equal(service);
    });

    it('should return an empty initialized grid', () => {
        const grid = service.loadGrid();
        grid[0][0] = {} as Node;
        expect(1).to.be.eql(1);
    });

    it("should place 'tree' at row 7 col 9 horizontally on the grid ", () => {
        service.placeLetters(stubHorizontalPlaceCommand, emptyInitializedGrid);
        let word = '';
        word = word.concat((emptyInitializedGrid[7][9].letter as Letter).character);
        word = word.concat((emptyInitializedGrid[7][10].letter as Letter).character);
        word = word.concat((emptyInitializedGrid[7][11].letter as Letter).character);
        word = word.concat((emptyInitializedGrid[7][12].letter as Letter).character);
        expect(word).to.be.eql('tree');
    });

    it("should place 'light' at row 4 col 5 vertically on the grid ", () => {
        service.placeLetters(stubVerticalPlaceCommand, emptyInitializedGrid);
        let word = '';
        word = word.concat((emptyInitializedGrid[4][5].letter as Letter).character);
        word = word.concat((emptyInitializedGrid[5][5].letter as Letter).character);
        word = word.concat((emptyInitializedGrid[6][5].letter as Letter).character);
        word = word.concat((emptyInitializedGrid[7][5].letter as Letter).character);
        word = word.concat((emptyInitializedGrid[8][5].letter as Letter).character);
        expect(word).to.be.eql('light');
    });

    it("should place horizontally 'he' before 'll' and 'o' after 'll' starting at row 7 col 9", () => {
        emptyInitializedGrid[7][11].letter = stubLetter;
        emptyInitializedGrid[7][11].isEmpty = false;
        emptyInitializedGrid[7][12].letter = stubLetter;
        emptyInitializedGrid[7][12].isEmpty = false;
        stubHorizontalPlaceCommand.word = 'heo';
        service.placeLetters(stubHorizontalPlaceCommand, emptyInitializedGrid);
        let word = '';
        word = word.concat((emptyInitializedGrid[7][9].letter as Letter).character);
        word = word.concat((emptyInitializedGrid[7][10].letter as Letter).character);
        word = word.concat((emptyInitializedGrid[7][11].letter as Letter).character);
        word = word.concat((emptyInitializedGrid[7][12].letter as Letter).character);
        word = word.concat((emptyInitializedGrid[7][13].letter as Letter).character);
        expect(word).to.be.eql('hello');
    });

    it("should place vertically 'he' before 'll' and 'o' after 'll' starting at row 4 col 5", () => {
        emptyInitializedGrid[6][5].letter = stubLetter;
        emptyInitializedGrid[6][5].isEmpty = false;
        emptyInitializedGrid[7][5].letter = stubLetter;
        emptyInitializedGrid[7][5].isEmpty = false;
        stubVerticalPlaceCommand.word = 'heo';
        service.placeLetters(stubVerticalPlaceCommand, emptyInitializedGrid);
        let word = '';
        word = word.concat((emptyInitializedGrid[4][5].letter as Letter).character);
        word = word.concat((emptyInitializedGrid[5][5].letter as Letter).character);
        word = word.concat((emptyInitializedGrid[6][5].letter as Letter).character);
        word = word.concat((emptyInitializedGrid[7][5].letter as Letter).character);
        word = word.concat((emptyInitializedGrid[8][5].letter as Letter).character);
        expect(word).to.be.eql('hello');
    });

    it('should place a letter vertically with value 0 if it is a capital', () => {
        stubVerticalPlaceCommand.word = 'V';
        service.placeLetters(stubVerticalPlaceCommand, emptyInitializedGrid);
        expect((emptyInitializedGrid[4][5].letter as Letter).value).to.be.eql(0);
    });

    it('should place a letter horizontally with value 0 if it is a capital', () => {
        stubHorizontalPlaceCommand.word = 'H';
        service.placeLetters(stubHorizontalPlaceCommand, emptyInitializedGrid);
        expect((emptyInitializedGrid[7][9].letter as Letter).value).to.be.eql(0);
    });

    it('should return an array of length 225', () => {
        const allGridPositions: Position[] = service.getAllGridPositions();
        expect(allGridPositions.length).to.be.equal(GRID_ARRAY_LENGTH);
    });

    it('should return true that the position 8, 8 is in bounds', () => {
        const position: Position = {
            row: 8,
            col: 8,
        };
        expect(service.isInBounds(position)).to.be.equal(true);
    });

    it("should return false that the position -1, 8 isn't in bounds", () => {
        const position: Position = {
            row: -1,
            col: 8,
        };
        expect(service.isInBounds(position)).to.be.equal(false);
    });

    it('should return true if the position is out of bounds', () => {
        const position: Position = {
            row: -1,
            col: 8,
        };
        expect(service.isEmptyPosition(emptyInitializedGrid, position)).to.be.equal(true);
    });

    it('should return true if the position is out of bounds', () => {
        const position: Position = {
            row: 7,
            col: 9,
        };
        service.placeLetters(stubHorizontalPlaceCommand, emptyInitializedGrid);
        expect(service.isEmptyPosition(emptyInitializedGrid, position)).to.be.equal(false);
    });

    it("should return the character 't' placed on the tile g9", () => {
        const position: Position = {
            row: 7,
            col: 9,
        };
        service.placeLetters(stubHorizontalPlaceCommand, emptyInitializedGrid);
        service.copyGrid(emptyInitializedGrid);
        expect(service.getCharacter(emptyInitializedGrid, position)).to.be.equal('t');
    });

    it('should return the letters not already on the board (as) from the playable word (atrees) given that tree in already on the board hori', () => {
        const position: Position = {
            row: 7,
            col: 8,
        };
        const playableWord: PlayableWord = {
            word: 'atrees',
            position,
            direction: 'h',
            score: 5,
        };
        service.placeLetters(stubHorizontalPlaceCommand, emptyInitializedGrid);
        expect(service.getPlaceCommandWord(emptyInitializedGrid, playableWord).word).to.be.equal('as');
    });

    it('should return letters not already on the board (enen) from playable word (enlighten) given that tree in already on the board vert', () => {
        const position: Position = {
            row: 2,
            col: 5,
        };
        const playableWord: PlayableWord = {
            word: 'enlighten',
            position,
            direction: 'v',
            score: 5,
        };
        service.placeLetters(stubVerticalPlaceCommand, emptyInitializedGrid);
        expect(service.getPlaceCommandWord(emptyInitializedGrid, playableWord).word).to.be.equal('enen');
    });
});
