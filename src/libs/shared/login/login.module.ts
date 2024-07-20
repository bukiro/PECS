import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './components/login/login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { InputModule } from '../ui/input/input.module';
import { CharacterSheetCardComponent } from '../ui/character-sheet-card/character-sheet-card.component';
import { LogoComponent } from '../ui/logo/components/logo/logo.component';
import { ButtonComponent } from '../ui/button/components/button/button.component';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,

        NgbModalModule,

        ButtonComponent,
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
