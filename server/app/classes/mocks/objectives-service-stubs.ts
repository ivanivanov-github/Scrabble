import { Command, PlaceCommand } from '@common/command';
import { Letter } from '@common/grid';
import { Tile } from '@common/grid/gridTypes';
import { Node, Word } from '@common/grid/node';
import { Objective } from '@common/objectives';

export const OBJECTIVE_STUB_1: Objective = {
    name: 'objective1',
    fullName: 'objective1 fullName',
    points: 5,
    isCompleted: false,
};

export const PUBLIC_OBJECTIVES_STUB: Objective[] = [OBJECTIVE_STUB_1];

export const COMMAND_STUB: Command = {
    fullCommand: '!placer h8v allo',
    name: 'placer',
};

export const PALINDROME_OBJECTIVE_STUB: Objective = {
    name: 'Palindrome',
    fullName: 'Placer un palindrome',
    points: 35,
    isCompleted: false,
};

export const POINTS_50_OBJECTIVE_STUB: Objective = {
    name: '50 points',
    fullName: 'Premier joueur qui atteint ou dépasse 50 points',
    points: 10,
    isCompleted: false,
};

export const THREE_TIMES_SAME_LETTER_OBJECTIVE_STUB: Objective = {
    name: '3 times same letters',
    fullName: 'Placer un mot contenant 3 fois la même lettre',
    points: 40,
    isCompleted: false,
};

export const THREE_VOWELS_OBJECTIVE_STUB: Objective = {
    name: '3 vowels',
    fullName: 'Placer un mot contenant 3 voyelles',
    points: 15,
    isCompleted: false,
};

export const STARTING_FINISHING_SAME_OBJECTIVE_STUB: Objective = {
    name: 'Start finish same letter',
    fullName: 'Former un mot commençant et finissant avec la même lettre',
    points: 8,
    isCompleted: false,
};

export const OBJECTIVE_FORM_20_POINT_WORD_STUB: Objective = {
    name: 'Form 20 point word',
    fullName: 'Former un mot de 20 points ou plus',
    points: 10,
    isCompleted: false,
};

export const OBJECTIVE_FORM_SCRABBLE_STUB: Objective = {
    name: 'Form word Scrabble',
    fullName: 'Former le mot scrabble',
    points: 40,
    isCompleted: false,
};

export const OBJECTIVE_FORM_WORD_ON_BOARD_STUB: Objective = {
    name: 'Form word already on board',
    fullName: 'Former un mot déjà sur le plateau',
    points: 30,
    isCompleted: false,
};

export const SUCCESSFUL_OBJECTIVES_PLACE_COMMAND_STUB: PlaceCommand = {
    fullCommand: '!placer h8v aoooa',
    name: 'placer',
    row: 'h',
    direction: 'v',
    column: 8,
    word: 'aoooa',
    wordsInDictionary: true,
};

export const UNSUCCESSFUL_OBJECTIVES_PLACE_COMMAND_STUB: PlaceCommand = {
    fullCommand: '!placer h8v xyz',
    name: 'placer',
    row: 'h',
    direction: 'v',
    column: 8,
    word: 'xyz',
    wordsInDictionary: true,
};

export const S_LETTER: Letter = {
    character: 's',
    value: 1,
};

const C_LETTER: Letter = {
    character: 'c',
    value: 3,
};

const R_LETTER: Letter = {
    character: 'r',
    value: 1,
};

const A_LETTER: Letter = {
    character: 'a',
    value: 1,
};

const B_LETTER: Letter = {
    character: 'b',
    value: 3,
};

const L_LETTER: Letter = {
    character: 'l',
    value: 1,
};

const E_LETTER: Letter = {
    character: 'e',
    value: 1,
};

const S_NODE: Node = {
    letter: S_LETTER,
    tileType: Tile.BASIC,
    isEmpty: false,
    x: 0,
    y: 0,
    isNewNode: false,
};

const C_NODE: Node = {
    letter: C_LETTER,
    tileType: Tile.BASIC,
    isEmpty: false,
    x: 0,
    y: 0,
    isNewNode: false,
};

const R_NODE: Node = {
    letter: R_LETTER,
    tileType: Tile.BASIC,
    isEmpty: false,
    x: 0,
    y: 0,
    isNewNode: false,
};

const A_NODE: Node = {
    letter: A_LETTER,
    tileType: Tile.BASIC,
    isEmpty: false,
    x: 0,
    y: 0,
    isNewNode: false,
};

const B_NODE: Node = {
    letter: B_LETTER,
    tileType: Tile.BASIC,
    isEmpty: false,
    x: 0,
    y: 0,
    isNewNode: false,
};

const L_NODE: Node = {
    letter: L_LETTER,
    tileType: Tile.BASIC,
    isEmpty: false,
    x: 0,
    y: 0,
    isNewNode: false,
};

const E_NODE: Node = {
    letter: E_LETTER,
    tileType: Tile.BASIC,
    isEmpty: false,
    x: 0,
    y: 0,
    isNewNode: false,
};

const LETTERS: Node[] = [S_NODE, C_NODE, R_NODE, A_NODE, B_NODE, B_NODE, L_NODE, E_NODE];

export const SCRABBLE_STUB: Word = {
    letters: LETTERS,
    isHorizontal: true,
};
