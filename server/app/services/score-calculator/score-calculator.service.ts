import { GridService } from '@app/services/game/grid/grid.service';
import { WordValidatorService } from '@app/services/word-validator/wordvalidator.service';
import { SCORE_MULTIPLIER } from '@app/utils/score-multiplier-constant';
import { PlayableWord, SCORE_PERCENTILE } from '@common/clue';
import { PlaceCommand } from '@common/command';
import { Game } from '@common/game';
import { Tile } from '@common/grid/gridTypes';
import { DEFAULT_GRID } from '@common/grid/initialGrid';
import { Letter, Node, Word } from '@common/grid/node';
import { INDEX_ROW } from '@common/grid/row-index';
import { Container, Service } from 'typedi';

@Service()
export class ScoreCalculatorService {
    calculateScore(newWords: Word[], command: PlaceCommand): number {
        let score = 0;
        let wordMultiplier = 1;
        for (const word of newWords) {
            for (const node of word.letters) {
                if (node.isNewNode) {
                    const scoreAndMultiplier = this.checkTypeOfTile(node);
                    score += scoreAndMultiplier[0];
                    wordMultiplier *= scoreAndMultiplier[1];
                } else {
                    score += (node.letter as Letter).value as number;
                }
            }
            score *= wordMultiplier;
            wordMultiplier = 1;
        }

        if (command.word.length === SCORE_MULTIPLIER.maxAmountLetter) score += SCORE_MULTIPLIER.point7Letters;
        return score;
    }

    get80th70th60thScoredWords(game: Game, playableWords: PlayableWord[]): PlayableWord[] {
        const threePlayableWords: PlayableWord[] = [];
        this.generateScoreForPlayableWords(game, playableWords);

        playableWords.sort((a: PlayableWord, b: PlayableWord) => {
            return (a.score as number) - (b.score as number);
        });
        if (playableWords.length !== 0) {
            threePlayableWords.push(this.getPercentilePlayableWord(SCORE_PERCENTILE.EIGHTIETH_PERCENTILE_SCORE, playableWords));
            threePlayableWords.push(this.getPercentilePlayableWord(SCORE_PERCENTILE.SEVENTIETH_PERCENTILE_SCORE, playableWords));
            threePlayableWords.push(this.getPercentilePlayableWord(SCORE_PERCENTILE.SIXTIETH_PERCENTILE_SCORE, playableWords));
        }
        return threePlayableWords;
    }

    generateScoreForPlayableWords(game: Game, playableWords: PlayableWord[]): void {
        const placeCommand: PlaceCommand = {} as PlaceCommand;
        let copyGrid: Node[][] = Container.get(GridService).copyGrid(game.grid);
        for (const playableWord of playableWords) {
            placeCommand.row = INDEX_ROW.get(playableWord.position.row) as string;
            placeCommand.column = playableWord.position.col;
            placeCommand.direction = playableWord.direction;
            placeCommand.word = Container.get(GridService).getPlaceCommandWord(game.grid, playableWord).word;
            placeCommand.wordsInDictionary = true;
            const newWords: Word[] = Container.get(WordValidatorService).getNewWords(placeCommand, copyGrid);
            playableWord.score = Container.get(ScoreCalculatorService).calculateScore(newWords, placeCommand);
            copyGrid = Container.get(GridService).copyGrid(game.grid);
        }
    }

    private getPercentilePlayableWord(scorePercentile: number, playableWords: PlayableWord[]): PlayableWord {
        return playableWords[Math.round(scorePercentile * playableWords.length)];
    }

    private checkTypeOfTile(node: Node): [number, number] {
        const scoreAndMultiplier: [number, number] = [0, 1];
        switch (DEFAULT_GRID[node.y][node.x]) {
            case Tile.DOUBLE_LETTER:
                scoreAndMultiplier[0] = (node.letter as Letter).value * SCORE_MULTIPLIER.timeTwo;
                break;

            case Tile.TRIPLE_LETTER:
                scoreAndMultiplier[0] = (node.letter as Letter).value * SCORE_MULTIPLIER.timeThree;
                break;

            case Tile.DOUBLE_WORD:
                scoreAndMultiplier[1] = SCORE_MULTIPLIER.timeTwo;
                scoreAndMultiplier[0] = (node.letter as Letter).value as number;
                break;

            case Tile.TRIPLE_WORD:
                scoreAndMultiplier[1] = SCORE_MULTIPLIER.timeThree;
                scoreAndMultiplier[0] = (node.letter as Letter).value as number;
                break;

            case Tile.STAR:
                scoreAndMultiplier[1] = SCORE_MULTIPLIER.timeTwo;
                scoreAndMultiplier[0] = (node.letter as Letter).value as number;
                break;

            default:
                scoreAndMultiplier[0] = (node.letter as Letter).value as number;
                break;
        }
        if ((node.letter as Letter).character === (node.letter as Letter).character.toUpperCase()) scoreAndMultiplier[0] = 0;
        return scoreAndMultiplier;
    }
}
