import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { TopBarComponent } from './components/top-bar/top-bar.component';
import { FormsModule } from '@angular/forms';
import { DiceIconsModule } from '../shared/ui/dice-icons/dice-icons.module';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ButtonModule } from '../shared/ui/button/button.module';
import { DialogModule } from '../shared/dialog/dialog.module';
import { NewMessagesComponent } from './components/new-messages/new-messages.component';
import { MessagesDialogComponent } from './components/messages-dialog/messages-dialog.component';
import { InputModule } from '../shared/ui/input/input.module';
import { CharacterSheetCardComponent } from '../shared/ui/character-sheet-card/character-sheet-card.component';
import { LogoComponent } from '../shared/ui/logo/components/logo/logo.component';
import { LoadingDiamondComponent } from '../shared/ui/diamond/components/loading-diamond/loading-diamond.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        BrowserAnimationsModule,

        NgbTooltipModule,

        DiceIconsModule,
        ButtonModule,
        DialogModule,
        InputModule,
        LoadingDiamondComponent,
        CharacterSheetCardComponent,

        LogoComponent,
    ],
    declarations: [
        NewMessagesComponent,
        MessagesDialogComponent,
        TopBarComponent,
    ],
    exports: [
        TopBarComponent,
    ],
})
export class TopBarModule { }
