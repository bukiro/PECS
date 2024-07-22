import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiStatus } from 'src/libs/shared/definitions/interfaces/api-status';
import { AuthService } from 'src/libs/shared/services/auth/auth.service';
import { ButtonComponent } from '../../../ui/button/components/button/button.component';
import { TextInputComponent } from '../../../ui/input/components/text-input/text-input.component';
import { LogoComponent } from '../../../ui/logo/components/logo/logo.component';
import { CharacterSheetCardComponent } from '../../../ui/character-sheet-card/character-sheet-card.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,

        CharacterSheetCardComponent,
        LogoComponent,
        TextInputComponent,
        ButtonComponent,
    ],
})
export class LoginComponent implements AfterViewInit {

    @ViewChild('PasswordInput')
    public passwordInput?: ElementRef<HTMLInputElement>;

    @Input()
    public loadingStatus?: ApiStatus;

    public passwordForm: FormGroup<{ password: FormControl<string | null> }>;

    constructor(
        private readonly _authService: AuthService,
    ) {
        this.passwordForm = new FormGroup({
            password: new FormControl<string>(
                '',
                Validators.required,
            ),
        });
    }

    public login(): void {
        this._authService.login(this.passwordForm.value.password ?? '');
    }

    public ngAfterViewInit(): void {
        this.passwordInput?.nativeElement?.focus();
    }

}
