import { LETTER_VALUES } from '@common/grid/letterValue';
import { Letter } from '@common/grid/node';
import { Service } from 'typedi';

const MAX_LETTERS_ON_EASEL = 7;

@Service()
export class EaselService {
    removeLetters(word: string, playerEasel: Letter[], reserve: string[]): void {
        for (let letter of word) {
            if (letter === letter.toUpperCase()) letter = '*';
            this.removeLetter(letter, playerEasel);
            this.addLetter(playerEasel, reserve);
        }
    }

    exchangeLetters(letters: string, playerEasel: Letter[], reserve: string[]): boolean {
        if (reserve.length < MAX_LETTERS_ON_EASEL) return false;
        for (const letter of letters) {
            this.removeLetter(letter, playerEasel);
            this.addLetter(playerEasel, reserve);
        }
        for (const letter of letters) {
            reserve.push(letter);
        }
        return true;
    }

    generatePlayerLetters(reserve: string[]): Letter[] {
        const playerLetters: Letter[] = [];
        for (let i = 0; i < MAX_LETTERS_ON_EASEL; i++) {
            const randomLetter = this.getRandomLetter(reserve);
            reserve.splice(reserve.indexOf(randomLetter as string), 1);
            const newLetter: Letter = { character: randomLetter as string, value: LETTER_VALUES.get(randomLetter as string) as number };
            playerLetters.push(newLetter);
        }
        return playerLetters;
    }
    private removeLetter(letterToRemove: string, playerEasel: Letter[]): void {
        const letterIndex = playerEasel.findIndex((letter) => letter.character === letterToRemove);
        playerEasel.splice(letterIndex, 1);
    }

    private addLetter(playerEasel: Letter[], reserve: string[]): void {
        const letterGenerated: string | undefined = this.getRandomLetter(reserve);
        this.updateLetterReserve(letterGenerated as string, reserve);
        if (letterGenerated !== undefined) {
            const newLetter: Letter = { character: letterGenerated, value: LETTER_VALUES.get(letterGenerated) as number };
            playerEasel.push(newLetter);
        }
    }

    private getRandomLetter(reserve: string[]): string | undefined {
        const letter = reserve[Math.floor(Math.random() * reserve.length)];
        return letter;
    }

    private updateLetterReserve(removedLetter: string, reserve: string[]): void {
        reserve.splice(reserve.indexOf(removedLetter), 1);
    }
}
