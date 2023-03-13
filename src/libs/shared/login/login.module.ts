import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './components/login/login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from '../ui/button/button.module';
import { LogoModule } from '../ui/logo/logo.module';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,

        ButtonModule,
        LogoModule,
    ],
    declarations: [
        LoginComponent,
    ],
    exports: [
        LoginComponent,
    ],
})
export class LoginModule { }
