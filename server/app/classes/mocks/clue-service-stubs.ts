import { ClueFunctionParams, PlayableWord, Position } from '@common/clue';
import { STUB_PLAYER_LETTERS_CLUE } from './easel-service-stubs';
import { STUB_GRID } from './grid-service-stubs';

export const STUB_POSITION: Position = {
    row: 8,
    col: 8,
};

export const STUB_ANCHOR: Position = {
    row: 7,
    col: 13,
};

export const STUB_ANCHOR_FOR_PREFIX: Position = {
    row: 7,
    col: 8,
};

export const STUB_HORIZONTAL_DIRECTION = 'h';
export const STUB_VERTICAL_DIRECTION = 'v';

export const STUB_POSITION1: Position = {
    row: 8,
    col: 9,
};
export const STUB_POSITION2: Position = {
    row: 8,
    col: 10,
};
export const STUB_POSITION3: Position = {
    row: 8,
    col: 11,
};
export const STUB_PLACE_COMMAND_POSITION: Position = {
    row: 7,
    col: 11,
};

export const STUB_ANCHORS: Position[] = [STUB_POSITION1, STUB_POSITION2, STUB_POSITION3];

export const STUB_PLAYABLE_WORD1: PlayableWord = {
    word: 'word1',
    position: STUB_POSITION,
    direction: STUB_HORIZONTAL_DIRECTION,
    score: 5,
};
export const STUB_PLAYABLE_WORD2: PlayableWord = {
    word: 'word2',
    position: STUB_POSITION,
    direction: STUB_HORIZONTAL_DIRECTION,
    score: 6,
};

export const STUB_PLAYABLE_WORDS: PlayableWord[] = [STUB_PLAYABLE_WORD1, STUB_PLAYABLE_WORD2];

export const STUB_CLUE_FUNCTION_PARAMS: ClueFunctionParams = {
    playableWords: STUB_PLAYABLE_WORDS,
    anchors: STUB_ANCHORS,
    grid: STUB_GRID,
    playerLetters: STUB_PLAYER_LETTERS_CLUE,
    wordDirection: STUB_HORIZONTAL_DIRECTION,
    prefixLimit: 3,
};
