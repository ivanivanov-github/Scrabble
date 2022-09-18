import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AboutUsComponent } from '@app/components/about-us/about-us.component';
import { HighscoresComponent } from '@app/components/highscores/highscores.component';
import { ParametersComponent } from '@app/components/parameters/parameters.component';
import { GameMode } from '@common/game-mode';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent {
    readonly title: string = 'Scrabble';
    isJoining: boolean = false;

    constructor(public dialog: MatDialog) {}
    openParameterDialog(mode: string): void {
        const gameMode: GameMode = mode === GameMode.Classic ? GameMode.Classic : GameMode.Log2990;
        this.dialog.open(ParametersComponent, {
            panelClass: 'parametrisationModal',
            disableClose: true,
            data: { gameMode },
        });
    }
    openScoreDialog(): void {
        this.dialog.open(HighscoresComponent, { panelClass: 'parametrisationModal' });
    }
    openAboutUsDialog(): void {
        this.dialog.open(AboutUsComponent, { panelClass: 'parametrisationModal' });
    }
}
