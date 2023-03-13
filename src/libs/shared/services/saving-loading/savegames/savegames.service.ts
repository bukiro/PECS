import { Injectable } from '@angular/core';
import { Character } from 'src/app/classes/Character';
import { HttpClient, HttpHeaders, HttpStatusCode } from '@angular/common/http';
import { Savegame } from 'src/app/classes/Savegame';
import { BehaviorSubject, distinctUntilChanged, finalize, Observable, tap } from 'rxjs';
import { ConfigService } from '../../config/config.service';
import { ApiStatusKey } from 'src/libs/shared/definitions/apiStatusKey';
import { ApiStatus } from 'src/libs/shared/definitions/interfaces/api-status';

type DatabaseCharacter = Partial<Character> & { _id: string; id: string };

@Injectable({
    providedIn: 'root',
})
export class SavegamesService {

    public static savegamesStatus$ = new BehaviorSubject<ApiStatus>({ key: ApiStatusKey.Initializing });

    public savegames$ = new BehaviorSubject<Array<Savegame>>([]);

    // Savegames are stored here for synchronous access.
    private _savegames: Array<Savegame> = [];

    constructor(
        private readonly _http: HttpClient,
        private readonly _configService: ConfigService,
    ) {
        ConfigService.configStatus$
            .pipe(
                distinctUntilChanged(),
            )
            .subscribe(apiStatus => {
                if (apiStatus.key === ApiStatusKey.Ready) {
                    this.reset();
                }
            });
    }

    public get savegames(): Array<Savegame> {
        return this._savegames;
    }

    public reset(): void {
        new BehaviorSubject<ApiStatus>({ key: ApiStatusKey.Initializing });

        this._savegames = [];

        this._loadAllCharactersFromDatabase()
            .pipe(
                tap({
                    next: (characters: Array<DatabaseCharacter>) => {
                        this._savegames = this._parseCharacters(characters);
                        SavegamesService.savegamesStatus$.next({ key: ApiStatusKey.Ready });
                    },
                    error: error => {
                        if (error.status === HttpStatusCode.Unauthorized) {
                            this._configService.logout('Your login is no longer valid.');
                        } else {
                            console.error(`Error loading characters from database: ${ error.message }`);
                            SavegamesService.savegamesStatus$.next({
                                key: ApiStatusKey.Failed,
                                message: 'Characters could not be loaded.',
                            });
                        }
                    },
                }),
                finalize(() => {
                    this.savegames$.next(this._savegames);
                }),
            )
            .subscribe();
    }

    private _loadAllCharactersFromDatabase(): Observable<Array<DatabaseCharacter>> {
        return this._http.get<Array<DatabaseCharacter>>(
            `${ this._configService.dataServiceURL }/listCharacters`,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._configService.xAccessToken }) },
        );
    }

    private _parseCharacters(characters: Array<DatabaseCharacter>): Array<Savegame> {
        if (!characters) {
            return [];
        }

        return characters.map(savegame => {
            //Build some informational attributes on each save game description from the character's properties.
            const parsedSavegame = Object.assign(new Savegame(savegame.id), {
                dbId: savegame._id || '',
                level: savegame.level || 1,
                name: savegame.name || 'Unnamed',
                partyName: savegame.partyName || 'No Party',
            });

            if (savegame.class) {
                parsedSavegame.class = savegame.class.name || '';

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

                            parsedSavegame.classChoice = choiceName;
                        });
                }

                if (savegame.class.ancestry) {
                    parsedSavegame.ancestry = savegame.class.ancestry.name || '';
                }

                if (savegame.class.heritage) {
                    parsedSavegame.heritage = savegame.class.heritage.name || '';
                }

                if (savegame.class.animalCompanion?.class) {
                    parsedSavegame.companionName = savegame.class.animalCompanion.name || savegame.class.animalCompanion.type;
                    parsedSavegame.companionId = savegame.class.animalCompanion.id;
                }

                if (savegame.class.familiar?.originClass) {
                    parsedSavegame.familiarName = savegame.class.familiar.name || savegame.class.familiar.type;
                    parsedSavegame.familiarId = savegame.class.familiar.id;
                }

            }

            return parsedSavegame;
        });
    }

}
