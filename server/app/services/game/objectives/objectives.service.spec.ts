/* eslint-disable no-console */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable dot-notation */ // We should be able to access private method for test files
/* eslint-disable @typescript-eslint/no-explicit-any */ // We should be able to access private method for test files
import { STUB_GAME } from '@app/classes/mocks/game-service-stubs';
import {
    COMMAND_STUB,
    OBJECTIVE_FORM_20_POINT_WORD_STUB,
    OBJECTIVE_FORM_SCRABBLE_STUB,
    OBJECTIVE_FORM_WORD_ON_BOARD_STUB,
    OBJECTIVE_STUB_1,
    PALINDROME_OBJECTIVE_STUB,
    POINTS_50_OBJECTIVE_STUB,
    PUBLIC_OBJECTIVES_STUB,
    SCRABBLE_STUB,
    STARTING_FINISHING_SAME_OBJECTIVE_STUB,
    SUCCESSFUL_OBJECTIVES_PLACE_COMMAND_STUB,
    S_LETTER,
    THREE_TIMES_SAME_LETTER_OBJECTIVE_STUB,
    THREE_VOWELS_OBJECTIVE_STUB,
    UNSUCCESSFUL_OBJECTIVES_PLACE_COMMAND_STUB,
} from '@app/classes/mocks/objectives-service-stubs';
import { ObjectivesService } from '@app/services/game/objectives/objectives.service';
import { ScoreCalculatorService } from '@app/services/score-calculator/score-calculator.service';
import { WordValidatorService } from '@app/services/word-validator/wordvalidator.service';
import { Command, PlaceCommand } from '@common/command';
import { Game } from '@common/game';
import { Letter } from '@common/grid';
import { Node, Word } from '@common/grid/node';
import { Objective, ObjectiveName, ObjectiveType } from '@common/objectives';
import { Player } from '@common/player';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Container } from 'typedi';

describe('ObjectivesService', () => {
    let objectivesService: ObjectivesService;
    let stubGame: Game;
    let stubPublicObjectives: Objective[];
    let commandStub: Command;
    let objectiveStub: Objective;
    let palindromeObjectiveStub: Objective;
    let points50ObjectiveStub: Objective;
    let threeTimesSameLetterObjectiveStub: Objective;
    let threeVowelsObjectiveStub: Objective;
    let startFinishingSameObjectiveStub: Objective;
    let word20PointsObjectiveStub: Objective;
    let formWordScrabbleStub: Objective;
    let wordAlreadyOnGridStub: Objective;
    let objectiveReserveStub: Objective[];
    let successObjectiveCommandStub: PlaceCommand;
    let unsuccessObjectiveCommandStub: PlaceCommand;

    let addPublicObjectivesStub: sinon.SinonStub;
    let addPrivateObjectivesStub: sinon.SinonStub;
    let handlePalindromeObjectiveStub: sinon.SinonStub;
    let handleFirstTo50PointsObjectiveStub: sinon.SinonStub;
    let handleTripleSameLetterObjectiveStub: sinon.SinonStub;
    let handleTripleVowelObjectiveStub: sinon.SinonStub;
    let handleStartEndSameLetterObjectiveStub: sinon.SinonStub;

    beforeEach(() => {
        objectivesService = Container.get(ObjectivesService);
        stubGame = JSON.parse(JSON.stringify(STUB_GAME));
        stubPublicObjectives = JSON.parse(JSON.stringify(PUBLIC_OBJECTIVES_STUB));
        commandStub = JSON.parse(JSON.stringify(COMMAND_STUB));
        objectiveStub = JSON.parse(JSON.stringify(OBJECTIVE_STUB_1));
        palindromeObjectiveStub = JSON.parse(JSON.stringify(PALINDROME_OBJECTIVE_STUB));
        points50ObjectiveStub = JSON.parse(JSON.stringify(POINTS_50_OBJECTIVE_STUB));
        threeTimesSameLetterObjectiveStub = JSON.parse(JSON.stringify(THREE_TIMES_SAME_LETTER_OBJECTIVE_STUB));
        threeVowelsObjectiveStub = JSON.parse(JSON.stringify(THREE_VOWELS_OBJECTIVE_STUB));
        startFinishingSameObjectiveStub = JSON.parse(JSON.stringify(STARTING_FINISHING_SAME_OBJECTIVE_STUB));
        word20PointsObjectiveStub = JSON.parse(JSON.stringify(OBJECTIVE_FORM_20_POINT_WORD_STUB));
        formWordScrabbleStub = JSON.parse(JSON.stringify(OBJECTIVE_FORM_SCRABBLE_STUB));
        wordAlreadyOnGridStub = JSON.parse(JSON.stringify(OBJECTIVE_FORM_WORD_ON_BOARD_STUB));
        successObjectiveCommandStub = JSON.parse(JSON.stringify(SUCCESSFUL_OBJECTIVES_PLACE_COMMAND_STUB));
        unsuccessObjectiveCommandStub = JSON.parse(JSON.stringify(UNSUCCESSFUL_OBJECTIVES_PLACE_COMMAND_STUB));

        addPublicObjectivesStub = sinon.stub(objectivesService as any, 'addPublicObjectives').returns(stubPublicObjectives);
        addPrivateObjectivesStub = sinon.stub(objectivesService as any, 'addPrivateObjectives').returns(stubPublicObjectives);
        handleTripleSameLetterObjectiveStub = sinon.stub(objectivesService as any, 'handleTripleSameLetterObjective');
        handlePalindromeObjectiveStub = sinon.stub(objectivesService as any, 'handlePalindromeObjective');
        handleStartEndSameLetterObjectiveStub = sinon.stub(objectivesService as any, 'handleStartEndSameLetterObjective');
        handleTripleVowelObjectiveStub = sinon.stub(objectivesService as any, 'handleTripleVowelObjective');
        handleFirstTo50PointsObjectiveStub = sinon.stub(objectivesService as any, 'handleFirstTo50PointsObjective');

        stubGame.publicObjectives = [] as Objective[];
        stubGame.publicObjectives = stubPublicObjectives;
        objectiveReserveStub = [] as Objective[];
        objectiveReserveStub.push(palindromeObjectiveStub);
        objectiveReserveStub.push(points50ObjectiveStub);
        objectiveReserveStub.push(threeTimesSameLetterObjectiveStub);
        objectiveReserveStub.push(threeVowelsObjectiveStub);
        objectiveReserveStub.push(startFinishingSameObjectiveStub);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('addObjectives should call addPublicObjectives and addPrivateObjectives', () => {
        objectivesService.addObjectives(stubGame);
        sinon.assert.calledWith(addPublicObjectivesStub);
        sinon.assert.calledWith(addPrivateObjectivesStub);
    });

    it('should call handleTripleSameLetterObjective if the objective name is TripleSameLetter', () => {
        objectivesService.handleObjective(commandStub as PlaceCommand, threeTimesSameLetterObjectiveStub, stubGame, stubGame.grid);
        sinon.assert.calledWith(handleTripleSameLetterObjectiveStub, commandStub as PlaceCommand, threeTimesSameLetterObjectiveStub, stubGame);
    });

    it('should call handlePalindromeObjective if the objective name is Palindrome', () => {
        objectivesService.handleObjective(commandStub as PlaceCommand, palindromeObjectiveStub, stubGame, stubGame.grid);
        sinon.assert.calledWith(handlePalindromeObjectiveStub, commandStub as PlaceCommand, palindromeObjectiveStub, stubGame);
    });

    it('should call handleStartEndSameLetterObjective if the objective name is StartEnd', () => {
        objectivesService.handleObjective(commandStub as PlaceCommand, startFinishingSameObjectiveStub, stubGame, stubGame.grid);
        sinon.assert.calledWith(handleStartEndSameLetterObjectiveStub, commandStub as PlaceCommand, startFinishingSameObjectiveStub, stubGame);
    });

    it('should call handleTripleVowelObjective if the objective name is TripleVowels', () => {
        objectivesService.handleObjective(commandStub as PlaceCommand, threeVowelsObjectiveStub, stubGame, stubGame.grid);
        sinon.assert.calledWith(handleTripleVowelObjectiveStub, commandStub as PlaceCommand, threeVowelsObjectiveStub, stubGame);
    });

    it('should call handleFirstTo50PointsObjective if the objective name is FirstTo50', () => {
        objectivesService.handleObjective(commandStub as PlaceCommand, points50ObjectiveStub, stubGame, stubGame.grid);
        sinon.assert.calledWith(handleFirstTo50PointsObjectiveStub, points50ObjectiveStub, stubGame);
    });

    it('should call handleWord20Points if the objective name is Word20Points', () => {
        const handleWord20PointsSpy = sinon.stub(objectivesService as any, 'handleWord20Points').returns(null);
        objectivesService.handleObjective(commandStub as PlaceCommand, word20PointsObjectiveStub, stubGame, stubGame.grid);
        sinon.assert.calledWith(handleWord20PointsSpy, commandStub as PlaceCommand, word20PointsObjectiveStub, stubGame);
    });

    it('should call handleFormWordScrabble if the objective name is FormScrabble', () => {
        const handleFormWordScrabbleSpy = sinon.stub(objectivesService as any, 'handleFormWordScrabble').returns(null);
        objectivesService.handleObjective(commandStub as PlaceCommand, formWordScrabbleStub, stubGame, stubGame.grid);
        sinon.assert.calledWith(handleFormWordScrabbleSpy, commandStub as PlaceCommand, formWordScrabbleStub, stubGame);
    });

    it('should call handleWordAlreadyOnGrid if the objective name is WordOnGrid', () => {
        const handleWordAlreadyOnGridSpy = sinon.stub(objectivesService as any, 'handleWordAlreadyOnGrid').returns(null);
        objectivesService.handleObjective(commandStub as PlaceCommand, wordAlreadyOnGridStub, stubGame, stubGame.grid);
        sinon.assert.calledWith(handleWordAlreadyOnGridSpy, commandStub as PlaceCommand, wordAlreadyOnGridStub, stubGame);
    });

    it("shouldn't call any handle objective functions", () => {
        objectivesService.handleObjective(commandStub as PlaceCommand, objectiveStub, stubGame, stubGame.grid);
        sinon.assert.notCalled(handleTripleSameLetterObjectiveStub);
        sinon.assert.notCalled(handlePalindromeObjectiveStub);
        sinon.assert.notCalled(handleStartEndSameLetterObjectiveStub);
        sinon.assert.notCalled(handleTripleVowelObjectiveStub);
        sinon.assert.notCalled(handleFirstTo50PointsObjectiveStub);
    });

    it("shouldn't call any handle objective functions if objective isCompleted", () => {
        objectiveStub.isCompleted = true;
        objectivesService.handleObjective(commandStub as PlaceCommand, objectiveStub, stubGame, stubGame.grid);
        sinon.assert.notCalled(handleTripleSameLetterObjectiveStub);
        sinon.assert.notCalled(handlePalindromeObjectiveStub);
        sinon.assert.notCalled(handleStartEndSameLetterObjectiveStub);
        sinon.assert.notCalled(handleTripleVowelObjectiveStub);
        sinon.assert.notCalled(handleFirstTo50PointsObjectiveStub);
    });

    it('should return the objectives of the game', () => {
        expect(objectivesService.getGameObjectives(stubGame)).to.deep.equal(stubPublicObjectives);
    });

    it('should return the objectives of the game, the creator and the opponent', () => {
        (stubGame.creator as Player).privateObjective = palindromeObjectiveStub;
        (stubGame.opponent as Player).privateObjective = points50ObjectiveStub;
        const copyAllObjectives: Objective[] = JSON.parse(JSON.stringify(stubPublicObjectives));
        copyAllObjectives.push(palindromeObjectiveStub);
        copyAllObjectives.push(points50ObjectiveStub);
        expect(objectivesService.getAllObjectives(stubGame)).to.deep.equal(copyAllObjectives);
    });

    it('should add 2 different objectives to the game, and remove the same 2 from the objective reserve', () => {
        sinon.restore();
        const mathRandomStub: sinon.SinonStub = sinon.stub(Math, 'random');
        stubGame.publicObjectives = [] as Objective[];
        mathRandomStub.onFirstCall().returns(0);
        mathRandomStub.onSecondCall().returns(0);
        objectivesService['addPublicObjectives'](stubGame, objectiveReserveStub);
        expect((stubGame.publicObjectives as Objective[])[0]).to.be.equal(palindromeObjectiveStub);
        expect((stubGame.publicObjectives as Objective[])[1]).to.be.equal(points50ObjectiveStub);
    });

    it('should add 2 different objectives to the 2 players, and remove the same 2 from the objective reserve', () => {
        sinon.restore();
        const mathRandomStub: sinon.SinonStub = sinon.stub(Math, 'random');
        mathRandomStub.onFirstCall().returns(0);
        mathRandomStub.onSecondCall().returns(0);
        objectivesService['addPrivateObjectives'](stubGame, objectiveReserveStub);
        expect((stubGame.creator as Player).privateObjective as Objective).to.be.equal(palindromeObjectiveStub);
        expect((stubGame.opponent as Player).privateObjective as Objective).to.be.equal(points50ObjectiveStub);
    });

    it('should change objective 3 times same letter isCompleted boolean attribute to true if word in place command is aoooa', () => {
        sinon.restore();
        objectivesService['handleTripleSameLetterObjective'](successObjectiveCommandStub, threeTimesSameLetterObjectiveStub, stubGame);
        expect(threeTimesSameLetterObjectiveStub.isCompleted).to.be.equal(true);
    });

    it('should change objective palindrome isCompleted boolean attribute to true if word in place command is aoooa', () => {
        sinon.restore();
        objectivesService['handlePalindromeObjective'](successObjectiveCommandStub, palindromeObjectiveStub, stubGame);
        expect(palindromeObjectiveStub.isCompleted).to.be.equal(true);
    });

    it('handlePalindromeObjective should not call handleObjectiveSuccess', () => {
        sinon.restore();
        const handleObjectiveSuccessSpy = sinon.spy(objectivesService as any, 'handleObjectiveSuccess');
        successObjectiveCommandStub.word = 'a';
        console.log(successObjectiveCommandStub.word.length);
        objectivesService['handlePalindromeObjective'](successObjectiveCommandStub, palindromeObjectiveStub, stubGame);
        sinon.assert.notCalled(handleObjectiveSuccessSpy);
    });

    it('should change objective starts ends isCompleted boolean attribute to true if word in place command is aoooa', () => {
        sinon.restore();
        objectivesService['handleStartEndSameLetterObjective'](successObjectiveCommandStub, startFinishingSameObjectiveStub, stubGame, stubGame.grid);
        expect(startFinishingSameObjectiveStub.isCompleted).to.be.equal(true);
    });

    it('handleStartEndSameLetterObjective should not call handleObjectiveSuccess', () => {
        sinon.restore();
        const handleObjectiveSuccessSpy = sinon.spy(objectivesService as any, 'handleObjectiveSuccess');
        const newFormedWordStub: Word = JSON.parse(JSON.stringify(SCRABBLE_STUB));
        const letters = newFormedWordStub.letters.map((node) => (node.letter as Letter).character as string);
        console.log(letters.join(''));
        sinon.stub(Container.get(WordValidatorService), 'getNewWords').returns([newFormedWordStub]);
        successObjectiveCommandStub.word = 'scrabble';
        objectivesService['handleStartEndSameLetterObjective'](successObjectiveCommandStub, startFinishingSameObjectiveStub, stubGame, stubGame.grid);
        console.log(successObjectiveCommandStub.word);
        console.log(
            Container.get(WordValidatorService)
                .getNewWords(successObjectiveCommandStub, stubGame.grid)[0]
                .letters.map((node) => (node.letter as Letter).character as string),
        );
        sinon.assert.notCalled(handleObjectiveSuccessSpy);
    });

    it('should change objective three vowels isCompleted boolean attribute to true if word in place command is aoooa', () => {
        sinon.restore();
        objectivesService['handleTripleVowelObjective'](successObjectiveCommandStub, threeVowelsObjectiveStub, stubGame);
        expect(threeVowelsObjectiveStub.isCompleted).to.be.equal(true);
    });

    it('should change objective 50 points isCompleted boolean attribute to true if neither player has more than 50 points', () => {
        sinon.restore();
        (stubGame.creator as Player).score = 55;
        (stubGame.opponent as Player).score = 15;
        objectivesService['handleFirstTo50PointsObjective'](points50ObjectiveStub, stubGame);
        expect(points50ObjectiveStub.isCompleted).to.be.equal(true);
    });

    it('should not change objective 3 times same letter isCompleted boolean attribute to true if word in place command is xyz', () => {
        sinon.restore();
        objectivesService['handleTripleSameLetterObjective'](unsuccessObjectiveCommandStub, threeTimesSameLetterObjectiveStub, stubGame);
        expect(threeTimesSameLetterObjectiveStub.isCompleted).to.be.equal(false);
    });

    it('should not change objective palindrome isCompleted boolean attribute to true if word in place command is xyz', () => {
        sinon.restore();
        objectivesService['handlePalindromeObjective'](unsuccessObjectiveCommandStub, palindromeObjectiveStub, stubGame);
        expect(palindromeObjectiveStub.isCompleted).to.be.equal(false);
    });

    it('should not change objective starts ends isCompleted boolean attribute to true if word in place command is xyz', () => {
        sinon.restore();
        objectivesService['handleStartEndSameLetterObjective'](
            unsuccessObjectiveCommandStub,
            startFinishingSameObjectiveStub,
            stubGame,
            stubGame.grid,
        );
        expect(startFinishingSameObjectiveStub.isCompleted).to.be.equal(false);
    });

    it('should not change objective three vowels isCompleted boolean attribute to true if word in place command is xyz', () => {
        sinon.restore();
        objectivesService['handleTripleVowelObjective'](unsuccessObjectiveCommandStub, threeVowelsObjectiveStub, stubGame);
        expect(threeVowelsObjectiveStub.isCompleted).to.be.equal(false);
    });

    it('should not change objective 50 points isCompleted boolean attribute to true if neither player has more than 50 points', () => {
        sinon.restore();
        (stubGame.creator as Player).score = 15;
        (stubGame.opponent as Player).score = 15;
        objectivesService['handleFirstTo50PointsObjective'](points50ObjectiveStub, stubGame);
        expect(points50ObjectiveStub.isCompleted).to.be.equal(false);
    });

    it('should add objective three times same letter score to opponent if is playing', () => {
        sinon.restore();
        (stubGame.creator as Player).isPlaying = false;
        (stubGame.opponent as Player).isPlaying = true;
        objectivesService['handleTripleSameLetterObjective'](successObjectiveCommandStub, threeTimesSameLetterObjectiveStub, stubGame);
        expect(threeTimesSameLetterObjectiveStub.isCompleted).to.be.equal(true);
    });

    it('should add objective palindrome score to opponent if is playing', () => {
        sinon.restore();
        (stubGame.creator as Player).isPlaying = false;
        (stubGame.opponent as Player).isPlaying = true;
        objectivesService['handlePalindromeObjective'](successObjectiveCommandStub, palindromeObjectiveStub, stubGame);
        expect(palindromeObjectiveStub.isCompleted).to.be.equal(true);
    });

    it('should add objective start end score to opponent if is playing', () => {
        sinon.restore();
        (stubGame.creator as Player).isPlaying = false;
        (stubGame.opponent as Player).isPlaying = true;
        objectivesService['handleStartEndSameLetterObjective'](successObjectiveCommandStub, startFinishingSameObjectiveStub, stubGame, stubGame.grid);
        expect(startFinishingSameObjectiveStub.isCompleted).to.be.equal(true);
    });

    it('should add objective three vowels score to opponent if is playing', () => {
        sinon.restore();
        (stubGame.creator as Player).isPlaying = false;
        (stubGame.opponent as Player).isPlaying = true;
        objectivesService['handleTripleVowelObjective'](successObjectiveCommandStub, threeVowelsObjectiveStub, stubGame);
        expect(threeVowelsObjectiveStub.isCompleted).to.be.equal(true);
    });

    it('should add objective 50 points score to opponent if is playing', () => {
        sinon.restore();
        (stubGame.creator as Player).isPlaying = false;
        (stubGame.opponent as Player).isPlaying = true;
        (stubGame.creator as Player).score = 55;
        (stubGame.opponent as Player).score = 15;
        objectivesService['handleFirstTo50PointsObjective'](points50ObjectiveStub, stubGame);
        expect(points50ObjectiveStub.isCompleted).to.be.equal(true);
    });

    it('should add score to player with first to 50 points as private objective', () => {
        sinon.restore();
        (stubGame.creator as Player).isPlaying = false;
        (stubGame.opponent as Player).isPlaying = true;
        (stubGame.opponent as Player).privateObjective = palindromeObjectiveStub;
        ((stubGame.opponent as Player).privateObjective as Objective).name = ObjectiveName.FirstTo50;
        ((stubGame.opponent as Player).privateObjective as Objective).type = ObjectiveType.Private;
        points50ObjectiveStub.type = ObjectiveType.Private;
        (stubGame.creator as Player).score = 15;
        (stubGame.opponent as Player).score = 55;
        objectivesService['handleFirstTo50PointsObjective'](points50ObjectiveStub, stubGame);
        expect(points50ObjectiveStub.name).to.be.equal(((stubGame.opponent as Player).privateObjective as Objective).name);
        expect(points50ObjectiveStub.isCompleted).to.be.equal(true);
        expect((stubGame.opponent as Player).score).to.be.equal(65);
    });

    it('should add score to player with first to 50 points with first to 50 as public', () => {
        sinon.restore();
        (stubGame.publicObjectives as Objective[])[0].name = ObjectiveType.Public;
        (stubGame.creator as Player).score = 15;
        (stubGame.opponent as Player).score = 55;
        points50ObjectiveStub.type = ObjectiveType.Public;
        objectivesService['handleFirstTo50PointsObjective'](points50ObjectiveStub, stubGame);
        expect(points50ObjectiveStub.isCompleted).to.be.equal(true);
    });

    it('handleWord20Points should call handleObjectiveSuccess', () => {
        const handleObjectiveSuccessSpy = sinon.spy(objectivesService as any, 'handleObjectiveSuccess');
        sinon.stub(Container.get(WordValidatorService), 'getNewWords').returns([] as Word[]);
        sinon.stub(Container.get(ScoreCalculatorService), 'calculateScore').returns(25);
        objectivesService['handleWord20Points'](successObjectiveCommandStub, word20PointsObjectiveStub, stubGame, stubGame.grid);
        sinon.assert.called(handleObjectiveSuccessSpy);
    });

    it('handleWord20Points should not call handleObjectiveSuccess', () => {
        const handleObjectiveSuccessSpy = sinon.spy(objectivesService as any, 'handleObjectiveSuccess');
        sinon.stub(Container.get(WordValidatorService), 'getNewWords').returns([] as Word[]);
        sinon.stub(Container.get(ScoreCalculatorService), 'calculateScore').returns(15);
        objectivesService['handleWord20Points'](successObjectiveCommandStub, word20PointsObjectiveStub, stubGame, stubGame.grid);
        sinon.assert.notCalled(handleObjectiveSuccessSpy);
    });

    it('handleFormWordScrabble should call handleObjectiveSuccess', () => {
        const handleObjectiveSuccessSpy = sinon.spy(objectivesService as any, 'handleObjectiveSuccess');
        const scrabbleWordStub: Word = JSON.parse(JSON.stringify(SCRABBLE_STUB));
        sinon.stub(Container.get(WordValidatorService), 'getNewWords').returns([scrabbleWordStub] as Word[]);
        objectivesService['handleFormWordScrabble'](successObjectiveCommandStub, formWordScrabbleStub, stubGame, stubGame.grid);
        sinon.assert.called(handleObjectiveSuccessSpy);
    });

    it('handleFormWordScrabble should not call handleObjectiveSuccess', () => {
        const handleObjectiveSuccessSpy = sinon.spy(objectivesService as any, 'handleObjectiveSuccess');
        const scrabbleWordStub: Word = JSON.parse(JSON.stringify(SCRABBLE_STUB));
        ((scrabbleWordStub.letters[0] as Node).letter as Letter).character = 'a';
        sinon.stub(Container.get(WordValidatorService), 'getNewWords').returns([scrabbleWordStub] as Word[]);
        objectivesService['handleFormWordScrabble'](successObjectiveCommandStub, formWordScrabbleStub, stubGame, stubGame.grid);
        sinon.assert.notCalled(handleObjectiveSuccessSpy);
    });

    it('handleWordAlreadyOnGrid should call handleObjectiveSuccess', () => {
        const handleObjectiveSuccessSpy = sinon.spy(objectivesService as any, 'handleObjectiveSuccess');
        const newFormedWordStub: Word = JSON.parse(JSON.stringify(SCRABBLE_STUB));
        const wordOnGridStub = ['scrabble'];
        sinon.stub(Container.get(WordValidatorService), 'getNewWords').returns([newFormedWordStub] as Word[]);
        sinon.stub(objectivesService as any, 'getAllWordsOnGrid').returns(wordOnGridStub);
        objectivesService['handleWordAlreadyOnGrid'](successObjectiveCommandStub, wordAlreadyOnGridStub, stubGame, stubGame.grid);
        sinon.assert.called(handleObjectiveSuccessSpy);
    });

    it('handleWordAlreadyOnGrid should not call handleObjectiveSuccess', () => {
        const handleObjectiveSuccessSpy = sinon.spy(objectivesService as any, 'handleObjectiveSuccess');
        const newFormedWordStub: Word = JSON.parse(JSON.stringify(SCRABBLE_STUB));
        const wordOnGridStub = ['acrabble'];
        sinon.stub(Container.get(WordValidatorService), 'getNewWords').returns([newFormedWordStub] as Word[]);
        sinon.stub(objectivesService as any, 'getAllWordsOnGrid').returns(wordOnGridStub);
        objectivesService['handleWordAlreadyOnGrid'](successObjectiveCommandStub, wordAlreadyOnGridStub, stubGame, stubGame.grid);
        sinon.assert.notCalled(handleObjectiveSuccessSpy);
    });

    it('getAllWordsOnGrid should return an empty array of sss', () => {
        stubGame.grid[0][0].letter = JSON.parse(JSON.stringify(S_LETTER));
        stubGame.grid[0][0].isEmpty = false;
        stubGame.grid[0][1].letter = JSON.parse(JSON.stringify(S_LETTER));
        stubGame.grid[0][1].isEmpty = false;
        stubGame.grid[0][2].letter = JSON.parse(JSON.stringify(S_LETTER));
        stubGame.grid[0][2].isEmpty = false;
        stubGame.grid[1][0].letter = JSON.parse(JSON.stringify(S_LETTER));
        stubGame.grid[1][0].isEmpty = false;
        const result = objectivesService['getAllWordsOnGrid'](stubGame.grid);
        expect(result).to.deep.equal(['sss', 'ss']);
    });
});
