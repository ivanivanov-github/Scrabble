import { EaselService } from '@app/services/game/easel/easel.service';
import { GameService } from '@app/services/game/game.service';
import { WebsocketService } from '@app/services/socket/websocket.service';
import { Game, GameOptions } from '@common/game';
import { Letter } from '@common/grid/node';
import { Player, PlayerInfo } from '@common/player';
import { Container, Service } from 'typedi';

@Service()
export class PlayerService {
    addCreator(gameOptions: GameOptions, playerEasel: Letter[]): Player {
        return {
            id: gameOptions.playerId,
            name: gameOptions.playerName,
            isPlaying: true,
            completedWords: [],
            easel: playerEasel,
            score: 0,
            hasAbandon: false,
            isVirtual: false,
        };
    }
    addOpponent(playerInfo: PlayerInfo, game: Game, isVirtual: boolean = false): void {
        const playerEasel = Container.get(EaselService).generatePlayerLetters(game.letterReserve);
        const opponent: Player = {
            id: playerInfo.id,
            name: playerInfo.name,
            isPlaying: false,
            completedWords: [],
            easel: playerEasel,
            score: 0,
            hasAbandon: false,
            isVirtual,
        };
        if (playerInfo.virtualPlayerType) opponent.virtualPlayerType = playerInfo.virtualPlayerType;
        game.opponent = opponent;
        game.capacity++;
    }

    rejectPlayer(game: Game): void {
        const player: PlayerInfo = {
            id: (game.creator as Player).id,
            name: (game.creator as Player).name,
        };
        this.removeOpponent(game);
        Container.get(WebsocketService).io.to(game.id).emit('rejected', player);
    }

    removeOpponent(game: Game): void {
        if (!game.opponent) return;
        game.opponent = null;
        game.capacity--;
        Container.get(WebsocketService).io.emit('updateGamesAvailable');
    }

    getPlayerById(playerId: string, game: Game): Player | undefined {
        if ((game.creator as Player).id === playerId) return game.creator;
        else if (game.opponent && game.opponent.id === playerId) return game.opponent;
        else return undefined;
    }

    incrementPlayerScore(score: number, playerId: string, game: Game): void {
        const player = this.getPlayerById(playerId, game);
        if (!player) return;
        player.score += score;
    }

    switchPlayerTurn(game: Game): void {
        if (game.opponent?.isPlaying) {
            game.creator.isPlaying = true;
            game.opponent.isPlaying = false;
        } else if (game.opponent && game.creator.isPlaying) {
            game.creator.isPlaying = false;
            game.opponent.isPlaying = true;
        }
        game.timer = game.time;
        Container.get(GameService).handleMaxSkip(game);
    }

    getRemainingLettersScore(player: Player): number {
        let score = 0;
        for (const letter of player.easel) {
            score += letter.value;
        }
        return score;
    }

    updateEasel(easel: Letter[], playerId: string, game: Game): void {
        const player = this.getPlayerById(playerId, game);
        if (!player) return;
        player.easel = easel;
    }

    setRandomStartingPlayer(game: Game) {
        if (Math.round(Math.random())) {
            this.switchPlayerTurn(game);
        }
    }

    updatePlayerFinalScore(player: Player): void {
        player.score -= this.getRemainingLettersScore(player);
        if (player.score < 0) player.score = 0;
    }
}
