import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/game/player/player.service';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class GameController {
    router: Router;

    constructor(private gameService: GameService, private playerService: PlayerService) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.post('/init/multi', (req: Request, res: Response) => {
            try {
                const game = this.gameService.initGame(req.body);
                res.status(StatusCodes.CREATED).json(game);
            } catch (error) {
                res.sendStatus(StatusCodes.NOT_FOUND);
            }
        });

        this.router.post('/join', (req: Request, res: Response) => {
            try {
                const game = this.gameService.joinGame(req.body);
                if (game) res.status(StatusCodes.OK).json(game);
                else res.sendStatus(StatusCodes.NOT_FOUND);
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.post('/start', (req: Request, res: Response) => {
            const { gameId } = req.body;
            try {
                this.gameService.startGame(gameId);
                res.sendStatus(StatusCodes.CREATED);
            } catch (error) {
                res.sendStatus(StatusCodes.NOT_FOUND);
            }
        });
        this.router.delete('/rejectPlayer', (req: Request, res: Response) => {
            const { gameId } = req.body;
            try {
                const game = this.gameService.getGameById(gameId);
                if (!game) throw new Error('Game not found');
                this.playerService.rejectPlayer(game);
                res.sendStatus(StatusCodes.OK);
            } catch (error) {
                res.sendStatus(StatusCodes.NOT_FOUND);
            }
        });

        this.router.get('/gameSession', (_: Request, res: Response) => {
            res.status(StatusCodes.OK).json(this.gameService.gameSessions);
        });

        this.router.delete('/gameSession', (req: Request, res: Response) => {
            const { gameId } = req.body;
            try {
                this.gameService.removeGameSession(gameId);
                res.sendStatus(StatusCodes.OK);
            } catch (error) {
                res.sendStatus(StatusCodes.NOT_FOUND);
            }
        });

        this.router.post('/playerCheck', (req: Request, res: Response) => {
            const { gameId, playerId } = req.body;
            try {
                const game = this.gameService.getGameById(gameId);
                if (game) {
                    const player = this.playerService.getPlayerById(playerId, game);
                    if (!player) res.status(StatusCodes.NOT_FOUND).json(false);
                    else if (player.hasAbandon) res.status(StatusCodes.OK).json(false);
                    else res.status(StatusCodes.OK).json(true);
                } else res.status(StatusCodes.NOT_FOUND).json(false);
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.post('/reconnect', (req: Request, res: Response) => {
            const { oldId, newId, gameId } = req.body;
            try {
                const game = this.gameService.reconnectToGame(oldId, newId, gameId);
                if (game) res.status(StatusCodes.OK).json(game);
                else res.status(StatusCodes.NOT_FOUND).json('Reconnection timeout');
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.post('/convertSolo', async (req: Request, res: Response) => {
            try {
                this.gameService.convertToSolo(req.body.gameId, req.body.oponentName, req.body.virtualPlayerType);
                res.sendStatus(StatusCodes.OK);
            } catch (error) {
                res.sendStatus(StatusCodes.NOT_FOUND);
            }
        });
    }
}
