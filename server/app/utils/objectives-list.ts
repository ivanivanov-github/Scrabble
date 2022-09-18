import { Objective } from '@common/objectives';

const OBJECTIVE_PLACE_PALINDROME: Objective = {
    name: 'Palindrome',
    fullName: 'Placer un palindrome',
    points: 35,
    isCompleted: false,
};

const OBJECTIVE_GET_50_POINTS_FIRST: Objective = {
    name: '50 points',
    fullName: 'Premier joueur qui atteint ou dépasse 50 points',
    points: 10,
    isCompleted: false,
};

const OBJECTIVE_PLACE_WORD_CONTAINING_3_TIMES_SAME_LETTER: Objective = {
    name: '3 times same letters',
    fullName: 'Placer un mot contenant 3 fois la même lettre',
    points: 40,
    isCompleted: false,
};

const OBJECTIVE_PLACE_WORD_WITH_3_VOWELS: Objective = {
    name: '3 vowels',
    fullName: 'Placer un mot contenant 3 voyelles',
    points: 15,
    isCompleted: false,
};

const OBJECTIVE_FORM_WORD_STARTING_FINISHING_WITH_SAME_LETTER: Objective = {
    name: 'Start finish same letter',
    fullName: 'Former un mot commençant et finissant avec la même lettre',
    points: 8,
    isCompleted: false,
};

const OBJECTIVE_FORM_20_POINT_WORD: Objective = {
    name: 'Form 20 point word',
    fullName: 'Former un mot de 20 points ou plus',
    points: 10,
    isCompleted: false,
};

const OBJECTIVE_FORM_SCRABBLE: Objective = {
    name: 'Form word Scrabble',
    fullName: 'Former le mot scrabble',
    points: 40,
    isCompleted: false,
};

const OBJECTIVE_FORM_WORD_ON_BOARD: Objective = {
    name: 'Form word already on board',
    fullName: 'Former un mot déjà sur le plateau',
    points: 30,
    isCompleted: false,
};

export const OBJECTIVES: Objective[] = [
    OBJECTIVE_PLACE_PALINDROME,
    OBJECTIVE_GET_50_POINTS_FIRST,
    OBJECTIVE_PLACE_WORD_CONTAINING_3_TIMES_SAME_LETTER,
    OBJECTIVE_PLACE_WORD_WITH_3_VOWELS,
    OBJECTIVE_FORM_WORD_STARTING_FINISHING_WITH_SAME_LETTER,
    OBJECTIVE_FORM_20_POINT_WORD,
    OBJECTIVE_FORM_SCRABBLE,
    OBJECTIVE_FORM_WORD_ON_BOARD,
];
