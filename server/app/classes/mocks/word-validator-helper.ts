import { PlaceCommand } from '@common/command';
import { DEFAULT_GRID } from '@common/grid/initialGrid';
import { LETTER_VALUES } from '@common/grid/letterValue';
import { Node, Word } from '@common/grid/node';

export class WordValidatorHelper {
    createNewNode(letterChar: string, nodeX: number, nodeY: number, isNew: boolean): Node {
        return {
            letter: {
                character: letterChar,
                value: letterChar.toLowerCase() === letterChar ? (LETTER_VALUES.get(letterChar) as number) : 0,
            },
            tileType: DEFAULT_GRID[nodeY][nodeX],
            isEmpty: false,
            x: nodeX,
            y: nodeY,
            isNewNode: isNew,
        };
    }

    createNewWord(letters: string, nodeX: number, nodeY: number, isHorizontal: boolean): Word {
        const newLetters = [];
        if (isHorizontal) {
            for (let i = 0; i < letters.length; i++) {
                newLetters.push(this.createNewNode(letters[i], nodeX + i, nodeY, true));
            }
        } else {
            for (let i = 0; i < letters.length; i++) {
                newLetters.push(this.createNewNode(letters[i], nodeX, nodeY + i, true));
            }
        }
        return { letters: newLetters, isHorizontal };
    }

    copyGrid(grid: Node[][]): Node[][] {
        const gridCopy: Node[][] = [];
        for (let i = 0; i < grid.length; i++) {
            gridCopy[i] = [];
            for (let j = 0; j < grid[i].length; j++) {
                const newNode = {
                    ...grid[i][j],
                };
                gridCopy[i][j] = newNode;
            }
        }
        return gridCopy;
    }

    createPlaceCommand(command: string): PlaceCommand {
        const stringNoExclamation = command.substring(1);
        const splitString = stringNoExclamation.split(' ');
        return {
            fullCommand: command,
            name: splitString[0],
            row: splitString[1].charAt(0),
            column: parseInt(splitString[1].charAt(1), 10),
            direction: splitString[1].charAt(2),
            word: splitString[2],
            wordsInDictionary: true,
        };
    }
}
