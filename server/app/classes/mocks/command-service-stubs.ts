import { ExchangeCommand, PlaceCommand } from '@common/command';

export const MOCK_PLAYER_LETTERS: string[] = ['a', 'a', 'c', 'd', 'e', '*', 'g'];

export const MOCK_PLACE_COMMAND: PlaceCommand = {
    fullCommand: 'placer aa*',
    name: 'placer',
    row: 'g',
    column: 9,
    direction: 'v',
    word: 'aa*',
    wordsInDictionary: true,
};

export const MOCK_INVALID_PLACE_COMMAND: PlaceCommand = {
    fullCommand: 'placer xyz',
    name: 'placer',
    row: 'g',
    column: 9,
    direction: 'v',
    word: 'xyz',
    wordsInDictionary: true,
};

export const MOCK_EXCHANGE_COMMAND: ExchangeCommand = {
    fullCommand: 'échanger aa*',
    name: 'échanger',
    letters: 'aa*',
};

export const MOCK_INVALID_EXCHANGE_COMMAND: ExchangeCommand = {
    fullCommand: 'échanger xyz',
    name: 'échanger',
    letters: 'xyz',
};
