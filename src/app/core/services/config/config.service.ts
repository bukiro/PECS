import { HttpClient, HttpHeaders, HttpRequest, HttpEvent, HttpStatusCode, HttpEventType } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Md5 } from 'ts-md5';
import { default as package_json } from 'package.json';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { filter, map, Observable, of, switchMap } from 'rxjs';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { ToastService } from 'src/libs/shared/services/toast/toast.service';
import { StatusService } from 'src/app/core/services/status/status.service';
import { SavegamesService } from 'src/libs/shared/saving-loading/services/savegames/savegames.service';

interface LoginToken {
    token: string | false;
}

@Injectable({
    providedIn: 'root',
})
export class ConfigService {

    private _dataServiceURL?: string;
    private _localDataService = false;
    private _initialized = false;
    private _xAccessToken = 'testtoken';
    private _loggingIn = false;
    private _loggedIn = false;
    private _cannotLogin = false;
    private _loggedOutMessage = '';
    private _updateAvailable = '';
    private readonly _updateURL = 'http://api.github.com/repos/bukiro/PECS/releases/latest';

    private _savegamesService?: SavegamesService;

    constructor(
        private readonly _httpClient: HttpClient,
        private readonly _refreshService: RefreshService,
        private readonly _toastService: ToastService,
        private readonly _statusService: StatusService,
    ) { }

    public get stillLoading(): boolean {
        return this._loggingIn || !this._initialized;
    }

    public get isLoggingIn(): boolean {
        return this._loggingIn;
    }

    public get isLoggedIn(): boolean {
        return this._loggedIn;
    }

    public get cannotLogin(): boolean {
        return this._cannotLogin;
    }

    public get loggedOutMessage(): string {
        return this._loggedOutMessage;
    }

    public get xAccessToken(): string {
        return this._xAccessToken;
    }

    public get hasDBConnectionURL(): boolean {
        return !!this._dataServiceURL || !!this._localDataService;
    }

    public get dBConnectionURL(): string {
        if (this._dataServiceURL) {
            return this._dataServiceURL;
        } else {
            return '';
        }
    }

    public get updateAvailable(): string {
        return this._updateAvailable;
    }

    public login(password = ''): void {
        //We set loggingIn to true, which changes buttons in the character builder and the top-bar, so we need to update those.
        this._loggingIn = true;
        this._statusService.setLoadingStatus('Connecting');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
        this._refreshService.processPreparedChanges();
        // Try logging in. Return values are:
        // - false if the password was wrong
        // - a randomized token if it was correct
        // - a token of "no-login-required" if no password is needed
        this._httpLogin(password)
            .subscribe({
                next: result => {
                    this._cannotLogin = false;

                    if (result.token !== false) {
                        this._xAccessToken = result.token;
                        this._loggedIn = true;
                        this._loggingIn = false;
                        this._loggedOutMessage = '';
                        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
                        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'top-bar');
                        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'reset-savegames');
                        this._refreshService.processPreparedChanges();
                        this._savegamesService?.reset();
                    } else {
                        this._loggedIn = false;
                        this._loggingIn = false;

                        if (password) {
                            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'password-failed');
                        } else {
                            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'logged-out');
                        }

                        this._refreshService.processPreparedChanges();
                    }
                }, error: error => {
                    console.error(`Error logging in: ${ error.message }`);

                    if (error.status === 0) {
                        this._toastService.show(
                            'The configured database is not available. Characters can\'t be saved or loaded.',
                        );
                    }

                    this._cannotLogin = true;
                    this._loggingIn = false;
                    this._initialized = true;
                    this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
                    this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'top-bar');
                    this._refreshService.processPreparedChanges();
                },
            });
    }

    public logout(notification = ''): void {
        this._loggedIn = false;
        this._loggedOutMessage = notification;
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'character-sheet');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'top-bar');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'logged-out');
        this._refreshService.processPreparedChanges();
    }

    public initialize(savegamesService: SavegamesService): void {
        this._savegamesService = savegamesService;

        const headers = new HttpHeaders()
            .set('Cache-Control', 'no-cache')
            .set('Pragma', 'no-cache');

        this._httpClient.request(new HttpRequest('HEAD', '/assets/config.json', headers))
            .pipe(
                filter((response: HttpEvent<unknown>) => (response.type !== HttpEventType.Sent)),
                switchMap((response: HttpEvent<unknown>) => {
                    if (response.type === HttpEventType.Response && response.status) {
                        if (response.status === HttpStatusCode.Ok) {
                            return this._httpClient.get('assets/config.json', { headers });
                        } else {
                            //If there was any result other than 200, we can assume that we are working with a local data service.
                            //In that case, login will run without a dataServiceURL.
                            return of(undefined);
                        }
                    }

                    return of(undefined);
                }),
                map((data: object | undefined) => {
                    if (data) {
                        const config = JSON.parse(JSON.stringify(data));

                        this._dataServiceURL = config.dataServiceURL || config.dbConnectionURL || '';
                        this._localDataService = config.localDataService || config.localDBConnector;
                    }

                    //Establish a connection to the data service and do a dummy login to check whether login is required.
                    this.login();
                    this._initialized = true;

                    return data;
                }),
            )
            .subscribe({
                error: error => {
                    if (error.status === HttpStatusCode.NotFound) {
                        console.error('No config file was found. See assets/config.json.example for more information.');
                        this._statusService.setLoadingStatus('No config file!');
                        this._toastService.show('No config file was found. PECS cannot be started.');
                    } else if (error.message.includes('failure during parsing')) {
                        console.error('A bad config file was found. See assets/config.json.example for more information.');
                        this._statusService.setLoadingStatus('Bad config file!');
                        this._toastService.show('The config file could not be read. PECS cannot be started.');
                    }
                },
            });

        this._httpClient.get(this._updateURL)
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
                            this._updateAvailable = availableVersion;
                        }
                    } else {
                        this._updateAvailable = availableVersion;
                    }
                },
                error: () => {
                    console.warn('Could not contact github to check for new version.');
                    this._updateAvailable = 'n/a';
                },
            });
    }

    private _httpLogin(password = ''): Observable<LoginToken> {
        return this._httpClient.post<LoginToken>(`${ this.dBConnectionURL }/login`, { password: Md5.hashStr(password) });
    }

}
