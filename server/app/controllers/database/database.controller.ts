import { AdminService } from '@app/services/database/admin-service/admin.service';
import { GameHistoryService } from '@app/services/database/game-history-service/game-history.service';
import { ScoreDatabaseService } from '@app/services/database/score-database-service/score-database.service';
import { DictionaryService } from '@app/services/dictionary/dictionary.service';
import { SETTING_DICTIONNARY, SETTING_HIGHSCORE, SETTING_HISTORIQUE_DES_PARTIS, SETTING_JV_NAMES } from '@common/dictionnary';
import { GameMode } from '@common/game-mode';
import { GameHistory, VirtualPlayerName } from '@common/player';
import { PlayerScore } from '@common/player-score';
import { VirtualPlayerType } from '@common/virtualPlayer';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';
@Service()
export class DatabaseController {
    router: Router;

    constructor(
        private scoreService: ScoreDatabaseService,
        private adminService: AdminService,
        private gameHistoryService: GameHistoryService,
        private dictionnaryService: DictionaryService,
    ) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.get('/gameHistory', async (req: Request, res: Response) => {
            try {
                const gameHistory: GameHistory[] = await this.gameHistoryService.getGameHistory();
                res.status(StatusCodes.OK).json(gameHistory);
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.get('/scores/:mode', async (req: Request, res: Response) => {
            try {
                const scores: PlayerScore[] = await this.scoreService.getTopScore(req.params.mode as GameMode);
                res.status(StatusCodes.OK).json(scores);
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.get('/virtualPlayer/names/random/:mode', async (req: Request, res: Response) => {
            try {
                const virtualPlayerName: string = await this.adminService.getRandomVirtualPlayerName(req.params.mode as VirtualPlayerType);
                res.status(StatusCodes.OK).json(virtualPlayerName);
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.get('/virtualPlayer/names', async (req: Request, res: Response) => {
            try {
                const virtualPlayerName: VirtualPlayerName[] = await this.adminService.getVirtualPlayerNames();
                res.status(StatusCodes.OK).json(virtualPlayerName);
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.post('/virtualPlayer', async (req: Request, res: Response) => {
            try {
                this.adminService.addVirtualPlayer(req.body.name, req.body.type);
                res.sendStatus(StatusCodes.OK);
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.delete('/virtualPlayer', async (req: Request, res: Response) => {
            const { name, type } = req.body;
            try {
                this.adminService.deleteVirtualPlayer(name, type);
                res.sendStatus(StatusCodes.OK);
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.patch('/virtualPlayer', async (req: Request, res: Response) => {
            const { oldName, newName, type } = req.body;
            try {
                this.adminService.renameVirtualPlayer(oldName, newName, type);
                res.sendStatus(StatusCodes.OK);
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });
        this.router.patch('/reset', async (req: Request, res: Response) => {
            try {
                switch (req.body.settingType) {
                    case SETTING_DICTIONNARY:
                        await this.dictionnaryService.reset();
                        break;
                    case SETTING_JV_NAMES:
                        await this.adminService.reset();
                        break;
                    case SETTING_HISTORIQUE_DES_PARTIS:
                        await this.gameHistoryService.reset();
                        break;
                    case SETTING_HIGHSCORE:
                        await this.scoreService.resetScore();
                        break;
                }
                res.status(StatusCodes.OK).json({});
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });
    }
}
