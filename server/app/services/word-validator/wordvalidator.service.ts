import { ValidationIterator } from '@app/classes/wordValidation/validation-iterator';
import { DictionaryService } from '@app/services/dictionary/dictionary.service';
import { GridService } from '@app/services/game/grid/grid.service';
import { PlaceCommand } from '@common/command';
import { Direction } from '@common/grid/direction';
import { DEFAULT_GRID } from '@common/grid/initialGrid';
import { LETTER_VALUES } from '@common/grid/letterValue';
import { Letter, Node, Word } from '@common/grid/node';
import { ROW_INDEX } from '@common/grid/row-index';
import { Container, Service } from 'typedi';

@Service()
export class WordValidatorService {
    isPlaceCommandValid(dictTitle: string, placeCommand: PlaceCommand, grid: Node[][]): boolean {
        let newWords: Word[] = [];
        if (this.isFirstMove(grid)) {
            return this.isTouchingH8(placeCommand) && this.isWordInDict(dictTitle, placeCommand.word);
        }

        if (!this.isTouchingOldLetter(placeCommand, grid)) return false;

        newWords = this.getNewWords(placeCommand, grid);
        return newWords.length !== 0 && this.isWordsInDict(dictTitle, newWords);
    }

    isEmpty(placeCommand: PlaceCommand, grid: Node[][]): boolean {
        const row = ROW_INDEX.get(placeCommand.row) as number;
        return grid[row][placeCommand.column].isEmpty;
    }

    getNewWords(placeCommand: PlaceCommand, grid: Node[][]): Word[] {
        const row = ROW_INDEX.get(placeCommand.row) as number;
        const copiedGrid = Container.get(GridService).copyGrid(grid);
        let newWords: Word[] = [];
        newWords = this.getNewWordsCommand(placeCommand.column, row, copiedGrid, placeCommand);
        return newWords;
    }

    getWordTouching(node: Node, grid: Node[][], command: PlaceCommand, isHorizontal: boolean): Word | void {
        const word = [];
        let iterator = new ValidationIterator(node.x, node.y, grid, isHorizontal);
        iterator.previous();
        while (iterator.isValid() && !iterator.isEmpty()) {
            word.push(iterator.getNode());
            iterator.previous();
        }

        word.reverse();
        word.push(node);

        iterator = new ValidationIterator(node.x, node.y, grid, isHorizontal);
        iterator.next();
        while (iterator.isValid() && !iterator.isEmpty()) {
            word.push(iterator.getNode());
            iterator.next();
        }

        if (word.length > 1) return { letters: word, isHorizontal: true };
    }

    isWordInDict(dictTitle: string, word: string): boolean {
        const wordLowerCase = word.toLowerCase();
        wordLowerCase.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return Container.get(DictionaryService).verifyWord(dictTitle, wordLowerCase);
    }

    isFirstMove(grid: Node[][]): boolean {
        for (let i = 1; i < grid.length; i++) {
            for (let j = 1; j < grid[i].length; j++) {
                if (!grid[i][j].isEmpty) {
                    return false;
                }
            }
        }
        return true;
    }

    isTouchingH8(command: PlaceCommand): boolean {
        const MIDDLE = 8;
        const lettersLength = command.word.length;
        let row = ROW_INDEX.get(command.row) as number;
        let column = command.column;
        if (command.direction === Direction.Horizontal) {
            for (let i = 0; i < lettersLength; i++) {
                if (row === MIDDLE && column === MIDDLE) return true;
                column++;
            }
        } else {
            for (let i = 0; i < lettersLength; i++) {
                if (row === MIDDLE && column === MIDDLE) return true;
                row++;
            }
        }
        return false;
    }

    private isWordsInDict(dictTitle: string, newWords: Word[]): boolean {
        for (const word of newWords) {
            let newWord = '';
            for (const letter of word.letters) {
                newWord += (letter.letter as Letter).character;
            }
            const isValid = this.isWordInDict(dictTitle, newWord);
            if (!isValid) {
                return false;
            }
        }
        return true;
    }

    private getNewWordsCommand(startingX: number, startingY: number, grid: Node[][], command: PlaceCommand): Word[] {
        const newWords: Word[] = [];
        const isHorizontal = command.direction === Direction.Horizontal;
        const iterator = new ValidationIterator(startingX, startingY, grid, isHorizontal);
        for (const letter of command.word) {
            if (!iterator.isValid()) break;
            if (iterator.isEmpty()) {
                const tempLetter = this.createNewLetter(letter);
                iterator.setNode(this.createNewNode(tempLetter, iterator.getColumn(), iterator.getRow()));
                const newWord = this.getWordTouching(iterator.getNode(), grid, command, !isHorizontal);
                if (newWord) newWords.push(newWord);
                iterator.next();
            }
        }
        const word = this.getWordTouching(grid[startingY][startingX], grid, command, isHorizontal);
        if (word) newWords.push(word);
        return newWords;
    }

    private createNewLetter(letterChar: string): Letter {
        return {
            character: letterChar,
            value: letterChar !== letterChar.toUpperCase() ? (LETTER_VALUES.get(letterChar) as number) : 0,
        };
    }

    private createNewNode(letter: Letter, x: number, y: number): Node {
        return {
            letter,
            tileType: DEFAULT_GRID[y][x],
            isEmpty: false,
            x,
            y,
            isNewNode: true,
        };
    }

    private isTouchingHorizontal(length: number, startingRow: number, startingCol: number, grid: Node[][]): boolean {
        if (grid[startingRow][startingCol - 1] && !grid[startingRow][startingCol - 1].isEmpty) return true;
        if (grid[startingRow][startingCol + length] && !grid[startingRow][startingCol + length].isEmpty) return true;
        for (let i = 0; i < length && startingCol + i < grid[startingRow].length; i++) {
            if (grid[startingRow - 1]) {
                if (!grid[startingRow - 1][startingCol + i].isEmpty) return true;
            }

            if (grid[startingRow + 1]) {
                if (!grid[startingRow + 1][startingCol + i].isEmpty) return true;
            }
        }
        return false;
    }

    private isTouchingVertical(length: number, startingRow: number, startingCol: number, grid: Node[][]): boolean {
        if (grid[startingRow - 1] && grid[startingRow - 1][startingCol] && !grid[startingRow - 1][startingCol].isEmpty) return true;
        if (grid[startingRow + length] && grid[startingRow + length][startingCol] && !grid[startingRow + length][startingCol].isEmpty) return true;
        for (let i = 0; i < length && startingRow + i < grid.length; i++) {
            if (grid[startingRow + i][startingCol - 1]) {
                if (!grid[startingRow + i][startingCol - 1].isEmpty) return true;
            }
            if (grid[startingRow + i][startingCol + 1]) {
                if (!grid[startingRow + i][startingCol + 1].isEmpty) return true;
            }
        }
        return false;
    }

    private isTouchingOldLetter(placeCommand: PlaceCommand, grid: Node[][]): boolean {
        const row = ROW_INDEX.get(placeCommand.row) as number;
        return placeCommand.direction === Direction.Horizontal
            ? this.isTouchingHorizontal(placeCommand.word.length, row, placeCommand.column, grid)
            : this.isTouchingVertical(placeCommand.word.length, row, placeCommand.column, grid);
    }
}
