import { Direction } from '@common/grid/direction';
import { BOARD_LENGTH } from '@common/grid/initialGrid';
import { Node } from '@common/grid/node';

export class ValidationIterator {
    private board: Node[][];
    private direction: string;
    private row: number;
    private column: number;

    constructor(column: number, row: number, board: Node[][], isHorizontal: boolean) {
        if (isHorizontal) {
            this.direction = Direction.Horizontal;
        } else {
            this.direction = Direction.Vertical;
        }
        this.board = board;
        this.column = column;
        this.row = row;
    }

    isValid(): boolean {
        return this.column >= 1 && this.column <= BOARD_LENGTH && this.row >= 1 && this.row <= BOARD_LENGTH;
    }

    next(): void {
        if (this.direction === Direction.Horizontal) {
            this.column++;
        } else {
            this.row++;
        }
    }

    previous(): void {
        if (this.direction === Direction.Horizontal) {
            this.column--;
        } else {
            this.row--;
        }
    }

    isEmpty(): boolean {
        return this.board[this.row][this.column].isEmpty;
    }

    getNode(): Node {
        return this.board[this.row][this.column];
    }

    setNode(newNode: Node): void {
        this.board[this.row][this.column] = newNode;
    }

    getColumn(): number {
        return this.column;
    }

    getRow(): number {
        return this.row;
    }
}
