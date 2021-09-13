import { HttpClient, HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Md5 } from 'ts-md5';
import { CharacterService } from './character.service';
import { SavegameService } from './savegame.service';

@Injectable({
    providedIn: 'root'
})
export class ConfigService {

    public dbConnectionURL: string = "";
    public localDBConnector: boolean = false;
    private loading = false;
    private xAccessToken: string = "testtoken";
    private loggingIn: boolean = false;
    private loggedIn: boolean = false;
    private cannotLogin: boolean = false;
    private loggedOutMessage: string = "";

    constructor(
        private httpClient: HttpClient
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
        return this.dbConnectionURL || this.localDBConnector;
    }

    get_DBConnectionURL() {
        if (this.dbConnectionURL) {
            return this.dbConnectionURL;
        } else {
            return "";
        }
    }

    login(password: string = "") {
        return this.httpClient.post<{ token: string | false }>(this.get_DBConnectionURL() + '/login', { password: Md5.hashStr(password) });
    }

    get_Login(password: string = "", characterService: CharacterService, savegameService: SavegameService) {
        //We set loggingIn to true, which changes buttons in the character builder and the top-bar, so we need to update those.
        this.loggingIn = true;
        characterService.set_ToChange("Character", "charactersheet");
        characterService.set_ToChange("Character", "top-bar");
        characterService.process_ToChange();
        //Try logging in. You will receive false if the password was wrong, a random token if it was correct, or a token of "no-login-required" if no password is needed. 
        this.login(password).subscribe((result: { token: string | false }) => {
            this.cannotLogin = false;
            if (result.token != false) {
                this.xAccessToken = result.token;
                this.loggedIn = true;
                this.loggingIn = false;
                this.loggedOutMessage = "";
                characterService.set_ToChange("Character", "charactersheet");
                characterService.set_ToChange("Character", "top-bar");
                characterService.process_ToChange();
                savegameService.initialize(characterService);
            } else {
                this.loggedIn = false;
                if (password) {
                    characterService.set_ToChange("Character", "password-failed");
                } else {
                    characterService.set_ToChange("Character", "logged-out");
                }
                characterService.process_ToChange();
            }
            this.loading = false;
        }, (error) => {
            console.log('Error logging in: ' + error.message);
            if (error.status == 0) {
                characterService.toastService.show("The configured database is not available. Characters can't be saved or loaded.", [], characterService)
            }
            this.cannotLogin = true;
            this.loggingIn = false;
            this.loading = false;
            characterService.set_ToChange("Character", "charactersheet");
            characterService.set_ToChange("Character", "top-bar");
            characterService.process_ToChange();
        });
    }

    on_LoggedOut(characterService: CharacterService, notification: string = "") {
        this.loggedIn = false;
        this.loggedOutMessage = notification;
        characterService.set_ToChange("Character", "character-sheet");
        characterService.set_ToChange("Character", "top-bar");
        characterService.set_ToChange("Character", "logged-out");
        characterService.process_ToChange();
    }

    initialize(characterService: CharacterService, savegameService: SavegameService) {
        //Initialize only once.
        if (!this.dbConnectionURL && !this.localDBConnector) {
            this.loading = true;

            let headers = new HttpHeaders().set('Cache-Control', 'no-cache').set('Pragma', 'no-cache');

            this.httpClient.request(new HttpRequest("HEAD", 'assets/config.json', headers))
                .toPromise()
                .then((response: HttpResponse<unknown>) => {
                    if (response.status == 200) {
                        this.httpClient.get('assets/config.json', { headers })
                            .toPromise()
                            .then(data => {
                                let config = JSON.parse(JSON.stringify(data));
                                this.dbConnectionURL = config.dbConnectionURL || "";
                                this.localDBConnector = config.localDBConnector;
                            }).catch(err => {
                                throw err;
                            }).finally(() => {
                                if (!this.get_LoggedIn()) {
                                    this.get_Login("", characterService, savegameService);
                                }
                            })
                    } else {
                        if (!this.get_LoggedIn()) {
                            this.get_Login("", characterService, savegameService);
                        }
                    }
                }).catch(err => {
                    if (err.status == 404) {
                        console.log("No config file was found. See assets/config.json.example for more information.")
                    } else {
                        throw err;
                    }
                    this.loading = false;
                })
        }
    }

}
