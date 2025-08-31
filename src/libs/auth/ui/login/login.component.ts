import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiStatus } from 'src/libs/shared/api/util/models/api-status';
import { ButtonComponent } from 'src/libs/shared/common/ui/button/button.component';
import { CharacterSheetCardComponent } from 'src/libs/shared/common/ui/character-sheet-card/character-sheet-card.component';
import { LogoComponent } from 'src/libs/shared/common/ui/logo/logo.component';
import { TextInputComponent } from 'src/libs/shared/common/ui/text-input/text-input.component';
import { AuthService } from '../../domain/services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
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
