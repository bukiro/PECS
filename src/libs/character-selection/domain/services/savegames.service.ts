import { HttpClient, HttpStatusCode, HttpHeaders } from '@angular/common/http';
import { effect, inject, Injectable, Signal, signal } from '@angular/core';
import { tap, Observable } from 'rxjs';
import { AuthService } from 'src/libs/auth/domain/services/auth.service';
import { ApiStatusKey } from 'src/libs/shared/api/util/models/api-status-key';
import { ConfigService } from 'src/libs/shared/app-status/domain/services/config.service';
import { CharacterClass } from 'src/libs/shared/character-classes/util/models/character-class';
import { Character } from 'src/libs/shared/character/util/models/character';

import { Serialized } from 'src/libs/shared/serialization/util/models/serializable';
import { Savegame } from '../../util/models/savegame';
import { StatusStore } from 'src/libs/shared/app-status/domain/stores/status.store';
import { ToastService } from 'src/libs/app-shell/domain/services/toast.service';

type DatabaseCharacter = Serialized<Character> & { _id: string; id: string };

@Injectable({
    providedIn: 'root',
})
export class SavegamesService {

    public savegames$$: Signal<Array<Savegame>>;

    private readonly _savegames$$ = signal<Array<Savegame>>([]);

    private readonly _http = inject(HttpClient);
    private readonly _authService = inject(AuthService);
    private readonly _configService = inject(ConfigService);
    private readonly _toastService = inject(ToastService);
    private readonly _statusStore = inject(StatusStore);

    constructor() {
        this.savegames$$ = this._savegames$$.asReadonly();

        effect(() => {
            if (this._statusStore.auth().key === ApiStatusKey.Ready) {
                this.reset();
            }
        });
    }

    public reset(): void {
        this._statusStore.setSavegamesStatus({ key: ApiStatusKey.Initializing, message: 'Loading characters...' });

        this._savegames$$.set([]);

        this._loadAllCharactersFromDatabase()
            .pipe(
                tap({
                    next: (characters: Array<DatabaseCharacter>) => {
                        this._savegames$$.set(this._parseCharacters(characters));
                        this._statusStore.setSavegamesStatus({ key: ApiStatusKey.Ready });
                    },
                    error: error => {
                        if (error.status === HttpStatusCode.Unauthorized) {
                            this._toastService.show({ text: 'Your login is no longer valid.' });
                        } else {
                            console.error(`Error loading characters from database: ${ error.message }`);
                            this._statusStore.setSavegamesStatus({
                                key: ApiStatusKey.Failed,
                                message: 'Characters could not be loaded.',
                            });
                        }
                    },
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

    private _buildClassChoice(savegameClass: Serialized<CharacterClass>): string | undefined {
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
