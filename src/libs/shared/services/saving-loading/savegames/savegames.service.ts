import { HttpClient, HttpStatusCode, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, distinctUntilChanged, tap, finalize, Observable } from 'rxjs';
import { Savegame } from 'src/app/classes/api/savegame';
import { Character } from 'src/app/classes/creatures/character/character';
import { CharacterClass } from 'src/app/classes/creatures/character/character-class';
import { setSavegamesStatus } from 'src/libs/store/status/status.actions';
import { selectAuthStatus } from 'src/libs/store/status/status.selectors';
import { ToastService } from 'src/libs/toasts/services/toast/toast.service';
import { AuthService } from '../../auth/auth.service';
import { ConfigService } from '../../config/config.service';
import { ApiStatusKey } from 'src/libs/shared/definitions/api-status-key';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';

type DatabaseCharacter = DeepPartial<Character> & { _id: string; id: string };

@Injectable({
    providedIn: 'root',
})
export class SavegamesService {

    public savegames$ = new BehaviorSubject<Array<Savegame>>([]);

    // Savegames are stored here for synchronous access.
    private _savegames: Array<Savegame> = [];

    constructor(
        private readonly _http: HttpClient,
        private readonly _authService: AuthService,
        private readonly _configService: ConfigService,
        private readonly _toastService: ToastService,
        private readonly _store$: Store,
    ) {
        _store$.select(selectAuthStatus)
            .pipe(
                distinctUntilChanged(),
            )
            .subscribe(config => {
                if (config.key === ApiStatusKey.Ready) {
                    this.reset();
                }
            });
    }

    public get savegames(): Array<Savegame> {
        return this._savegames;
    }

    public reset(): void {
        this._store$.dispatch(setSavegamesStatus({ status: { key: ApiStatusKey.Initializing, message: 'Loading characters...' } }));

        this._savegames = [];

        this._loadAllCharactersFromDatabase()
            .pipe(
                tap({
                    next: (characters: Array<DatabaseCharacter>) => {
                        this._savegames = this._parseCharacters(characters);
                        this._store$.dispatch(setSavegamesStatus({ status: { key: ApiStatusKey.Ready } }));
                    },
                    error: error => {
                        if (error.status === HttpStatusCode.Unauthorized) {
                            this._toastService.show('Your login is no longer valid.');
                        } else {
                            console.error(`Error loading characters from database: ${ error.message }`);
                            this._store$.dispatch(setSavegamesStatus({
                                status: {
                                    key: ApiStatusKey.Failed,
                                    message: 'Characters could not be loaded.',
                                },
                            }));
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
            { headers: new HttpHeaders({ 'x-access-Token': this._authService.xAccessToken }) },
        );
    }

    private _parseCharacters(characters: Array<DatabaseCharacter>): Array<Savegame> {
        if (!characters) {
            return [];
        }

        return characters.map(savegame => {
            //Build some informational attributes on each save game description from the character's properties.
            const parsedSavegame = Savegame.from({
                id: savegame.id,
                dbId: savegame._id || '',
                level: savegame.level || 1,
                name: savegame.name || 'Unnamed',
                partyName: savegame.partyName || 'No Party',
            });

            if (savegame.class) {
                parsedSavegame.class = savegame.class.name;

                parsedSavegame.classChoice = this._buildClassChoice(savegame.class);

                parsedSavegame.ancestry = savegame.class.ancestry?.name;

                parsedSavegame.heritage = savegame.class.heritage?.name;

                // Checking the class is a shortcut to indicate whether the animal companion is initialized or a placeholder.
                if (savegame.class.animalCompanion?.class) {
                    parsedSavegame.companionName = savegame.class.animalCompanion.name || savegame.class.animalCompanion.type;
                    parsedSavegame.companionId = savegame.class.animalCompanion.id;
                }

                // Checking the originClass is a shortcut to indicate whether the familiar is initialized or a placeholder.
                if (savegame.class.familiar?.originClass) {
                    parsedSavegame.familiarName = savegame.class.familiar.name || savegame.class.familiar.type;
                    parsedSavegame.familiarId = savegame.class.familiar.id;
                }
            }

            return parsedSavegame;
        });
    }

    private _buildClassChoice(savegameClass: DeepPartial<CharacterClass>): string | undefined {
        let classChoice;

        if (savegameClass.levels?.[1]?.featChoices?.length) {
            savegameClass.levels[1].featChoices
                .filter(choice =>
                    choice?.specialChoice &&
                    !choice?.autoSelectIfPossible &&
                    choice?.feats?.length === 1 &&
                    choice?.available === 1 &&
                    choice?.source === savegameClass?.name,
                )
                .forEach(choice => {
                    let choiceName = choice?.feats?.[0]?.name?.split(':')?.[0];

                    if (choice?.type && !choiceName?.includes('School') && choiceName?.includes(choice.type)) {
                        choiceName = choiceName.substring(0, choiceName.length - choice.type.length - 1);
                    }

                    classChoice = choiceName;
                });
        }

        return classChoice;
    }

}
