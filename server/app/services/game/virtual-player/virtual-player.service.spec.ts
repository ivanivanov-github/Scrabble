/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable dot-notation */ // We should be able to access private methods for the sake of the tests
/* eslint-disable @typescript-eslint/no-magic-numbers */ // We shouldn't need to create constants for magic numbers in test files
import { defaultDictMock } from '@app/classes/mocks/clue-service-mock';
import { STUB_PLAYABLE_WORD1, STUB_PLAYABLE_WORD2, STUB_PLAYABLE_WORDS } from '@app/classes/mocks/clue-service-stubs';
import { STUB_RESERVE_5_LETTERS } from '@app/classes/mocks/easel-service-stubs';
import { STUB_CREATOR, STUB_GAME, STUB_OPPONENT } from '@app/classes/mocks/game-service-stubs';
import { PLAYABLEWORD_STUB1 } from '@app/classes/mocks/virtual-player-stubs';
import { serverMock } from '@app/classes/mocks/web-socket-mock';
import { DictionaryService } from '@app/services/dictionary/dictionary.service';
import { ClueService } from '@app/services/game/clue/clue.service';
import { EaselService } from '@app/services/game/easel/easel.service';
import { GridService } from '@app/services/game/grid/grid.service';
import { PlayerService } from '@app/services/game/player/player.service';
import { ScoreCalculatorService } from '@app/services/score-calculator/score-calculator.service';
import { WebsocketService } from '@app/services/socket/websocket.service';
import { PlayableWord } from '@common/clue';
import { Game } from '@common/game';
import { Letter } from '@common/grid';
import { Player } from '@common/player';
import { CHOOSE_ACTION_DELAY_MS, SKIP_TURN_DELAY_MS, VirtualPlayerType } from '@common/virtualPlayer';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Container } from 'typedi';
import { VirtualPlayerService } from './virtual-player.service';

const MAX_SKIP_COUNT = 6;

describe('VirtualPlayerService', () => {
    let service: VirtualPlayerService;
    let playerService: PlayerService;
    let websocketService: WebsocketService;
    let easelService: EaselService;
    let gridService: GridService;
    let clueService: ClueService;
    let dictionnaryService: DictionaryService;
    let scoreService: ScoreCalculatorService;
    let game: Game;
    let player: Player;
    let playableWordStub: PlayableWord;
    let playableWordsStub: PlayableWord[];
    let getVirtualPlayerStub: sinon.SinonStub;
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
        clock = sinon.useFakeTimers({
            toFake: ['setTimeout'],
        });
        service = Container.get(VirtualPlayerService);
        websocketService = Container.get(WebsocketService);
        playerService = Container.get(PlayerService);
        easelService = Container.get(EaselService);
        gridService = Container.get(GridService);
        clueService = Container.get(ClueService);
        scoreService = Container.get(ScoreCalculatorService);
        dictionnaryService = Container.get(DictionaryService);

        game = JSON.parse(JSON.stringify(STUB_GAME));
        player = JSON.parse(JSON.stringify(STUB_CREATOR));
        playableWordStub = JSON.parse(JSON.stringify(STUB_PLAYABLE_WORD1));
        playableWordsStub = JSON.parse(JSON.stringify(STUB_PLAYABLE_WORDS));

        getVirtualPlayerStub = sinon.stub(service as any, 'getVirtualPlayer').returns(player);
        Object.defineProperty(websocketService, 'io', { value: serverMock, writable: true });
        Object.defineProperty(dictionnaryService, 'dictTrie', { value: defaultDictMock, writable: true });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should skipTurn if roll is under 10%', (done) => {
        sinon.stub(Math, 'random').returns(0.05);
        const skipTurnStub = sinon.stub(service as any, 'skipTurn');
        service['chooseActionBeginner'](game);
        setTimeout(() => {
            sinon.assert.called(skipTurnStub);
            done();
        }, CHOOSE_ACTION_DELAY_MS);
        clock.tick(CHOOSE_ACTION_DELAY_MS);
    }).timeout(30000);

    it('should exchangeLetters if roll is between 10% and 20%', (done) => {
        sinon.stub(Math, 'random').returns(0.15);
        const exchangeLettersStub = sinon.stub(service as any, 'exchangeLetters');
        service['chooseActionBeginner'](game);
        setTimeout(() => {
            sinon.assert.called(exchangeLettersStub);
            done();
        }, CHOOSE_ACTION_DELAY_MS);
        clock.tick(CHOOSE_ACTION_DELAY_MS);
    });

    it('should call exchangeLetters, switchPlayerTurn, updateGame and message if letterReserve length is above 7', () => {
        const ioEmitStub = sinon.spy(websocketService.io, 'to');
        const exchangeLettersStub = sinon.stub(easelService, 'exchangeLetters').returns(true);
        const switchPlayerTurnStub = sinon.stub(playerService, 'switchPlayerTurn').returns();
        service['exchangeAllLetters'](game);
        sinon.assert.calledTwice(ioEmitStub);
        sinon.assert.called(switchPlayerTurnStub);
        sinon.assert.called(exchangeLettersStub);
    });

    it('should call exchangeLetters, switchPlayerTurn, updateGame and message if letterReserve length is between 1 and 7 7', () => {
        game.letterReserve = ['a'];
        const ioEmitStub = sinon.spy(websocketService.io, 'to');
        const exchangeLettersStub = sinon.stub(easelService, 'exchangeLetters').returns(true);
        const switchPlayerTurnStub = sinon.stub(playerService, 'switchPlayerTurn').returns();
        service['exchangeAllLetters'](game);
        sinon.assert.calledTwice(ioEmitStub);
        sinon.assert.called(switchPlayerTurnStub);
        sinon.assert.called(exchangeLettersStub);
    });

    it('should call skipTurn if letterReserve is empty', () => {
        game.letterReserve = [];
        const skipTurnStub = sinon.stub(service as any, 'skipTurn');
        service['exchangeAllLetters'](game);
        sinon.assert.called(skipTurnStub);
    });

    it('should PlaceLetters if roll is between 20% and 100%', (done) => {
        sinon.stub(Math, 'random').returns(0.55);
        const placeLettersStub = sinon.stub(service as any, 'placeLetters').returns(STUB_PLAYABLE_WORD1);
        service['chooseActionBeginner'](game);
        setTimeout(() => {
            sinon.assert.called(placeLettersStub);
            done();
        }, CHOOSE_ACTION_DELAY_MS);
        clock.tick(CHOOSE_ACTION_DELAY_MS);
    });

    it('should call handleVirtualPlaceCommand, handleVirtualPlayerScoreUpdate, switchPlayerTurn and updateGame', (done) => {
        const findAllPlayableWordsSpy = sinon.stub(clueService, 'findAllPlayableWords').returns([PLAYABLEWORD_STUB1]);
        const generateScoreForPlayableWordsSpy = sinon.stub(scoreService, 'generateScoreForPlayableWords').returns();
        const handleVirtualPlayerPlaceCommandSpy = sinon.stub(service as any, 'handleVirtualPlayerPlaceCommand');
        const handleVirtualPlayerScoreUpdateSpy = sinon.stub(service as any, 'handleVirtualPlayerScoreUpdate');
        const switchPlayerTurnSpy = sinon.stub(playerService, 'switchPlayerTurn');
        const ioEmitStub = sinon.spy(websocketService.io, 'to');
        sinon.stub(service as any, 'getWordToPlay').returns(playableWordStub);
        service['chooseActionExpert'](game);
        setTimeout(() => {
            sinon.assert.calledOnce(findAllPlayableWordsSpy);
            sinon.assert.calledOnce(generateScoreForPlayableWordsSpy);
            sinon.assert.calledOnce(handleVirtualPlayerPlaceCommandSpy);
            sinon.assert.calledOnce(handleVirtualPlayerScoreUpdateSpy);
            sinon.assert.calledOnce(switchPlayerTurnSpy);
            sinon.assert.calledOnce(ioEmitStub);
            done();
        }, CHOOSE_ACTION_DELAY_MS);
        clock.tick(CHOOSE_ACTION_DELAY_MS);
    });

    it('should call exchangeAllLetters if findAllPlayableWords returns nothing', (done) => {
        const findAllPlayableWordsSpy = sinon.stub(clueService, 'findAllPlayableWords').returns([]);
        const exchangeAllLettersSpy = sinon.stub(service as any, 'exchangeAllLetters');
        service['chooseActionExpert'](game);
        setTimeout(() => {
            sinon.assert.calledOnce(findAllPlayableWordsSpy);
            sinon.assert.calledOnce(exchangeAllLettersSpy);
            done();
        }, CHOOSE_ACTION_DELAY_MS);
        clock.tick(CHOOSE_ACTION_DELAY_MS);
    });

    it('skipTurn should emit updateGame and message and switchPlayerTurn', (done) => {
        const switchPlayerTurnStub = sinon.stub(playerService, 'switchPlayerTurn');
        const ioEmitStub = sinon.spy(websocketService.io, 'to');
        service['skipTurn'](game);
        setTimeout(() => {
            sinon.assert.called(switchPlayerTurnStub);
            sinon.assert.calledTwice(ioEmitStub);
            done();
        }, SKIP_TURN_DELAY_MS);
        clock.tick(SKIP_TURN_DELAY_MS);
    }).timeout(30000);

    it('skipTurn should emit updateGame and message and endOfGame and clearGameInterval', (done) => {
        game.skipCounter = MAX_SKIP_COUNT - 1;
        const ioEmitStub = sinon.spy(websocketService.io, 'to');
        service['skipTurn'](game);
        setTimeout(() => {
            sinon.assert.calledTwice(ioEmitStub);
            done();
        }, SKIP_TURN_DELAY_MS);
        clock.tick(SKIP_TURN_DELAY_MS);
    }).timeout(30000);

    it('exchangeLetters should skipTurn if not enough letters in the reserve', (done) => {
        sinon.stub(Math, 'random').returns(0.9);
        const skipTurnStub = sinon.stub(service as any, 'skipTurn');
        game.letterReserve = STUB_RESERVE_5_LETTERS;
        service['exchangeLetters'](game);
        sinon.assert.called(skipTurnStub);
        done();
    });

    it('exchangeLetters should skipTurn if player does not have any letters', (done) => {
        sinon.stub(Math, 'random').returns(0.9);
        player.easel = [];
        const exchangeLettersStub = sinon.stub(Container.get(EaselService), 'exchangeLetters').returns(false);
        service['exchangeLetters'](game);
        sinon.assert.notCalled(exchangeLettersStub);
        done();
    });

    it('exchangeLetters should emit message and updateGame and call exchangeLetters and switchPlayerTurn', () => {
        sinon.stub(Math, 'random').returns(0.9);
        const exchangeLettersStub = sinon.stub(easelService, 'exchangeLetters');
        const switchPlayerTurnStub = sinon.stub(playerService, 'switchPlayerTurn');
        const ioEmitStub = sinon.spy(websocketService.io, 'to');
        service['exchangeLetters'](game);
        sinon.assert.called(switchPlayerTurnStub);
        sinon.assert.called(exchangeLettersStub);
        sinon.assert.calledTwice(ioEmitStub);
    });

    it('exchangeLetters should return undefined if no letters in the easel', () => {
        (game.opponent as Player).easel = [] as Letter[];
        const returnValue = service['exchangeLetters'](game);
        expect(returnValue).to.be.equal(undefined);
    });

    it('placeLetters should emit updateGame, call findAllPyableWords, generateScoreForPlableWords, getWordToPlay, getPlaceCommandWord', () => {
        const findAllPlayableWordsSpy = sinon.stub(clueService, 'findAllPlayableWords').returns([PLAYABLEWORD_STUB1]);
        const generateScoreForPlayableWordsSpy = sinon.stub(scoreService, 'generateScoreForPlayableWords').returns();
        const handleVirtualPlayerPlaceCommandSpy = sinon.stub(service as any, 'handleVirtualPlayerPlaceCommand');
        const handleVirtualPlayerScoreUpdateSpy = sinon.stub(service as any, 'handleVirtualPlayerScoreUpdate');
        const switchPlayerTurnSpy = sinon.stub(playerService, 'switchPlayerTurn').returns();
        const ioEmitStub = sinon.spy(websocketService.io, 'to');
        sinon.stub(service as any, 'getWordToPlay').returns(playableWordStub);
        service['placeLetters'](game);
        sinon.assert.calledOnce(findAllPlayableWordsSpy);
        sinon.assert.calledOnce(generateScoreForPlayableWordsSpy);
        sinon.assert.calledOnce(handleVirtualPlayerPlaceCommandSpy);
        sinon.assert.calledOnce(handleVirtualPlayerScoreUpdateSpy);
        sinon.assert.calledOnce(switchPlayerTurnSpy);
        sinon.assert.calledOnce(ioEmitStub);
    });

    it('placeLetters should call skipTurn if no word playable word was found', () => {
        sinon.stub(clueService, 'findAllPlayableWords').returns([PLAYABLEWORD_STUB1]);
        sinon.stub(scoreService, 'generateScoreForPlayableWords').returns();

        sinon.stub(service as any, 'getWordToPlay').returns({} as PlayableWord);
        const skipTurnSpy = sinon.stub(service as any, 'skipTurn').resolves();
        service['placeLetters'](game);
        sinon.assert.calledOnce(skipTurnSpy);
    });

    it('sendChatBoxCommandMessage should emit message', (done) => {
        const ioEmitStub = sinon.spy(websocketService.io, 'to');
        service['sendChatBoxCommandMessage'](game, playableWordStub);
        setTimeout(() => {
            sinon.assert.calledOnce(ioEmitStub);
            done();
        }, CHOOSE_ACTION_DELAY_MS);
        clock.tick(CHOOSE_ACTION_DELAY_MS);
    });

    it('handleVirtualPlayerPlaceCommand should call removeLetters, placeLetters, sendChatBoxCommandMessage', () => {
        const sendChatBoxCommandMessageStub = sinon.stub(service as any, 'sendChatBoxCommandMessage');
        const removeLettersSpy = sinon.spy(easelService, 'removeLetters');
        const placeLettersSpy = sinon.spy(gridService, 'placeLetters');
        service['handleVirtualPlayerPlaceCommand'](playableWordStub, game);
        sinon.assert.calledOnce(sendChatBoxCommandMessageStub);
        sinon.assert.calledOnce(removeLettersSpy);
        sinon.assert.calledOnce(placeLettersSpy);
    });

    it('should increment the virtual players score by 3', () => {
        service['handleVirtualPlayerScoreUpdate'](player, 3);
        expect(player.score).to.be.equal(3);
    });

    it('should call getWordWithLowerScoreBound with a lower score bound of 1 since the score probability is lower than 40%', () => {
        const getWordWithLowerScoreBoundStub = sinon.stub(service as any, 'getWordWithLowerScoreBound');
        sinon.stub(Math, 'random').returns(0.1);
        service['getWordToPlay'](playableWordsStub);
        sinon.assert.calledWith(getWordWithLowerScoreBoundStub, 1, playableWordsStub);
    });

    it('should call getWordWithLowerScoreBound with a lower score bound of 7 since the score probability is lower than 30%', () => {
        const getWordWithLowerScoreBoundStub = sinon.stub(service as any, 'getWordWithLowerScoreBound');
        sinon.stub(Math, 'random').returns(0.5);
        service['getWordToPlay'](playableWordsStub);
        sinon.assert.calledWith(getWordWithLowerScoreBoundStub, 7, playableWordsStub);
    });

    it('should call getWordWithLowerScoreBound with a lower score bound of 7 since the score probability is lower than 30%', () => {
        const getWordWithLowerScoreBoundStub = sinon.stub(service as any, 'getWordWithLowerScoreBound');
        sinon.stub(Math, 'random').returns(0.8);
        service['getWordToPlay'](playableWordsStub);
        sinon.assert.calledWith(getWordWithLowerScoreBoundStub, 13, playableWordsStub);
    });

    it('should return playable word with hello as word and 8, 8 as position', () => {
        sinon.stub(service as any, 'getWordWithRandomScore').returns(playableWordStub);
        expect(service['getWordWithLowerScoreBound'](1, playableWordsStub) as PlayableWord).to.be.equal(playableWordStub);
    });

    it('should return a word with the same score as the score randomly generated using Math.random', () => {
        sinon.stub(Math, 'random').returns(0.8);
        expect(service['getWordWithRandomScore'](1, playableWordsStub).score as number).to.be.equal(5);
    });

    it('should return an empty PlayableWord if the playableWords array does not contain any playableWord with the randomly generated score', () => {
        sinon.stub(Math, 'random').returns(0.1);
        expect(service['getWordWithRandomScore'](1, playableWordsStub)).to.not.be.equal(playableWordsStub[0]);
        expect(service['getWordWithRandomScore'](1, playableWordsStub)).to.not.be.equal(playableWordsStub[1]);
    });

    it('should choose call the right actions dependant of the type of virtual Player were playing aigaint', () => {
        player.virtualPlayerType = VirtualPlayerType.expert;
        const chooseActionsExpertstub = sinon.stub(service as any, 'chooseActionExpert').returns(null);
        service.chooseAction(game);
        sinon.assert.calledOnce(chooseActionsExpertstub);
        player.virtualPlayerType = VirtualPlayerType.debutant;
        const chooseActionsDebutantstub = sinon.stub(service as any, 'chooseActionBeginner').returns(null);
        service.chooseAction(game);
        sinon.assert.calledOnce(chooseActionsDebutantstub);
    });

    it('should choose call the right actions dependant of the type of virtual Player were playing aigaint', () => {
        player.virtualPlayerType = VirtualPlayerType.expert;
        const chooseActionsExpertstub = sinon.stub(service as any, 'chooseActionExpert').returns(null);
        service.chooseAction(game);
        sinon.assert.calledOnce(chooseActionsExpertstub);
        player.virtualPlayerType = VirtualPlayerType.debutant;
        const chooseActionsDebutantstub = sinon.stub(service as any, 'chooseActionBeginner').returns(null);
        service.chooseAction(game);
        sinon.assert.calledOnce(chooseActionsDebutantstub);
    });

    it('should return virtualPlayer oponent if oponent is virtual', () => {
        const gameOponent = { ...STUB_OPPONENT, isVirtual: true };
        game.opponent = gameOponent;
        game.creator.isVirtual = false;
        getVirtualPlayerStub.callThrough();

        expect(service['getVirtualPlayer'](game)).to.equal(gameOponent);
    });

    it('should return virtualPlayer creator if oponent is virtual', () => {
        const gameCreator = { ...STUB_CREATOR, isVirtual: true };
        (game.opponent as Player).isVirtual = false;
        game.creator = gameCreator;
        getVirtualPlayerStub.callThrough();
        expect(service['getVirtualPlayer'](game)).to.equal(gameCreator);
    });

    it('should change the wordToPlay to get the highestScore possible', () => {
        expect(service['getWordWithHighestScore'](STUB_PLAYABLE_WORDS)).to.deep.equal(STUB_PLAYABLE_WORD2);
    });
});
