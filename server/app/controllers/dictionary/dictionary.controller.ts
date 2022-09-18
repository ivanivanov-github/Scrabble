import { DictionaryService } from '@app/services/dictionary/dictionary.service';
import { Dictionary } from '@common/dictionary';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class DictionaryController {
    router: Router;

    constructor(private dictionaryService: DictionaryService) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.get('/:title', async (req: Request, res: Response) => {
            const { title } = req.params;
            try {
                const dictionary = this.dictionaryService.getDictionary(title);
                if (!dictionary) {
                    res.sendStatus(StatusCodes.NOT_FOUND);
                } else {
                    res.status(StatusCodes.OK).json(dictionary);
                }
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.get('/', async (req: Request, res: Response) => {
            try {
                const titles = this.dictionaryService.getDictionnariesHeaders();
                res.status(StatusCodes.OK).json(titles);
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.patch('/', async (req: Request, res: Response) => {
            const { oldName, newName, newDescription } = req.body;
            try {
                await this.dictionaryService.modifyDictionary(oldName, newName, newDescription);
                res.sendStatus(StatusCodes.NO_CONTENT);
            } catch (error) {
                if (error.message === 'Vous ne pouvez pas modifier le dictionnaire par défaut') {
                    res.status(StatusCodes.BAD_REQUEST).json(error.message);
                } else if (error.message === "Le dictionnaire n'existe pas") {
                    res.status(StatusCodes.NOT_FOUND).json(error.message);
                } else res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.delete('/:dictionaryName', async (req: Request, res: Response) => {
            const { dictionaryName } = req.params;
            try {
                await this.dictionaryService.deleteDictionary(dictionaryName);
                res.sendStatus(StatusCodes.NO_CONTENT);
            } catch (error) {
                if (error.message === 'Vous ne pouvez pas supprimer le dictionnaire par défaut') {
                    res.status(StatusCodes.BAD_REQUEST).json(error.message);
                } else res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.post('/', async (req: Request, res: Response) => {
            const dictionary = req.body as Dictionary;
            try {
                await this.dictionaryService.addDictionary(dictionary);
                res.status(StatusCodes.CREATED).json(dictionary);
            } catch (error) {
                if (error.message === 'Le dictionnaire existe déjà') {
                    res.status(StatusCodes.CONFLICT).json(error.message);
                } else {
                    res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
                }
            }
        });
    }
}
