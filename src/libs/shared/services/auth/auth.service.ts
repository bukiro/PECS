import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Md5 } from 'ts-md5';
import { map, Observable } from 'rxjs';
import { ApiStatusKey } from '../../definitions/apiStatusKey';
import { Store } from '@ngrx/store';
import { selectAuthStatus } from 'src/libs/store/status/status.selectors';
import { setAuthStatus } from 'src/libs/store/status/status.actions';
import { ConfigService } from '../config/config.service';
import { TokenService } from '../token/token.service';

interface LoginToken {
    token: string | false;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    public isReady$: Observable<boolean>;

    private _xAccessToken: string | undefined = undefined;

    private readonly _accessTokenKey = 'pecs_access_token';

    constructor(
        private readonly _httpClient: HttpClient,
        private readonly _configService: ConfigService,
        private readonly _tokenService: TokenService,
        private readonly _store$: Store,
    ) {
        this.isReady$ = _store$.select(selectAuthStatus)
            .pipe(
                map(status => status.key === ApiStatusKey.Ready),
            );
    }

    public get xAccessToken(): string {
        return this._xAccessToken ?? '';
    }

    // Verify the stored token, if any. If no token, find out whether a password is needed.
    public initialize(): void {
        this._xAccessToken = this._tokenService.getAccessToken();

        if (this._xAccessToken) {
            this._verifyLogin(this._xAccessToken);
        } else {
            this._checkLoginRequired();
        }
    }

    public login(password = ''): void {
        if (password) {
            this._store$.dispatch(setAuthStatus({ status: { key: ApiStatusKey.LoggingIn, message: 'Logging in...' } }));
        } else {
            this._store$.dispatch(setAuthStatus({ status: { key: ApiStatusKey.LoggingIn, message: 'Connecting...' } }));
        }

        // Try logging in. Return values are:
        // - false if the password was wrong
        // - a randomized token if it was correct
        // - a token of "no-login-required" if no password is needed
        this._httpLogin(password)
            .subscribe({
                next: result => {
                    if (result.token) {
                        this._xAccessToken = result.token;
                        this._tokenService.setAccessToken(result.token);
                        this._store$.dispatch(setAuthStatus({ status: { key: ApiStatusKey.Ready } }));
                    } else {
                        if (password) {
                            this._store$.dispatch(setAuthStatus({
                                status: { key: ApiStatusKey.NotLoggedIn, message: 'The password is incorrect.' },
                            }));
                        } else {
                            // Login with no password should only happen in the initial connection test.
                            // This result means a password is required.
                            this._store$.dispatch(setAuthStatus({ status: { key: ApiStatusKey.NotLoggedIn } }));
                        }
                    }
                },
                error: error => {
                    console.error(`Error logging in: ${ error.message }`);

                    this._store$.dispatch(setAuthStatus({
                        status: {
                            key: ApiStatusKey.Failed,
                            message: 'The configured database is not available.',
                            retryFn: this.login.bind(this),
                        },
                    }));
                },
            });
    }

    public logout(notification = ''): void {
        this._store$.dispatch(setAuthStatus({ status: { key: ApiStatusKey.NotLoggedIn, message: notification } }));
        this._xAccessToken = '';
        this._tokenService.setAccessToken();
    }

    private _verifyLogin(token: string): void {
        this._httpClient.get<{ time: number }>(
            `${ this._configService.dataServiceURL }/time`,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': token }) },
        )
            .subscribe({
                next: () => {
                    this._store$.dispatch(setAuthStatus({ status: { key: ApiStatusKey.Ready } }));
                },
                error: () => {
                    this.logout();
                    this._checkLoginRequired();
                },
            });
    }

    private _checkLoginRequired(): void {
        this._store$.dispatch(setAuthStatus({ status: { key: ApiStatusKey.LoggingIn, message: 'Connecting...' } }));

        // Try logging in. Return values are:
        // - false if a password is needed (i.e. the blank password was not accepted)
        // - a token of "no-login-required" if no password is needed
        this._httpLogin()
            .subscribe({
                next: result => {
                    if (result.token) {
                        this._store$.dispatch(setAuthStatus({ status: { key: ApiStatusKey.Ready } }));
                    } else {
                        // This result means a password is required.
                        this._store$.dispatch(setAuthStatus({ status: { key: ApiStatusKey.NotLoggedIn } }));
                    }
                },
                error: error => {
                    console.error(`Error logging in: ${ error.message }`);

                    this._store$.dispatch(setAuthStatus({
                        status: {
                            key: ApiStatusKey.Failed,
                            message: 'The configured database is not available.',
                            retryFn: this._checkLoginRequired.bind(this),
                        },
                    }));
                },
            });
    }

    private _httpLogin(password = ''): Observable<LoginToken> {
        // If no connection URL is set, the login will be posted against the local service.
        return this._httpClient.post<LoginToken>(`${ this._configService.dataServiceURL }/login`, { password: Md5.hashStr(password) });
    }

}
