import { HttpClient, HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Md5 } from 'ts-md5';
import { CharacterService } from 'src/app/services/character.service';
import { SavegameService } from 'src/app/services/savegame.service';
import { default as package_json } from 'package.json';
import { RefreshService } from 'src/app/services/refresh.service';

@Injectable({
    providedIn: 'root',
})
export class ConfigService {

    private dataServiceURL: string;
    private localDataService = false;
    private loading = false;
    private xAccessToken = 'testtoken';
    private loggingIn = false;
    private loggedIn = false;
    private cannotLogin = false;
    private loggedOutMessage = '';
    private updateAvailable = '';
    private readonly updateURL = 'http://api.github.com/repos/bukiro/PECS/releases/latest';

    constructor(
        private readonly httpClient: HttpClient,
        private readonly refreshService: RefreshService,
    ) { }

    still_loading() {
        return this.loading;
    }

    get_LoggingIn() {
        return this.loggingIn;
    }

    get_LoggedIn() {
        return this.loggedIn;
    }

    get_CannotLogin() {
        return this.cannotLogin;
    }

    get_LoggedOutMessage() {
        return this.loggedOutMessage;
    }

    get_XAccessToken() {
        return this.xAccessToken;
    }

    get_HasDBConnectionURL() {
        return this.dataServiceURL || this.localDataService;
    }

    get_DBConnectionURL() {
        if (this.dataServiceURL) {
            return this.dataServiceURL;
        } else {
            return '';
        }
    }

    get_UpdateAvailable() {
        return this.updateAvailable;
    }

    login(password = '') {
        return this.httpClient.post<{ token: string | false }>(`${ this.get_DBConnectionURL() }/login`, { password: Md5.hashStr(password) });
    }

    get_Login(password = '', characterService: CharacterService, savegameService: SavegameService) {
        //We set loggingIn to true, which changes buttons in the character builder and the top-bar, so we need to update those.
        this.loggingIn = true;
        characterService.set_LoadingStatus('Connecting');
        this.refreshService.set_ToChange('Character', 'charactersheet');
        this.refreshService.process_ToChange();
        //Try logging in. You will receive false if the password was wrong, a random token if it was correct, or a token of "no-login-required" if no password is needed.
        this.login(password)
            .subscribe({
                next: (result: { token: string | false }) => {
                    this.cannotLogin = false;

                    if (result.token != false) {
                        this.xAccessToken = result.token;
                        this.loggedIn = true;
                        this.loggingIn = false;
                        this.loggedOutMessage = '';
                        this.refreshService.set_ToChange('Character', 'charactersheet');
                        this.refreshService.set_ToChange('Character', 'top-bar');
                        this.refreshService.process_ToChange();
                        savegameService.reset();
                    } else {
                        this.loggedIn = false;

                        if (password) {
                            this.refreshService.set_ToChange('Character', 'password-failed');
                        } else {
                            this.refreshService.set_ToChange('Character', 'logged-out');
                        }

                        this.refreshService.process_ToChange();
                    }

                    this.loading = false;
                }, error: error => {
                    console.log(`Error logging in: ${ error.message }`);

                    if (error.status == 0) {
                        characterService.toastService.show('The configured database is not available. Characters can\'t be saved or loaded.');
                    }

                    this.cannotLogin = true;
                    this.loggingIn = false;
                    this.loading = false;
                    this.refreshService.set_ToChange('Character', 'charactersheet');
                    this.refreshService.set_ToChange('Character', 'top-bar');
                    this.refreshService.process_ToChange();
                },
            });
    }

    on_LoggedOut(notification = '') {
        this.loggedIn = false;
        this.loggedOutMessage = notification;
        this.refreshService.set_ToChange('Character', 'character-sheet');
        this.refreshService.set_ToChange('Character', 'top-bar');
        this.refreshService.set_ToChange('Character', 'logged-out');
        this.refreshService.process_ToChange();
    }

    initialize(characterService: CharacterService, savegameService: SavegameService) {
        //Initialize only once.
        if (!this.dataServiceURL && !this.localDataService) {
            this.loading = true;

            const headers = new HttpHeaders().set('Cache-Control', 'no-cache')
                .set('Pragma', 'no-cache');

            this.httpClient.request(new HttpRequest('HEAD', 'assets/config.json', headers))
                .subscribe({
                    next: (response: HttpResponse<unknown>) => {
                        if (response.status) {
                            if (response.status == 200) {
                                this.httpClient.get('assets/config.json', { headers })
                                    .subscribe({
                                        next: data => {
                                            const config = JSON.parse(JSON.stringify(data));

                                            this.dataServiceURL = config.dataServiceURL || config.dbConnectionURL || '';
                                            this.localDataService = config.localDataService || config.localDBConnector;
                                        },
                                        error: error => {
                                            throw error;
                                        },
                                        complete: () => {
                                            //Establish a connection to the data service and check whether login is required.
                                            this.get_Login('', characterService, savegameService);
                                        },
                                    });
                            } else {
                                //If there is any result other than 200, assume that we are working with a local data service.
                                //Run Login to check whether login is required.
                                this.get_Login('', characterService, savegameService);
                            }
                        }
                    },
                    error: error => {
                        if (error.status == 404) {
                            console.error('No config file was found. See assets/config.json.example for more information.');
                        } else {
                            throw error;
                        }

                        this.loading = false;
                    },
                });
            this.httpClient.get(this.updateURL)
                .subscribe({
                    next: response => {
                        const cvs = package_json.version.split('.').map(version => parseInt(version));
                        const availableVersion = JSON.parse(JSON.stringify(response)).tag_name?.replace('v', '') || 'n/a';

                        if (availableVersion != 'n/a') {
                            const avs = availableVersion.split('.').map(version => parseInt(version));

                            if (avs[0] > cvs[0] || (avs[0] == cvs[0] && avs[1] > cvs[1]) || (avs[0] == cvs[0] && avs[1] == cvs[1] && avs[2] > cvs[2])) {
                                this.updateAvailable = availableVersion;
                            }
                        } else {
                            this.updateAvailable = availableVersion;
                        }
                    },
                    error: () => {
                        console.warn('Could not contact github to check for new version.');
                        this.updateAvailable = 'n/a';
                    },
                });
        }
    }

}
