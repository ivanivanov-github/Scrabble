import { PlayableWord, Position } from '@common/clue';
import { Letter } from '@common/grid';

export const POSITION_STUB: Position = {
    row: 0,
    col: 0,
};

export const LETTER_STUB: Letter = {
    value: 1,
    character: 'a',
};

export const PLAYABLEWORD_STUB1: PlayableWord = {
    word: 'bruh',
    position: POSITION_STUB,
    direction: 'v',
    score: 3,
};
export const PLAYABLEWORD_STUB_EMPTY: PlayableWord = {
    word: '',
    position: POSITION_STUB,
    direction: 'v',
    score: 3,
};
