/* eslint-disable max-lines */
import { Trie } from '@app/classes/trie/trie';
import { TrieNode } from '@app/classes/trie/trie-node';
import { DictionaryService } from '@app/services/dictionary/dictionary.service';
import { CommandService } from '@app/services/game/command/command.service';
import { GridService } from '@app/services/game/grid/grid.service';
import { ClueFunctionParams, PlayableWord, Position } from '@common/clue';
import { Direction } from '@common/grid/direction';
import { Letter, Node } from '@common/grid/node';
import { Container, Service } from 'typedi';

const FIRST_WORD_LENGTH = 8;
const MIDDLE_TILE_ROW = 8;
const MIDDLE_TILE_COLUMN = 8;

@Service()
export class ClueService {
    findAllPlayableWords(dictTitle: string, dictionary: TrieNode, playerEasel: Letter[], grid: Node[][]): PlayableWord[] {
        const playableWords: PlayableWord[] = [];
        const playerLetters: string[] = playerEasel.map((letter) => letter.character);
        const anchors: Position[] = this.findAnchors(grid);
        const clueFunctionParams: ClueFunctionParams = {
            playableWords,
            anchors,
            grid,
            playerLetters,
            wordDirection: Direction.Horizontal,
            prefixLimit: 0,
        };
        if (anchors.length === 0) {
            this.generateWordsWithEasel(dictionary, '', clueFunctionParams);
            return clueFunctionParams.playableWords;
        } else {
            this.generateWordsWithEaselAndBoard(dictTitle, dictionary, clueFunctionParams);
            return clueFunctionParams.playableWords;
        }
    }

    private generateWordsWithEaselAndBoard(dictTitle: string, currentTrieNode: TrieNode, clueFunctionParams: ClueFunctionParams): void {
        for (const direction of [Direction.Horizontal, Direction.Vertical]) {
            let partialWord = '';
            for (const anchor of clueFunctionParams.anchors) {
                if (!Container.get(GridService).isEmptyPosition(clueFunctionParams.grid, this.positionBefore(anchor, direction))) {
                    clueFunctionParams.wordDirection = direction;
                    partialWord = this.getAnchorPrefix(anchor, clueFunctionParams);
                    const partialWordNode: TrieNode = (Container.get(DictionaryService).dictTrie.get(dictTitle) as Trie).getLastTrieNode(
                        partialWord,
                    ) as TrieNode;
                    if (partialWordNode) {
                        this.findWordSuffix(dictTitle, partialWord, partialWordNode as TrieNode, anchor, clueFunctionParams);
                    }
                } else {
                    clueFunctionParams.wordDirection = direction;
                    clueFunctionParams.prefixLimit = this.getPrefixLimit(anchor, clueFunctionParams);
                    this.findWordPrefix(dictTitle, '', currentTrieNode, anchor, clueFunctionParams);
                }
            }
        }
    }

    private generateWordsWithEasel(currentNode: TrieNode, partialWord: string, clueFunctionParams: ClueFunctionParams): void {
        if (currentNode.isEndOfWord && partialWord.length < FIRST_WORD_LENGTH) {
            const randomDirection = this.generateRandomDirection();
            const newPosition: Position = this.generateRandomFirstWordPosition(randomDirection, partialWord.length);
            const newPlayableWord: PlayableWord = {
                word: partialWord,
                position: newPosition,
                direction: randomDirection,
            };
            clueFunctionParams.playableWords.push(newPlayableWord);
        }
        for (const [letter, letterChildren] of currentNode.children) {
            if (Container.get(CommandService).includesLetter(letter, clueFunctionParams.playerLetters)) {
                clueFunctionParams.playerLetters.splice(clueFunctionParams.playerLetters.indexOf(letter), 1);
                this.generateWordsWithEasel(letterChildren, partialWord + letter, clueFunctionParams);
                clueFunctionParams.playerLetters.push(letter);
            }
        }
    }

    private includesAnchor(anchor: Position, anchors: Position[]): boolean {
        for (const tmpAnchor of anchors) {
            if (tmpAnchor.row === anchor.row && tmpAnchor.col === anchor.col) return true;
        }
        return false;
    }

    private getLettersBefore(grid: Node[][], position: Position, direction: string): string {
        let lettersBefore = '';
        while (!Container.get(GridService).isEmptyPosition(grid, this.positionBeforeOpposite(position, direction))) {
            position = this.positionBeforeOpposite(position, direction);
            lettersBefore += Container.get(GridService).getCharacter(grid, position);
        }
        return lettersBefore;
    }

    private getLettersAfter(grid: Node[][], position: Position, direction: string): string {
        let lettersAfter = '';
        while (!Container.get(GridService).isEmptyPosition(grid, this.positionAfterOpposite(position, direction))) {
            position = this.positionAfterOpposite(position, direction);
            lettersAfter += Container.get(GridService).getCharacter(grid, position);
        }
        return lettersAfter;
    }

    private getValidLettersCrossingWords(dictTitle: string, grid: Node[][], direction: string, playerLetters: string[]): Map<string, string[]> {
        const validLettersForCrossPosition: Map<string, string[]> = new Map();
        let validLetters: string[] = [];
        for (const position of Container.get(GridService).getAllGridPositions()) {
            validLetters = [];
            if (!Container.get(GridService).isEmptyPosition(grid, position)) continue;
            const lettersBefore = this.getLettersBefore(grid, position, direction);
            const lettersAfter = this.getLettersAfter(grid, position, direction);
            if (lettersBefore.length === 0 && lettersAfter.length === 0) validLetters = playerLetters;
            else {
                for (const letter of playerLetters) {
                    const wordFormed = lettersBefore + letter + lettersAfter;
                    if ((Container.get(DictionaryService).dictTrie.get(dictTitle) as Trie).search(wordFormed)) validLetters.push(letter);
                }
            }
            const key = JSON.stringify(position);
            validLettersForCrossPosition[key] = validLetters;
        }
        return validLettersForCrossPosition;
    }

    private findAnchors(grid: Node[][]): Position[] {
        const anchors: Position[] = [];
        for (const position of Container.get(GridService).getAllGridPositions()) {
            const isEmpty = Container.get(GridService).isEmptyPosition(grid, position);
            const neighborNodeHasLetter =
                !Container.get(GridService).isEmptyPosition(grid, this.positionBefore(position, Direction.Horizontal)) ||
                !Container.get(GridService).isEmptyPosition(grid, this.positionAfter(position, Direction.Horizontal)) ||
                !Container.get(GridService).isEmptyPosition(grid, this.positionBeforeOpposite(position, Direction.Horizontal)) ||
                !Container.get(GridService).isEmptyPosition(grid, this.positionAfterOpposite(position, Direction.Horizontal));
            if (isEmpty && neighborNodeHasLetter) anchors.push(position);
        }
        return anchors;
    }

    private findWordPrefix(
        dictTitle: string,
        partialWord: string,
        currentNode: TrieNode,
        anchor: Position,
        clueFunctionParams: ClueFunctionParams,
    ): void {
        this.findWordSuffix(dictTitle, partialWord, currentNode, anchor, clueFunctionParams);
        const positionTileOnBoard: Position = {
            row: anchor.row,
            col: anchor.col - partialWord.length - 2,
        };
        if (
            Container.get(GridService).isEmptyPosition(clueFunctionParams.grid, positionTileOnBoard) &&
            (clueFunctionParams.prefixLimit as number) > 0
        ) {
            for (const [nextLetter, nextLetterChildren] of currentNode.children) {
                if (Container.get(CommandService).includesLetter(nextLetter, clueFunctionParams.playerLetters)) {
                    clueFunctionParams.playerLetters.splice(clueFunctionParams.playerLetters.indexOf(nextLetter), 1);
                    clueFunctionParams.prefixLimit -= 1;
                    this.findWordPrefix(dictTitle, partialWord.concat(nextLetter), nextLetterChildren, anchor, clueFunctionParams);
                    clueFunctionParams.playerLetters.push(nextLetter);
                }
            }
        }
    }

    private addWordToPlayableWord(position: Position, direction: string, playableWords: PlayableWord[], word: string): void {
        let newPosition: Position = {} as Position;
        if (direction === Direction.Horizontal) {
            newPosition = {
                row: position.row,
                col: position.col - word.length,
            };
        } else {
            newPosition = {
                row: position.row - word.length,
                col: position.col,
            };
        }
        const newPlayableWord: PlayableWord = {
            word,
            position: newPosition,
            direction,
        };
        playableWords.push(newPlayableWord);
    }

    private findWordSuffix(
        dictTitle: string,
        partialWord: string,
        currentNode: TrieNode,
        nextLetterPosition: Position,
        clueFunctionParams: ClueFunctionParams,
    ): void {
        const validLettersForCrossPosition = this.getValidLettersCrossingWords(
            dictTitle,
            clueFunctionParams.grid,
            clueFunctionParams.wordDirection,
            clueFunctionParams.playerLetters,
        );
        if (Container.get(GridService).isInBounds(nextLetterPosition)) {
            if (
                currentNode.isEndOfWord &&
                clueFunctionParams.grid[nextLetterPosition.row][nextLetterPosition.col].isEmpty &&
                !clueFunctionParams.anchors.includes(nextLetterPosition)
            ) {
                this.addWordToPlayableWord(nextLetterPosition, clueFunctionParams.wordDirection, clueFunctionParams.playableWords, partialWord);
            }
            if (Container.get(GridService).isEmptyPosition(clueFunctionParams.grid, nextLetterPosition)) {
                for (const [nextLetter, nextLetterChildren] of currentNode.children) {
                    if (
                        Container.get(CommandService).includesLetter(nextLetter, clueFunctionParams.playerLetters) &&
                        Container.get(CommandService).includesLetter(nextLetter, validLettersForCrossPosition[JSON.stringify(nextLetterPosition)])
                    ) {
                        clueFunctionParams.playerLetters.splice(clueFunctionParams.playerLetters.indexOf(nextLetter), 1);
                        this.findWordSuffix(
                            dictTitle,
                            partialWord.concat(nextLetter),
                            nextLetterChildren,
                            this.positionAfter(nextLetterPosition, clueFunctionParams.wordDirection),
                            clueFunctionParams,
                        );
                        clueFunctionParams.playerLetters.push(nextLetter);
                    }
                }
            } else {
                const letterOnBoard = clueFunctionParams.grid[nextLetterPosition.row][nextLetterPosition.col].letter?.character as string;
                if (currentNode.children.has(letterOnBoard as string)) {
                    this.findWordSuffix(
                        dictTitle,
                        partialWord.concat(letterOnBoard),
                        currentNode.children.get(letterOnBoard as string) as TrieNode,
                        this.positionAfter(nextLetterPosition, clueFunctionParams.wordDirection),
                        clueFunctionParams,
                    );
                }
            }
        }
    }

    private generateRandomFirstWordPosition(direction: string, wordLength: number): Position {
        let newPosition: Position = {} as Position;
        if (direction === Direction.Horizontal) {
            newPosition = {
                row: MIDDLE_TILE_ROW,
                col: Math.round(Math.random() * (wordLength - 1)) + MIDDLE_TILE_COLUMN - wordLength + 1,
            };
        } else {
            newPosition = {
                row: Math.round(Math.random() * (wordLength - 1)) + MIDDLE_TILE_ROW - wordLength + 1,
                col: MIDDLE_TILE_COLUMN,
            };
        }
        return newPosition;
    }

    private generateRandomDirection(): string {
        const directions = [Direction.Horizontal, Direction.Vertical];
        return directions[Math.round(Math.random())] as string;
    }

    private getAnchorPrefix(anchor: Position, clueFunctionParams: ClueFunctionParams): string {
        let scannerPosition = this.positionBefore(anchor, clueFunctionParams.wordDirection);
        let partialWord = clueFunctionParams.grid[scannerPosition.row][scannerPosition.col].letter?.character as string;
        while (
            !Container.get(GridService).isEmptyPosition(
                clueFunctionParams.grid,
                this.positionBefore(scannerPosition, clueFunctionParams.wordDirection),
            )
        ) {
            scannerPosition = this.positionBefore(scannerPosition, clueFunctionParams.wordDirection);
            partialWord = (clueFunctionParams.grid[scannerPosition.row][scannerPosition.col].letter?.character as string) + partialWord;
        }
        return partialWord;
    }

    private getPrefixLimit(anchor: Position, clueFunctionParams: ClueFunctionParams): number {
        let prefixLimit = 0;
        let scannerPosition = anchor;
        while (
            Container.get(GridService).isInBounds(this.positionBefore(scannerPosition, clueFunctionParams.wordDirection)) &&
            Container.get(GridService).isEmptyPosition(
                clueFunctionParams.grid,
                this.positionBefore(scannerPosition, clueFunctionParams.wordDirection),
            ) &&
            !this.includesAnchor(this.positionBefore(scannerPosition, clueFunctionParams.wordDirection), clueFunctionParams.anchors)
        ) {
            prefixLimit += 1;
            scannerPosition = this.positionBefore(scannerPosition, clueFunctionParams.wordDirection);
        }
        return prefixLimit;
    }

    private positionBefore(position: Position, direction: string): Position {
        if (direction === Direction.Horizontal) {
            const beforePosition: Position = {
                row: position.row,
                col: position.col - 1,
            };
            return beforePosition;
        } else {
            const beforePosition: Position = {
                row: position.row - 1,
                col: position.col,
            };
            return beforePosition;
        }
    }

    private positionAfter(position: Position, direction: string): Position {
        if (direction === Direction.Horizontal) {
            const afterPosition: Position = {
                row: position.row,
                col: position.col + 1,
            };
            return afterPosition;
        } else {
            const afterPosition: Position = {
                row: position.row + 1,
                col: position.col,
            };
            return afterPosition;
        }
    }

    private positionBeforeOpposite(position: Position, direction: string): Position {
        if (direction === Direction.Horizontal) {
            const beforeOppositePosition: Position = {
                row: position.row - 1,
                col: position.col,
            };
            return beforeOppositePosition;
        } else {
            const beforeOppositePosition: Position = {
                row: position.row,
                col: position.col - 1,
            };
            return beforeOppositePosition;
        }
    }

    private positionAfterOpposite(position: Position, direction: string): Position {
        if (direction === Direction.Horizontal) {
            const afterOppositePosition: Position = {
                row: position.row + 1,
                col: position.col,
            };
            return afterOppositePosition;
        } else {
            const afterOppositePosition: Position = {
                row: position.row,
                col: position.col + 1,
            };
            return afterOppositePosition;
        }
    }
}
