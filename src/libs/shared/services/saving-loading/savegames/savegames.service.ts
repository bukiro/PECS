import { Injectable } from '@angular/core';
import { Character } from 'src/app/classes/Character';
import { HttpClient, HttpHeaders, HttpStatusCode } from '@angular/common/http';
import { Savegame } from 'src/app/classes/Savegame';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Observable } from 'rxjs';
import { ConfigService } from '../../config/config.service';

type DatabaseCharacter = Partial<Character> & { _id: string; id: string };

@Injectable({
    providedIn: 'root',
})
export class SavegamesService {

    private _savegames: Array<Savegame> = [];
    private _loadingError = false;
    private _loading = false;

    constructor(
        private readonly _http: HttpClient,
        private readonly _configService: ConfigService,
        private readonly _refreshService: RefreshService,
    ) {
        this._subscribeToChanges();
    }

    public get stillLoading(): boolean {
        return this._loading;
    }

    public savegames(): Array<Savegame> {
        return this._savegames;
    }

    public loadingError(): boolean {
        return this._loadingError;
    }

    public reset(): void {
        this._loading = true;
        // At this time, the save and load buttons are disabled,
        // and we refresh the character builder and the menu bar so that the browser knows.
        this._refreshService.setComponentChanged('charactersheet');
        this._refreshService.setComponentChanged('top-bar');

        if (this._configService.hasDBConnectionURL && this._configService.isLoggedIn) {
            this._loadAllCharactersFromDatabase()
                .subscribe({
                    next: (results: Array<DatabaseCharacter>) => {
                        this._finishLoading(results);
                    },
                    error: error => {
                        if (error.status === HttpStatusCode.Unauthorized) {
                            this._configService.logout('Your login is no longer valid.');
                        } else {
                            console.error(`Error loading characters from database: ${ error.message }`);
                            this._savegames = [];
                            this._loadingError = true;
                            this._loading = false;
                            // If the character list couldn't be loaded,
                            // the save and load buttons are re-enabled (but will disable on their own because of the error).
                            // We refresh the character builder and the menu bar to update the buttons.
                            this._refreshService.setComponentChanged('charactersheet');
                            this._refreshService.setComponentChanged('top-bar');
                            this._refreshService.setComponentChanged();
                        }
                    },
                });
        } else {
            this._loading = false;
            this._loadingError = true;
            this._savegames = [];
        }
    }

    private _loadAllCharactersFromDatabase(): Observable<Array<DatabaseCharacter>> {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        return this._http.get<Array<DatabaseCharacter>>(
            `${ this._configService.dBConnectionURL }/listCharacters`,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._configService.xAccessToken }) },
        );
    }

    private _finishLoading(loader: Array<DatabaseCharacter>): void {
        if (loader) {
            this._savegames = [];
            loader.forEach(savegame => {
                //Build some informational attributes on each save game description from the character's properties.
                const newLength = this._savegames.push(
                    Object.assign(new Savegame(savegame.id), {
                        dbId: savegame._id || '',
                        level: savegame.level || 1,
                        name: savegame.name || 'Unnamed',
                        partyName: savegame.partyName || 'No Party',
                    }),
                );
                const newSavegame = this._savegames[newLength - 1];

                if (savegame.class) {
                    newSavegame.class = savegame.class.name || '';

                    if (savegame.class.levels?.[1]?.featChoices?.length) {
                        savegame.class.levels[1].featChoices
                            .filter(choice =>
                                choice.specialChoice &&
                                !choice.autoSelectIfPossible &&
                                choice.feats?.length === 1 &&
                                choice.available === 1 &&
                                choice.source === savegame.class?.name,
                            )
                            .forEach(choice => {
                                let choiceName = choice.feats[0].name.split(':')[0];

                                if (!choiceName.includes('School') && choiceName.includes(choice.type)) {
                                    choiceName = choiceName.substring(0, choiceName.length - choice.type.length - 1);
                                }

                                newSavegame.classChoice = choiceName;
                            });
                    }

                    if (savegame.class.ancestry) {
                        newSavegame.ancestry = savegame.class.ancestry.name || '';
                    }

                    if (savegame.class.heritage) {
                        newSavegame.heritage = savegame.class.heritage.name || '';
                    }

                    if (savegame.class.animalCompanion?.class) {
                        newSavegame.companionName = savegame.class.animalCompanion.name || savegame.class.animalCompanion.type;
                        newSavegame.companionId = savegame.class.animalCompanion.id;
                    }

                    if (savegame.class.familiar?.originClass) {
                        newSavegame.familiarName = savegame.class.familiar.name || savegame.class.familiar.type;
                        newSavegame.familiarId = savegame.class.familiar.id;
                    }
                }
            });

            this._loadingError = false;
        }

        if (this._loading) { this._loading = false; }

        //Refresh the character builder and menu bar to update the save and load buttons, now that they are enabled again.
        this._refreshService.setComponentChanged('charactersheet');
        this._refreshService.setComponentChanged('top-bar');
        //Also update the charactersheet that the character builder is attached to, so it is properly displayed after loading the page.
        this._refreshService.setComponentChanged('character-sheet');
    }

    private _subscribeToChanges(): void {
        this._refreshService.componentChanged$
            .subscribe(target => {
                if (target === 'reload-savegames') {
                    this.reset();
                }
            });
        this._refreshService.detailChanged$
            .subscribe(target => {
                if (target.target === 'reload-savegames') {
                    this.reset();
                }
            });
    }

}
