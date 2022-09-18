import { Trie } from '@app/classes/trie/trie';
import { DictionaryService } from '@app/services/dictionary/dictionary.service';
import { ClueService } from '@app/services/game/clue/clue.service';
import { EaselService } from '@app/services/game/easel/easel.service';
import { GridService } from '@app/services/game/grid/grid.service';
import { PlayerService } from '@app/services/game/player/player.service';
import { ScoreCalculatorService } from '@app/services/score-calculator/score-calculator.service';
import { WebsocketService } from '@app/services/socket/websocket.service';
import { ChatMessage } from '@common/chatMessage';
import { PlayableWord } from '@common/clue';
import { ExchangeCommand, PlaceCommand } from '@common/command';
import { Game } from '@common/game';
import { Letter } from '@common/grid';
import { INDEX_ROW } from '@common/grid/row-index';
import { Player } from '@common/player';
import {
    CHOOSE_ACTION_DELAY_MS,
    MAX_RECURSION_CALL,
    PROBABILITY_WORD_SCORE_BETWEEN_1_AND_6,
    PROBABILITY_WORD_SCORE_BETWEEN_7_AND_12_LOWER_BOUND,
    PROBABILITY_WORD_SCORE_BETWEEN_7_AND_12_UPPER_BOUND,
    SKIP_TURN_DELAY_MS,
    VirtualPlayerType,
    WORD_SCORE_RANGE,
} from '@common/virtualPlayer';
import { Container, Service } from 'typedi';

const SKIP_TURN_LOWER_BOUND = 0.1;
const EXCHANGE_UPPER_BOUND = 0.2;
const EASEL_SIZE = 7;
const MEDIUM_WORD_SCORE_LOWER_BOUND = 7;
const HIGH_WORD_SCORE_LOWER_BOUND = 13;

@Service()
export class VirtualPlayerService {
    chooseAction(game: Game): void {
        const virtualPlayer = this.getVirtualPlayer(game);
        if (virtualPlayer.virtualPlayerType === VirtualPlayerType.expert) {
            this.chooseActionExpert(game);
        } else {
            this.chooseActionBeginner(game);
        }
    }

    private chooseActionBeginner(game: Game): void {
        const roll = Math.random();
        setTimeout(() => {
            if (roll < SKIP_TURN_LOWER_BOUND) {
                this.skipTurn(game);
            } else if (roll > SKIP_TURN_LOWER_BOUND && roll < EXCHANGE_UPPER_BOUND) {
                this.exchangeLetters(game);
            } else {
                this.placeLetters(game);
            }
        }, CHOOSE_ACTION_DELAY_MS);
    }
    private chooseActionExpert(game: Game): void {
        const virtualPlayer = this.getVirtualPlayer(game);
        setTimeout(() => {
            const playableWords: PlayableWord[] = Container.get(ClueService).findAllPlayableWords(
                game.dict,
                (Container.get(DictionaryService).dictTrie.get(game.dict) as Trie).root,
                (virtualPlayer as Player).easel,
                game.grid,
            );
            Container.get(ScoreCalculatorService).generateScoreForPlayableWords(game, playableWords);
            if (playableWords.length === 0) {
                this.exchangeAllLetters(game);
                return;
            }
            const wordToPlay = this.getWordWithHighestScore(playableWords);
            this.handleVirtualPlayerPlaceCommand(wordToPlay, game);
            this.handleVirtualPlayerScoreUpdate(virtualPlayer as Player, wordToPlay.score as number);
            game.skipCounter = 0;
            Container.get(PlayerService).switchPlayerTurn(game);
            Container.get(WebsocketService).io.to(game.id).emit('updateGame', game);
        }, CHOOSE_ACTION_DELAY_MS);
    }

    private skipTurn(game: Game): void {
        const virtualPlayer = this.getVirtualPlayer(game);
        setTimeout(() => {
            const newChatMessage: ChatMessage = {
                playerName: (virtualPlayer as Player).name as string,
                data: '!passer',
                from: 'opponent',
            };
            Container.get(WebsocketService).io.to(game.id).emit('message', newChatMessage);
            game.skipCounter++;
            Container.get(PlayerService).switchPlayerTurn(game);
            Container.get(WebsocketService).io.to(game.id).emit('updateGame', game);
        }, SKIP_TURN_DELAY_MS);
    }

    private exchangeLetters(game: Game): void {
        const virtualPlayer = this.getVirtualPlayer(game);
        const numLettersToExchange = Math.floor(Math.random() * EASEL_SIZE + 1);
        if (game.letterReserve.length >= numLettersToExchange) {
            const letterList = JSON.parse(JSON.stringify((virtualPlayer as Player).easel)) as Letter[];
            let chosenLetters = '';
            if (letterList.length === 0) {
                return;
            }
            for (let i = 0; i < numLettersToExchange; i++) {
                const chosenIndex = Math.floor(Math.random() * letterList.length);
                chosenLetters = chosenLetters + letterList[chosenIndex].character;
                letterList.splice(chosenIndex, 1);
            }
            const command: ExchangeCommand = {
                name: 'échanger',
                letters: chosenLetters,
                fullCommand: 'échanger' + chosenLetters,
            };
            const newChatMessage: ChatMessage = {
                playerName: (virtualPlayer as Player).name as string,
                data: `!échanger ${command.letters.length} lettres`,
                from: 'opponent',
            };
            Container.get(EaselService).exchangeLetters(command.letters, (virtualPlayer as Player).easel, game.letterReserve);
            Container.get(WebsocketService).io.to(game.id).emit('message', newChatMessage);
            game.skipCounter = 0;
            Container.get(PlayerService).switchPlayerTurn(game);
            Container.get(WebsocketService).io.to(game.id).emit('updateGame', game);
        } else {
            this.skipTurn(game);
        }
    }

    private exchangeAllLetters(game: Game): void {
        const virtualPlayer = this.getVirtualPlayer(game);
        let chosenLetters = '';
        if (game.letterReserve.length >= EASEL_SIZE) {
            const letterList = JSON.parse(JSON.stringify((virtualPlayer as Player).easel)) as Letter[];
            for (let i = 0; i < EASEL_SIZE; i++) {
                chosenLetters = chosenLetters + letterList[i].character;
            }
        } else if (game.letterReserve.length < EASEL_SIZE && game.letterReserve.length > 0) {
            const letterList = JSON.parse(JSON.stringify((virtualPlayer as Player).easel)) as Letter[];
            chosenLetters = '';
            if (letterList.length === 0) {
                return;
            }
            game.letterReserve.forEach(() => {
                const chosenIndex = Math.floor(Math.random() * letterList.length);
                chosenLetters = chosenLetters + letterList[chosenIndex].character;
                letterList.splice(chosenIndex, 1);
            });
        } else {
            this.skipTurn(game);
            return;
        }
        const command: ExchangeCommand = {
            name: 'échanger',
            letters: chosenLetters,
            fullCommand: 'échanger' + chosenLetters,
        };
        const newChatMessage: ChatMessage = {
            playerName: (virtualPlayer as Player).name as string,
            data: `!échanger ${command.letters.length} lettres`,
            from: 'opponent',
        };
        Container.get(EaselService).exchangeLetters(command.letters, (virtualPlayer as Player).easel, game.letterReserve);
        Container.get(WebsocketService).io.to(game.id).emit('message', newChatMessage);
        game.skipCounter = 0;
        Container.get(PlayerService).switchPlayerTurn(game);
        Container.get(WebsocketService).io.to(game.id).emit('updateGame', game);
    }

    private placeLetters(game: Game): void {
        const virtualPlayer = this.getVirtualPlayer(game);
        const playableWords: PlayableWord[] = Container.get(ClueService).findAllPlayableWords(
            game.dict,
            (Container.get(DictionaryService).dictTrie.get(game.dict) as Trie).root,
            (virtualPlayer as Player).easel,
            game.grid,
        );

        Container.get(ScoreCalculatorService).generateScoreForPlayableWords(game, playableWords);
        const wordToPlay = this.getWordToPlay(playableWords);
        if (!wordToPlay.word) return this.skipTurn(game);
        this.handleVirtualPlayerPlaceCommand(wordToPlay, game);
        this.handleVirtualPlayerScoreUpdate(virtualPlayer as Player, wordToPlay.score as number);
        game.skipCounter = 0;

        Container.get(PlayerService).switchPlayerTurn(game);
        Container.get(WebsocketService).io.to(game.id).emit('updateGame', game);
    }

    private handleVirtualPlayerScoreUpdate(virtualPlayer: Player, wordToPlayScore: number): void {
        virtualPlayer.score += wordToPlayScore;
    }

    private sendChatBoxCommandMessage(game: Game, wordToPlay: PlayableWord): void {
        const virtualPlayer = this.getVirtualPlayer(game);
        const newChatMessage: ChatMessage = {
            playerName: (virtualPlayer as Player).name as string,
            data: `!placer ${INDEX_ROW.get(wordToPlay.position.row)}${wordToPlay.position.col}${wordToPlay.direction} ${
                (wordToPlay as PlayableWord).word
            }`,
            from: 'opponent',
        };
        Container.get(WebsocketService).io.to(game.id).emit('message', newChatMessage);
    }

    private handleVirtualPlayerPlaceCommand(wordToPlay: PlayableWord, game: Game): void {
        const virtualPlayer = this.getVirtualPlayer(game);
        const placeCommand: PlaceCommand = {
            fullCommand: '',
            name: 'placer',
            row: INDEX_ROW.get(wordToPlay.position.row as number) as string,
            column: wordToPlay.position.col as number,
            direction: wordToPlay.direction as string,
            word: wordToPlay.word as string,
            wordsInDictionary: true,
        };
        Container.get(EaselService).removeLetters(placeCommand.word, (virtualPlayer as Player).easel, game.letterReserve);
        Container.get(GridService).placeLetters(placeCommand, game.grid);
        this.sendChatBoxCommandMessage(game, wordToPlay);
    }

    private getWordToPlay(playableWords: PlayableWord[]): PlayableWord {
        const scoreProbability = Math.random();
        if (scoreProbability < PROBABILITY_WORD_SCORE_BETWEEN_1_AND_6) {
            return this.getWordWithLowerScoreBound(1, playableWords);
        } else if (
            scoreProbability >= PROBABILITY_WORD_SCORE_BETWEEN_7_AND_12_LOWER_BOUND &&
            scoreProbability < PROBABILITY_WORD_SCORE_BETWEEN_7_AND_12_UPPER_BOUND
        ) {
            return this.getWordWithLowerScoreBound(MEDIUM_WORD_SCORE_LOWER_BOUND, playableWords);
        } else {
            return this.getWordWithLowerScoreBound(HIGH_WORD_SCORE_LOWER_BOUND, playableWords);
        }
    }

    private getWordWithLowerScoreBound(lowerScoreBound: number, playableWords: PlayableWord[]): PlayableWord {
        let counter = 0;
        let wordToPlay: PlayableWord = {} as PlayableWord;
        while (!wordToPlay.word && counter < MAX_RECURSION_CALL) {
            wordToPlay = this.getWordWithRandomScore(lowerScoreBound, playableWords);
            counter++;
        }
        return wordToPlay;
    }

    private getWordWithRandomScore(lowerScoreBound: number, playableWords: PlayableWord[]): PlayableWord {
        let wordToPlay: PlayableWord = {} as PlayableWord;
        const randomScore = Math.floor(Math.random() * WORD_SCORE_RANGE + lowerScoreBound);

        for (const playableWord of playableWords) {
            if (playableWord.score === randomScore) {
                wordToPlay = playableWord;
            }
        }
        return wordToPlay;
    }
    private getWordWithHighestScore(playableWords: PlayableWord[]): PlayableWord {
        let wordToPlay: PlayableWord = playableWords[0] as PlayableWord;
        for (const playableWord of playableWords) {
            if ((playableWord.score as number) > (wordToPlay.score as number)) {
                wordToPlay = playableWord;
            }
        }
        return wordToPlay;
    }

    private getVirtualPlayer(game: Game): Player {
        return (game.opponent as Player).isVirtual ? (game.opponent as Player) : game.creator;
    }
}
