import { STUB_CREATOR, STUB_GAME } from '@app/classes/mocks/game-service-stubs';
import { serverMock } from '@app/classes/mocks/web-socket-mock';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/game/player/player.service';
import { VirtualPlayerService } from '@app/services/game/virtual-player/virtual-player.service';
import { WebsocketService } from '@app/services/socket/websocket.service';
import { Game } from '@common/game';
import { Player } from '@common/player';
import { assert, expect } from 'chai';
import * as sinon from 'sinon';
import { Container } from 'typedi';
import { TimerService } from './timer.service';

const SECOND = 1000;

describe('TimerService tests', () => {
    let service: TimerService;
    let ws: WebsocketService;

    let game: Game;
    let player: Player;

    let switchPlayerTurnStub: sinon.SinonStub;

    beforeEach(() => {
        service = Container.get(TimerService);
        ws = Container.get(WebsocketService);

        player = JSON.parse(JSON.stringify(STUB_CREATOR));
        game = JSON.parse(JSON.stringify(STUB_GAME));

        switchPlayerTurnStub = sinon.stub(Container.get(PlayerService), 'switchPlayerTurn');

        sinon.stub(Container.get(PlayerService), 'getPlayerById').returns(player);
        Object.defineProperty(ws, 'io', { value: serverMock, writable: true });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should start timer', (done) => {
        const sendTimerUpdateSpy = sinon.spy(service, 'sendTimerUpdate');
        service.startTimer(game);
        assert(service.gameTimers.get(game.id), 'timer should be defined');
        assert.equal(service.gameTimers.size, 1);
        setTimeout(() => {
            assert(sendTimerUpdateSpy.called);
            done();
        }, SECOND);
    });

    it('should call deleteGame if game.letterReserve is empty', (done) => {
        const sendTimerUpdateStub = sinon.stub(service, 'sendTimerUpdate');
        const deleteGameStub = sinon.stub(Container.get(GameService), 'deleteGame');
        game.letterReserve = [];
        service.startTimer(game);
        assert.isDefined(service.gameTimers.get(game.id));
        setTimeout(() => {
            sinon.assert.called(deleteGameStub);
            sinon.assert.called(sendTimerUpdateStub);
            done();
        }, SECOND);
    });

    it('should refresh timer', () => {
        service.startTimer(game);
        const timer = service.gameTimers.get(game.id) as NodeJS.Timeout;
        const timerSpy = sinon.spy(timer, 'refresh');
        service.refreshTimer(game);
        assert(timerSpy.called);
    });

    it('should send timer update and decrease timer if its not over', () => {
        const timerStart = game.timer;
        service.sendTimerUpdate(game);
        const timerEnd = game.timer;
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- We don't need to create a CONST for this
        expect(timerEnd).to.be.equal(timerStart - 1000);
    });

    it('should call gameService switchPlayerTurn() if timer is over and send game update', () => {
        const wsToRoomSpy = sinon.spy(ws.io, 'to');
        game.timer = 0;
        service.sendTimerUpdate(game);
        assert(switchPlayerTurnStub.calledWith(game), 'switchPlayerTurn was not called');
        sinon.assert.calledWith(wsToRoomSpy, game.id);
    });

    it('should call gameService switchPlayerTurn() if timer is over and send game update', () => {
        (game.opponent as Player).isVirtual = true;
        (game.opponent as Player).isPlaying = true;
        const wsToRoomSpy = sinon.spy(ws.io, 'to');
        const chooseActionSpy = sinon.stub(Container.get(VirtualPlayerService), 'chooseAction');
        game.timer = 0;
        service.sendTimerUpdate(game);
        assert(switchPlayerTurnStub.calledWith(game), 'switchPlayerTurn was not called');
        sinon.assert.calledWith(wsToRoomSpy, game.id);
        sinon.assert.called(chooseActionSpy);
    });

    it('should clear game interval', () => {
        const clearIntervalSpy = sinon.spy(global, 'clearInterval');
        service.gameTimers.set(
            game.id,
            setInterval(() => {
                return;
            }, SECOND),
        );
        service.clearGameInterval(game);
        sinon.assert.calledOnce(clearIntervalSpy);
        assert.isUndefined(service.gameTimers.get(game.id));
    });

    it('should call chooseAction if the creator is virtual and playing', () => {
        const chooseActionStub = sinon.stub(Container.get(VirtualPlayerService), 'chooseAction');
        game.creator.isVirtual = true;
        game.creator.isPlaying = true;
        game.timer = 0;
        service.sendTimerUpdate(game);
        sinon.assert.called(chooseActionStub);
        sinon.assert.calledWith(chooseActionStub, game);
    });
});
