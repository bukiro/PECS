import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './components/login/login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from '../ui/button/button.module';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { InputModule } from '../ui/input/input.module';
import { CharacterSheetCardComponent } from '../ui/character-sheet-card/character-sheet-card.component';
import { LogoComponent } from '../ui/logo/components/logo/logo.component';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,

        NgbModalModule,

        ButtonModule,
        InputModule,
        CharacterSheetCardComponent,
        LogoComponent,
    ],
    declarations: [
        LoginComponent,
    ],
    exports: [
        LoginComponent,
    ],
})
export class LoginModule { }
