import { ScoreCalculatorService } from '@app/services/score-calculator/score-calculator.service';
import { WordValidatorService } from '@app/services/word-validator/wordvalidator.service';
import { OBJECTIVES } from '@app/utils/objectives-list';
import { PlaceCommand } from '@common/command';
import { Game } from '@common/game';
import { Letter } from '@common/grid';
import { Node, Word } from '@common/grid/node';
import { Objective, ObjectiveName, ObjectiveType } from '@common/objectives';
import { Player } from '@common/player';
import { Container, Service } from 'typedi';

const NUMBER_OF_OBJECTIVES = 7;
const SCORE_FOR_50_POINTS_OBJECTIVE = 50;
const SCORE_FOR_20_POINTS_OBJECTIVE = 20;

@Service()
export class ObjectivesService {
    addObjectives(game: Game): void {
        const objectivesReserve: Objective[] = JSON.parse(JSON.stringify(OBJECTIVES));
        this.addPublicObjectives(game, objectivesReserve);
        this.addPrivateObjectives(game, objectivesReserve);
    }

    handleObjective(command: PlaceCommand, objective: Objective, game: Game, previousGridState: Node[][]): void {
        if (objective.isCompleted) return;

        switch (objective.name) {
            case ObjectiveName.TripleSameLetter:
                this.handleTripleSameLetterObjective(command, objective, game);
                break;
            case ObjectiveName.Palindrome:
                this.handlePalindromeObjective(command, objective, game);
                break;
            case ObjectiveName.StartEnd:
                this.handleStartEndSameLetterObjective(command, objective, game, previousGridState);
                break;
            case ObjectiveName.TripleVowels:
                this.handleTripleVowelObjective(command, objective, game);
                break;
            case ObjectiveName.FirstTo50:
                this.handleFirstTo50PointsObjective(objective, game);
                break;
            case ObjectiveName.Word20Points:
                this.handleWord20Points(command, objective, game, previousGridState);
                break;
            case ObjectiveName.FormScrabble:
                this.handleFormWordScrabble(command, objective, game, previousGridState);
                break;
            case ObjectiveName.WordOnGrid:
                this.handleWordAlreadyOnGrid(command, objective, game, previousGridState);
                break;
            default:
                break;
        }
    }

    getGameObjectives(game: Game): Objective[] {
        const objectives: Objective[] = [] as Objective[];
        for (const objective of game.publicObjectives as Objective[]) {
            objectives.push(objective);
        }
        return objectives;
    }

    getAllObjectives(game: Game): Objective[] {
        const objectives: Objective[] = this.getGameObjectives(game);
        for (const player of [game.creator, game.opponent]) {
            objectives.push((player as Player).privateObjective as Objective);
        }
        return objectives;
    }

    private addPublicObjectives(game: Game, objectivesReserve: Objective[]): void {
        game.publicObjectives = [] as Objective[];
        for (let i = 0; i < 2; i++) {
            const randomGameObjectiveIndex = Math.floor(Math.random() * (NUMBER_OF_OBJECTIVES - i));
            (game.publicObjectives as Objective[]).push(objectivesReserve[randomGameObjectiveIndex]);
            game.publicObjectives[i].type = ObjectiveType.Public;
            objectivesReserve.splice(randomGameObjectiveIndex, 1);
        }
    }

    private addPrivateObjectives(game: Game, objectivesReserve: Objective[]): void {
        let counter = 2;
        for (const player of [game.creator, game.opponent]) {
            const randomPlayerObjectiveIndex = Math.floor(Math.random() * (NUMBER_OF_OBJECTIVES - counter));
            (player as Player).privateObjective = objectivesReserve[randomPlayerObjectiveIndex];
            ((player as Player).privateObjective as Objective).type = ObjectiveType.Private;
            objectivesReserve.splice(randomPlayerObjectiveIndex, 1);
            counter += 1;
        }
        // (game.creator as Player).privateObjective = objectivesReserve[1];
        // (game.opponent as Player).privateObjective = objectivesReserve[2];
    }

    private handleObjectiveSuccess(objective: Objective, game: Game): void {
        objective.isCompleted = true;
        if ((game.creator as Player).isPlaying) (game.creator as Player).score += objective.points;
        else (game.opponent as Player).score += objective.points;
    }

    private handleTripleSameLetterObjective(command: PlaceCommand, objective: Objective, game: Game): void {
        let success = false;
        let counter = 0;
        for (const selectedLetter of command.word) {
            for (const letter of command.word) {
                if (selectedLetter.toLowerCase() === letter.toLowerCase()) counter += 1;
            }
            if (counter >= 3) {
                success = true;
                break;
            }
            counter = 0;
        }
        if (success) this.handleObjectiveSuccess(objective, game);
    }

    private handlePalindromeObjective(command: PlaceCommand, objective: Objective, game: Game): void {
        if (command.word.length < 2) return;
        let success = false;
        const regex = /[\W_]/g;
        const lowerCaseWord = command.word.toLowerCase().replace(regex, '');
        const reserveWord = lowerCaseWord.split('').reverse().join('');
        if (lowerCaseWord === reserveWord) success = true;
        if (success) this.handleObjectiveSuccess(objective, game);
    }

    private handleStartEndSameLetterObjective(command: PlaceCommand, objective: Objective, game: Game, previousGridState: Node[][]): void {
        let success = false;
        const newFormedWords: Word[] = Container.get(WordValidatorService).getNewWords(command as PlaceCommand, previousGridState);
        for (const formedWord of newFormedWords) {
            const letters = formedWord.letters.map((node) => (node.letter as Letter).character as string);
            if (letters.join() === command.word) continue;
            if (letters[0].toLowerCase() === letters[letters.length - 1].toLowerCase()) {
                success = true;
                break;
            }
        }
        if (success) this.handleObjectiveSuccess(objective, game);
    }

    private handleTripleVowelObjective(command: PlaceCommand, objective: Objective, game: Game): void {
        let success = false;
        const vowels = /[aeiou]/gi;
        const result = command.word.toLowerCase().match(vowels);
        let numVowels = 0;
        if (result) numVowels = (result as RegExpMatchArray).length;
        if (numVowels >= 3) success = true;
        if (success) this.handleObjectiveSuccess(objective, game);
    }

    private handleFirstTo50PointsObjective(objective: Objective, game: Game): void {
        for (const player of [game.creator, game.opponent]) {
            if ((player as Player).score >= SCORE_FOR_50_POINTS_OBJECTIVE) {
                objective.isCompleted = true;
                if (objective.type === ObjectiveType.Private && ((player as Player).privateObjective as Objective).name === objective.name)
                    (player as Player).score += objective.points;
                if (objective.type === ObjectiveType.Public) (player as Player).score += objective.points;
            }
        }
    }

    private handleWord20Points(command: PlaceCommand, objective: Objective, game: Game, previousGridState: Node[][]): void {
        let success = false;
        const newFormedWords: Word[] = Container.get(WordValidatorService).getNewWords(command as PlaceCommand, previousGridState);
        if (Container.get(ScoreCalculatorService).calculateScore(newFormedWords, command) > SCORE_FOR_20_POINTS_OBJECTIVE) success = true;
        if (success) this.handleObjectiveSuccess(objective, game);
    }

    private handleFormWordScrabble(command: PlaceCommand, objective: Objective, game: Game, previousGridState: Node[][]): void {
        let success = false;
        const newWords: Word[] = Container.get(WordValidatorService).getNewWords(command as PlaceCommand, previousGridState);
        for (const word of newWords) {
            const letters = word.letters.map((node) => (node.letter as Letter).character as string);
            if (letters.join('').toLowerCase() === 'scrabble') {
                success = true;
                break;
            }
        }
        if (success) this.handleObjectiveSuccess(objective, game);
    }

    private handleWordAlreadyOnGrid(command: PlaceCommand, objective: Objective, game: Game, previousGridState: Node[][]): void {
        let success = false;
        const previousGridStateCopy = JSON.parse(JSON.stringify(previousGridState));
        const newFormedWords: Word[] = Container.get(WordValidatorService).getNewWords(command as PlaceCommand, previousGridStateCopy);
        const allWordsOnGrid = this.getAllWordsOnGrid(previousGridState);
        // if (allWords.some((word, index) => allWords.indexOf(word) !== index)) success = true;
        for (const formedWord of newFormedWords) {
            const letters = formedWord.letters.map((node) => (node.letter as Letter).character as string);
            if (allWordsOnGrid.includes(letters.join('').toLowerCase())) {
                success = true;
                break;
            }
        }
        if (success) this.handleObjectiveSuccess(objective, game);
    }

    private getAllWordsOnGrid(grid: Node[][]): string[] {
        const allWords = [] as string[];
        for (const row of grid) {
            let tempWord = '';
            for (let i = 0; i < row.length - 1; ) {
                let node: Node = row[i];
                if (!node.isEmpty) {
                    while (!node.isEmpty) {
                        tempWord += (node.letter as Letter).character;
                        i++;
                        node = row[i];
                    }
                    if (tempWord.length > 1) allWords.push(tempWord);
                    continue;
                }
                i++;
            }
        }
        for (let i = 0; i < grid.length - 1; ) {
            let tempWord = '';
            for (let j = 0; j < grid.length - 1; ) {
                let tempNode: Node = grid[j][i];
                if (!tempNode.isEmpty) {
                    while (!tempNode.isEmpty) {
                        tempWord += (tempNode.letter as Letter).character;
                        j++;
                        tempNode = grid[j][i];
                    }
                    if (tempWord.length > 1) allWords.push(tempWord);
                    continue;
                }
                j++;
            }
            i++;
        }
        return allWords;
    }
}
