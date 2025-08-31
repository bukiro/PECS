import { HttpClient, HttpStatusCode, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ToastService } from 'src/libs/app-shell/domain/services/toast.service';
import { MenuNames } from 'src/libs/app-shell/util/models/menu-names';
import { AuthService } from 'src/libs/auth/domain/services/auth.service';
import { TokenService } from 'src/libs/auth/domain/services/token.service';
import { SavegamesService } from 'src/libs/character-selection/domain/services/savegames.service';
import { Ancestry } from 'src/libs/shared/character/util/models/ancestry';
import { ApiStatusKey } from 'src/libs/shared/api/util/models/api-status-key';
import { ConfigService } from 'src/libs/shared/app-status/domain/services/config.service';
import { Settings } from 'src/libs/shared/app-status/util/models/settings';
import { Background } from 'src/libs/shared/character/util/models/background';
import { CharacterClass } from 'src/libs/shared/character-classes/util/models/character-class';
import { CreatureService } from 'src/libs/shared/creatures/domain/services/creature.service';
import { Character } from 'src/libs/shared/character/util/models/character';
import { Heritage } from 'src/libs/shared/character/util/models/heritage';
import { Serialized } from 'src/libs/shared/serialization/util/models/serializable';
import { CharacterPatchingService } from '../character-patching/character-patching.service';
import { MenuStore } from 'src/libs/shared/app-status/domain/stores/menu.store';
import { StatusStore } from 'src/libs/shared/app-status/domain/stores/status.store';
import { AnimalCompanionAncestry } from 'src/libs/shared/animal-companion/util/models/animal-companion-ancestry';
import { AnimalCompanionStage } from 'src/libs/shared/animal-companion/util/models/animal-companion-stage';
import { AnimalCompanionSpecialization } from 'src/libs/shared/feats/util/models/animal-companion-specialization';
import { RecastService } from 'src/libs/shared/serialization/domain/services/recast.service';
import { TurnService } from 'src/libs/shared/time/domain/services/turn.service';
import { AnimalCompanionAncestryService } from 'src/libs/shared/animal-companion/domain/services/animal-companion-ancestry.service';

interface DatabaseCharacter {
    _id: string;
}

@Injectable({
    providedIn: 'root',
})
export class CharacterLoadingService {

    private _resetApp?: () => void;

    private readonly _httpClient = inject(HttpClient);
    private readonly _authService = inject(AuthService);
    private readonly _configService = inject(ConfigService);
    private readonly _tokenService = inject(TokenService);
    private readonly _animalCompanionAncestryService = inject(AnimalCompanionAncestryService);
    private readonly _animalCompanionLevelsService = inject(AnimalCompanionLevelsService);
    private readonly _animalCompanionSpecializationsService = inject(AnimalCompanionSpecializationsService);
    private readonly _classSavingLoadingService = inject(ClassSavingLoadingService);
    private readonly _historySavingLoadingService = inject(HistorySavingLoadingService);
    private readonly _characterPatchingService = inject(CharacterPatchingService);
    private readonly _toastService = inject(ToastService);
    private readonly _characterFeatsService = inject(CharacterFeatsService);
    private readonly _basicEquipmentService = inject(BasicEquipmentService);
    private readonly _savegamesService = inject(SavegamesService);
    private readonly _creatureService = inject(CreatureService);
    private readonly _statusStore = inject(StatusStore);
    private readonly _menuStore = inject(MenuStore);

    public loadOrResetCharacter(id = '', loadAsGm = false): void {
        if (!this._resetApp) { console.error('App reset function missing in CharacterLoadingService!'); }

        this._statusStore.setCharacterStatus({ key: ApiStatusKey.Loading, message: 'Resetting character...' });
        this._resetApp?.();

        if (id) {
            this._statusStore.setCharacterStatus({ key: ApiStatusKey.Loading, message: 'Loading character...' });
            this._loadCharacterFromDatabase(id)
                .subscribe({
                    next: (results: Array<Partial<Character>>) => {
                        if (results) {
                            this._finishLoading(
                                this._processLoadedCharacter(
                                    JSON.parse(JSON.stringify(results)),
                                ),
                                loadAsGm,
                            );
                        } else {
                            this._toastService.show({ text: 'The character could not be found in the database.' });
                            this._savegamesService.reset();
                            this._cancelLoading();
                        }
                    },
                    error: error => {
                        if (error.status === HttpStatusCode.Unauthorized) {
                            this._toastService.show({
                                text:
                                    'Your login is no longer valid. The character could not be loaded. Please try again after logging in.',
                            });

                            this._cancelLoading();
                        } else {
                            this._toastService.show({
                                text: 'An error occurred while loading the character. See console for more information.',
                            });

                            console.error(`Error loading character from database: ${ error.message }`);
                            this._savegamesService.reset();
                            this._cancelLoading();
                        }
                    },
                });
        } else {
            this._menuStore.toggleLeftMenu({ menu: MenuNames.CharacterCreationMenu });

            this._finishLoading(new Character());
        }
    }

    public initialize(resetApp: () => void): void {
        this._resetApp = resetApp;

        this._loadSessionCharacter();
    }

    private _loadSessionCharacter(): void {
        const sessionCharacterId = this._tokenService.getSessionCharacterId();
        const savegames = this._savegamesService.savegames$$();

        if (savegames.some(savegame => savegame.id === sessionCharacterId)) {
            this.loadOrResetCharacter(sessionCharacterId);
        }
    }

    private _finishLoading(newCharacter: Character, loadAsGm = false): void {
        this._statusStore.setCharacterStatus({ key: ApiStatusKey.Initializing, message: 'Initializing character...' });
        // Assign the loaded character.

        this._creatureService.setCharacter(newCharacter, loadAsGm);

        const character = CreatureService.character$$();

        //Grant and equip basic items
        this._basicEquipmentService.equipBasicItems(character, false);

        // Set your turn state according to the saved state.
        TurnService.setYourTurn(character.yourTurn);
        // Fill a runtime variable with all the feats the character has taken, and another with the level at which they were taken.
        this._characterFeatsService.buildCharacterFeats(character);

        this._setAllReady();

        this._tokenService.writeSessionCharacterId(character.id);
    }

    private _cancelLoading(): void {
        this._statusStore.setCharacterStatus({ key: ApiStatusKey.NoCharacter });
        this._creatureService.setCharacter(new Character());
        this._tokenService.writeSessionCharacterId();
    }

    private _setAllReady(): void {
        this._statusStore.setCharacterStatus({ key: ApiStatusKey.Ready });
    }

    // eslint-disable-next-line complexity
    private _processLoadedCharacter(
        loader: Serialized<Character & DatabaseCharacter>,
    ): Character {
        //Make a copy of the character before restoration. This will be used in patching.
        const rawCharacterCopy = JSON.parse(JSON.stringify(loader)) as Serialized<Character & DatabaseCharacter>;

        //Remove the database id so it isn't saved over.
        if (loader._id) {
            delete loader._id;
        }

        const rawCharacter = JSON.parse(JSON.stringify(loader)) as Serialized<Character & DatabaseCharacter>;

        // We restore a few things individually before we restore the class,
        // allowing us to patch them before any issues would be created by new changes to the class.

        // Apply patches that need to be done before the class is restored.
        // This is usually removing skill increases and feat choices,
        // which can cause issues if the class doesn't have them at the same index as the character.
        this._characterPatchingService.patchPartialCharacter(rawCharacter, rawCharacterCopy);

        //Apply any new settings.
        const settings = Settings.from(rawCharacter.settings ?? {});

        // Restore a lot of data from reference objects.
        // This allows us to save a lot of traffic at saving by removing all data
        // from certain objects that is the unchanged from in their original template.
        let restoredClass: CharacterClass | undefined;
        let ancestry: Ancestry | undefined;
        let heritage: Heritage | undefined;
        let background: Background | undefined;
        let companionAncestry: AnimalCompanionAncestry | undefined;
        let companionLevels: Array<AnimalCompanionStage> | undefined;
        let companionSpecializations: Array<AnimalCompanionSpecialization> | undefined;

        if (rawCharacter.class?.name) {
            const _class = rawCharacter.class;

            if (_class.ancestry?.name) {
                ancestry = this._historySavingLoadingService.restoreAncestryFromSave(_class.ancestry);
            }

            if (_class.heritage && _class.heritage.name) {
                heritage = this._historySavingLoadingService.restoreHeritageFromSave(_class.heritage);
            }

            if (_class.background && _class.background.name) {
                background = this._historySavingLoadingService.restoreBackgroundFromSave(_class.background);
            }

            if (_class.animalCompanion) {
                const animalCompanion = _class.animalCompanion;

                if (animalCompanion?.class?.ancestry) {
                    companionAncestry =
                        this._animalCompanionAncestryService.restoreAncestryFromSave(animalCompanion.class.ancestry);
                }

                if (animalCompanion?.class?.stages$$) {
                    companionLevels =
                        this._animalCompanionLevelsService.restoreLevelsFromSave(animalCompanion.class.stages$$);
                }

                if (animalCompanion.class?.specializations) {
                    companionSpecializations =
                        animalCompanion.class.specializations
                            .map(spec =>
                                this._animalCompanionSpecializationsService.restoreSpecializationFromSave(spec),
                            );
                }
            }

            //Restore the class last, so we don't null its components (ancestry, animal companion etc.)
            restoredClass = this._classSavingLoadingService.restoreClassFromSave({
                ...rawCharacter.class,
                ancestry,
                heritage,
                background,
                animalCompanion: {
                    ..._class.animalCompanion,
                    class: {
                        ..._class.animalCompanion?.class,
                        ancestry: companionAncestry,
                        levels: companionLevels,
                        specializations: companionSpecializations,
                    },
                },
            });
        }

        const finalCharacter = Character.from({ ...rawCharacter, settings, class: restoredClass }, RecastService.restoreFns);

        //Apply any patches that need to be done after the class is restored.
        this._characterPatchingService.patchCompleteCharacter(finalCharacter, rawCharacterCopy);

        return finalCharacter;
    }

    private _loadCharacterFromDatabase(id: string): Observable<Array<Partial<Character>>> {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        return this._httpClient.get<Array<Partial<Character>>>(
            `${ this._configService.dataServiceURL }/loadCharacter/${ id }`,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._authService.xAccessToken }) },
        );
    }

}
