import { Injectable } from '@angular/core';
import { Character } from 'src/app/classes/Character';
import { Settings } from 'src/app/classes/Settings';
import { HttpClient, HttpHeaders, HttpStatusCode } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from 'src/libs/shared/services/config/config.service';
import { AnimalCompanionAncestryService } from 'src/libs/shared/services/animal-companion-ancestry/animal-companion-ancestry.service';
import { AnimalCompanionLevelsService } from 'src/libs/shared/services/animal-companion-level/animal-companion-level.service';
import { AnimalCompanionSpecializationsService } from 'src/libs/shared/services/animal-companion-specializations/animal-companion-specializations.service';
import { CharacterPatchingService } from '../character-patching/character-patching.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { BasicEquipmentService } from 'src/libs/shared/services/basic-equipment/basic-equipment.service';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { ToastService } from 'src/libs/toasts/services/toast/toast.service';
import { ClassSavingLoadingService } from '../../../services/saving-loading/class-saving-loading/class-saving-loading.service';
import { HistorySavingLoadingService } from '../../../services/saving-loading/history-saving-loading/history-saving-loading.service';
import { ApiStatusKey } from 'src/libs/shared/definitions/apiStatusKey';
import { SavegamesService } from 'src/libs/shared/services/saving-loading/savegames/savegames.service';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { Store } from '@ngrx/store';
import { setCharacterStatus } from 'src/libs/store/status/status.actions';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { toggleLeftMenu } from 'src/libs/store/menu/menu.actions';
import { TurnService } from 'src/libs/shared/time/services/turn/turn.service';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';
import { AuthService } from 'src/libs/shared/services/auth/auth.service';
import { TokenService } from 'src/libs/shared/services/token/token.service';

interface DatabaseCharacter {
    _id: string;
}

@Injectable({
    providedIn: 'root',
})
export class CharacterLoadingService {

    private _resetApp?: () => void;

    constructor(
        private readonly _httpClient: HttpClient,
        private readonly _authService: AuthService,
        private readonly _configService: ConfigService,
        private readonly _tokenService: TokenService,
        private readonly _animalCompanionAncestryService: AnimalCompanionAncestryService,
        private readonly _animalCompanionLevelsService: AnimalCompanionLevelsService,
        private readonly _animalCompanionSpecializationsService: AnimalCompanionSpecializationsService,
        private readonly _classSavingLoadingService: ClassSavingLoadingService,
        private readonly _historySavingLoadingService: HistorySavingLoadingService,
        private readonly _characterPatchingService: CharacterPatchingService,
        private readonly _refreshService: RefreshService,
        private readonly _toastService: ToastService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _basicEquipmentService: BasicEquipmentService,
        private readonly _savegamesService: SavegamesService,
        private readonly _creatureService: CreatureService,
        private readonly _store$: Store,
    ) { }

    public loadOrResetCharacter(id = '', loadAsGm = false): void {
        if (!this._resetApp) { console.error('App reset function missing in CharacterLoadingService!'); }

        this._store$.dispatch(setCharacterStatus({ status: { key: ApiStatusKey.Loading, message: 'Resetting character...' } }));
        this._resetApp?.();

        if (id) {
            this._store$.dispatch(setCharacterStatus({ status: { key: ApiStatusKey.Loading, message: 'Loading character...' } }));
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
                            this._toastService.show('The character could not be found in the database.');
                            this._savegamesService.reset();
                            this._cancelLoading();
                        }
                    },
                    error: error => {
                        if (error.status === HttpStatusCode.Unauthorized) {
                            this._toastService.show(
                                'Your login is no longer valid. The character could not be loaded. Please try again after logging in.',
                            );
                            this._cancelLoading();
                        } else {
                            this._toastService.show('An error occurred while loading the character. See console for more information.');
                            console.error(`Error loading character from database: ${ error.message }`);
                            this._savegamesService.reset();
                            this._cancelLoading();
                        }
                    },
                });
        } else {
            this._store$.dispatch(toggleLeftMenu({ menu: MenuNames.CharacterCreationMenu }));

            this._finishLoading(new Character());
        }
    }

    public initialize(resetApp: () => void): void {
        this._resetApp = resetApp;

        this._loadSessionCharacter();
    }

    private _loadSessionCharacter(): void {
        const sessionCharacterId = this._tokenService.getSessionCharacterId();
        const savegames = this._savegamesService.savegames;

        if (savegames.some(savegame => savegame.id === sessionCharacterId)) {
            this.loadOrResetCharacter(sessionCharacterId);
        }
    }

    private _finishLoading(newCharacter: Character, loadAsGm = false): void {
        this._store$.dispatch(setCharacterStatus({ status: { key: ApiStatusKey.Initializing, message: 'Initializing character...' } }));
        // Assign the loaded character.

        this._creatureService.resetCharacter(newCharacter, loadAsGm);

        const character = CreatureService.character;

        //Grant and equip basic items
        this._basicEquipmentService.equipBasicItems(character, false);

        // Set your turn state according to the saved state.
        TurnService.setYourTurn(character.yourTurn);
        // Fill a runtime variable with all the feats the character has taken, and another with the level at which they were taken.
        this._characterFeatsService.buildCharacterFeats(character);

        this._setAllReady();

        this._tokenService.writeSessionCharacterId(character.id);

        this._refreshAfterLoading();
    }

    private _cancelLoading(): void {
        this._store$.dispatch(setCharacterStatus({ status: { key: ApiStatusKey.NoCharacter } }));
        this._creatureService.resetCharacter(new Character());
        this._tokenService.writeSessionCharacterId();

        this._refreshAfterLoading();
    }

    private _refreshAfterLoading(): void {
        //Update everything once, then effects, and then the player can take over.
        this._refreshService.setComponentChanged();
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'effects');

        this._refreshService.processPreparedChanges();
        this._refreshService.setComponentChanged();
    }

    private _setAllReady(): void {
        this._store$.dispatch(setCharacterStatus({ status: { key: ApiStatusKey.Ready } }));
    }

    private _processLoadedCharacter(
        loader: Partial<Character & DatabaseCharacter>,
    ): Character {
        //Make a copy of the character before restoration. This will be used in patching.
        const rawCharacterCopy = JSON.parse(JSON.stringify(loader));

        //Remove the database id so it isn't saved over.
        if (loader._id) {
            delete loader._id;
        }

        const rawCharacter = JSON.parse(JSON.stringify(loader));

        // We restore a few things individually before we restore the class,
        // allowing us to patch them before any issues would be created by new changes to the class.

        //Apply any new settings.
        rawCharacter.settings = Settings.from(rawCharacter.settings ?? {});

        // Apply patches that need to be done before the class is restored.
        // This is usually removing skill increases and feat choices,
        // which can cause issues if the class doesn't have them at the same index as the character.
        this._characterPatchingService.patchPartialCharacter(rawCharacter, rawCharacterCopy);

        // Restore a lot of data from reference objects.
        // This allows us to save a lot of traffic at saving by removing all data
        // from certain objects that is the unchanged from in their original template.
        if (rawCharacter.class.name) {
            const _class = rawCharacter.class;

            if (_class.ancestry && _class.ancestry.name) {
                _class.ancestry = this._historySavingLoadingService.restoreAncestryFromSave(_class.ancestry);
            }

            if (_class.heritage && _class.heritage.name) {
                _class.heritage = this._historySavingLoadingService.restoreHeritageFromSave(_class.heritage);
            }

            if (_class.background && _class.background.name) {
                _class.background = this._historySavingLoadingService.restoreBackgroundFromSave(_class.background);
            }

            if (_class.animalCompanion) {
                const animalCompanion = _class.animalCompanion;

                if (animalCompanion?.class?.ancestry) {
                    animalCompanion.class.ancestry =
                        this._animalCompanionAncestryService.restoreAncestryFromSave(animalCompanion.class.ancestry);
                }

                if (animalCompanion?.class?.levels) {
                    animalCompanion.class =
                        this._animalCompanionLevelsService.restoreLevelsFromSave(animalCompanion.class.levels);
                }

                if (animalCompanion.class?.specializations) {
                    animalCompanion.class.specializations =
                        animalCompanion.class.specializations
                            .map((spec: Partial<AnimalCompanionSpecialization>) =>
                                this._animalCompanionSpecializationsService.restoreSpecializationFromSave(spec),
                            );
                }
            }

            //Restore the class last, so we don't null its components (ancestry, animal companion etc.)
            rawCharacter.class = this._classSavingLoadingService.restoreClassFromSave(rawCharacter.class);
        }

        const finalCharacter = Character.from(rawCharacter, RecastService.restoreFns);

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
