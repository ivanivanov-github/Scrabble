import { PlayableWord, Position } from '@common/clue';
import { PlaceCommand } from '@common/command';
import { Direction } from '@common/grid/direction';
import { BOARD_LENGTH, DEFAULT_GRID } from '@common/grid/initialGrid';
import { LETTER_VALUES } from '@common/grid/letterValue';
import { Letter, Node } from '@common/grid/node';
import { ROW_INDEX } from '@common/grid/row-index';
import { Service } from 'typedi';

@Service()
export class GridService {
    private readonly gridInfos: number[][] = DEFAULT_GRID;

    loadGrid(): Node[][] {
        const grid: Node[][] = [];
        for (let row = 0; row <= BOARD_LENGTH; row++) {
            grid[row] = [];
            for (let col = 0; col <= BOARD_LENGTH; col++) {
                const nodeTypeValue = this.gridInfos[row][col];
                const node: Node = { tileType: nodeTypeValue, isEmpty: true, x: row, y: col };
                grid[row][col] = node;
            }
        }
        return grid;
    }

    placeLetters(placeCommand: PlaceCommand, grid: Node[][], isNewNode: boolean = false): void {
        let rowIndex = ROW_INDEX.get(placeCommand.row) as number;
        let column = placeCommand.column;
        for (const letter of placeCommand.word) {
            const newLetter: Letter = {
                character: letter,
                value: letter !== letter.toUpperCase() ? (LETTER_VALUES.get(letter) as number) : 0,
            };
            if (placeCommand.direction === Direction.Horizontal) {
                while (!grid[rowIndex][column].isEmpty) {
                    column++;
                }
                grid[rowIndex][column].letter = newLetter;
                grid[rowIndex][column].isEmpty = false;
                grid[rowIndex][column].isNewNode = isNewNode;
                column++;
            } else {
                while (!grid[rowIndex][column].isEmpty) {
                    rowIndex++;
                }
                grid[rowIndex][column].letter = newLetter;
                grid[rowIndex][column].isEmpty = false;
                grid[rowIndex][column].isNewNode = isNewNode;
                rowIndex++;
            }
        }
    }

    getAllGridPositions(): Position[] {
        const allPositions: Position[] = [];
        for (let row = 1; row <= BOARD_LENGTH; row++) {
            for (let col = 1; col <= BOARD_LENGTH; col++) {
                const newPosition: Position = {
                    row,
                    col,
                };
                allPositions.push(newPosition);
            }
        }
        return allPositions;
    }

    isInBounds(position: Position): boolean {
        return position.row > 0 && position.row <= BOARD_LENGTH && position.col > 0 && position.col <= BOARD_LENGTH;
    }

    isEmptyPosition(grid: Node[][], position: Position): boolean {
        if (!this.isInBounds(position)) return true;
        return grid[position.row][position.col].isEmpty;
    }

    getCharacter(grid: Node[][], position: Position): string {
        return (grid[position.row][position.col].letter as Letter).character as string;
    }

    copyGrid(grid: Node[][]): Node[][] {
        const gridCopy: Node[][] = [[]];
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

    getPlaceCommandWord(grid: Node[][], playableWord: PlayableWord): PlayableWord {
        let word = '';
        let row = playableWord.position.row;
        let column = playableWord.position.col;
        let isFirstLetterPlaced = false;
        for (const letter of playableWord.word) {
            if (playableWord.direction === Direction.Horizontal) {
                if (grid[row][column].isEmpty) {
                    if (!isFirstLetterPlaced) {
                        isFirstLetterPlaced = true;
                        playableWord.position.col = column;
                    }
                    ++column;
                    word += letter;
                    continue;
                }
                ++column;
            } else {
                if (grid[row][column].isEmpty) {
                    if (!isFirstLetterPlaced) {
                        isFirstLetterPlaced = true;
                        playableWord.position.row = row;
                    }
                    ++row;
                    word += letter;
                    continue;
                }
                ++row;
            }
        }
        playableWord.word = word;
        return playableWord;
    }
}
