import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/game/player/player.service';
import { VirtualPlayerService } from '@app/services/game/virtual-player/virtual-player.service';
import { WebsocketService } from '@app/services/socket/websocket.service';
import { Game } from '@common/game';
import { Player } from '@common/player';
import { Container, Service } from 'typedi';

const SECOND = 1000;
export const PLACE_LETTERS_TIMEOUT = 3000;
export const RECONNECT_TIMEOUT = 5000;
export const TIMEOUT = 50000;
export const MAX_SKIP_COUNT = 6;

@Service()
export class TimerService {
    gameTimers: Map<string, NodeJS.Timer> = new Map();

    startTimer(game: Game): void {
        this.gameTimers.set(
            game.id,
            setInterval(() => {
                if (game.letterReserve.length <= 0) {
                    Container.get(GameService).deleteGame(game.id);
                }
                this.sendTimerUpdate(game);
            }, SECOND),
        );
    }

    refreshTimer(game: Game): void {
        const gameTimer = this.gameTimers.get(game.id) as NodeJS.Timer;
        gameTimer.refresh();
    }

    sendTimerUpdate(game: Game): void {
        Container.get(WebsocketService).io.to(game.id).emit('updateTimer', game.timer);
        game.totalTime += 1000;
        if (game.timer) {
            game.timer -= 1000;
        } else {
            game.skipCounter++;
            Container.get(PlayerService).switchPlayerTurn(game);
            Container.get(WebsocketService).io.to(game.id).emit('updateGame', game);
            if (
                ((game.opponent as Player).isVirtual && (game.opponent as Player).isPlaying) ||
                ((game.creator as Player).isVirtual && (game.creator as Player).isPlaying)
            ) {
                Container.get(VirtualPlayerService).chooseAction(game);
            }
        }
    }

    clearGameInterval(game: Game): void {
        const interval = this.gameTimers.get(game.id) as NodeJS.Timer;
        clearInterval(interval);
        this.gameTimers.delete(game.id);
    }
}
