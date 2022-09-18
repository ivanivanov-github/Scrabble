import { Game, GameOptions, JoinMultiplayerOption } from '@common/game';
import { GameMode } from '@common/game-mode';
import { LETTERS } from '@common/grid/letterCount';
import { Player, PlayerInfo } from '@common/player';
import { SocketInfo } from '@common/websocket';
import { STUB_PLAYER_EASEL } from './easel-service-stubs';
import { STUB_GRID } from './grid-service-stubs';

export const STUB_GAMEID = 'gameId';

export const STUB_PLAYER_INFOS: PlayerInfo = {
    name: 'test player',
    id: '123456789',
};

export const STUB_OPPONENT_INFOS: PlayerInfo = {
    id: '987654321',
    name: 'Nikolay',
};

export const STUB_CREATOR: Player = {
    id: STUB_PLAYER_INFOS.id,
    name: STUB_PLAYER_INFOS.name,
    isPlaying: true,
    completedWords: [],
    easel: JSON.parse(JSON.stringify(STUB_PLAYER_EASEL)),
    score: 0,
    hasAbandon: false,
    isVirtual: false,
};

export const STUB_OPPONENT: Player = {
    id: STUB_OPPONENT_INFOS.id,
    name: STUB_OPPONENT_INFOS.name,
    isPlaying: false,
    completedWords: [],
    easel: JSON.parse(JSON.stringify(STUB_PLAYER_EASEL)),
    score: 0,
    hasAbandon: false,
    isVirtual: false,
    virtualPlayerType: undefined,
};

export const STUB_JOIN_OPTIONS: JoinMultiplayerOption = {
    gameId: STUB_GAMEID,
    playerInfo: STUB_PLAYER_INFOS,
};

export const STUB_GAME_OPTIONS: GameOptions = {
    playerName: 'jamesley',
    playerId: 'id',
    time: 300000,
    dictionary: 'default',
    isMultiplayer: true,
    gameMode: GameMode.Classic,
};

export const STUB_GAME: Game = {
    id: '123456789',
    creator: STUB_CREATOR,
    opponent: STUB_OPPONENT,
    capacity: 1,
    dict: STUB_GAME_OPTIONS.dictionary,
    time: STUB_GAME_OPTIONS.time,
    timer: STUB_GAME_OPTIONS.time,
    grid: JSON.parse(JSON.stringify(STUB_GRID)),
    letterReserve: Array.from(LETTERS),
    skipCounter: 0,
    mode: STUB_GAME_OPTIONS.gameMode,
    totalTime: 0,
    hasEnded: false,
    isMultiplayer: true,
};

export const STUB_GAME_2 = {
    id: 987654321,
    creator: STUB_CREATOR,
    opponent: null,
    capacity: 1,
    dict: STUB_GAME_OPTIONS.dictionary,
    time: STUB_GAME_OPTIONS.time,
    timer: STUB_GAME_OPTIONS.time,
    grid: JSON.parse(JSON.stringify(STUB_GRID)),
    letters: Array.from(LETTERS),
    skipCounter: 0,
};

export const STUB_GAME1 = {} as Game;
export const STUB_GAME2 = {} as Game;
export const STUB_GAME3 = {} as Game;
export const STUB_GAME4 = {} as Game;

export const STUB_GAME_SESSIONS: Game[] = [STUB_GAME1, STUB_GAME2, STUB_GAME3, STUB_GAME4];

export const STUB_SOCKET_INFOS: SocketInfo = {
    gameId: JSON.stringify(STUB_GAME.id),
    player: STUB_CREATOR,
};

export const STUB_SOCKET_INFOS_OPP: SocketInfo = {
    gameId: JSON.stringify(STUB_GAME.id),
    player: STUB_OPPONENT,
};
