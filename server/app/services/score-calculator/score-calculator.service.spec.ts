/* eslint-disable @typescript-eslint/no-explicit-any */ // need to access private method from service as any
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { STUB_PLAYABLE_WORDS } from '@app/classes/mocks/clue-service-stubs';
import { STUB_GAME } from '@app/classes/mocks/game-service-stubs';
import { WordValidatorHelper } from '@app/classes/mocks/word-validator-helper';
import { ScoreCalculatorService } from '@app/services/score-calculator/score-calculator.service';
import { PlayableWord, SCORE_PERCENTILE } from '@common/clue';
import { Game } from '@common/game';
import { Word } from '@common/grid/node';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Container } from 'typedi';

describe('ScoreCalculatorService', () => {
    let service: ScoreCalculatorService;
    const wordValidatorHelper = new WordValidatorHelper();

    let stubNewWords: Word[];
    let stubGame: Game;
    let stubPlayableWords: PlayableWord[];

    beforeEach(() => {
        stubNewWords = [];
        service = Container.get(ScoreCalculatorService);
        stubGame = JSON.parse(JSON.stringify(STUB_GAME));
        stubPlayableWords = JSON.parse(JSON.stringify(STUB_PLAYABLE_WORDS));
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should be created', () => {
        expect(service).to.be.equal(service);
    });

    it('should calculate the score of word without any multiplier', () => {
        const newLetters = [
            wordValidatorHelper.createNewNode('b', 6, 11, true),
            wordValidatorHelper.createNewNode('a', 7, 11, true),
            wordValidatorHelper.createNewNode('l', 8, 11, true),
            wordValidatorHelper.createNewNode('l', 9, 11, true),
            wordValidatorHelper.createNewNode('E', 10, 11, true),
        ];

        const newWord = { letters: newLetters, isHorizontal: true };
        const EXPECTED_SCORE = 6;
        stubNewWords.push(newWord);
        const command = wordValidatorHelper.createPlaceCommand('!placer k6h balle');
        expect(service.calculateScore(stubNewWords, command)).to.be.equal(EXPECTED_SCORE);
    });

    it('should calculate the score of the word with 2x word multiplier and 2x multiplier on letter e', () => {
        const newLetters = [
            wordValidatorHelper.createNewNode('b', 8, 8, true),
            wordValidatorHelper.createNewNode('a', 9, 8, true),
            wordValidatorHelper.createNewNode('l', 10, 8, true),
            wordValidatorHelper.createNewNode('l', 11, 8, true),
            wordValidatorHelper.createNewNode('e', 12, 8, true),
        ];

        const newWord = { letters: newLetters, isHorizontal: true };
        stubNewWords.push(newWord);
        const EXPECTED_SCORE = 16;
        const command = wordValidatorHelper.createPlaceCommand('!placer h8h balle');
        expect(service.calculateScore(stubNewWords, command)).to.be.equal(EXPECTED_SCORE);
    });

    it('should calculate score and add 50 points for placing 7 letters', () => {
        const newLetters = [
            wordValidatorHelper.createNewNode('a', 5, 8, true),
            wordValidatorHelper.createNewNode('b', 6, 8, true),
            wordValidatorHelper.createNewNode('a', 7, 8, true),
            wordValidatorHelper.createNewNode('n', 8, 8, true),
            wordValidatorHelper.createNewNode('d', 9, 8, true),
            wordValidatorHelper.createNewNode('o', 10, 8, true),
            wordValidatorHelper.createNewNode('n', 11, 8, true),
        ];

        const newWord = { letters: newLetters, isHorizontal: true };
        stubNewWords.push(newWord);
        const EXPECTED_SCORE = 70;
        const command = wordValidatorHelper.createPlaceCommand('!placer h5h abandon');
        expect(service.calculateScore(stubNewWords, command)).to.be.equal(EXPECTED_SCORE);
    });

    it('should calculate score of a vertical word with 2x word multiplier and 2x letter multiplier', () => {
        const newLetters = [
            wordValidatorHelper.createNewNode('b', 12, 1, true),
            wordValidatorHelper.createNewNode('a', 12, 2, true),
            wordValidatorHelper.createNewNode('l', 12, 3, true),
            wordValidatorHelper.createNewNode('l', 12, 4, true),
            wordValidatorHelper.createNewNode('e', 12, 5, true),
        ];

        const newWord = { letters: newLetters, isHorizontal: false };
        stubNewWords.push(newWord);
        const EXPECTED_SCORE = 20;
        const command = wordValidatorHelper.createPlaceCommand('!placer a12v balle');
        expect(service.calculateScore(stubNewWords, command)).to.be.equal(EXPECTED_SCORE);
    });

    it('should calculate score of vertical word touching letter of another word', () => {
        const lettersOfNewWord = [
            wordValidatorHelper.createNewNode('b', 1, 1, false),
            wordValidatorHelper.createNewNode('a', 1, 2, true),
            wordValidatorHelper.createNewNode('l', 1, 3, true),
            wordValidatorHelper.createNewNode('l', 1, 4, true),
            wordValidatorHelper.createNewNode('e', 1, 5, true),
        ];
        const newWord = { letters: lettersOfNewWord, isHorizontal: false };
        stubNewWords.push(newWord);
        const EXPECTED_SCORE = 8;
        const command = wordValidatorHelper.createPlaceCommand('!placer b1v balle');
        expect(service.calculateScore(stubNewWords, command)).to.be.equal(EXPECTED_SCORE);
    });

    it('should calculate score of vertical word with a 3x word multiplier', () => {
        const newLetters = [
            wordValidatorHelper.createNewNode('b', 1, 1, true),
            wordValidatorHelper.createNewNode('a', 1, 2, true),
            wordValidatorHelper.createNewNode('l', 1, 3, true),
            wordValidatorHelper.createNewNode('l', 1, 4, true),
            wordValidatorHelper.createNewNode('e', 1, 5, true),
        ];
        const newWord = { letters: newLetters, isHorizontal: false };
        stubNewWords.push(newWord);
        const EXPECTED_SCORE = 24;
        const command = wordValidatorHelper.createPlaceCommand('!placer a1v balle');
        expect(service.calculateScore(stubNewWords, command)).to.be.equal(EXPECTED_SCORE);
    });

    it('should calculate score of vertical word with a 3x letter multiplier', () => {
        const newLetters = [
            wordValidatorHelper.createNewNode('b', 8, 2, true),
            wordValidatorHelper.createNewNode('a', 9, 2, true),
            wordValidatorHelper.createNewNode('l', 10, 2, true),
            wordValidatorHelper.createNewNode('l', 11, 2, true),
            wordValidatorHelper.createNewNode('e', 12, 2, true),
        ];
        const newWord = { letters: newLetters, isHorizontal: true };
        stubNewWords.push(newWord);
        const EXPECTED_SCORE = 9;
        const command = wordValidatorHelper.createPlaceCommand('!placer b8h balle');
        expect(service.calculateScore(stubNewWords, command)).to.be.equal(EXPECTED_SCORE);
    });

    it('get80th70th60thScoredWords should call generateScoreForPlayableWords', () => {
        const generateScoreForPlayableWordsSpy = sinon.spy(service, 'generateScoreForPlayableWords');
        service.get80th70th60thScoredWords(stubGame, stubPlayableWords);
        sinon.assert.calledOnce(generateScoreForPlayableWordsSpy);
    });

    it('get80th70th60thScoredWords should call 3 times with given percentages getPercentilePlayableWord', () => {
        const getPercentilePlayableWordSpy = sinon.spy(service as any, 'getPercentilePlayableWord');
        sinon.stub(service, 'generateScoreForPlayableWords').returns();
        service.get80th70th60thScoredWords(stubGame, stubPlayableWords);
        sinon.assert.calledThrice(getPercentilePlayableWordSpy);
        sinon.assert.calledWith(getPercentilePlayableWordSpy, SCORE_PERCENTILE.EIGHTIETH_PERCENTILE_SCORE, stubPlayableWords);
        sinon.assert.calledWith(getPercentilePlayableWordSpy, SCORE_PERCENTILE.SEVENTIETH_PERCENTILE_SCORE, stubPlayableWords);
        sinon.assert.calledWith(getPercentilePlayableWordSpy, SCORE_PERCENTILE.SIXTIETH_PERCENTILE_SCORE, stubPlayableWords);
    });

    it("get80th70th60thScoredWords shouldn't call getPercentilePlayableWord", () => {
        const getPercentilePlayableWordSpy = sinon.spy(service as any, 'getPercentilePlayableWord');
        sinon.stub(service, 'generateScoreForPlayableWords').returns();
        stubPlayableWords = [];
        service.get80th70th60thScoredWords(stubGame, stubPlayableWords);
        sinon.assert.notCalled(getPercentilePlayableWordSpy);
    });
});
