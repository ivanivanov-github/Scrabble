import { ExchangeCommand, PlaceCommand } from '@common/command';
import { Letter } from '@common/grid/node';
import { Service } from 'typedi';

const NOT_FOUND = -1;

@Service()
export class CommandService {
    isValidPlaceCommand(command: PlaceCommand, playerEasel: Letter[]): boolean {
        return this.hasLetters(command.word, playerEasel);
    }

    isValidExchangeCommand(command: ExchangeCommand, playerEasel: Letter[]): boolean {
        return this.hasLetters(command.letters, playerEasel);
    }

    includesLetter(letter: string, playerLetters: string[]): boolean {
        return playerLetters.indexOf(letter) !== NOT_FOUND;
    }

    private hasLetters(letters: string, playerEasel: Letter[]): boolean {
        const playerLetters = playerEasel.map((letter) => letter.character);
        for (const letter of letters) {
            if (letter === letter.toUpperCase()) {
                if (this.includesLetter('*', playerLetters)) playerLetters.splice(playerLetters.indexOf('*'), 1);
                else return false;
            } else {
                if (this.includesLetter(letter, playerLetters)) {
                    playerLetters.splice(playerLetters.indexOf(letter), 1);
                } else return false;
            }
        }
        return true;
    }
}
