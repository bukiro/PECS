import { HttpClient, HttpHeaders, HttpRequest, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Md5 } from 'ts-md5';
import { CharacterService } from 'src/app/services/character.service';
import { SavegameService } from 'src/app/services/savegame.service';
import { default as package_json } from 'package.json';
import { RefreshService } from 'src/app/services/refresh.service';
import { map, Observable, of, switchMap } from 'rxjs';

interface LoginToken {
    token: string | false;
}

@Injectable({
    providedIn: 'root',
})
export class ConfigService {

    private _dataServiceURL: string;
    private _localDataService = false;
    private _initialized = false;
    private _xAccessToken = 'testtoken';
    private _loggingIn = false;
    private _loggedIn = false;
    private _cannotLogin = false;
    private _loggedOutMessage = '';
    private _updateAvailable = '';
    private readonly _updateURL = 'http://api.github.com/repos/bukiro/PECS/releases/latest';

    constructor(
        private readonly _httpClient: HttpClient,
        private readonly _refreshService: RefreshService,
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

    public login(password = '', characterService: CharacterService, savegameService: SavegameService): void {
        //We set loggingIn to true, which changes buttons in the character builder and the top-bar, so we need to update those.
        this._loggingIn = true;
        characterService.setLoadingStatus('Connecting');
        this._refreshService.prepareDetailToChange('Character', 'charactersheet');
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
                        this._refreshService.prepareDetailToChange('Character', 'charactersheet');
                        this._refreshService.prepareDetailToChange('Character', 'top-bar');
                        this._refreshService.processPreparedChanges();
                        savegameService.reset();
                    } else {
                        this._loggedIn = false;
                        this._loggingIn = false;

                        if (password) {
                            this._refreshService.prepareDetailToChange('Character', 'password-failed');
                        } else {
                            this._refreshService.prepareDetailToChange('Character', 'logged-out');
                        }

                        this._refreshService.processPreparedChanges();
                    }
                }, error: error => {
                    console.error(`Error logging in: ${ error.message }`);

                    if (error.status === 0) {
                        characterService.toastService.show(
                            'The configured database is not available. Characters can\'t be saved or loaded.',
                        );
                    }

                    this._cannotLogin = true;
                    this._loggingIn = false;
                    this._initialized = true;
                    this._refreshService.prepareDetailToChange('Character', 'charactersheet');
                    this._refreshService.prepareDetailToChange('Character', 'top-bar');
                    this._refreshService.processPreparedChanges();
                },
            });
    }

    public logout(notification = ''): void {
        this._loggedIn = false;
        this._loggedOutMessage = notification;
        this._refreshService.prepareDetailToChange('Character', 'character-sheet');
        this._refreshService.prepareDetailToChange('Character', 'top-bar');
        this._refreshService.prepareDetailToChange('Character', 'logged-out');
        this._refreshService.processPreparedChanges();
    }

    public initialize(characterService: CharacterService, savegameService: SavegameService): void {
        const headers = new HttpHeaders().set('Cache-Control', 'no-cache')
            .set('Pragma', 'no-cache');

        this._httpClient.request(new HttpRequest('HEAD', 'assets/config.json', headers))
            .pipe(
                switchMap((response: HttpResponse<unknown>) => {
                    if (response.status) {
                        if (response.status === HttpStatusCode.Ok) {
                            return this._httpClient.get('assets/config.json', { headers });
                        } else {
                            //If there was any result other than 200, we can assume that we are working with a local data service.
                            //In that case, login will run without a dataServiceURL.
                            return of(undefined);
                        }
                    }
                }),
                map((data: object | undefined) => {
                    if (data) {
                        const config = JSON.parse(JSON.stringify(data));

                        this._dataServiceURL = config.dataServiceURL || config.dbConnectionURL || '';
                        this._localDataService = config.localDataService || config.localDBConnector;
                    }

                    //Establish a connection to the data service and do a dummy login to check whether login is required.
                    this.login('', characterService, savegameService);
                    this._initialized = true;
                }),
            )
            .subscribe({
                error: error => {
                    if (error.status === HttpStatusCode.NotFound) {
                        console.error('No config file was found. See assets/config.json.example for more information.');
                    } else {
                        throw error;
                    }

                    this._initialized = true;
                },
            });

        this._httpClient.get(this._updateURL)
            .subscribe({
                next: response => {
                    const cvs = package_json.version.split('.').map(version => parseInt(version, 10));
                    const availableVersion = JSON.parse(JSON.stringify(response)).tag_name?.replace('v', '') || 'n/a';

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
