import { HttpClient, HttpHeaders, HttpRequest, HttpEvent, HttpStatusCode, HttpEventType, HttpBackend } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Md5 } from 'ts-md5';
import { default as package_json } from 'package.json';
import { BehaviorSubject, catchError, filter, map, Observable, of, switchMap } from 'rxjs';
import { ApiStatusKey } from '../../definitions/apiStatusKey';
import { Defaults } from '../../definitions/defaults';
import { Store } from '@ngrx/store';
import { selectConfigStatus } from 'src/libs/store/status/status.selectors';
import { setConfigStatus } from 'src/libs/store/status/status.actions';

interface LoginToken {
    token: string | false;
}

@Injectable({
    providedIn: 'root',
})
export class ConfigService {

    public updateVersionAvailable$ = new BehaviorSubject<string>('');
    public isReady$: Observable<boolean>;

    private _dataServiceURL?: string;
    private _xAccessToken = 'testtoken';

    private readonly _httpClient: HttpClient;

    constructor(
        _httpBackend: HttpBackend,
        private readonly _store$: Store,
    ) {
        // Create a new HttpClient to avoid circular dependencies with http interceptors.
        this._httpClient = new HttpClient(_httpBackend);

        this.isReady$ = _store$.select(selectConfigStatus)
            .pipe(
                map(status => status.key === ApiStatusKey.Ready),
            );

        this._checkForUpdate();
        this._initialize();
    }

    public get xAccessToken(): string {
        return this._xAccessToken;
    }

    public get dataServiceURL(): string {
        return this._dataServiceURL ?? '';
    }

    public login(password = ''): void {
        if (password) {
            this._store$.dispatch(setConfigStatus({ status: { key: ApiStatusKey.LoggingIn, message: 'Logging in...' } }));
        } else {
            this._store$.dispatch(setConfigStatus({ status: { key: ApiStatusKey.LoggingIn, message: 'Connecting...' } }));
        }

        // Try logging in. Return values are:
        // - false if the password was wrong
        // - a randomized token if it was correct
        // - a token of "no-login-required" if no password is needed
        this._httpLogin(password)
            .subscribe({
                next: result => {
                    if (result.token !== false) {
                        this._xAccessToken = result.token;
                        this._store$.dispatch(setConfigStatus({ status: { key: ApiStatusKey.Ready } }));
                    } else {
                        if (password) {
                            this._store$.dispatch(setConfigStatus({
                                status: { key: ApiStatusKey.NotLoggedIn, message: 'The password is incorrect.' },
                            }));
                        } else {
                            // Login with no password should only happen in the initial connection test.
                            // This result means a password is required.
                            this._store$.dispatch(setConfigStatus({ status: { key: ApiStatusKey.NotLoggedIn } }));
                        }
                    }
                }, error: error => {
                    console.error(`Error logging in: ${ error.message }`);

                    this._store$.dispatch(setConfigStatus({
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
        this._store$.dispatch(setConfigStatus({ status: { key: ApiStatusKey.NotLoggedIn, message: notification } }));
    }

    private _initialize(): void {

        const headers = new HttpHeaders()
            .set('Cache-Control', 'no-cache')
            .set('Pragma', 'no-cache');

        this._checkForConfig$(headers)
            .pipe(
                filter((response: HttpEvent<unknown>) => (response.type !== HttpEventType.Sent)),
                switchMap((response: HttpEvent<unknown>) => {
                    if (response.type === HttpEventType.Response && response.status) {
                        if (response.status === HttpStatusCode.Ok) {
                            return this._readConfig$(headers);
                        } else {
                            //If there was any result other than 200, we can assume that we are working with a local data service.
                            //In that case, login will run without a dataServiceURL.
                            return of(undefined);
                        }
                    }

                    // In any other non-error case, we don't know what happened, but we don't have a connection URL.
                    return of(undefined);
                }),
                catchError(error => {
                    if (error.status === HttpStatusCode.NotFound) {
                        // If no config file exists, assume a local connection URL.
                        // Warn about the file in case it is mistakenly missing.
                        console.warn(
                            'No config file was found. '
                            + 'Switching to a local service. '
                            + 'If a configuration was intended, see assets/config.json.example for more information.',
                        );

                        return of(undefined);
                    } else if (error.message.includes('failure during parsing')) {
                        console.error('A bad config file was found. See assets/config.json.example for more information.');

                        this._store$.dispatch(setConfigStatus({
                            status: {
                                key: ApiStatusKey.Failed,
                                message:
                                    'A bad config file was found.\n'
                                    + 'PECS cannot be started.\n'
                                    + 'See assets/config.json.example for more information.',
                            },
                        }));

                        throw (error);
                    }

                    console.warn('An unknown error occurred while reading the config file. Switching to a local service.');
                    console.error(error);

                    return of(undefined);
                }),
                map((data: object | undefined) => {
                    if (data) {
                        const config = JSON.parse(JSON.stringify(data));

                        this._dataServiceURL = config.dataServiceURL || config.dbConnectionURL || '';
                    }

                    //If the result is undefined, PECS will assume a local service.

                    //Establish a connection to the data service and perform a dummy login to check whether login is required.
                    this.login();

                    return data;
                }),
            )
            .subscribe();
    }

    private _checkForConfig$(headers: HttpHeaders): Observable<HttpEvent<unknown>> {
        return this._httpClient.request(new HttpRequest('HEAD', '/assets/config.json', headers));
    }

    private _readConfig$(headers: HttpHeaders): Observable<object> {
        return this._httpClient.get('assets/config.json', { headers });
    }

    private _httpLogin(password = ''): Observable<LoginToken> {
        // If no connection URL is set, the login will be posted against the local service.
        return this._httpClient.post<LoginToken>(`${ this.dataServiceURL }/login`, { password: Md5.hashStr(password) });
    }

    private _checkForUpdate(): void {
        this._httpClient.get(Defaults.updateURL)
            .subscribe({
                next: response => {
                    const cvs = package_json.version.split('.').map(version => parseInt(version, 10));
                    const availableVersion: string = JSON.parse(JSON.stringify(response)).tag_name?.replace('v', '') || 'n/a';

                    if (availableVersion !== 'n/a') {
                        const avs = availableVersion.split('.').map(version => parseInt(version, 10));
                        const majorVersionIndex = 0;
                        const versionIndex = 1;
                        const minorVersionIndex = 2;

                        if (
                            avs[majorVersionIndex] > cvs[majorVersionIndex] ||
                            (
                                avs[majorVersionIndex] === cvs[majorVersionIndex] &&
                                avs[versionIndex] > cvs[versionIndex]
                            ) ||
                            (
                                avs[majorVersionIndex] === cvs[majorVersionIndex] &&
                                avs[versionIndex] === cvs[versionIndex] &&
                                avs[minorVersionIndex] > cvs[minorVersionIndex]
                            )
                        ) {
                            this.updateVersionAvailable$.next(availableVersion);
                        }
                    } else {
                        this.updateVersionAvailable$.next(availableVersion);
                    }
                },
                error: () => {
                    console.warn('Could not contact github to check for new version.');
                    this.updateVersionAvailable$.next('n/a');
                },
            });
    }

}
