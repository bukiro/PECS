import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ApiStatus } from 'src/libs/shared/definitions/interfaces/api-status';
import { ConfigService } from 'src/libs/shared/services/config/config.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements AfterViewInit {

    @ViewChild('PasswordInput')
    public passwordInput?: ElementRef<HTMLInputElement>;

    @Input()
    public loadingStatus?: ApiStatus;

    public passwordForm: FormGroup<{ password: FormControl<string | null> }>;

    constructor(
        private readonly _configService: ConfigService,
    ) {
        this.passwordForm = new FormGroup({
            password: new FormControl<string>(
                '',
                Validators.required,
            ),
        });
    }

    public login(): void {
        this._configService.login(this.passwordForm.value.password ?? '');
    }

    public ngAfterViewInit(): void {
        this.passwordInput?.nativeElement?.focus();
    }

}
