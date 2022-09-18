import { GameMode } from '@common/game-mode';
import { GameHistory } from '@common/player';
import { STUB_CREATOR, STUB_OPPONENT } from './game-service-stubs';
const date = new Date('March 27, 2022 03:24:00');
export const GAME_HISTORY_MOCKS: GameHistory = {
    started: date,
    duration: 10000,
    creator: STUB_CREATOR,
    creatorScore: STUB_CREATOR.score,
    oponentScore: STUB_OPPONENT.score,
    opponent: STUB_OPPONENT,
    mode: GameMode.Classic,
    gameAbandoned: false,
};
